import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getAllSettings, setSetting } from '@/server/database';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const settings = getAllSettings();
    return NextResponse.json(settings);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);
    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }
    for (const [key, value] of Object.entries(settings)) {
      setSetting(key, String(value));
    }
    return NextResponse.json({ success: true });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
