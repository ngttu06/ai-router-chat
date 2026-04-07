import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getStats } from '@/server/database';

export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    const stats = getStats();
    return NextResponse.json(stats);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
