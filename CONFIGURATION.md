# Configuration du Proxy Llama-Server

Ce document décrit toutes les options de configuration disponibles pour le proxy Llama.

## Configuration via Interface Web

Accédez à `/config` dans l'application pour configurer le proxy via une interface graphique.

## Configuration via API

### Endpoint: `GET /api/config`
Récupère la configuration actuelle complète.

### Endpoint: `POST /api/config`
Met à jour la configuration.

```json
{
  "llama_server": {
    "host": "localhost",
    "port": 8080,
    "timeout": 30000
  },
  "llama_config": {
    // Toutes les options ci-dessous
  },
  "model_paths": {
    "modelsDir": "./models",
    "defaultModel": ""
  },
  "reset": false // true pour réinitialiser toute la config
}
```

## Options de Configuration Llama-Server

### Options Serveur
- `port` (number, default: 8080): Port du serveur
- `host` (string, default: "127.0.0.1"): Adresse d'écoute
- `timeout` (number, default: 30000): Timeout des requêtes en ms

### Options Modèle
- `model` (string): Chemin vers le fichier modèle (.gguf)

### Options Contexte et Mémoire
- `context_size` | `n_ctx` (number, default: 2048): Taille du contexte
- `n_batch` (number, default: 512): Taille du batch pour le traitement des prompts
- `n_ubatch` (number, default: 512): Taille du batch unifié

### Options GPU
- `n_gpu_layers` (number, default: 0): Nombre de couches à décharger sur GPU
- `main_gpu` (number, default: 0): Index du GPU principal
- `tensor_split` (string): Répartition des tenseurs sur les GPUs (virgules)
- `n_gqa` (number, default: 0): Facteur Group Query Attention

### Options CPU
- `n_threads` (number, default: -1): Nombre de threads (-1 = auto)
- `n_threads_batch` (number, default: -1): Threads pour le traitement en batch

### Options d'Échantillonnage (Sampling)
- `temperature` (number, 0-2, default: 0.7): Température d'échantillonnage
- `top_k` (number, min: 1, default: 40): Top-K sampling
- `top_p` (number, 0-1, default: 0.9): Top-P sampling
- `min_p` (number, 0-1, default: 0.0): Probabilité minimale
- `xtc_probability` (number, 0-1, default: 0.0): Probabilité XTC
- `xtc_threshold` (number, 0-1, default: 0.1): Seuil XTC
- `typical_p` (number, 0-1, default: 1.0): Typical sampling
- `repeat_last_n` (number, min: 0, default: 64): Fenêtre de pénalité de répétition
- `repeat_penalty` (number, min: 0, default: 1.0): Pénalité de répétition
- `presence_penalty` (number, -2-2, default: 0.0): Pénalité de présence
- `frequency_penalty` (number, -2-2, default: 0.0): Pénalité de fréquence
- `dry_multiplier` (number, min: 0, default: 0.0): Multiplicateur DRY
- `dry_base` (number, min: 0, default: 1.75): Base DRY
- `dry_allowed_length` (number, min: 0, default: 2): Longueur autorisée DRY
- `dry_penalty_last_n` (number, min: 0, default: 20): Fenêtre DRY
- `dry_sequence_breaker` (string): Séquence de rupture DRY (JSON array)

### Options de Génération
- `max_tokens` (number, min: 1, default: 100): Nombre maximum de tokens
- `max_seq_len` (number, min: 0, default: 0): Longueur maximale de séquence
- `seed` (number, default: -1): Graine aléatoire (-1 = aléatoire)

### Options de Chargement du Modèle
- `embedding` (boolean, default: false): Mode embedding
- `memory_f16` (boolean, default: false): Utiliser F16
- `memory_f32` (boolean, default: false): Utiliser F32
- `memory_auto` (boolean, default: true): Sélection auto du type mémoire
- `vocab_only` (boolean, default: false): Charger seulement le vocabulaire

### Options RoPE
- `rope_freq_base` (number, default: 0.0): Base de fréquence RoPE
- `rope_freq_scale` (number, default: 0.0): Échelle de fréquence RoPE

### Options YaRN
- `yarn_ext_factor` (number, default: 0.0): Facteur d'extension YaRN
- `yarn_attn_factor` (number, default: 0.0): Facteur d'attention YaRN
- `yarn_beta_fast` (number, default: 0.0): Beta fast YaRN
- `yarn_beta_slow` (number, default: 0.0): Beta slow YaRN

### Options Serveur
- `api_keys` (string): Clés API (séparées par virgules)
- `ssl_cert_file` (string): Fichier certificat SSL
- `ssl_key_file` (string): Fichier clé SSL
- `cors_allow_origins` (string): Origines CORS autorisées
- `system_prompt` (string): Prompt système
- `chat_template` (string): Template de chat

### Options de Logging
- `log_format` (string, "text"|"json", default: "text"): Format des logs
- `log_level` (string, "debug"|"info"|"warn"|"error", default: "info"): Niveau de log
- `log_colors` (boolean, default: true): Couleurs dans les logs
- `log_verbose` (boolean, default: false): Logging verbeux

### Autres Options
- `cache_reuse` (number, default: 0): Niveau de réutilisation du cache
- `cache_type_k` (string, "f16"|"f32"|"q8_0"|"q4_0", default: "f16"): Type de cache pour K
- `cache_type_v` (string, "f16"|"f32"|"q8_0"|"q4_0", default: "f16"): Type de cache pour V
- `ml_lock` (boolean, default: false): Verrouiller la mémoire
- `no_kv_offload` (boolean, default: false): Désactiver l'offload KV

## Configuration via Variables d'Environnement

Les variables d'environnement sont chargées au démarrage et peuvent être surchargées par la configuration runtime.

```bash
# Serveur
LLAMA_SERVER_PORT=8134
LLAMA_SERVER_HOST=localhost
LLAMA_SERVER_TIMEOUT=30000

# Modèles
LLAMA_MODELS_DIR=./models
LLAMA_DEFAULT_MODEL=

# Options courantes
LLAMA_CONTEXT_SIZE=4096
LLAMA_GPU_LAYERS=35
LLAMA_THREADS=-1
LLAMA_TEMPERATURE=0.7
LLAMA_TOP_P=0.9
LLAMA_MAX_TOKENS=200
```

## Exemples d'Utilisation

### Configuration Basique
```json
{
  "llama_server": {
    "host": "localhost",
    "port": 8080
  },
  "llama_config": {
    "n_ctx": 4096,
    "n_gpu_layers": 35,
    "temperature": 0.7
  },
  "model_paths": {
    "modelsDir": "/home/user/models"
  }
}
```

### Configuration Avancée pour GPU
```json
{
  "llama_config": {
    "n_ctx": 8192,
    "n_batch": 1024,
    "n_gpu_layers": 40,
    "main_gpu": 0,
    "tensor_split": "7,7,7,7",
    "n_gqa": 1,
    "cache_type_k": "q8_0",
    "cache_type_v": "q8_0",
    "temperature": 0.8,
    "top_p": 0.9,
    "repeat_penalty": 1.1,
    "presence_penalty": 0.1
  }
}
```

### Configuration pour Chat
```json
{
  "llama_config": {
    "chat_template": "llama2",
    "system_prompt": "You are a helpful AI assistant.",
    "temperature": 0.7,
    "max_tokens": 512,
    "repeat_penalty": 1.1,
    "presence_penalty": 0.1,
    "frequency_penalty": 0.1
  }
}
```