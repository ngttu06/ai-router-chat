import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getProviderById, upsertModel } from '@/server/database';

function normalizeBaseUrl(url: string) { return url.trim().replace(/\/+$/, ''); }
function parseLimit(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') { const p = parseInt(value, 10); return Number.isFinite(p) ? p : 0; }
  return 0;
}
function parseModelsPayload(data: any): any[] {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const provider = getProviderById(id);
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const baseUrl = normalizeBaseUrl(provider.base_url);
    const response = await fetch(`${baseUrl}/models`, {
      headers: provider.api_key?.trim() ? { Authorization: `Bearer ${provider.api_key.trim()}` } : {},
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return NextResponse.json({ error: `Failed to fetch models: ${response.status}${errorBody ? ` - ${errorBody}` : ''}` }, { status: response.status });
    }

    const payload = await response.json();
    const modelsData = parseModelsPayload(payload);
    let synced = 0;

    for (const m of modelsData) {
      const modelId = typeof m?.id === 'string' ? m.id.trim() : '';
      if (!modelId) continue;
      const supportedEndpoints = Array.isArray(m?.supported_endpoints) ? m.supported_endpoints : null;
      const hasChatEndpoint = !supportedEndpoints || supportedEndpoints.includes('/chat/completions') || supportedEndpoints.includes('chat/completions') || supportedEndpoints.includes('/responses') || supportedEndpoints.includes('responses');
      if (!hasChatEndpoint) continue;

      const supportsStreaming = m?.capabilities?.supports?.streaming;
      const modalities = Array.isArray(m?.modalities) ? m.modalities : [];
      const inputModalities = Array.isArray(m?.architecture?.input_modalities) ? m.architecture.input_modalities : [];
      const inferredVision = modalities.includes('vision') || modalities.includes('image') || inputModalities.includes('vision') || inputModalities.includes('image');
      const supportsVision = m?.capabilities?.supports?.vision ?? inferredVision;

      upsertModel({
        id: modelId, provider_id: provider.id,
        name: typeof m?.name === 'string' && m.name.trim() ? m.name.trim() : modelId,
        vendor: m?.vendor || m?.owned_by || provider.name || 'Unknown',
        max_context_tokens: parseLimit(m?.capabilities?.limits?.max_context_window_tokens ?? m?.context_length ?? m?.max_context_tokens),
        max_output_tokens: parseLimit(m?.capabilities?.limits?.max_output_tokens ?? m?.max_output_tokens),
        max_prompt_tokens: parseLimit(m?.capabilities?.limits?.max_prompt_tokens ?? m?.max_prompt_tokens),
        supports_streaming: supportsStreaming === undefined ? 1 : (supportsStreaming ? 1 : 0),
        supports_vision: supportsVision ? 1 : 0,
      });
      synced++;
    }

    return NextResponse.json({ synced, total: modelsData.length, source: baseUrl });
  } catch (response) {
    if (response instanceof Response) return response;
    const err = response as any;
    if (err?.name === 'TimeoutError') return NextResponse.json({ error: 'Timed out while syncing models' }, { status: 504 });
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
