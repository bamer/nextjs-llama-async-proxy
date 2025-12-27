const { execSync } = require('child_process');

try {
  console.log('Running TypeScript type check...');
  const result = execSync('pnpm type:check', {
    cwd: '/home/bamer/nextjs-llama-async-proxy',
    encoding: 'utf-8',
    stdio: 'inherit'
  });
  console.log('✅ Type check passed!');
} catch (error) {
  console.error('❌ Type check failed:');
  console.error(error.message || error.stdout || error.stderr);
  process.exit(1);
}
