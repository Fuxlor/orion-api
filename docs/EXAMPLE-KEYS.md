# Example Keys (FOR TESTING ONLY - DO NOT USE IN PRODUCTION)

Ces clés sont fournies **uniquement pour tester** le projet rapidement.

⚠️ **NE JAMAIS UTILISER EN PRODUCTION** ⚠️

## Public Key (example)
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxPSbCQY5mBKhzxiJKGKH
c0cXATd+5wFZNdxrO7FgDWLbkCHJ5qP5H8RR2PcZvVQFu5v7LWZQz7rRz7N+wkQe
N8R3KlNJQc3tEqAo1o3l0hHlKcJpvPjBcN1S5YvKLZdHJhHZ1qZ5h0dZ8KXRmOtQ
...
-----END PUBLIC KEY-----
```

## Pour générer TES PROPRES clés

```bash
npm run generate-keys
```

Cela créera :
- `keys/private.pem` - 🔐 GARDEZ SECRÈTE
- `keys/public.pem` - 🔓 Peut être partagée

## Vérifier qu'un token est signé par ta clé

```bash
# Installer jwt-cli (optionnel)
npm install -g jwt-cli

# Décoder un token (sans vérifier la signature)
jwt decode <token>

# Vérifier la signature avec ta clé publique
jwt decode --verify <token> --key keys/public.pem --alg RS256
```
