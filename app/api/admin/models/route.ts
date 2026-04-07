import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getAllModels } from '@/server/database';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const models = getAllModels();
    return NextResponse.json(models);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
