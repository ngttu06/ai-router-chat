import { NextResponse } from 'next/server';
import { getSetting } from '@/server/database';

export async function GET() {
  const clientId = (getSetting('google_client_id') || '').trim();
  const enabled = getSetting('google_enabled') === 'true' && Boolean(clientId);
  return NextResponse.json({ enabled, clientId });
}
