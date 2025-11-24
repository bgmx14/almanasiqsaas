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

- Node.js 18+
- PostgreSQL 15+
- Redis
- Docker & Docker Compose (optionnel)

### Installation

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env

# Configurer la base de données
cd packages/database
npx prisma migrate dev
npx prisma generate

# Lancer en mode développement
npm run dev
```

### Scripts disponibles

```bash
npm run dev        # Lancer tous les services en dev
npm run build      # Build de production
npm run test       # Lancer les tests
npm run lint       # Linter le code
npm run format     # Formater le code
npm run typecheck  # Vérifier les types TypeScript
```

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
