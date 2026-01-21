// nextjs-llama-async-proxy/src/app/api/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'src/config/app_config.json');

export async function GET() {
  try {
    // Read current config
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newConfig = await request.json();

    // Validate config structure
    const requiredFields = ['basePath', 'logLevel', 'maxConcurrentModels', 'autoUpdate', 'notificationsEnabled'];
    for (const field of requiredFields) {
      if (!(field in newConfig)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Write to file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));

    return NextResponse.json({
      message: 'Configuration saved successfully',
      config: newConfig
    });
  } catch (error) {
    console.error('Config save error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}