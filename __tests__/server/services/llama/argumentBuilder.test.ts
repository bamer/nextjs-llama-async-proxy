import { ArgumentBuilder } from '@/server/services/llama/argumentBuilder';
import type { LlamaServerConfig } from '@/server/services/llama/types';

describe('ArgumentBuilder', () => {
  describe('build', () => {
    it('should build basic config arguments', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8134,
        basePath: '/models',
        ctx_size: 8192,
        batch_size: 512,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-m');
      expect(args).toContain('-c');
      expect(args).toContain('-b');
      expect(args).toContain('-t');
    });

    it('should use models directory when no model path', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8134,
        basePath: '/models',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--models-dir');
      expect(args).toContain('/models');
    });

    it('should use model path when specified', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8134,
        modelPath: '/path/to/model.gguf',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-m');
      expect(args).toContain('/path/to/model.gguf');
      expect(args).not.toContain('--models-dir');
    });

    it('should configure host and port', () => {
      const config: LlamaServerConfig = {
        host: '192.168.1.100',
        port: 9000,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--host');
      expect(args).toContain('192.168.1.100');
      expect(args).toContain('--port');
      expect(args).toContain('9000');
    });

    it('should set context size', () => {
      const config: LlamaServerConfig = {
        ctx_size: 16384,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-c');
      expect(args).toContain('16384');
    });

    it('should set batch size', () => {
      const config: LlamaServerConfig = {
        batch_size: 1024,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-b');
      expect(args).toContain('1024');
    });

    it('should set threads when not -1', () => {
      const config: LlamaServerConfig = {
        threads: 4,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-t');
      expect(args).toContain('4');
    });

    it('should not set threads when -1', () => {
      const config: LlamaServerConfig = {
        threads: -1,
      };

      const args = ArgumentBuilder.build(config);

      const threadArg = args[args.indexOf('-t') + 1];
      expect(threadArg).not.toBe('4');
    });

    it('should set GPU layers when not -1', () => {
      const config: LlamaServerConfig = {
        gpu_layers: 35,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-ngl');
      expect(args).toContain('35');
    });

    it('should not set GPU layers when -1', () => {
      const config: LlamaServerConfig = {
        gpu_layers: -1,
      };

      const args = ArgumentBuilder.build(config);

      const gpuArgIndex = args.indexOf('-ngl');
      if (gpuArgIndex >= 0) {
        const gpuArg = args[gpuArgIndex + 1];
        expect(gpuArg).not.toBe('35');
      }
    });

    it('should enable flash attention when on', () => {
      const config: LlamaServerConfig = {
        flash_attn: 'on',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-fa');
    });

    it('should disable flash attention when off', () => {
      const config: LlamaServerConfig = {
        flash_attn: 'off',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--no-flash-attn');
    });

    it('should set temperature', () => {
      const config: LlamaServerConfig = {
        temperature: 0.7,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--temp');
      expect(args).toContain('0.7');
    });

    it('should set top_k', () => {
      const config: LlamaServerConfig = {
        top_k: 40,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--top-k');
      expect(args).toContain('40');
    });

    it('should set top_p', () => {
      const config: LlamaServerConfig = {
        top_p: 0.9,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--top-p');
      expect(args).toContain('0.9');
    });

    it('should set repeat penalty', () => {
      const config: LlamaServerConfig = {
        repeat_penalty: 1.1,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--repeat-penalty');
      expect(args).toContain('1.1');
    });

    it('should set n_predict', () => {
      const config: LlamaServerConfig = {
        n_predict: 512,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-n');
      expect(args).toContain('512');
    });

    it('should set seed when not -1', () => {
      const config: LlamaServerConfig = {
        seed: 42,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--seed');
      expect(args).toContain('42');
    });

    it('should enable embedding mode', () => {
      const config: LlamaServerConfig = {
        embedding: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--embedding');
    });

    it('should set cache types', () => {
      const config: LlamaServerConfig = {
        cache_type_k: 'f16',
        cache_type_v: 'f16',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--cache-type-k');
      expect(args).toContain('f16');
      expect(args).toContain('--cache-type-v');
      expect(args).toContain('f16');
    });

    it('should enable verbose logging', () => {
      const config: LlamaServerConfig = {
        verbose: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--verbose');
    });

    it('should include custom server args', () => {
      const config: LlamaServerConfig = {
        serverArgs: ['--custom-arg1', '--custom-arg2'],
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--custom-arg1');
      expect(args).toContain('--custom-arg2');
    });

    it('should build minimal config', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8134,
      };

      const args = ArgumentBuilder.build(config);

      expect(Array.isArray(args)).toBe(true);
      expect(args.length).toBeGreaterThan(0);
    });

    it('should build full config', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8134,
        basePath: '/models',
        modelPath: '/model.gguf',
        ctx_size: 8192,
        batch_size: 512,
        threads: 4,
        gpu_layers: 35,
        flash_attn: 'on',
        temperature: 0.7,
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1,
        n_predict: 512,
        seed: 42,
        embedding: true,
        verbose: true,
        serverArgs: ['--custom'],
      };

      const args = ArgumentBuilder.build(config);

      expect(args.length).toBeGreaterThan(20);
    });
  });
});
