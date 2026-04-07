import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { setSetting } from '@/server/database';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    requireAdmin(request);
    const { key } = await params;
    const { value } = await request.json();
    if (value === undefined) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }
    setSetting(key, String(value));
    return NextResponse.json({ success: true, key, value: String(value) });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
