# Guide de Développement - OmraFlow Pro 🕋

Bienvenue dans le guide de développement d'OmraFlow Pro, la plateforme SaaS pour la gestion des agences Omra.

## Table des Matières

1. [Installation](#installation)
2. [Architecture](#architecture)
3. [Démarrage Rapide](#démarrage-rapide)
4. [Développement](#développement)
5. [Base de Données](#base-de-données)
6. [API](#api)
7. [Frontend](#frontend)
8. [Tests](#tests)
9. [Déploiement](#déploiement)

---

## Installation

### Prérequis

- **Node.js** 18+ ([télécharger](https://nodejs.org/))
- **npm** 9+ (inclus avec Node.js)
- **Docker & Docker Compose** ([télécharger](https://www.docker.com/))
- **Git** ([télécharger](https://git-scm.com/))

### Vérification des versions

```bash
node --version  # devrait afficher v18.x.x ou supérieur
npm --version   # devrait afficher 9.x.x ou supérieur
docker --version
docker-compose --version
```

### Clone du Repository

```bash
git clone <repository-url>
cd almanasiqsaas
```

### Installation des Dépendances

```bash
npm install
```

Cette commande installe toutes les dépendances pour tous les packages du monorepo.

---

## Architecture

### Structure du Projet

```
omraflow-pro/
├── apps/
│   ├── web/              # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/      # Pages Next.js (App Router)
│   │   │   ├── components/
│   │   │   ├── lib/      # Utilitaires
│   │   │   └── stores/   # State management (Zustand)
│   │   └── package.json
│   │
│   ├── api/              # Backend Express API
│   │   ├── src/
│   │   │   ├── routes/   # Routes API
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── mobile/           # App React Native (TODO)
│
├── packages/
│   ├── database/         # Schema Prisma
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │
│   ├── shared/           # Code partagé
│   │   └── src/
│   │       ├── types.ts
│   │       ├── constants.ts
│   │       ├── utils.ts
│   │       └── validators.ts
│   │
│   └── ui/               # Composants UI (TODO)
│
├── docker/               # Dockerfiles
├── docker-compose.yml
├── turbo.json
└── package.json
```

### Technologies Utilisées

#### Backend
- **Node.js** & **TypeScript** - Runtime et langage
- **Express.js** - Framework web
- **Prisma** - ORM pour PostgreSQL
- **JWT** - Authentification
- **Redis** - Cache et queues
- **Socket.io** - WebSockets temps réel

#### Frontend
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Hook Form + Zod** - Formulaires et validation
- **Axios** - Client HTTP

#### Base de Données
- **PostgreSQL 15** - Base de données principale
- **Redis** - Cache et sessions

#### DevOps
- **Docker** - Conteneurisation
- **Turborepo** - Build system monorepo
- **GitHub Actions** - CI/CD

---

## Démarrage Rapide

### 1. Démarrer les Services (PostgreSQL + Redis)

```bash
docker-compose up -d
```

Cela démarre :
- PostgreSQL sur le port `5432`
- Redis sur le port `6379`
- Adminer (UI DB) sur le port `8080`

### 2. Configurer les Variables d'Environnement

#### API
```bash
cp apps/api/.env.example apps/api/.env
```

Modifiez `apps/api/.env` si nécessaire.

#### Web
```bash
cp apps/web/.env.example apps/web/.env
```

#### Database
```bash
cp packages/database/.env.example packages/database/.env
```

### 3. Initialiser la Base de Données

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### 4. Lancer le Projet en Mode Dev

```bash
npm run dev
```

Cela démarre :
- **API** sur http://localhost:5000
- **Web** sur http://localhost:3000

### 5. Accéder à l'Application

- **Frontend** : http://localhost:3000
- **API** : http://localhost:5000/api
- **Health Check** : http://localhost:5000/health
- **Adminer (DB UI)** : http://localhost:8080

---

## Développement

### Structure des Scripts

```bash
# Lancer tous les services en dev
npm run dev

# Build tous les packages
npm run build

# Lancer les tests
npm run test

# Linter
npm run lint

# Formatter le code
npm run format

# Type checking
npm run typecheck

# Nettoyer (node_modules, dist, .next)
npm run clean
```

### Travailler sur l'API

```bash
# Dev mode avec hot reload
npm run dev --workspace=@omraflow/api

# Build
npm run build --workspace=@omraflow/api

# Start production
npm run start --workspace=@omraflow/api
```

### Travailler sur le Frontend

```bash
# Dev mode
npm run dev --workspace=@omraflow/web

# Build
npm run build --workspace=@omraflow/web

# Start production
npm run start --workspace=@omraflow/web
```

---

## Base de Données

### Schema Prisma

Le schema complet est dans `packages/database/prisma/schema.prisma`.

### Migrations

```bash
cd packages/database

# Créer une migration
npx prisma migrate dev --name <nom_migration>

# Appliquer les migrations
npx prisma migrate deploy

# Reset la DB (DEV ONLY)
npx prisma migrate reset
```

### Prisma Studio (UI)

```bash
cd packages/database
npx prisma studio
```

Ouvre une interface graphique sur http://localhost:5555

### Seed la Base de Données

```bash
cd packages/database
npm run db:seed
```

### Multi-Tenancy

Le système utilise une architecture **shared database** avec `tenant_id` sur chaque table.

**Row Level Security (RLS)** est implémentée via middleware Prisma pour garantir l'isolation des données.

---

## API

### Architecture

L'API suit une architecture en couches :

```
Routes → Middleware → Controllers → Services → Prisma
```

### Authentification

L'API utilise **JWT** avec :
- **Access Token** (15 min)
- **Refresh Token** (7 jours)

#### Endpoints Auth

```
POST /api/auth/register   - Créer compte
POST /api/auth/login      - Se connecter
POST /api/auth/refresh    - Rafraîchir token
GET  /api/auth/me         - Profil utilisateur
POST /api/auth/logout     - Se déconnecter
POST /api/auth/forgot-password  - Mot de passe oublié
POST /api/auth/reset-password   - Réinitialiser mot de passe
```

### Modules Disponibles

#### CRM & Leads
```
GET    /api/leads          - Liste des leads
GET    /api/leads/:id      - Détail lead
POST   /api/leads          - Créer lead
PATCH  /api/leads/:id      - Modifier lead
DELETE /api/leads/:id      - Supprimer lead
POST   /api/leads/:id/convert - Convertir en client
```

#### Clients
```
GET    /api/customers      - Liste clients
GET    /api/customers/:id  - Détail client
POST   /api/customers      - Créer client
PATCH  /api/customers/:id  - Modifier client
DELETE /api/customers/:id  - Supprimer client
```

#### Réservations
```
GET    /api/bookings       - Liste réservations
GET    /api/bookings/:id   - Détail réservation
POST   /api/bookings       - Créer réservation
PATCH  /api/bookings/:id   - Modifier réservation
DELETE /api/bookings/:id   - Annuler réservation
```

#### Paiements
```
GET    /api/payments       - Liste paiements
GET    /api/payments/:id   - Détail paiement
POST   /api/payments       - Créer paiement
PATCH  /api/payments/:id   - Modifier paiement
```

### Tester l'API

#### Avec cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get leads (avec token)
curl http://localhost:5000/api/leads \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Avec Postman/Insomnia

Importez la collection depuis `docs/api-collection.json` (TODO)

---

## Frontend

### Pages Disponibles

- `/` - Landing page publique
- `/login` - Connexion
- `/register` - Inscription
- `/dashboard` - Dashboard principal
- `/dashboard/leads` - Gestion leads
- `/dashboard/customers` - Gestion clients
- `/dashboard/bookings` - Gestion réservations
- `/dashboard/payments` - Gestion paiements

### State Management

Le projet utilise **Zustand** pour le state management.

Store principal : `authStore` (`apps/web/src/stores/authStore.ts`)

```typescript
import { useAuthStore } from '@/stores/authStore';

function MyComponent() {
  const { user, login, logout } = useAuthStore();

  // ...
}
```

### API Client

Le client API est dans `apps/web/src/lib/api.ts`.

```typescript
import { leadsAPI } from '@/lib/api';

// Get leads
const response = await leadsAPI.getAll({ page: 1, limit: 20 });
const leads = response.data.data;
```

### Styling

Le projet utilise **Tailwind CSS**.

Classes personnalisées dans `apps/web/src/app/globals.css`.

---

## Tests

### Tests Backend

```bash
npm run test --workspace=@omraflow/api
```

### Tests Frontend

```bash
npm run test --workspace=@omraflow/web
```

### Tests E2E (TODO)

```bash
npm run test:e2e
```

---

## Déploiement

### Build de Production

```bash
npm run build
```

### Variables d'Environnement Production

Assurez-vous de configurer :

**API:**
- `NODE_ENV=production`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`
- `AWS_*` variables
- `SENDGRID_API_KEY`
- `TWILIO_*` variables

**Web:**
- `NEXT_PUBLIC_API_URL`

### Docker Production

```bash
# Build images
docker build -f docker/Dockerfile.api -t omraflow-api .
docker build -f docker/Dockerfile.web -t omraflow-web .

# Run
docker run -p 5000:5000 omraflow-api
docker run -p 3000:3000 omraflow-web
```

### Déploiement Recommandé

- **Frontend** : Vercel / Netlify
- **API** : Railway / Render / AWS ECS
- **Database** : AWS RDS PostgreSQL / Supabase
- **Redis** : AWS ElastiCache / Upstash

---

## Commandes Utiles

### Base de Données

```bash
# Accéder à PostgreSQL via Docker
docker exec -it omraflow_postgres psql -U omraflow -d omraflow_dev

# Dump database
docker exec omraflow_postgres pg_dump -U omraflow omraflow_dev > backup.sql

# Restore database
docker exec -i omraflow_postgres psql -U omraflow omraflow_dev < backup.sql
```

### Docker

```bash
# Voir les logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Stop et supprimer volumes
docker-compose down -v
```

### Turborepo

```bash
# Clear Turbo cache
npx turbo clean

# Run command in specific workspace
npx turbo run build --filter=@omraflow/api
```

---

## Troubleshooting

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port 5000
lsof -i :5000

# Ou pour Windows
netstat -ano | findstr :5000

# Kill le processus
kill -9 <PID>
```

### Erreur Prisma

```bash
# Regenerate Prisma client
cd packages/database
npx prisma generate

# Reset and migrate
npx prisma migrate reset
```

### Erreur Next.js

```bash
# Clear .next folder
rm -rf apps/web/.next

# Clear node_modules et reinstaller
npm run clean
npm install
```

---

## Roadmap Développement

### ✅ Phase 0 : Setup & Infrastructure (COMPLÉTÉ)
- [x] Architecture monorepo
- [x] Database schema Prisma
- [x] API backend avec auth JWT
- [x] Frontend Next.js
- [x] Docker setup

### 🚧 Phase 1 : MVP Core Features (EN COURS)
- [ ] Module CRM complet (leads, pipeline, quotes)
- [ ] Module Réservations
- [ ] Module Paiements (Stripe)
- [ ] Module Communication (email/SMS)
- [ ] Dashboard avec analytics
- [ ] App mobile pèlerins V1

### 📅 Phase 2 : Features Avancées
- [ ] Module Visa & Documents
- [ ] Module Opérations & Logistique
- [ ] Module Fournisseurs
- [ ] Marketing automation
- [ ] Avis & Réputation
- [ ] Analytics avancés

### 📅 Phase 3 : Scale & Optimisation
- [ ] Performance optimization
- [ ] Mobile offline mode
- [ ] Intégrations tierces
- [ ] AI features (chatbot, suggestions)
- [ ] White-label
- [ ] Sécurité renforcée

---

## Support

Pour toute question ou problème :

1. Consultez la [documentation API](docs/api.md)
2. Voir les [exemples](examples/)
3. Ouvrir une issue sur GitHub

---

## License

Proprietary - All rights reserved

© 2025 OmraFlow Pro

---

**"Transformer le pèlerinage de La Mecque grâce à la technologie"** 🕋
