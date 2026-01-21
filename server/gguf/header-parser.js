import fs from "fs";

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
    const headerView = new DataView(headerBuf.buffer, headerBuf.byteOffset, headerBuf.byteLength);

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
