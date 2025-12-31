#!/usr/bin/env node

// Simple test to check if getCompleteModelConfig works
const { initDatabase, getModels, getCompleteModelConfig, closeDatabase } = require('./src/lib/database.ts');

console.log('=== Testing getCompleteModelConfig ===\n');

try {
  const db = initDatabase();
  const models = getModels();

  console.log(`Found ${models.length} models`);

  if (models.length > 0) {
    const firstModel = models[0];
    console.log(`Testing with model ID: ${firstModel.id}`);

    const completeConfig = getCompleteModelConfig(firstModel.id);

    if (completeConfig) {
      console.log('✅ Complete config loaded:');
      console.log('  - model:', JSON.stringify(completeConfig.model, null, 2));
      console.log('  - sampling:', completeConfig.sampling ? 'loaded' : 'null');
      console.log('  - memory:', completeConfig.memory ? 'loaded' : 'null');
      console.log('  - gpu:', completeConfig.gpu ? 'loaded' : 'null');
    } else {
      console.log('❌ Complete config is null');
    }
  }

  closeDatabase(db);
  console.log('\n✅ Test completed successfully');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
