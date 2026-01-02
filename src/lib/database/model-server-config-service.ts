import { initDatabase, closeDatabase } from "./database-client";
import { ModelServerConfig } from "./models-service";

export function saveServerConfig(
  config: Omit<ModelServerConfig, "id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const existing = db.prepare("SELECT id FROM model_server_config").get() as { id: number } | undefined;

    if (existing) {
      const stmt = db.prepare(`
        UPDATE model_server_config SET
          host = ?, port = ?, api_prefix = ?, path = ?, webui = ?, webui_config_file = ?,
          no_webui = ?, embeddings = ?, reranking = ?, api_key = ?, api_key_file = ?,
          ssl_key_file = ?, ssl_cert_file = ?, timeout = ?, threads_http = ?, cache_reuse = ?,
          metrics_enabled = ?, props_enabled = ?, slots_enabled = ?, slot_save_path = ?,
          media_path = ?, models_dir = ?, models_preset = ?, models_max = ?,
          models_autoload = ?, jinja = ?, chat_template = ?, chat_template_file = ?,
          chat_template_kwargs = ?, prefill_assistant = ?, ctx_checkpoints = ?,
          verbose_prompt = ?, warmup = ?, spm_infill = ?, log_disable = ?,
          log_file = ?, log_colors = ?, log_verbose = ?, log_prefix = ?, log_timestamps = ?,
          updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        config.host ?? "127.0.0.1",
        config.port ?? 8080,
        config.api_prefix ?? null,
        config.path ?? null,
        config.webui ?? null,
        config.webui_config_file ?? null,
        config.no_webui ?? 0,
        config.embeddings ?? 0,
        config.reranking ?? 0,
        config.api_key ?? null,
        config.api_key_file ?? null,
        config.ssl_key_file ?? null,
        config.ssl_cert_file ?? null,
        config.timeout ?? 600,
        config.threads_http ?? null,
        config.cache_reuse ?? null,
        config.metrics_enabled ?? 1,
        config.props_enabled ?? 0,
        config.slots_enabled ?? 0,
        config.slot_save_path ?? null,
        config.media_path ?? null,
        config.models_dir ?? null,
        config.models_preset ?? null,
        config.models_max ?? 4,
        config.models_autoload ?? 0,
        config.jinja ?? 0,
        config.chat_template ?? null,
        config.chat_template_file ?? null,
        config.chat_template_kwargs ?? null,
        config.prefill_assistant ?? 0,
        config.ctx_checkpoints ?? 8,
        config.verbose_prompt ?? 0,
        config.warmup ?? 0,
        config.spm_infill ?? 0,
        config.log_disable ?? null,
        config.log_file ?? null,
        config.log_colors ?? null,
        config.log_verbose ?? 0,
        config.log_prefix ?? 0,
        config.log_timestamps ?? 0,
        now,
        existing.id
      );

      return existing.id;
    } else {
      const stmt = db.prepare(`
        INSERT INTO model_server_config (
          host, port, api_prefix, path, webui, webui_config_file, no_webui,
          embeddings, reranking, api_key, api_key_file, ssl_key_file, ssl_cert_file,
          timeout, threads_http, cache_reuse, metrics_enabled, props_enabled,
          slots_enabled, slot_save_path, media_path, models_dir, models_preset,
          models_max, models_autoload, jinja, chat_template, chat_template_file,
          chat_template_kwargs, prefill_assistant, ctx_checkpoints, verbose_prompt,
          warmup, spm_infill, log_disable, log_file, log_colors, log_verbose,
          log_prefix, log_timestamps, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        config.host ?? "127.0.0.1",
        config.port ?? 8080,
        config.api_prefix ?? null,
        config.path ?? null,
        config.webui ?? null,
        config.webui_config_file ?? null,
        config.no_webui ?? 0,
        config.embeddings ?? 0,
        config.reranking ?? 0,
        config.api_key ?? null,
        config.api_key_file ?? null,
        config.ssl_key_file ?? null,
        config.ssl_cert_file ?? null,
        config.timeout ?? 600,
        config.threads_http ?? null,
        config.cache_reuse ?? null,
        config.metrics_enabled ?? 1,
        config.props_enabled ?? 0,
        config.slots_enabled ?? 0,
        config.slot_save_path ?? null,
        config.media_path ?? null,
        config.models_dir ?? null,
        config.models_preset ?? null,
        config.models_max ?? 4,
        config.models_autoload ?? 0,
        config.jinja ?? 0,
        config.chat_template ?? null,
        config.chat_template_file ?? null,
        config.chat_template_kwargs ?? null,
        config.prefill_assistant ?? 0,
        config.ctx_checkpoints ?? 8,
        config.verbose_prompt ?? 0,
        config.warmup ?? 0,
        config.spm_infill ?? 0,
        config.log_disable ?? null,
        config.log_file ?? null,
        config.log_colors ?? null,
        config.log_verbose ?? 0,
        config.log_prefix ?? 0,
        config.log_timestamps ?? 0,
        now,
        now
      );

      return result.lastInsertRowid as number;
    }
  } finally {
    closeDatabase(db);
  }
}
