import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Test from '@/models/Test';
import { UserRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/receptionist/tests/search
 * Search tests by name or code
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only staff can search tests
    if (user.role === UserRole.PATIENT) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Search tests using the model's search method
    const tests = await Test.searchTests(query);

    return NextResponse.json({
      success: true,
      data: tests,
      count: tests.length,
    });
  } catch (error) {
    console.error('Error searching tests:', error);
    return NextResponse.json(
      { error: 'Failed to search tests' },
      { status: 500 }
    );
  }
}
