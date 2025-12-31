#!/usr/bin/env node

// Simulate the exact flow that should happen

console.log('=== Simulating load_models flow ===\n');

try {
  // Step 1: Import database functions
  const { initDatabase, getModels, getCompleteModelConfig, closeDatabase } = require('./src/lib/database.ts');
  console.log('✅ Step 1: Database functions imported');

  // Step 2: Initialize database
  const db = initDatabase();
  console.log('✅ Step 2: Database initialized');

  // Step 3: Get models (simulate server's getModels())
  const models = getModels();
  console.log(`✅ Step 3: Found ${models.length} models`);

  if (models.length === 0) {
    console.log('❌ No models found in database');
    closeDatabase(db);
    process.exit(1);
  }

  // Step 4: Process first model (simulate server's map)
  const firstModel = models[0];
  console.log(`\n📋 Processing first model: ID=${firstModel.id}, name=${firstModel.name}`);

  try {
    const completeConfig = getCompleteModelConfig(firstModel.id);

    if (!completeConfig) {
      console.log('⚠️  getCompleteModelConfig returned null');
      console.log('  This means the function failed or model ID is invalid');
      closeDatabase(db);
      process.exit(1);
    }

    console.log('✅ Step 4: Complete config loaded');
    console.log('   Model:', completeConfig.model ? 'loaded' : 'null');
    console.log('   Sampling config:', completeConfig.sampling ? 'loaded' : 'null');
    console.log('   Memory config:', completeConfig.memory ? 'loaded' : 'null');
    console.log('   GPU config:', completeConfig.gpu ? 'loaded' : 'null');

    // Step 5: Build result object (simulate what server sends)
    const modelWithConfigs = {
      id: firstModel.id,
      name: firstModel.name,
      path: firstModel.path,
      size: firstModel.size,
      architecture: firstModel.architecture,
      parameters: {
        ...(firstModel.parameters || {}),
        sampling: completeConfig.sampling || null,
        memory: completeConfig.memory || null,
        gpu: completeConfig.gpu || null,
        advanced: completeConfig.advanced || null,
        lora: completeConfig.lora || null,
        multimodal: completeConfig.multimodal || null,
      },
      quantization: firstModel.quantization,
      rope_freq_scale: firstModel.rope_freq_scale,
    };

    console.log('\n✅ Step 5: Built modelWithConfigs object');
    console.log(`   Has sampling config: ${!!modelWithConfigs.parameters.sampling}`);
    console.log(`   Has memory config: ${!!modelWithConfigs.parameters.memory}`);

    closeDatabase(db);

    console.log('\n✅ Test passed! The flow works correctly.');
    console.log('Expected: Socket.io would emit {success: true, data: [...]}');
  } catch (error) {
    console.error('❌ ERROR in simulation:', error.message);
    console.error('Stack:', error.stack);
    closeDatabase(db);
    process.exit(1);
  }

} catch (error) {
  console.error('❌ CRITICAL ERROR:', error.message);
  console.error('This means imports failed - fix import paths');
  process.exit(1);
}
