/**
 * DEPRECATED: This file has been moved to src/lib/client-model-templates.ts
 * 
 * This file was causing server-only import issues because it imported
 * from @/lib/logger which uses Winston with fs operations.
 * 
 * Client components should now import from: @/lib/client-model-templates
 * 
 * Migration guide:
 * - Old: import { ... } from '@/server/model-templates';
 * - New: import { ... } from '@/lib/client-model-templates';
 * 
 * This file is kept for backward compatibility and can be deleted
 * after verifying all imports have been updated.
 */

// Re-export everything from client module for backward compatibility
export * from '@/lib/client-model-templates';
