# Llama Runner Async Proxy

Une interface web moderne et élégante pour gérer les modèles Llama avec support Ollama et LMStudio. Construit avec Next.js 16, Tailwind CSS, et React 19.

## ⚠️ AVERTISSEMENT DE SÉCURITÉ IMPORTANT

**🔓 CE PROJET EST INTENTIONNELLEMENT SANS AUTHENTIFICATION**

Ce système est conçu pour un **accès public** sans mécanismes d'authentification. Tous les endpoints (WebSocket, SSE, API) sont ouverts et accessibles sans identifiants. Cela fait partie intégrante de la conception architecturale.

📄 [Lire le document complet de sécurité](SECURITY_NOTICE.md)

## 🚀 Fonctionnalités

- **Dashboard temps réel** : Métriques, graphiques de performance, activité en direct
- **Gestion des modèles** : Découverte automatique, gestion et monitoring
- **Logs colorés** : Système de logs avec niveaux de couleur distincts
- **Thème moderne** : Design sombre/clair avec animations fluides et effets 3D
- **API REST** : Endpoints complets pour la gestion des modèles et configurations
- **WebSocket** : Communication temps réel pour les métriques et logs

## 🏗️ Architecture

### Structure des dossiers

```
├── src/
│   ├── app/                    # Routes Next.js App Router
│   │   ├── api/               # API routes (config, models, monitoring, etc.)
│   │   ├── dashboard/         # Page dashboard
│   │   ├── logs/              # Page logs
│   │   ├── models/            # Page modèles
│   │   ├── monitoring/        # Page monitoring
│   │   ├── settings/          # Page paramètres
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Page d'accueil (redirect)
│   │   └── globals.css        # Styles globaux
│   ├── components/            # Composants React
│   │   ├── layout/           # Header, Sidebar, Layout
│   │   ├── pages/            # Composants de pages
│   │   ├── ui/               # Composants UI réutilisables
│   │   └── websocket/        # Gestionnaire WebSocket
│   └── config/               # Configurations (models, app config)
├── app/                       # Proxy App Router (requis par Next.js)
├── public/                    # Assets statiques
└── [config files]            # tsconfig.json, tailwind.config.js, etc.
```

### Technologies utilisées

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript
- **Styling** : Tailwind CSS v4, animations CSS modernes
- **UI/UX** : Design système avec composants réutilisables
- **Temps réel** : WebSocket pour métriques et logs
- **Build** : Turbopack, optimisation automatique

## 🛠️ Installation & Développement

### Prérequis

- Node.js 18+
- pnpm (recommandé) ou npm/yarn

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd nextjs-llama-async-proxy

# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir l'application.

### Scripts disponibles

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm start        # Serveur de production
pnpm test         # Tests unitaires
pnpm lint         # Linting du code
pnpm lint:fix     # Correction automatique du linting
```

## 📊 API Routes

### Modèles (`/api/models`)
- `GET /api/models` : Liste des modèles enregistrés
- `POST /api/models` : Enregistrer de nouveaux modèles
- `POST /api/models/discover` : Découverte automatique de modèles

### Configuration (`/api/config`)
- `GET /api/config` : Configuration de l'application
- `POST /api/config` : Mise à jour de la configuration

### Monitoring (`/api/monitoring`)
- `GET /api/monitoring` : Métriques de performance
- `GET /api/monitoring/history` : Historique des métriques

### Paramètres (`/api/parameters`)
- `GET /api/parameters` : Liste des catégories de paramètres
- `GET /api/parameters/[category]` : Paramètres d'une catégorie
- `GET /api/parameters/category/[paramName]` : Valeur d'un paramètre spécifique

### WebSocket (`/api/websocket`)
- Connexion WebSocket pour les données temps réel

## 🎨 Thème & Design

### Palette de couleurs
- **Primaire** : Tons gris chauds modernes
- **Secondaire** : Rouge pour les accents
- **Succès/Erreur** : Vert/Rouge standards
- **Fond** : Blanc/crème (light), gris foncé (dark)

### Fonctionnalités UI
- **Mode sombre/clair** : Toggle automatique
- **Animations fluides** : Transitions CSS avec easing cubic-bezier
- **Effets 3D** : Ombres multicouches, transforms au hover
- **Responsive** : Design mobile-first
- **Accessibilité** : Contrastes élevés, navigation clavier

### Composants clés
- **Sidebar** : Navigation avec états actifs et hover
- **Cards** : Composants avec effets verre et profondeur
- **Charts** : Graphiques temps réel avec Recharts
- **Logs** : Affichage coloré par niveau de sévérité

## 🚀 Déploiement

### Build de production

```bash
pnpm build
pnpm start
```

### Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### Déploiement sur Vercel

1. Connecter le repository GitHub
2. Configurer les variables d'environnement
3. Déployer automatiquement

## 🤝 Contribution

### Structure de code recommandée

Voir [DEVELOPMENT.md](DEVELOPMENT.md) pour les bonnes pratiques de développement.

### Agents IA

Ce projet utilise un système d'agents IA pour l'assistance au développement. Voir [AGENTS.md](AGENTS.md) pour les instructions détaillées.

## 📝 Licence

MIT - Voir le fichier LICENSE pour plus de détails.

## 🔗 Liens utiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Lucide Icons](https://lucide.dev)
