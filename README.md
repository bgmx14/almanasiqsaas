# OmraFlow Pro 🕋

La solution SaaS tout-en-un pour digitaliser et optimiser votre agence Omra.

## 🎯 Vision

Devenir le système d'exploitation de référence pour toutes les agences Omra dans le monde francophone, permettant à chaque agence de se concentrer sur l'essentiel: l'accompagnement spirituel de leurs pèlerins.

## 🏗️ Architecture

Ce projet utilise une architecture monorepo avec Turborepo.

### Structure du projet

```
omraflow-pro/
├── apps/
│   ├── web/          # Frontend Next.js (Admin & Site web)
│   ├── api/          # Backend API (Express + TypeScript)
│   └── mobile/       # Application mobile (React Native)
├── packages/
│   ├── ui/           # Design system et composants partagés
│   ├── database/     # Prisma schema et migrations
│   ├── shared/       # Types et utilitaires partagés
│   └── config/       # Configurations partagées (ESLint, TypeScript, etc.)
└── docker/           # Configuration Docker
```

## 🚀 Stack Technique

### Frontend
- **Framework**: Next.js 14 avec TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js avec TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Queue**: Bull

### Mobile
- **Framework**: React Native avec TypeScript
- **Navigation**: React Navigation
- **State**: Zustand

### Infrastructure
- **Cloud**: AWS
- **Containers**: Docker + Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Datadog

## 📦 Modules Fonctionnels

1. **Acquisition & Marketing** - Site web, landing pages, génération de leads
2. **CRM & Gestion Leads** - Pipeline de vente, scoring, devis
3. **Réservation & Contrats** - Gestion des réservations et signatures électroniques
4. **Paiements & Facturation** - Intégration Stripe, plans de paiement
5. **Fournisseurs & Achats** - Gestion des partenaires et achats
6. **Visa & Documents** - Workflow visa, OCR, génération documents
7. **Opérations & Logistique** - Planning, chambres, check-in/out
8. **App Mobile Pèlerins** - Espace personnel, documents, communication
9. **Communication** - Email, SMS, WhatsApp, notifications
10. **Reporting & Analytics** - Dashboards, rapports, KPIs
11. **Avis & Réputation** - Collecte avis, NPS, testimonials
12. **Gestion Interne** - Utilisateurs, tâches, collaboration
13. **Intégrations & API** - API publique, webhooks, connecteurs
14. **Sécurité & Conformité** - RGPD, chiffrement, audits

## 🛠️ Développement

### Prérequis

- Node.js 18.20.0+ (voir `.nvmrc`)
- pnpm 8.15.0+
- PostgreSQL 15+
- Redis
- Docker & Docker Compose (optionnel)

### Installation

```bash
# Installer pnpm si nécessaire
npm install -g pnpm

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Configurer la base de données
cd packages/database
pnpm prisma migrate dev
pnpm prisma generate

# Retourner à la racine
cd ../..

# Lancer en mode développement
pnpm dev
```

### Scripts disponibles

```bash
pnpm dev           # Lancer tous les services en dev
pnpm build         # Build de production (tous les packages)
pnpm build:web     # Build uniquement le frontend
pnpm test          # Lancer les tests
pnpm lint          # Linter le code
pnpm format        # Formater le code
pnpm typecheck     # Vérifier les types TypeScript
pnpm clean         # Nettoyer les builds et node_modules
```

### Pourquoi pnpm?

- ⚡ **Plus rapide**: Jusqu'à 2x plus rapide que npm
- 💾 **Économie d'espace**: Stockage global avec liens symboliques
- 🔒 **Sécurité**: Dépendances strictes sans hoisting
- 🎯 **Monorepo**: Support natif des workspaces

## 🚢 Déploiement

### Frontend (Cloudflare Pages)

Le frontend Next.js peut être déployé sur Cloudflare Pages. Voir [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) pour le guide complet.

**Résumé rapide**:
```bash
# Build command
pnpm run build:web

# Build output directory
apps/web/.next

# Node version
18.20.0
```

**Variables d'environnement requises**:
- `NEXT_PUBLIC_API_URL`: URL de votre API backend

### Backend (API)

Le backend Express peut être déployé sur:
- VPS (DigitalOcean, Linode, etc.)
- Containers (Docker, Kubernetes)
- PaaS (Heroku, Railway, Render)
- Cloud (AWS EC2, Google Cloud Run)

**Prérequis**:
- PostgreSQL 15+ database
- Redis instance
- SMTP server (pour les emails)
- File storage (local ou S3)

## 📈 Business Model

### Pricing

- **Starter**: 89€/mois (jusqu'à 100 pèlerins/an)
- **Business**: 199€/mois (jusqu'à 500 pèlerins/an)
- **Enterprise**: 499€/mois (illimité)

### Objectifs

- **Année 1**: 50 agences - 300K€ ARR
- **Année 2**: 150 agences - 1.2M€ ARR
- **Année 3**: 300 agences - 3M€ ARR

## 🗺️ Roadmap

### Q1 2026 - MVP
- ✅ Infrastructure & authentification
- ✅ CRM complet
- ✅ Réservations
- ✅ Paiements & facturation
- ✅ Dashboard
- ✅ App mobile V1

### Q2 2026 - Core Features
- Visa workflow
- Communication avancée
- Opérations & logistique
- Fournisseurs
- Reporting avancé

### Q3 2026 - Scale
- Performance optimization
- Intégrations tierces
- Marketing automation
- API publique

### Q4 2026 - Premium
- WhatsApp Business
- Analytics AI
- White-label
- Mobile offline

## 🔒 Sécurité

- Chiffrement SSL/TLS (données en transit)
- Chiffrement AES-256 (données au repos)
- Authentification JWT + Refresh tokens
- 2FA optionnel
- Conformité RGPD
- Audits de sécurité réguliers

## 📄 License

Proprietary - All rights reserved

## 👥 Équipe

Développé avec ❤️ par l'équipe OmraFlow Pro

---

**"Transformer le pèlerinage de La Mecque grâce à la technologie"** 🕋
