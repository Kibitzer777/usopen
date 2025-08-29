import { NextRequest, NextResponse } from 'next/server';
import { getMatchesByDate } from '@/lib/espn';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gender: string; date: string }> }
) {
  try {
    const { gender, date } = await params;

    // Validate gender parameter
    if (gender !== 'men' && gender !== 'women') {
      return NextResponse.json(
        { error: 'Gender must be "men" or "women"' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Allow all dates
    // if (!isTodayOrFuture(date)) {
    //   return NextResponse.json(
    //     { error: 'Only today and future dates are allowed' },
    //     { status: 400 }
    //   );
    // }

    // Fetch matches from ESPN scoreboard (ATP/WTA)
    const { live, upcoming, completed } = await getMatchesByDate(gender, date);

    // Return response with proper cache headers
    const response = NextResponse.json({
      date,
      gender,
      live,
      upcoming,
      completed,
      lastUpdated: new Date().toISOString(),
    });

    // Set cache headers (client can cache for 15 seconds)
    response.headers.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');

    return response;
  } catch (error) {
    console.error('Error in US Open API route:', error);
    
    // Try to get params for error response
    let errorDate = 'unknown';
    let errorGender = 'unknown';
    try {
      const errorParams = await params;
      errorDate = errorParams.date;
      errorGender = errorParams.gender;
    } catch (paramsError) {
      console.error('Could not get params in error handler:', paramsError);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        date: errorDate,
        gender: errorGender,
        live: [],
        upcoming: [],
        completed: [],
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

