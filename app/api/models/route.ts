import { NextResponse } from 'next/server';
import { getActiveModels, getDefaultModelId } from '@/server/database';

export async function GET() {
  try {
    const models = getActiveModels();
    const defaultModelId = getDefaultModelId();
    const formatted = models.map((m: any) => ({
      id: m.id,
      name: m.name,
      vendor: m.vendor || 'Unknown',
      maxContextTokens: m.max_context_tokens,
      maxOutputTokens: m.max_output_tokens,
      maxPromptTokens: m.max_prompt_tokens,
      supportsStreaming: !!m.supports_streaming,
      supportsVision: !!m.supports_vision,
    }));
    return NextResponse.json({ data: formatted, defaultModelId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
