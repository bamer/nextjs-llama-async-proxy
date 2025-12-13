import { NextRequest } from 'next/server';

// Mock services (these would be properly connected in a real implementation)
let parameterService = {
  getCategory: (category: string) => ({})
};

export async function GET(req: NextRequest, { params }: { params: { category: string } }) {
  try {
    const categoryParams = parameterService.getCategory(params.category);
    
    if (Object.keys(categoryParams).length === 0) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      category: params.category,
      parameters: categoryParams
    });
  } catch (error) {
    console.error('Error fetching category parameters:', error);
    return Response.json({ error: 'Failed to fetch category parameters' }, { status: 500 });
  }
}