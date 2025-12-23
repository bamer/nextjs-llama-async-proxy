# Guide de Dépannage

## Problèmes Courants et Solutions

### 1. WebSocket Non Connecté

**Symptômes** :
- Message "WebSocket not connected, using fallback mock data"
- Pas de données GPU affichées
- Erreurs de timeout WebSocket

**Solutions** :

#### Option A: Démarrer le serveur WebSocket (recommandé)

```bash
# Dans un terminal séparé
pnpm run dev:full

# Puis dans un autre terminal
pnpm run dev
```

#### Option B: Utiliser les données mock (pour le développement)

Les données GPU mock sont maintenant incluses dans le fallback. Si WebSocket n'est pas disponible, vous devriez voir :
- 4 cartes GPU avec des données aléatoires réalistes
- Graphique GPU avec historique
- Toutes les fonctionnalités GPU disponibles

### 2. Erreurs de Compilation

**Symptômes** :
- Erreurs TypeScript lors de `pnpm run build`
- Messages comme "'Divider' is declared but its value is never read"

**Solutions** :

#### Import inutilisé
Supprimez les imports non utilisés. Exemple :

```typescript
// Avant
import { Card, CardContent, Typography, Box, Chip, TextField, InputAdornment, IconButton, Pagination, Divider } from "@mui/material";

// Après  
import { Card, CardContent, Typography, Box, Chip, TextField, InputAdornment, IconButton, Pagination } from "@mui/material";
```

#### Composants dépréciés
Remplacez `GridLegacy` par `Grid` :

```typescript
// Avant
import { GridLegacy } from "@mui/material";
<GridLegacy container spacing={3}>

// Après
import { Grid } from "@mui/material";
<Grid container spacing={3}>
```

### 3. Problèmes de Performance

**Symptômes** :
- Messages "handler took XXXms"
- Interface lente ou saccadée

**Solutions** :

#### Optimisation des graphiques
- Limitez le nombre de points de données (actuellement 20)
- Utilisez `ResponsiveContainer` pour éviter les redimensionnements coûteux

#### Réduction des mises à jour
- Le code vérifie déjà les changements avant de mettre à jour les graphiques
- Les données sont mises à jour toutes les 5 secondes (configurable)

### 4. Problèmes d'Icônes

**Symptômes** :
- Erreurs "Failed to load icon"
- Icônes manquantes dans la barre d'adresse

**Solutions** :

Vérifiez que les fichiers d'icônes existent :
- `public/apple-touch-icon.png`
- `public/favicon.ico`

Si manquants, créez des icônes de fallback ou supprimez les références.

## Configuration Recommandée

### Pour le développement

```bash
# Terminal 1: Serveur WebSocket + Next.js
pnpm run dev:full

# Terminal 2: (Optionnel) Juste Next.js si vous voulez utiliser les mocks
pnpm run dev
```

### Pour la production

```bash
# Build
pnpm run build

# Start
pnpm run start
```

## Vérification des Fonctionnalités

### Vérifier que les données GPU s'affichent

1. Ouvrez le dashboard (`/dashboard`)
2. Faites défiler vers le bas
3. Vous devriez voir :
   - Section "GPU Performance" avec 4 cartes
   - Graphique "GPU Performance History"
   - Données réalistes même sans WebSocket

### Vérifier la connexion WebSocket

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Cherchez les messages :
   - "WebSocket hook: connecting..." → Tentative de connexion
   - "Socket.IO connected to http://localhost:3000" → Connexion réussie
   - "WebSocket not connected, using fallback mock data" → Utilisation des mocks

### Vérifier les données en temps réel

Si WebSocket est connecté :
1. Les données devraient se mettre à jour toutes les 5 secondes
2. Les graphiques devraient montrer des courbes qui évoluent
3. Les valeurs devraient changer légèrement à chaque mise à jour

## Résolution des Problèmes Spécifiques

### "WebSocket is closed before the connection is established"

**Cause** : Le serveur WebSocket n'est pas démarré ou il y a un problème de CORS.

**Solution** :
1. Assurez-vous que `pnpm run dev:full` est en cours d'exécution
2. Vérifiez que le port 3000 est disponible
3. Si vous utilisez un proxy ou un VPN, désactivez-le temporairement

### Les données GPU ne s'affichent pas

**Causes possibles** :
1. WebSocket non connecté ET mock data non généré
2. Erreur dans le code de rendu
3. Problème de CSS

**Solutions** :
1. Vérifiez que `metrics.gpuUsage` est défini dans le store
2. Ouvrez les outils de développement et vérifiez l'onglet "Components"
3. Cherchez la section GPU dans le DOM

### Les graphiques ne se mettent pas à jour

**Causes possibles** :
1. Le hook useEffect n'est pas déclenché
2. Les données ne changent pas assez
3. Problème de référence

**Solutions** :
1. Ajoutez des logs dans le useEffect de génération des graphiques
2. Vérifiez que `metrics` change bien
3. Assurez-vous que le tableau `chartData` est mis à jour

## Bonnes Pratiques

### Pour le développement

- Utilisez `pnpm run dev:full` pour avoir toutes les fonctionnalités
- Si vous travaillez sur l'UI uniquement, `pnpm run dev` suffit
- Vérifiez toujours la console pour les erreurs

### Pour le débogage

- Utilisez `console.log()` stratégiquement
- Utilisez les outils de développement React
- Vérifiez le store Redux/Zustand pour voir les données

### Pour les tests

- Testez toujours avec et sans WebSocket
- Vérifiez le comportement responsive
- Testez les thèmes sombre et clair

## Support

Si vous rencontrez des problèmes persistants :

1. Vérifiez les logs du serveur WebSocket
2. Vérifiez les logs du navigateur
3. Consultez la documentation des composants utilisés
4. Vérifiez que toutes les dépendances sont à jour (`pnpm update`)

N'hésitez pas à demander de l'aide si vous avez besoin d'assistance supplémentaire !