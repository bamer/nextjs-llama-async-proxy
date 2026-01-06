/**
 * GGUF Parser Module
 * Extracts metadata from GGUF model files and provides filename-based fallback parsing
 */

import fs from "fs";
import path from "path";
import { gguf, ggufAllShards } from "@huggingface/gguf";

/**
 * Parse GGUF file header synchronously
 * @param {string} filePath - Path to the GGUF file
 * @returns {Object|null} Metadata object or null if parsing fails
 */
export function parseGgufHeaderSync(filePath) {
    const metadata = {
        architecture: "",
        params: "",
        ctxSize: 4096,
        embeddingLength: 0,
        blockCount: 0,
        headCount: 0,
        headCountKv: 0,
        ffnDim: 0,
        fileType: 0,
    };

    try {
        const fd = fs.openSync(filePath, "r");

        // Read header (24 bytes)
        const headerBuf = Buffer.alloc(24);
        fs.readSync(fd, headerBuf, 0, 24, 0);
        const headerView = new DataView(
            headerBuf.buffer,
            headerBuf.byteOffset,
            headerBuf.byteLength
        );

        // Check magic number (GGUF = 0x46554747)
        const magic = headerView.getUint32(0, true);
        if (magic !== 0x46554747) {
            fs.closeSync(fd);
            return null; // Not a GGUF file
        }

        const version = headerView.getUint32(4, true);
        const tensorCount = Number(headerView.getBigUint64(8, true));
        const metadataCount = Number(headerView.getBigUint64(16, true));

        // Read metadata - Pre-allocate reusable buffers for performance
        let offset = 24;
        const ggufMeta = {};
        const lenBuf = Buffer.alloc(8);
        const typeBuf = Buffer.alloc(4);
        const valBuf = Buffer.alloc(4);
        const strLenBuf = Buffer.alloc(8);
        let keyBuf = Buffer.alloc(256);
        let strBuf = null;

        for (let i = 0; i < metadataCount; i++) {
            // Key length (uint64)
            fs.readSync(fd, lenBuf, 0, 8, offset);
            const keyLen = Number(new DataView(lenBuf.buffer).getBigUint64(0, true));
            offset += 8;

            // Key string (including null terminator) - expand buffer if needed
            if (keyLen > keyBuf.length) {
                keyBuf = Buffer.alloc(keyLen);
            }
            fs.readSync(fd, keyBuf, 0, keyLen, offset);
            const key = keyBuf.toString("utf8", 0, keyLen - 1);
            offset += keyLen;

            // Value type (uint32)
            fs.readSync(fd, typeBuf, 0, 4, offset);
            const type = new DataView(typeBuf.buffer).getUint32(0, true);
            offset += 4;

            // Value based on type
            if (type === 0) {
                // uint32
                fs.readSync(fd, valBuf, 0, 4, offset);
                ggufMeta[key] = new DataView(valBuf.buffer).getUint32(0, true);
                offset += 4;
            } else if (type === 8) {
                // string
                fs.readSync(fd, strLenBuf, 0, 8, offset);
                const strLen = Number(new DataView(strLenBuf.buffer).getBigUint64(0, true));
                offset += 8;

                // Expand string buffer if needed
                if (!strBuf || strLen > strBuf.length) {
                    strBuf = Buffer.alloc(strLen);
                }
                fs.readSync(fd, strBuf, 0, strLen, offset);
                ggufMeta[key] = strBuf.toString("utf8", 0, strLen - 1);
                offset += strLen;
            } else if (type === 4) {
                // float32
                fs.readSync(fd, valBuf, 0, 4, offset);
                ggufMeta[key] = new DataView(valBuf.buffer).getFloat32(0, true);
                offset += 4;
            } else {
                // Skip unknown types
                ggufMeta[key] = `<type:${type}>`;
            }
        }

        fs.closeSync(fd);

        // Extract key metadata
        metadata.architecture = ggufMeta["general.architecture"] || "";
        metadata.params = ggufMeta["general.size_label"] || "";
        const arch = metadata.architecture;

        // Access metadata using flat key format with architecture prefix
        const getMetaValue = (key, defaultVal = 0) => {
            const val = ggufMeta[key];
            if (Array.isArray(val)) return val[0] || defaultVal;
            if (val === undefined || val === null) return defaultVal;
            return val;
        };

        metadata.ctxSize = getMetaValue(`${arch}.context_length`, 4096);
        metadata.embeddingLength = getMetaValue(`${arch}.embedding_length`, 0);
        metadata.blockCount = getMetaValue(`${arch}.block_count`, 0);
        metadata.headCount = getMetaValue(`${arch}.attention.head_count`, 0);
        metadata.headCountKv = getMetaValue(`${arch}.attention.head_count_kv`, 0);
        metadata.ffnDim = getMetaValue(`${arch}.feed_forward_length`, 0);
        metadata.fileType = ggufMeta["general.file_type"] || 0;

        return metadata;
    } catch (e) {
        return null;
    }
}

