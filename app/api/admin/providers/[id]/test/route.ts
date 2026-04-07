import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getProviderById } from '@/server/database';

function normalizeBaseUrl(url: string) { return url.trim().replace(/\/+$/, ''); }

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const provider = getProviderById(id);
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const baseUrl = normalizeBaseUrl(provider.base_url);
    const start = Date.now();
    const response = await fetch(`${baseUrl}/models`, {
      headers: provider.api_key?.trim() ? { Authorization: `Bearer ${provider.api_key.trim()}` } : {},
      signal: AbortSignal.timeout(10000),
    });
    const latency = Date.now() - start;

    if (!response.ok) {
      return NextResponse.json({ success: false, status: response.status, latency });
    }

    const data = await response.json();
    const modelCount = (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []).length;
    return NextResponse.json({ success: true, status: 200, latency, modelCount, source: baseUrl });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ success: false, error: (response as any)?.message });
  }
}
