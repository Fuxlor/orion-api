# Système d'authentification RSA - Explication détaillée

## Vue d'ensemble

Ce projet utilise la **cryptographie asymétrique RSA** pour sécuriser les JWT tokens.

## Clés RSA

### Clé privée (private.pem)
- **Usage** : SIGNER les tokens (encryption)
- **Localisation** : Serveur uniquement, jamais partagée
- **Opération** : `jwt.sign(payload, privateKey, { algorithm: 'RS256' })`
- **Qui l'utilise** : Module `auth.service.ts` uniquement

### Clé publique (public.pem)
- **Usage** : VÉRIFIER les tokens (decryption)
- **Localisation** : Peut être distribuée à tous les services
- **Opération** : `jwt.verify(token, publicKey, { algorithms: ['RS256'] })`
- **Qui l'utilise** : Middleware `authenticate.ts` et tous les services qui vérifient

## Workflow complet

### 1. Génération des clés (une seule fois)

```bash
npm run generate-keys
```

Crée :
- `keys/private.pem` (2048 bits RSA, format PKCS8)
- `keys/public.pem` (2048 bits RSA, format SPKI)

### 2. Login utilisateur

```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Serveur** :
1. Vérifie email + password
2. Récupère les rôles de l'utilisateur
3. Crée le payload : `{ userId, email, roles }`
4. **SIGNE avec la clé PRIVÉE** :
   ```typescript
   const token = jwt.sign(payload, privateKey, {
     algorithm: 'RS256',
     expiresIn: '7d'
   });
   ```
5. Retourne le token au client

### 3. Requête authentifiée

```
GET /api/users
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Serveur** :
1. Extrait le token du header
2. **VÉRIFIE avec la clé PUBLIQUE** :
   ```typescript
   const decoded = jwt.verify(token, publicKey, {
     algorithms: ['RS256']
   });
   ```
3. Si valide → attache `user` à la requête
4. Si invalide → retourne 401 Unauthorized

## Sécurité

### Pourquoi RSA est meilleur que secret symétrique ?

**Scénario : Architecture microservices**

Avec **secret symétrique (HS256)** :
```
Service Auth    ──> Génère tokens avec "secret123"
Service Users   ──> Vérifie tokens avec "secret123"
Service Metrics ──> Vérifie tokens avec "secret123"

❌ Problème : Tous les services ont "secret123"
   → N'importe quel service peut CRÉER des tokens
   → Si un service est compromis, tout le système l'est
```

Avec **RSA (RS256)** :
```
Service Auth    ──> Génère tokens avec PRIVATE KEY
Service Users   ──> Vérifie tokens avec PUBLIC KEY
Service Metrics ──> Vérifie tokens avec PUBLIC KEY

✅ Avantage : Seul Service Auth a la clé privée
   → Les autres services peuvent SEULEMENT vérifier
   → Un service compromis ne peut pas créer de faux tokens
```

### Protection de la clé privée

**❌ Ne JAMAIS** :
- Commiter `private.pem` dans Git
- Partager la clé privée par email/Slack
- Stocker en clair dans un fichier config

**✅ Bonnes pratiques** :
- Générer une nouvelle paire de clés par environnement (dev, staging, prod)
- Stocker la clé privée dans un secret manager (AWS Secrets, Vault, etc.)
- Limiter l'accès à la clé privée (permissions filesystem)
- Rotation régulière des clés en production

### Rotation des clés

Pour changer les clés sans downtime :

1. Générer une nouvelle paire de clés
2. Garder l'ancienne clé publique active pour vérification
3. Commencer à signer avec la nouvelle clé privée
4. Attendre l'expiration de tous les anciens tokens (7 jours par défaut)
5. Supprimer l'ancienne clé publique

## Comparaison des algorithmes

| Algorithme | Type        | Clés              | Use case                      |
|------------|-------------|-------------------|-------------------------------|
| HS256      | Symétrique  | 1 secret partagé  | Apps monolithiques simples    |
| RS256      | Asymétrique | Privée + Publique | Microservices, APIs publiques |
| ES256      | Asymétrique | ECDSA             | Même que RS256, plus rapide   |

**Ce projet utilise RS256** car :
- Standard industry pour les APIs
- Bon équilibre sécurité/performance
- Compatible avec tous les clients JWT

## Code source

### Génération token (avec clé privée)
📁 `src/modules/auth/auth.service.ts`
```typescript
generateToken(payload: JWTPayload): string {
  const privateKey = getPrivateKey(); // 🔐
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '7d'
  });
}
```

### Vérification token (avec clé publique)
📁 `src/shared/middlewares/authenticate.ts`
```typescript
const publicKey = getPublicKey(); // 🔓
const decoded = jwt.verify(token, publicKey, {
  algorithms: ['RS256']
});
```

### Chargement des clés
📁 `src/shared/crypto/keys.ts`
```typescript
const privateKey = readFileSync('./keys/private.pem', 'utf8');
const publicKey = readFileSync('./keys/public.pem', 'utf8');
```

## FAQ

**Q: Puis-je partager la clé publique ?**
R: Oui ! C'est fait pour ça. Tu peux même la publier sur un endpoint public.

**Q: Que se passe-t-il si je perds la clé privée ?**
R: Tous les tokens existants restent valides, mais tu ne pourras plus en créer de nouveaux. Génère une nouvelle paire et déploie.

**Q: Puis-je utiliser la même paire de clés en dev et prod ?**
R: Techniquement oui, mais c'est déconseillé. Utilise des clés différentes par environnement.

**Q: RSA est-il plus lent que symétrique ?**
R: Oui, légèrement plus lent pour signer (~2-3x), mais négligeable dans la pratique. La sécurité en vaut la peine.

**Q: Puis-je vérifier un token sans le serveur ?**
R: Oui ! Avec la clé publique, n'importe qui peut vérifier l'authenticité d'un token (c'est le principe).

## Ressources

- [JWT RS256 vs HS256](https://stackoverflow.com/questions/39239051/rs256-vs-hs256-whats-the-difference)
- [RSA cryptography explained](https://en.wikipedia.org/wiki/RSA_(cryptosystem))
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)