/**
 * Map file_type integer to quantization string
 */
export const fileTypeMap = {
    0: "F32",
    1: "F16",
    2: "Q4_0",
    3: "Q4_1",
    6: "Q5_0",
    7: "Q5_1",
    8: "Q8_0",
    9: "Q8_1",
    10: "Q2_K",
    11: "Q3_K_S",
    12: "Q3_K_M",
    13: "Q3_K_L",
    14: "Q4_K_S",
    15: "Q4_K_M",
    16: "Q5_K_S",
    17: "Q5_K_M",
    18: "Q6_K",
    19: "Q8_K",
};

/**
 * Parse GGUF metadata asynchronously
 * Tries the @huggingface/gguf library first, falls back to sync parser
 * @param {string} filePath - Path to the GGUF file
 * @returns {Object} Metadata object
 */
export async function parseGgufMetadata(filePath) {
    const metadata = {
        size: 0,
        architecture: "",
        params: "",
        quantization: "",
        ctxSize: 0,
        embeddingLength: 0,
        blockCount: 0,
        headCount: 0,
        headCountKv: 0,
        ffnDim: 0,
        fileType: 0,
    };

    try {
        const stats = fs.statSync(filePath);
        metadata.size = stats.size;

        // Try our simple synchronous parser first (handles all cases)
        const simpleResult = parseGgufHeaderSync(filePath);

        if (simpleResult && simpleResult.architecture) {
            // Successfully parsed with simple parser
            Object.assign(metadata, simpleResult);

            // Map file_type to quantization
            if (metadata.fileType !== undefined && fileTypeMap[metadata.fileType]) {
                metadata.quantization = fileTypeMap[metadata.fileType];
            }

            console.log("[DEBUG] Used simple GGUF parser for:", path.basename(filePath));
            console.log("[DEBUG] GGUF metadata extracted:", {
                architecture: metadata.architecture,
                params: metadata.params,
                ctxSize: metadata.ctxSize,
                blockCount: metadata.blockCount,
                headCount: metadata.headCount,
            });

            return metadata;
        }

        // Fallback to @huggingface/gguf library for advanced features
        console.log(
            "[DEBUG] Simple parser failed or no architecture, trying @huggingface/gguf for:",
            path.basename(filePath)
        );

        let ggufMeta = {};
        let tensorInfos = [];

        try {
            const info = await gguf(filePath, { allowLocalFile: true });
            if (info.metadata && Object.keys(info.metadata).length > 0) {
                ggufMeta = info.metadata;
                tensorInfos = info.tensorInfos || [];
                console.log("[DEBUG] Used gguf() for:", path.basename(filePath));
            } else {
                throw new Error("Empty metadata from gguf()");
            }
        } catch (ggufErr) {
            console.log(
                "[DEBUG] gguf() failed, trying ggufAllShards() for:",
                path.basename(filePath),
                ggufErr.message
            );
            try {
                const allShardsInfo = await ggufAllShards(filePath, { allowLocalFile: true });
                if (allShardsInfo.shards && allShardsInfo.shards.length > 0) {
                    const firstShard = allShardsInfo.shards[0];
                    ggufMeta = firstShard.metadata || {};
                    tensorInfos = firstShard.tensorInfos || [];
                    console.log("[DEBUG] Used ggufAllShards() for:", path.basename(filePath));
                } else {
                    throw new Error("No shards found");
                }
            } catch (shardsErr) {
                // Both failed, use regex fallback
                console.log(
                    "[DEBUG] Both gguf() and ggufAllShards() failed, using filename fallback for:",
                    path.basename(filePath)
                );
                const fileName = path.basename(filePath);
                metadata.architecture = extractArchitecture(fileName);
                metadata.params = extractParams(fileName);
                metadata.quantization = extractQuantization(fileName);
                const ctxMatch = fileName.match(/(\d+)k?ctx/i) || fileName.match(/ctx[-_]?(\d+)/i);
                if (ctxMatch) metadata.ctxSize = parseInt(ctxMatch[1]) * 1000;
                return metadata;
            }
        }

        // Extract key metadata - GGUF stores keys with architecture prefix as flat keys
        // e.g., "llama.block_count", "llama.context_length", not nested objects
        metadata.architecture = ggufMeta["general.architecture"] || "";
        metadata.params = ggufMeta["general.size_label"] || "";
        const arch = metadata.architecture;

        // Access metadata using flat key format with architecture prefix
        // Handle array values (convert to first element or JSON string)
        const getMetaValue = (key, defaultVal = 0) => {
            const val = ggufMeta[key];
            if (Array.isArray(val)) return val[0] || defaultVal; // Take first element for arrays
            if (val === undefined || val === null) return defaultVal;
            return val;
        };
        metadata.ctxSize = getMetaValue(`${arch}.context_length`, 4096);
        metadata.embeddingLength = getMetaValue(`${arch}.embedding_length`, 0);
        metadata.blockCount = getMetaValue(`${arch}.block_count`, 0);
        metadata.headCount = getMetaValue(`${arch}.attention.head_count`, 0);
        metadata.headCountKv = getMetaValue(`${arch}.attention.head_count_kv`, 0);
        metadata.ffnDim = getMetaValue(`${arch}.feed_forward_length`, 0);
        metadata.fileType = ggufMeta["general.file_type"] || 0;

        // Map file_type to quantization
        if (metadata.fileType !== undefined && fileTypeMap[metadata.fileType]) {
            metadata.quantization = fileTypeMap[metadata.fileType];
        }

        console.log("[DEBUG] GGUF metadata extracted:", {
            name: ggufMeta["general.name"],
            architecture: metadata.architecture,
            params: metadata.params,
            quantization: metadata.quantization,
            ctxSize: metadata.ctxSize,
            embeddingLength: metadata.embeddingLength,
            blockCount: metadata.blockCount,
            headCount: metadata.headCount,
            headCountKv: metadata.headCountKv,
            ffnDim: metadata.ffnDim,
            totalTensors: tensorInfos?.length || 0,
        });
    } catch (e) {
        console.warn("[DEBUG] Failed to parse GGUF metadata:", e.message);
        // Fallback: try regex-based parsing from filename
        try {
            const fileName = path.basename(filePath);
            metadata.architecture = extractArchitecture(fileName);
            metadata.params = extractParams(fileName);
            metadata.quantization = extractQuantization(fileName);
            const ctxMatch = fileName.match(/(\d+)k?ctx/i) || fileName.match(/ctx[-_]?(\d+)/i);
            if (ctxMatch) metadata.ctxSize = parseInt(ctxMatch[1]) * 1000;
        } catch (fallbackErr) {
            console.warn("[DEBUG] Fallback parsing also failed:", fallbackErr.message);
        }
    }

    return metadata;
}

