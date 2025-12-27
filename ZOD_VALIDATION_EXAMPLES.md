# Zod Validation Examples

This document provides examples of how the Zod validation works in the API routes and configuration loading.

## API Route Validation Examples

### Example 1: Start Model - Valid Request

```bash
curl -X POST http://localhost:3000/api/models/llama-3.2-3b-instruct-q4/start \
  -H "Content-Type: application/json" \
  -d '{
    "template": "custom_template"
  }'
```

**Response:** `200 OK` - Model started successfully

### Example 2: Start Model - Invalid Data Type

```bash
curl -X POST http://localhost:3000/api/models/llama-3.2-3b-instruct-q4/start \
  -H "Content-Type: application/json" \
  -d '{
    "template": 123
  }'
```

**Response:** `400 Bad Request`
```json
{
  "error": "Invalid request body",
  "details": ["template: Expected string, received number"]
}
```

### Example 3: Config Update - Valid Partial Update

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "appConfig": {
      "maxConcurrentModels": 2,
      "logLevel": "debug"
    }
  }'
```

**Response:** `200 OK` - Configuration saved successfully

### Example 4: Config Update - Invalid Log Level

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "appConfig": {
      "logLevel": "invalid"
    }
  }'
```

**Response:** `400 Bad Request`
```json
{
  "error": "Invalid request body",
  "details": [
    "appConfig.logLevel: Invalid enum value. Expected 'error' | 'warn' | 'info' | 'debug', received 'invalid'"
  ]
}
```

### Example 5: Config Update - Missing Both Configs

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:** `400 Bad Request`
```json
{
  "error": "Invalid request body",
  "details": ["At least one of appConfig or serverConfig must be provided"]
}
```

### Example 6: Config Update - Out of Range Value

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "appConfig": {
      "maxConcurrentModels": 15
    }
  }'
```

**Response:** `400 Bad Request`
```json
{
  "error": "Invalid request body",
  "details": ["appConfig.maxConcurrentModels: Number must be less than or equal to 10"]
}
```

### Example 7: Server Config - Invalid Port

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "serverConfig": {
      "port": 70000
    }
  }'
```

**Response:** `400 Bad Request`
```json
{
  "error": "Invalid request body",
  "details": ["serverConfig.port: Number must be less than or equal to 65535"]
}
```

### Example 8: Rescan - Invalid Port Type

```bash
curl -X POST http://localhost:3000/api/llama-server/rescan \
  -H "Content-Type: application/json" \
  -d '{
    "port": "not-a-number"
  }'
```

**Response:** `400 Bad Request`
```json
{
  "error": "Invalid request body",
  "details": ["port: Invalid input"]
}
```

## Configuration Validation Examples

### Example 9: Valid app-config.json

```json
{
  "maxConcurrentModels": 2,
  "logLevel": "info",
  "autoUpdate": false,
  "notificationsEnabled": true
}
```

**Result:** Configuration loaded successfully

### Example 10: Invalid app-config.json - Missing Required Field

```json
{
  "logLevel": "info",
  "autoUpdate": false,
  "notificationsEnabled": true
}
```

**Result (logged):**
```
[server-config] app-config.json contains invalid data. Errors: [
  "maxConcurrentModels: Required"
]
[server-config] Falling back to default configuration. Please fix the configuration file.
```

### Example 11: Invalid llama-server-config.json - Invalid Host

```json
{
  "host": "",
  "port": 8134,
  "basePath": "/models",
  "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

**Result (logged):**
```
[server-config] llama-server-config.json contains invalid data. Errors: [
  "host: String must contain at least 1 character(s)"
]
[server-config] Falling back to default configuration. Please fix the configuration file.
```

### Example 12: Valid llama-server-config.json with Optional Fields

```json
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/models",
  "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
  "ctx_size": 131000,
  "batch_size": 512
}
```

**Result:** Configuration loaded successfully (threads and gpu_layers default to -1)

## Error Response Format

All validation errors follow this format:

```json
{
  "error": "Invalid request body",
  "details": [
    "field1: Error message",
    "field2: Another error message"
  ]
}
```

**HTTP Status Codes:**
- `400 Bad Request` - Validation errors
- `500 Internal Server Error` - Unexpected errors

## Validation Benefits

1. **Security:** Prevents injection attacks through strict type checking
2. **Type Safety:** Ensures data matches expected types
3. **User Experience:** Clear, actionable error messages
4. **Debugging:** Detailed error logging for development
5. **Reliability:** Graceful fallback to defaults for invalid configs

## Testing Your Implementation

1. **Test Valid Requests:** All valid requests should pass validation
2. **Test Invalid Types:** Send wrong types (string instead of number, etc.)
3. **Test Missing Fields:** Omit required fields
4. **Test Out of Range Values:** Send values outside allowed ranges
5. **Test Invalid Enums:** Send invalid enum values
6. **Test Empty Bodies:** Send empty JSON objects

## Migration Notes

- Existing valid configurations will continue to work
- Invalid configurations will log errors and fall back to defaults
- Config files need to be fixed before custom values are used
- No downtime is introduced by this validation integration
