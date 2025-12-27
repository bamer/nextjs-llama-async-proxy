import { ArgumentBuilder } from '@/server/services/llama/argumentBuilder';
import { LlamaServerConfig } from '@/server/services/llama/types';

describe('ArgumentBuilder', () => {
  describe('build', () => {
    it('should build arguments with model path', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        modelPath: '/path/to/model.gguf',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-m');
      expect(args).toContain('/path/to/model.gguf');
    });

    it('should build arguments with models directory when no model path', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        basePath: '/path/to/models',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--models-dir');
      expect(args).toContain('/path/to/models');
    });

    it('should include server binding arguments', () => {
      const config: LlamaServerConfig = {
        host: '0.0.0.0',
        port: 3000,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--host');
      expect(args).toContain('0.0.0.0');
      expect(args).toContain('--port');
      expect(args).toContain('3000');
    });

    it('should include context size argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        ctx_size: 2048,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-c');
      expect(args).toContain('2048');
    });

    it('should not include context size if undefined', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('-c');
    });

    it('should include batch size argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        batch_size: 512,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-b');
      expect(args).toContain('512');
    });

    it('should include ubatch size argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        ubatch_size: 512,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--ubatch-size');
      expect(args).toContain('512');
    });

    it('should include threads argument when not -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        threads: 4,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-t');
      expect(args).toContain('4');
    });

    it('should not include threads argument when -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        threads: -1,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('-t');
    });

    it('should include threads-batch argument when not -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        threads_batch: 4,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--threads-batch');
      expect(args).toContain('4');
    });

    it('should not include threads-batch argument when -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        threads_batch: -1,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('--threads-batch');
    });

    it('should include gpu layers argument when not -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        gpu_layers: 20,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-ngl');
      expect(args).toContain('20');
    });

    it('should not include gpu layers argument when -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        gpu_layers: -1,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('-ngl');
    });

    it('should include main gpu argument when not 0', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        main_gpu: 1,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-mg');
      expect(args).toContain('1');
    });

    it('should not include main gpu argument when 0', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        main_gpu: 0,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('-mg');
    });

    it('should include -fa flag when flash_attn is on', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        flash_attn: 'on',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-fa');
    });

    it('should include --no-flash-attn flag when flash_attn is off', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        flash_attn: 'off',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--no-flash-attn');
    });

    it('should not include flash attention flag when auto', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        flash_attn: 'auto',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('-fa');
      expect(args).not.toContain('--no-flash-attn');
    });

    it('should include temperature argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        temperature: 0.7,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--temp');
      expect(args).toContain('0.7');
    });

    it('should include top_k argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        top_k: 40,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--top-k');
      expect(args).toContain('40');
    });

    it('should include top_p argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        top_p: 0.9,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--top-p');
      expect(args).toContain('0.9');
    });

    it('should include repeat_penalty argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        repeat_penalty: 1.1,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--repeat-penalty');
      expect(args).toContain('1.1');
    });

    it('should include n_predict argument when not -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        n_predict: 512,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('-n');
      expect(args).toContain('512');
    });

    it('should not include n_predict argument when -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        n_predict: -1,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('-n');
    });

    it('should include seed argument when not -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        seed: 42,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--seed');
      expect(args).toContain('42');
    });

    it('should not include seed argument when -1', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        seed: -1,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('--seed');
    });

    it('should include embedding flag when true', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        embedding: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--embedding');
    });

    it('should not include embedding flag when false or undefined', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        embedding: false,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).not.toContain('--embedding');
    });

    it('should include cache type k argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        cache_type_k: 'f16',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--cache-type-k');
      expect(args).toContain('f16');
    });

    it('should include cache type v argument', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        cache_type_v: 'f16',
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--cache-type-v');
      expect(args).toContain('f16');
    });

    it('should include verbose flag when true', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        verbose: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--verbose');
    });

    it('should include penalize_nl flag when true', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        penalize_nl: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--penalize-nl');
    });

    it('should include ignore_eos flag when true', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        ignore_eos: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--ignore-eos');
    });

    it('should include mlock flag when true', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        mlock: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--mlock');
    });

    it('should include numa flag when true', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        numa: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--numa');
    });

    it('should include memory_mapped flag when true', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        memory_mapped: true,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--memory-mapped');
    });

    it('should include --no-mmap flag when use_mmap is false', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        use_mmap: false,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--no-mmap');
    });

    it('should include custom server args', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        serverArgs: ['--custom-flag', 'custom-value', '--another-flag'],
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--custom-flag');
      expect(args).toContain('custom-value');
      expect(args).toContain('--another-flag');
    });

    it('should build comprehensive arguments with all options', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
        modelPath: '/path/to/model.gguf',
        ctx_size: 2048,
        batch_size: 512,
        ubatch_size: 512,
        threads: 4,
        threads_batch: 4,
        gpu_layers: 20,
        main_gpu: 1,
        flash_attn: 'on',
        temperature: 0.7,
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1,
        n_predict: 512,
        seed: 42,
        verbose: true,
        embedding: false,
        serverArgs: ['--custom'],
      };

      const args = ArgumentBuilder.build(config);

      expect(args.length).toBeGreaterThan(0);
      expect(args).toContain('-m');
      expect(args).toContain('/path/to/model.gguf');
      expect(args).toContain('--custom');
    });

    it('should handle minimal config with only required fields', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8080,
      };

      const args = ArgumentBuilder.build(config);

      expect(args).toContain('--host');
      expect(args).toContain('localhost');
      expect(args).toContain('--port');
      expect(args).toContain('8080');
    });
  });
});
