// app/api/parameters/category/paramName/route.ts
import { NextRequest } from 'next/server';

// Mock services (these would be properly connected in a real implementation)
let parameterService = {
  getOption: (category: string, paramName: string) => null,
  getParameterInfo: (paramName: string) => null
};

export async function GET(req: NextRequest, { params }: { params: { category: string; paramName: string } }) {
  try {
    const param = parameterService.getOption(params.category, params.paramName);
    
    if (!param) {
      return Response.json({ error: 'Parameter not found' }, { status: 404 });
    }

    const info = parameterService.getParameterInfo(params.paramName);
    return Response.json({
      success: true,
      parameter: params.paramName,
      category: params.category,
      ...(typeof param === 'object' && param !== null ? param : {}),
      ...(typeof info === 'object' && info !== null ? info : {})
    });
  } catch (error) {
    console.error('Error fetching parameter info:', error);
    return Response.json({ error: 'Failed to fetch parameter info' }, { status: 500 });
  }
}