// app/api/parameters/route.ts
import { NextRequest } from 'next/server';

// Mock services (these would be properly connected in a real implementation)
let parameterService = {
  getOptionsByCategoryForUI: () => ({}),
  countOptions: (): number => 0
};

export async function GET(req: NextRequest) {
  try {
    const parameters = parameterService.getOptionsByCategoryForUI();
    return Response.json({
      success: true,
      count: parameterService.countOptions(),
      parameters
    });
  } catch (error) {
    console.error('Error fetching parameters:', error);
    return Response.json({ error: 'Failed to fetch parameters' }, { status: 500 });
  }
}