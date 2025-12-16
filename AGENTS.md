# Agents IA - Instructions de développement

Ce document définit les instructions et contraintes pour les agents IA travaillant sur ce projet Next.js.

## 🏗️ Architecture du projet

### Structure unifiée `src/`
- **App Router** : Tout dans `src/app/` avec proxies dans `app/` (requis par Next.js)
- **Composants** : `src/components/` organisés par fonctionnalité (layout, pages, ui, websocket)
- **Configuration** : `src/config/` pour les configs métier
- **Types** : Strict TypeScript avec interfaces définies

### Technologies
- pnpm (package manager)
- Next.js 16 (App Router)
- React 19
- TypeScript strict
- Tailwind CSS v4
- HeroUI
- mui/material-ui (componements & themes)
- next-themes
- Turbopack
- WebSocket pour temps réel

## 🤖 Rôles des agents

### Agent Codebase Pattern Analyst
**Responsabilités** :
- Analyse structurelle du code
- Identification des patterns et anti-patterns
- Refactorisation selon bonnes pratiques
- Audit d'architecture et optimisation

**Outils privilégiés** : Glob, Grep, Read, Task avec subagents

### Agent Coder
**Responsabilités** :
- Implémentation de fonctionnalités
- Écriture de code propre et maintenable
- Tests unitaires et intégration
- Respect des patterns établis

**Outils privilégiés** : Edit, Write, Bash, Test

### Agent Tester
**Responsabilités** :
- Écriture et exécution de tests
- Validation de la qualité du code
- Tests de régression
- Performance et sécurité

**Outils privilégiés** : Bash (test commands), Task (tester subagent)

### Agent Documentation
**Responsabilités** :
- Mise à jour de la documentation
- Guides de développement
- Documentation API
- Instructions pour les agents

**Outils privilégiés** : Write, Edit, Read

## 🔄 Workflow de développement

### Phase 1 : Analyse
1. Examiner la structure existante
2. Identifier les problèmes et améliorations
3. Valider les contraintes techniques

### Phase 2 : Planification
1. Créer un plan détaillé avec tâches atomiques
2. Estimer complexité et effort
3. Obtenir approbation utilisateur

### Phase 3 : Implémentation
1. Travailler étape par étape
2. Valider chaque étape (build, tests, lint)
3. Commiter régulièrement avec messages clairs

### Phase 4 : Validation
1. Tests complets
2. Build de production réussi
3. Documentation mise à jour

## ⚠️ Contraintes absolues

### Sécurité et stabilité
- **NE JAMAIS** casser le build existant
- **TOUJOURS** tester avant commit
- **VALIDER** TypeScript strict
- **RESPECTER** les patterns établis

### Qualité du code
- **TypeScript strict** : Pas de `any`, types explicites
- **Imports organisés** : Grouper par type (React, libs externes, internes)
- **Nommage cohérent** : camelCase pour variables, PascalCase pour composants
- **Commentaires** : Fonctions complexes seulement, JSDoc pour APIs

### Architecture
- **Séparation claire** : UI / logique métier / config
- **Composants modulaires** : Un rôle par composant
- **Props interfaces** : Types explicites pour toutes les props
- **State management** : Local first, global seulement si nécessaire

### Performance
- **Optimisation automatique** : Laisser Next.js gérer
- **Bundle splitting** : Routes automatiques
- **Images optimisées** : Next.js Image component
- **SSR/SSG** : Préférer static quand possible

## 🛠️ Outils et commandes

### Développement
```bash
pnpm dev          # Serveur dev avec hot reload
pnpm build        # Build production
pnpm start        # Serveur production
pnpm test         # Tests Jest
pnpm lint         # ESLint
pnpm lint:fix     # Correction automatique
```

### Recherche de code
- **gh_grep** : Recherche dans GitHub pour patterns similaires
- **codesearch** : Recherche API spécialisée
- **websearch** : Recherche web générale

### Gestion des tâches
- **todowrite** : Créer liste de tâches
- **todoread** : Lire liste actuelle
- **Task tool** : Déléguer à subagents spécialisés

## 📋 Checklists par type de tâche

### Nouvelle fonctionnalité
- [ ] Analyse des requirements
- [ ] Design de l'interface
- [ ] Implémentation composant
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Documentation
- [ ] Build validation

### Refactorisation
- [ ] Analyse impact
- [ ] Plan de migration
- [ ] Tests de régression
- [ ] Mise à jour imports
- [ ] Documentation
- [ ] Validation complète

### Correction de bug
- [ ] Reproduction du bug
- [ ] Root cause analysis
- [ ] Fix implementation
- [ ] Tests de non-régression
- [ ] Validation edge cases

## 🔍 Debugging et recherche

### Quand utiliser gh_grep
- Patterns d'implémentation similaires
- Solutions à problèmes complexes
- Exemples de bonnes pratiques
- Recherche de librairies alternatives

### Recherche efficace
- Mots-clés spécifiques au framework
- Inclure langage/version (TypeScript, React 19)
- Filtrer par popularité et fraîcheur

## 🚨 Situations d'urgence

### Build cassé
1. **STOP** immédiatement
2. Identifier la cause (git bisect si nécessaire)
3. Corriger ou revert
4. Tester thoroughly
5. Informer l'équipe

### Perte de données
1. Vérifier backups
2. Analyser impact
3. Restaurer depuis dernier commit stable
4. Documenter l'incident

### Conflits majeurs
1. Créer branche de résolution
2. Analyser conflits ligne par ligne
3. Tester toutes les fonctionnalités
4. Merge seulement après validation complète

## 📚 Ressources

### Documentation interne
- [README.md](README.md) - Vue d'ensemble du projet
- [DEVELOPMENT.md](DEVELOPMENT.md) - Guide développement
- [tsconfig.json](tsconfig.json) - Configuration TypeScript
- [tailwind.config.js](tailwind.config.js) - Configuration Tailwind

### Bonnes pratiques
- Next.js App Router patterns
- React 19 best practices
- TypeScript strict mode
- Tailwind CSS utility-first
- mui/material-ui
- Testing with Jest/React Testing Library

---

## 📝 Notes importantes

Si vous êtes incertain sur quelque chose, utilisez `gh_grep` pour rechercher des exemples de code similaires sur GitHub. La recherche ciblée donne souvent de meilleures réponses que l'intuition.

**Rappel** : La qualité prime sur la vitesse. Un code bien conçu nécessite moins de maintenance et évolue mieux.
