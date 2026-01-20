// src/lib/validators.ts

import { z } from 'zod';

/**
 * Schéma de validation pour les configurations API
 * Valide la structure des configurations de modèles
 */
export const configSchema = z.object({
  models: z.array(
    z.object({
      id: z.string().uuid(), // Exige un UUID valide
      name: z.string().min(1), // Nom non vide
      options: z.object({
        temperature: z.number().min(0).max(1), // Température entre 0 et 1
        top_p: z.number().min(0).max(1),       // Top-p entre 0 et 1
      }),
    })
  ),
  parameters: z.array(
    z.object({
      category: z.string().min(1), // Catégorie non vide
      paramName: z.string().min(1), // ParamName non vide
    })
  ),
});

/**
 * Schéma de validation pour les paramètres API
 * Valide les paramètres de configuration
 */
export const parameterSchema = z.object({
  category: z.string().min(1),
  paramName: z.string().min(1),
});

/**
 * Schéma de validation pour les messages WebSocket
 * Valide les messages entrants via WebSocket
 */
export const websocketSchema = z.object({
  message: z.string().min(1), // Message non vide
  clientId: z.string().uuid(), // ClientId doit être un UUID valide
  timestamp: z.number().int(),   // Timestamp entier
});

/**
 * Types exportés pour l'utilisation dans les API routes
 */
export type ConfigSchema = z.infer<typeof configSchema>;
export type ParameterSchema = z.infer<typeof parameterSchema>;
export type WebSocketSchema = z.infer<typeof websocketSchema>;