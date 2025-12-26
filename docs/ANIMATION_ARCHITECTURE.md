# 🎬 Animation Architecture - Framer Motion

## 📋 Overview

This project uses **Framer Motion** with **LazyMotion** for optimized animations. This architecture is designed to support exponential project growth.

## 🎯 Current Architecture

```
AppProvider
└── MotionLazyContainer (LazyMotion)
    └── Entire application
        ├── Sidebar (m.div)
        ├── Dashboard (m.div)
        ├── Models (m.div)
        ├── etc...
```

### Key Components

#### 1. `MotionLazyContainer`
**File** : `src/components/animate/motion-lazy-container.tsx`

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

**Function** :
- Loads animations lazily
- Optimizes initial bundle
- Enables tree-shaking

#### 2. Animation Components
All components use `m` instead of `motion` :

```tsx
import { m } from "framer-motion";

function MyComponent() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      Animated content
    </m.div>
  );
}
```

## ✅ Best Practices

### 1. Imports
**✅ Correct** :
```tsx
import { m } from "framer-motion";
```

**❌ Incorrect** :
```tsx
import { motion } from "framer-motion";  // Do not use!
```

### 2. Components
**✅ Correct** :
```tsx
<m.div initial={{ x: 0 }} animate={{ x: 100 }}>
```

**❌ Incorrect** :
```tsx
<motion.div initial={{ x: 0 }} animate={{ x: 100 }}>
```

### 3. Complex Animations
For complex animations, use variants :

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

## 🚀 Adding New Animations

### 1. In an Existing Component
```tsx
import { m } from "framer-motion";

function NewFeature() {
  return (
    <m.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 10 }}
    >
      New animated feature
    </m.div>
  );
}
```

### 2. In a New Component
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

## 📊 Performance Optimization

### 1. LazyMotion Features
We use `domAnimation` which includes :
- Basic DOM animations
- Gesture handling
- Variant support

### 2. Adding More Features (if necessary)
```tsx
import { LazyMotion, domAnimation, domMax } from "framer-motion";

// For more functionality
<LazyMotion features={domMax}>
```

### 3. Conditional Animation
```tsx
<m.div
  animate={isVisible ? "visible" : "hidden"}
  variants={variants}
>
```

## ⚠️ Common Issues and Solutions

### 1. Animation not working
**Problem** : Animation doesn't trigger

**Solutions** :
- Verify component is `m.div` not `motion.div`
- Ensure component is inside `MotionLazyContainer`
- Check animation props (initial, animate, etc.)

### 2. Tree-Shaking Error
**Problem** : Error "motion component within LazyMotion"

**Solution** :
- Replace all `motion.xxx` with `m.xxx`
- Check imports

### 3. Poor Performance
**Problem** : Jerky animations

**Solutions** :
- Use `will-change: transform` in style
- Reduce number of simultaneous animations
- Use simpler transitions

## 🛠️ Development Tools

### 1. Framer Motion DevTools
```bash
npm install @motionone/devtools
```

### 2. React DevTools
To inspect animated components

### 3. Performance Tab (Chrome)
To analyze animation performance

## 📈 Scalability

### Adding New Animation Types
```tsx
// For SVGs
<m.path d="..." initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />

// For lists
<m.ul>
  {items.map(item => (
    <m.li key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {item.name}
    </m.li>
  ))}
</m.ul>
```

### Scroll-Based Animation
```tsx
import { useScroll, useTransform } from "framer-motion";

function ScrollAnimation() {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  return <m.div style={{ scale }} />;
}
```

## 🎓 Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [LazyMotion Guide](https://motion.dev/troubleshooting/lazy-strict-mode)
- [Animation Performance](https://web.dev/animations-guide/)

## 🎯 Conclusion

This architecture enables :
- ✅ **Performance optimization** through LazyMotion
- ✅ **Scalability** to support 800+ components
- ✅ **Maintainability** with clear rules
- ✅ **Consistency** throughout the project

**Golden rule** : Always use `m` instead of `motion` in this architecture !