/**
 * Extract architecture from filename using regex patterns
 * @param {string} filename - The model filename
 * @returns {string} Architecture name
 */
export function extractArchitecture(filename) {
    const lower = filename.toLowerCase();
    const patterns = [
        { regex: /(deepseek[-_]?r1)/i, name: "DeepSeek-R1" },
        { regex: /(deepseek[-_]?coder)/i, name: "DeepSeek-Coder" },
        { regex: /(deepseek)/i, name: "DeepSeek" },
        { regex: /(codellama)/i, name: "CodeLlama" },
        { regex: /(codegemma)/i, name: "CodeGemma" },
        { regex: /(mistral[-_]?moe)/i, name: "Mistral-MOE" },
        { regex: /(mistral)/i, name: "Mistral" },
        { regex: /(qwen[0-9]?)/i, name: "Qwen" },
        { regex: /(llama[0-9]?)/i, name: "Llama" },
        { regex: /(gemma[0-9]?)/i, name: "Gemma" },
        { regex: /(nemotron)/i, name: "Nemotron" },
        { regex: /(granite)/i, name: "Granite" },
        { regex: /(phi[0-9]?)/i, name: "Phi" },
        { regex: /(starcoder)/i, name: "StarCoder" },
        { regex: /(solar)/i, name: "Solar" },
        { regex: /(command[_-]?r)/i, name: "Command-R" },
        { regex: /(devstral)/i, name: "Devstral" },
        { regex: /(dbrx)/i, name: "DBRX" },
        { regex: /(mixtral)/i, name: "Mixtral" },
        { regex: /(yi[-_]?34b)/i, name: "Yi" },
        { regex: /(orca[0-9]?)/i, name: "Orca" },
        { regex: /(gpt-oss)/i, name: "GPT-OSS" },
        { regex: /(WizardCoder)/i, name: "WizardCoder" },
    ];

    for (const p of patterns) {
        if (p.regex.test(lower)) return p.name;
    }

    return "LLM";
}

