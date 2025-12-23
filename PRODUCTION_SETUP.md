# Guide de Configuration pour la Production

## Configuration Actuelle

Le dashboard est maintenant configuré pour **exiger des données réelles** en mode production. Voici comment cela fonctionne :

### Comportement par Défaut

- **Mode Développement** (`NODE_ENV !== 'production'`):
  - Mock data disponible comme fallback
  - Utile pour le développement et les tests
  - Données GPU mock générées automatiquement

- **Mode Production** (`NODE_ENV === 'production'`):
  - **Aucune donnée mock** - nécessite une connexion WebSocket réelle
  - Affichage clair quand il n'y a pas de données
  - Pas de données trompeuses

## Comment Démarrer Correctement

### Pour le Développement (avec données mock)

```bash
# Assurez-vous que NODE_ENV n'est pas 'production'
# Le comportement par défaut permet les mocks en développement

pnpm run dev
```

### Pour la Production (données réelles uniquement)

```bash
# Démarrer le serveur WebSocket
pnpm run dev:full

# Ou pour la production
NODE_ENV=production pnpm run build
NODE_ENV=production pnpm run start
```

## Configuration du Mode Monitoring

### Fichier de Configuration

`src/config/monitoring.config.ts`

### Options Principales

```typescript
{
  REQUIRE_REAL_DATA: process.env.NODE_ENV === 'production', // Principal
  
  WEBSOCKET: {
    CONNECTION_TIMEOUT: 5000, // Temps avant timeout
    AUTO_RECONNECT: true,      // Reconnexion automatique
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 3000
  },
  
  MOCK_DATA: {
    ENABLE_FALLBACK: process.env.NODE_ENV !== 'production', // Mocks en dev
    UPDATE_INTERVAL: 5000,
    GPU: {
      NAME: 'NVIDIA RTX 4090',
      MEMORY_TOTAL_MB: 24576,
      POWER_LIMIT_W: 350
    }
  }
}
```

## Personnalisation

### Activer les Mocks en Production (non recommandé)

Si vous avez vraiment besoin de mocks en production (pour les démos par exemple) :

```typescript
// Dans monitoring.config.ts
REQUIRE_REAL_DATA: false, // Désactive l'exigence de données réelles
MOCK_DATA: {
  ENABLE_FALLBACK: true, // Active les mocks même en production
}
```

### Désactiver les Mocks en Développement

Pour tester le comportement de production pendant le développement :

```typescript
// Dans monitoring.config.ts
REQUIRE_REAL_DATA: true, // Même comportement qu'en production
MOCK_DATA: {
  ENABLE_FALLBACK: false, // Désactive les mocks
}
```

## Indicateurs Visuels

### Connexion WebSocket

- **Connecté** : Badge VERT avec "CONNECTED"
- **Déconnecté** : Badge ROUGE CLIGNOTANT avec "DISCONNECTED"
- **Statut clair** : Texte indiquant l'état de la connexion

### Pas de Données Disponibles

Quand il n'y a pas de données (et que les mocks sont désactivés) :

1. **Message clair** : "No Real Data Available" en rouge
2. **Explication** : "This dashboard requires a real WebSocket connection"
3. **Instructions** : "Please start the WebSocket server to monitor real data"
4. **Boutons** :
   - "Retry Connection" - pour réessayer
   - "Development Mode" - pour basculer en mode dev (en production)

## Bonnes Pratiques

### Pour le Développement

1. **Utilisez les mocks** pour le développement UI
2. **Testez avec WebSocket** pour vérifier l'intégration
3. **Vérifiez les deux modes** avant de déployer

### Pour la Production

1. **Toujours démarrer le serveur WebSocket**
2. **Ne jamais déployer avec des mocks activés**
3. **Surveillez les logs** pour les problèmes de connexion
4. **Configurez les alertes** pour les déconnexions

### Pour les Tests

1. **Testez le comportement sans WebSocket**
2. **Vérifiez que les erreurs sont claires**
3. **Assurez-vous que les mocks sont réalistes**
4. **Testez la reconnexion automatique**

## Résolution des Problèmes

### "No Real Data Available" en Production

**Cause** : Le serveur WebSocket n'est pas démarré ou inaccessible.

**Solution** :

1. Vérifiez que le serveur WebSocket est démarré :
   ```bash
   pnpm run dev:full  # Pour le développement
   # Ou votre commande de production
   ```

2. Vérifiez la connexion réseau
3. Vérifiez les logs du serveur
4. Vérifiez que le port est accessible

### Les Mocks s'affichent en Production

**Cause** : La configuration permet les mocks en production.

**Solution** :

1. Vérifiez `monitoring.config.ts`
2. Assurez-vous que `REQUIRE_REAL_DATA: true`
3. Assurez-vous que `MOCK_DATA.ENABLE_FALLBACK: false`
4. Redémarrez l'application

### Le Badge de Connexion ne s'affiche pas

**Cause** : Problème d'import ou de rendu.

**Solution** :

1. Vérifiez que le composant est correctement importé
2. Vérifiez la console pour les erreurs
3. Assurez-vous que `isConnected` est défini

## Architecture Recommandée

### Environnement de Production

```
[Client Browser] 
       ↓ WebSocket (wss://)
[Load Balancer] 
       ↓
[WebSocket Server] ←→ [Data Sources]
       ↑
[Monitoring Dashboard]
```

### Configuration Recommandée

1. **WebSocket sécurisé** : Utilisez `wss://` en production
2. **Authentification** : Ajoutez l'authentification WebSocket
3. **Chiffrement** : Chiffrez les données sensibles
4. **Surveillance** : Surveillez la connexion WebSocket
5. **Redondance** : Ayez un serveur WebSocket de secours

## Support

Si vous avez des questions ou des problèmes :

1. Consultez les logs du serveur WebSocket
2. Vérifiez la configuration dans `monitoring.config.ts`
3. Consultez le guide de dépannage `TROUBLESHOOTING.md`
4. Vérifiez que toutes les dépendances sont à jour

N'hésitez pas à demander de l'aide pour la configuration spécifique à votre environnement !