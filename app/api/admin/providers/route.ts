import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getAllProviders, createProvider } from '@/server/database';

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const providers = getAllProviders();
    const masked = providers.map((p: any) => ({
      ...p,
      api_key: p.api_key ? p.api_key.slice(0, 10) + '...' + p.api_key.slice(-4) : '',
    }));
    return NextResponse.json(masked);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const { name, base_url, api_key } = await request.json();
    if (!name || !base_url) {
      return NextResponse.json({ error: 'Name and base_url are required' }, { status: 400 });
    }
    const normalizedBaseUrl = normalizeBaseUrl(String(base_url));
    if (!/^https?:\/\//i.test(normalizedBaseUrl)) {
      return NextResponse.json({ error: 'base_url must start with http:// or https://' }, { status: 400 });
    }
    const provider = createProvider({
      name: String(name).trim(),
      base_url: normalizedBaseUrl,
      api_key: api_key ? String(api_key).trim() : '',
    });
    return NextResponse.json({
      ...provider,
      api_key: provider.api_key ? provider.api_key.slice(0, 10) + '...' + provider.api_key.slice(-4) : '',
    });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
