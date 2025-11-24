# Guide de Démarrage Rapide - OmraFlow Pro ⚡

Guide en 5 minutes pour lancer le projet localement.

## Installation Express

### 1. Cloner et Installer

```bash
git clone <repository-url>
cd almanasiqsaas
npm install
```

### 2. Démarrer Docker (PostgreSQL + Redis)

```bash
docker-compose up -d
```

### 3. Configurer l'Environnement

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env

# Database
cp packages/database/.env.example packages/database/.env
```

### 4. Initialiser la Base de Données

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### 5. Lancer en Dev

```bash
npm run dev
```

## Accès

- 🌐 **Frontend** : http://localhost:3000
- 🔌 **API** : http://localhost:5000/api
- 💾 **Database UI** : http://localhost:8080
  - Système : PostgreSQL
  - Serveur : postgres
  - Utilisateur : omraflow
  - Mot de passe : omraflow
  - Base : omraflow_dev

## Premier Compte

1. Allez sur http://localhost:3000/register
2. Créez votre compte agence
3. Connectez-vous et explorez le dashboard !

## Commandes Utiles

```bash
npm run dev          # Dev mode (API + Web)
npm run build        # Build production
npm run lint         # Linter
npm run typecheck    # Vérifier types TS
```

## Structure Rapide

```
apps/
  api/         → Backend Express (port 5000)
  web/         → Frontend Next.js (port 3000)
packages/
  database/    → Schema Prisma + migrations
  shared/      → Code partagé (types, utils)
```

## Besoin d'Aide ?

Consultez [DEVELOPMENT.md](./DEVELOPMENT.md) pour le guide complet.

---

Happy coding! 🚀🕋
