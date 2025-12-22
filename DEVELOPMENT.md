# Guide de développement - Llama Runner Async Proxy

Ce guide détaille les bonnes pratiques, la structure recommandée et les conventions à suivre pour contribuer au projet.

## 🏗️ Structure recommandée

### Organisation des dossiers (Standard Next.js)

```
app/                             # Routes Next.js (App Router - standard)
├── api/                         # Routes API
├── [page]/                     # Pages UI
├── layout.tsx                  # Layout racine
├── page.tsx                    # Page d'accueil
└── globals.css                 # Styles globaux

src/                            # Code source organisé
├── components/                 # Composants React
│   ├── layout/                 # Header, Sidebar, Layout
│   ├── pages/                  # Composants spécifiques aux pages
│   ├── ui/                     # Composants UI réutilisables
│   └── websocket/              # Gestionnaire WebSocket
├── hooks/                      # Hooks personnalisés
├── services/                   # Services et logique métier
├── config/                     # Configurations
│   ├── app_config.json         # Config application
│   ├── models_config.json      # Config modèles
│   └── llama_options_reference.json
└── lib/                        # Utilitaires et helpers
```

### Structure Standard Next.js

Cette structure suit les meilleures pratiques officielles :

- **`app/` à la racine** : Pour le routage (pages et API) - requis par Next.js
- **`src/`** : Pour organiser le code source (composants, hooks, services)
- **`pages/`** : Ancienne structure (peut être supprimée si migration complète)

## 📝 Conventions de code

### TypeScript

```typescript
// ✅ Bon : Types explicites
interface UserProps {
  name: string;
  age: number;
  email?: string;
}

const UserCard: React.FC<UserProps> = ({ name, age, email }) => {
  // ...
};

// ❌ Mauvais : any, types implicites
const UserCard = ({ name, age, email }: any) => {
  // ...
};
```

### Composants React

```typescript
// ✅ Bon : Props typées, destructuring
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Imports organisés

```typescript
// ✅ Bon : Groupés par type
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types/user';

// ❌ Mauvais : Mélangé, relatif
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import React, { useState } from 'react';
import { formatDate } from '../../lib/utils';
```

## 🎨 Design System

### Palette de couleurs

- **Primaire** : Tons gris chauds modernes (`primary-50` à `primary-950`)
- **Secondaire** : Rouge pour les accents (`secondary-500`)
- **Succès** : Vert standard (`success`)
- **Danger** : Rouge pour les erreurs (`danger`)
- **Warning** : Orange pour les avertissements (`warning`)

### Composants UI

#### Cards
```typescript
// Utiliser la classe .card pour cohérence
<div className="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

#### Boutons
```typescript
// Variants disponibles via Button component
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
```

### Animations

```css
/* Utiliser les classes prédéfinies */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

/* Ou définir des transitions personnalisées */
.element {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 🔄 Workflow de développement

### 1. Création de fonctionnalité

```bash
# Créer une branche
git checkout -b feature/nom-fonctionnalite

# Développement itératif
# Commits fréquents avec messages descriptifs

# Tests et validation
pnpm test
pnpm lint
pnpm build

# Pull request
git push origin feature/nom-fonctionnalite
```

### 2. Messages de commit

```
feat: add user authentication
fix: resolve sidebar hover issue
docs: update API documentation
refactor: reorganize component structure
```

### 3. Pull Request

- Description claire du changement
- Screenshots si modification UI
- Tests ajoutés/modifiés
- Documentation mise à jour

## 🧪 Tests

### Tests unitaires (Jest)

```typescript
// __tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Tests E2E (Playwright)

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard loads correctly', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.locator('h1')).toContainText('Dashboard');
  await expect(page.locator('.metric-card')).toHaveCount(4);
});
```

## 🔍 Debugging

### Console logs

```typescript
// ✅ Bon : Logs contextuels
console.log('🔍 User data:', user);
console.error('❌ API Error:', error);

// ❌ Mauvais : Logs génériques
console.log('data', data);
console.log(error);
```

### React DevTools

- Utiliser les React DevTools pour inspecter les composants
- Vérifier les props et state
- Analyser les re-renders

### Performance

```typescript
// ✅ Bon : Memoization quand nécessaire
const MemoizedComponent = React.memo(Component);

// ✅ Bon : useMemo pour calculs coûteux
const expensiveValue = useMemo(() => computeExpensiveValue(dep), [dep]);
```

## 🚀 Performance

### Optimisations Next.js

```typescript
// ✅ Bon : Server Components par défaut
export default function Page() {
  return <div>Server rendered</div>;
}

// Client Components seulement si nécessaire
'use client';
export default function InteractivePage() {
  // ...
}
```

### Images

```typescript
import Image from 'next/image';

// ✅ Bon : Optimisation automatique
<Image
  src="/hero.jpg"
  alt="Hero"
  width={800}
  height={600}
  priority
/>
```

### Bundle splitting

- Next.js gère automatiquement le code splitting par route
- Imports dynamiques pour les composants lourds :

```typescript
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>Loading...</div>
});
```

## 🔒 Sécurité

### Validation des inputs

```typescript
// ✅ Bon : Validation côté serveur
export async function POST(request: Request) {
  const body = await request.json();

  // Validation
  if (!body.email || !isValidEmail(body.email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }

  // ...
}
```

### Authentification

- Utiliser NextAuth.js pour l'authentification
- Protéger les routes API sensibles
- Validation des tokens JWT

## 📚 Ressources

### Documentation officielle

- [Next.js App Router](https://nextjs.org/docs/app)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)

### Outils recommandés

- [ESLint](https://eslint.org) - Linting
- [Prettier](https://prettier.io) - Formatage
- [Husky](https://typicode.github.io/husky) - Git hooks
- [Commitlint](https://commitlint.js.org) - Messages de commit

### Communauté

- [Next.js Discord](https://nextjs.org/discord)
- [React Discord](https://reactjs.org/community)
- [TypeScript Discord](https://discord.gg/typescript)

---

## 📋 Checklist pré-commit

- [ ] Code linté (`pnpm lint`)
- [ ] Tests passent (`pnpm test`)
- [ ] Build réussi (`pnpm build`)
- [ ] Types TypeScript valides
- [ ] Documentation mise à jour
- [ ] Changements testés manuellement