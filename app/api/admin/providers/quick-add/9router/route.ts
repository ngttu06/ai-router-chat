import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getAllProviders, createProvider } from '@/server/database';

function normalizeBaseUrl(url: string) { return url.trim().replace(/\/+$/, ''); }

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const baseUrl = 'http://localhost:20128/v1';
    const existed = getAllProviders().find((p: any) => normalizeBaseUrl(p.base_url) === baseUrl);
    if (existed) {
      return NextResponse.json({ created: false, provider: { ...existed, api_key: existed.api_key ? existed.api_key.slice(0, 10) + '...' + existed.api_key.slice(-4) : '' } });
    }
    const created = createProvider({ name: '9Router Local', base_url: baseUrl, api_key: '' });
    return NextResponse.json({ created: true, provider: { ...created, api_key: created.api_key ? created.api_key.slice(0, 10) + '...' + created.api_key.slice(-4) : '' } });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: (response as any)?.message || 'Internal error' }, { status: 500 });
  }
}
