import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getProviderById, updateProvider, deleteProvider, deleteModelsByProvider } from '@/server/database';

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const provider = getProviderById(id);
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    return NextResponse.json({
      ...provider,
      api_key: provider.api_key ? provider.api_key.slice(0, 10) + '...' + provider.api_key.slice(-4) : '',
    });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const payload: Record<string, unknown> = await request.json();

    if (payload.base_url !== undefined) {
      const normalizedBaseUrl = normalizeBaseUrl(String(payload.base_url));
      if (!/^https?:\/\//i.test(normalizedBaseUrl)) {
        return NextResponse.json({ error: 'base_url must start with http:// or https://' }, { status: 400 });
      }
      payload.base_url = normalizedBaseUrl;
    }
    if (payload.name !== undefined) payload.name = String(payload.name).trim();
    if (payload.api_key !== undefined) payload.api_key = String(payload.api_key).trim();

    const provider = updateProvider(id, payload as any);
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    return NextResponse.json({
      ...provider,
      api_key: provider.api_key ? provider.api_key.slice(0, 10) + '...' + provider.api_key.slice(-4) : '',
    });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await params;
    deleteModelsByProvider(id);
    deleteProvider(id);
    return NextResponse.json({ success: true });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