/**
 * Extract parameter size from filename
 * @param {string} filename - The model filename
 * @returns {string} Parameter size (e.g., "7B", "13B")
 */
export function extractParams(filename) {
    const match = filename.match(/(\d+(?:\.\d+)?)[bB](?=[-._\s]|$)/);
    if (match) return `${match[1]}B`;
    const lower = filename.toLowerCase();
    if (/phi[-_]?3/i.test(lower)) return "3B";
    if (/yi[-_]?34b/i.test(lower)) return "34B";
    if (/dbrx/i.test(lower)) return "132B";
    if (/nemotron[-_]?8b/i.test(lower)) return "8B";
    if (/nemotron[-_]?5b/i.test(lower)) return "5B";
    if (/mixtral[-_]?8x/i.test(lower)) return "12B";
    return "";
}

/**
 * Extract quantization from filename
 * @param {string} filename - The model filename
 * @returns {string} Quantization label (e.g., "Q4_K_M", "Q8_0")
 */
export function extractQuantization(filename) {
    const endMatch = filename.match(
        /[-_](Q[0-9]+[_A-Z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/i
    );
    if (endMatch) return endMatch[1].toUpperCase();

    const iqEndMatch = filename.match(
        /[-_](IQ[0-9]+(?:_[A-Za-z0-9]+)?[A-Za-z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/
    );
    if (iqEndMatch) return iqEndMatch[1].toUpperCase();

    const directMatch =
        filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)\.gguf/i) ||
        filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)\.bin/i);
    if (directMatch) return directMatch[1].toUpperCase();

    const endOfStringMatch = filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)$/i);
    if (endOfStringMatch) return endOfStringMatch[1].toUpperCase();

    return "";
}
