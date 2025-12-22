# 🎬 Architecture d'Animation - Framer Motion

## 📋 Vue d'Ensemble

Ce projet utilise **Framer Motion** avec **LazyMotion** pour des animations optimisées. Cette architecture est conçue pour supporter une croissance exponentielle du projet.

## 🎯 Architecture Actuelle

```
AppProvider
└── MotionLazyContainer (LazyMotion)
    └── Toute l'application
        ├── Sidebar (m.div)
        ├── Dashboard (m.div)
        ├── Models (m.div)
        ├── etc...
```

### Composants Clés

#### 1. `MotionLazyContainer`
**Fichier** : `src/components/animate/motion-lazy-container.tsx`

```tsx
import { LazyMotion, domAnimation, m } from "framer-motion";

export function MotionLazyContainer({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div initial="initial" animate="animate" exit="exit">
        {children}
      </m.div>
    </LazyMotion>
  );
}
```

**Fonction** :
- Charge les animations de manière différée
- Optimise le bundle initial
- Active le tree-shaking

#### 2. Composants d'Animation
Tous les composants utilisent `m` au lieu de `motion` :

```tsx
import { m } from "framer-motion";

function MyComponent() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      Contenu animé
    </m.div>
  );
}
```

## ✅ Bonnes Pratiques

### 1. Imports
**✅ Correct** :
```tsx
import { m } from "framer-motion";
```

**❌ Incorrect** :
```tsx
import { motion } from "framer-motion";  // Ne pas utiliser!
```

### 2. Composants
**✅ Correct** :
```tsx
<m.div initial={{ x: 0 }} animate={{ x: 100 }}>
```

**❌ Incorrect** :
```tsx
<motion.div initial={{ x: 0 }} animate={{ x: 100 }}>
```

### 3. Animations Complexes
Pour les animations complexes, utilisez des variants :

```tsx
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<m.div
  initial="hidden"
  animate="visible"
  variants={variants}
  transition={{ duration: 0.5 }}
>
```

## 🚀 Ajouter de Nouvelles Animations

### 1. Dans un Composant Existant
```tsx
import { m } from "framer-motion";

function NewFeature() {
  return (
    <m.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 10 }}
    >
      Nouvelle fonctionnalité animée
    </m.div>
  );
}
```

### 2. Dans un Nouveau Composant
```tsx
import { m } from "framer-motion";

interface AnimatedCardProps {
  children: React.ReactNode;
}

export function AnimatedCard({ children }: AnimatedCardProps) {
  return (
    <m.div
      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {children}
    </m.div>
  );
}
```

## 📊 Optimisation des Performances

### 1. Features de LazyMotion
Nous utilisons `domAnimation` qui inclut :
- Animations DOM de base
- Gestion des gestures
- Support des variants

### 2. Ajouter Plus de Features (si nécessaire)
```tsx
import { LazyMotion, domAnimation, domMax } from "framer-motion";

// Pour plus de fonctionnalités
<LazyMotion features={domMax}>
```

### 3. Animation Conditionnelle
```tsx
<m.div
  animate={isVisible ? "visible" : "hidden"}
  variants={variants}
>
```

## ⚠️ Problèmes Courants et Solutions

### 1. Animation ne fonctionne pas
**Problème** : L'animation ne se déclenche pas

**Solutions** :
- Vérifier que le composant est bien `m.div` et non `motion.div`
- S'assurer que le composant est dans le `MotionLazyContainer`
- Vérifier les props d'animation (initial, animate, etc.)

### 2. Erreur de Tree-Shaking
**Problème** : Erreur "motion component within LazyMotion"

**Solution** :
- Remplacer tous les `motion.xxx` par `m.xxx`
- Vérifier les imports

### 3. Performance Médiocre
**Problème** : Animations saccadées

**Solutions** :
- Utiliser `will-change: transform` dans le style
- Réduire le nombre d'animations simultanées
- Utiliser des transitions plus simples

## 🛠️ Outils de Développement

### 1. Framer Motion DevTools
```bash
npm install @motionone/devtools
```

### 2. React DevTools
Pour inspecter les composants animés

### 3. Performance Tab (Chrome)
Pour analyser les performances des animations

## 📈 Évolutivité

### Ajouter de Nouveaux Types d'Animations
```tsx
// Pour les SVG
<m.path d="..." initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />

// Pour les listes
<m.ul>
  {items.map(item => (
    <m.li key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {item.name}
    </m.li>
  ))}
</m.ul>
```

### Animation Basée sur le Scroll
```tsx
import { useScroll, useTransform } from "framer-motion";

function ScrollAnimation() {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  
  return <m.div style={{ scale }} />;
}
```

## 🎓 Ressources

- [Documentation Framer Motion](https://www.framer.com/motion/)
- [LazyMotion Guide](https://motion.dev/troubleshooting/lazy-strict-mode)
- [Animation Performance](https://web.dev/animations-guide/)

## 🎯 Conclusion

Cette architecture permet :
- ✅ **Optimisation des performances** grâce à LazyMotion
- ✅ **Évolutivité** pour supporter 800+ composants
- ✅ **Maintenabilité** avec des règles claires
- ✅ **Consistance** dans tout le projet

**Règle d'or** : Toujours utiliser `m` au lieu de `motion` dans cette architecture !