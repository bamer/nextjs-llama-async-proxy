# API Documentation - Llama Runner Async Proxy

Documentation complète des endpoints API REST et WebSocket.

## 🔗 Base URL

```
http://localhost:3000/api
```

## 📋 Routes API

### Modèles (`/models`)

#### GET `/api/models`
Récupère la liste des modèles enregistrés.

**Response:**
```json
{
  "count": 3,
  "models": [
    {
      "name": "llama-2-7b-chat",
      "description": "Chat model for Llama 2",
      "status": "running",
      "version": "2.0"
    }
  ]
}
```

#### POST `/api/models`
Enregistre de nouveaux modèles.

**Request:**
```json
{
  "models": [
    {
      "name": "mistral-7b",
      "description": "Mistral model",
      "path": "/path/to/model"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Models registered successfully",
  "registered": 1
}
```

#### POST `/api/models/discover`
Découvre automatiquement des modèles dans les chemins spécifiés.

**Request:**
```json
{
  "paths": ["/path/to/models", "/another/path"]
}
```

**Response:**
```json
{
  "discovered": [
    {
      "name": "llama-3-8b",
      "description": "Llama 3 Base model",
      "version": "3.0",
      "path": "/path/to/models/llama-3-8b.gguf",
      "family": "llama",
      "size": 1234567890
    }
  ],
  "scannedPaths": ["/path/to/models", "/another/path"],
  "totalFound": 1
}
```

### Configuration (`/config`)

#### GET `/api/config`
Récupère la configuration de l'application.

**Response:**
```json
{
  "app": {
    "name": "Llama Runner Async Proxy",
    "version": "0.1.0",
    "port": 3000
  },
  "models": {
    "defaultModel": "llama-2-7b-chat",
    "maxConcurrent": 3
  }
}
```

#### POST `/api/config`
Met à jour la configuration.

**Request:**
```json
{
  "models": {
    "defaultModel": "mistral-7b",
    "maxConcurrent": 5
  }
}
```

### Monitoring (`/monitoring`)

#### GET `/api/monitoring`
Récupère les métriques de performance actuelles.

**Response:**
```json
{
  "cpu": 45.2,
  "memory": 67.8,
  "activeModels": 2,
  "totalRequests": 1234,
  "uptime": 3600
}
```

#### GET `/api/monitoring/history`
Récupère l'historique des métriques.

**Query Parameters:**
- `hours` (number): Nombre d'heures d'historique (défaut: 24)

**Response:**
```json
{
  "history": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "cpu": 45.2,
      "memory": 67.8,
      "requests": 150
    }
  ]
}
```

### Paramètres (`/parameters`)

#### GET `/api/parameters`
Liste les catégories de paramètres disponibles.

**Response:**
```json
{
  "categories": [
    "model",
    "system",
    "performance"
  ]
}
```

#### GET `/api/parameters/[category]`
Récupère les paramètres d'une catégorie spécifique.

**Path Parameters:**
- `category`: Nom de la catégorie (model, system, performance)

**Response:**
```json
{
  "category": "model",
  "parameters": {
    "temperature": {
      "value": 0.7,
      "min": 0.0,
      "max": 2.0,
      "description": "Controls randomness in generation"
    },
    "maxTokens": {
      "value": 2048,
      "min": 1,
      "max": 4096,
      "description": "Maximum tokens to generate"
    }
  }
}
```

#### GET `/api/parameters/category/[paramName]`
Récupère la valeur d'un paramètre spécifique.

**Path Parameters:**
- `paramName`: Nom du paramètre

**Response:**
```json
{
  "parameter": "temperature",
  "value": 0.7,
  "category": "model"
}
```

## 🌐 WebSocket

### Connexion
```
ws://localhost:3000/api/websocket
```

### Messages entrants

#### Status Update
```json
{
  "type": "status",
  "data": {
    "cpuUsage": 45.2,
    "memoryUsage": 67.8,
    "activeModels": 2,
    "totalRequests": 1234
  }
}
```

#### Logs
```json
{
  "type": "logs",
  "data": [
    {
      "level": "info",
      "message": "Model loaded successfully",
      "timestamp": "2024-01-15T10:00:00Z",
      "source": "model-manager"
    }
  ]
}
```

#### Errors
```json
{
  "type": "error",
  "data": {
    "message": "Model loading failed",
    "code": "MODEL_LOAD_ERROR",
    "details": "File not found"
  }
}
```

## 🚨 Gestion des erreurs

Toutes les API retournent des erreurs au format standard :

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error information"
}
```

### Codes d'erreur courants

- `400` - Bad Request (paramètres invalides)
- `404` - Not Found (ressource inexistante)
- `500` - Internal Server Error (erreur serveur)

## 🔐 Authentification

*À implémenter* - Les API actuelles sont ouvertes. Ajouter une authentification JWT pour la production.

## 📊 Limites et quotas

- **Rate limiting** : 100 requêtes/minute par IP
- **Timeout** : 30 secondes pour les opérations longues
- **Payload** : Maximum 10MB par requête

## 🧪 Tests

### Tests unitaires
```bash
pnpm test
```

### Tests d'intégration
```bash
# Tests API avec Jest
pnpm test -- --testPathPattern=api
```

### Tests E2E
```bash
# Tests avec Playwright
npx playwright test
```

## 📈 Monitoring

### Métriques disponibles
- Temps de réponse des API
- Taux d'erreur par endpoint
- Utilisation CPU/Mémoire
- Nombre de connexions WebSocket actives

### Logs
Tous les accès API sont loggés avec :
- Timestamp
- IP client
- Endpoint appelé
- Code de réponse
- Temps d'exécution

---

*Documentation générée le 15 décembre 2025*