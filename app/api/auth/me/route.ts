import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    return NextResponse.json({ user });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
