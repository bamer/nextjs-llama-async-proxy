// nextjs-llama-async-proxy/src/app/api/models/discover/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ModelFile {
  name: string;
  path: string;
  size: number;
  modified: Date;
}

function validatePath(scanPath: string): boolean {
  // Only allow absolute paths and prevent path traversal
  if (!path.isAbsolute(scanPath)) {
    return false;
  }

  // Resolve the path to prevent .. traversal
  const resolvedPath = path.resolve(scanPath);

  // Ensure the resolved path starts with the original path (no traversal)
  if (!resolvedPath.startsWith(scanPath)) {
    return false;
  }

  // Additional security: only allow paths under /media, /home, /opt, /usr/local
  const allowedPrefixes = ['/media', '/home', '/opt', '/usr/local'];
  return allowedPrefixes.some(prefix => resolvedPath.startsWith(prefix));
}

function scanDirectory(dirPath: string): ModelFile[] {
  const models: ModelFile[] = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        models.push(...scanDirectory(fullPath));
      } else if (stat.isFile()) {
        // Check if it's a model file (common extensions)
        const ext = path.extname(item).toLowerCase();
        if (['.gguf', '.bin', '.safetensors', '.ckpt'].includes(ext)) {
          models.push({
            name: path.basename(item, ext),
            path: fullPath,
            size: stat.size,
            modified: stat.mtime
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to scan directory ${dirPath}:`, error);
  }

  return models;
}

function getModelInfo(fileName: string, filePath: string): any {
  const name = fileName.toLowerCase();

  // Try to extract model info from filename
  const patterns = [
    // Llama patterns
    { regex: /llama-?(\d+)([a-z]*)-?(\d+[a-z]*)/i, family: 'llama', version: '$1$2' },
    // Mistral patterns
    { regex: /mistral-?(\d+[a-z]*)/i, family: 'mistral', version: '$1' },
    // CodeLlama patterns
    { regex: /codellama-?(\d+[a-z]*)/i, family: 'codellama', version: '$1' },
    // GPT patterns
    { regex: /gpt-?(\d+[a-z]*)/i, family: 'gpt', version: '$1' },
    // Generic patterns
    { regex: /(\w+)-(\d+[a-z]*)/i, family: '$1', version: '$2' }
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern.regex);
    if (match) {
      const family = pattern.family.replace('$1', match[1] || '');
      const version = pattern.version.replace('$1', match[1] || '').replace('$2', match[2] || '');

      return {
        name: fileName,
        description: `${family.charAt(0).toUpperCase() + family.slice(1)} ${version} model`,
        version: version,
        path: filePath,
        family: family,
        size: fs.statSync(filePath).size
      };
    }
  }

  // Fallback
  return {
    name: fileName,
    description: 'Unknown model type',
    version: '1.0',
    path: filePath,
    family: 'unknown',
    size: fs.statSync(filePath).size
  };
}

export async function POST(request: NextRequest) {
  try {
    const { paths } = await request.json();

    if (!Array.isArray(paths)) {
      return NextResponse.json({ error: 'Paths must be an array' }, { status: 400 });
    }

    // Validate all paths before processing
    const invalidPaths = paths.filter(scanPath => !validatePath(scanPath));
    if (invalidPaths.length > 0) {
      return NextResponse.json({
        error: 'Invalid paths detected',
        invalidPaths,
        message: 'Paths must be absolute and within allowed directories (/media, /home, /opt, /usr/local)'
      }, { status: 400 });
    }

    const discoveredModels: any[] = [];
    const scannedPaths: string[] = [];

    for (const scanPath of paths) {
      console.log(`Scanning path: ${scanPath}`);
      scannedPaths.push(scanPath);

      const modelFiles = scanDirectory(scanPath);

      for (const file of modelFiles) {
        const modelInfo = getModelInfo(file.name, file.path);
        discoveredModels.push(modelInfo);
      }
    }

    // Remove duplicates based on path
    const uniqueModels = discoveredModels.filter((model, index, self) =>
      index === self.findIndex(m => m.path === model.path)
    );

    return NextResponse.json({
      discovered: uniqueModels,
      scannedPaths,
      totalFound: uniqueModels.length
    });
  } catch (error) {
    console.error('Error discovering models:', error);
    return NextResponse.json({ error: 'Failed to discover models' }, { status: 500 });
  }
}