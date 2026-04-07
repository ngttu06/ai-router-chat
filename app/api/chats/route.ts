import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth-helpers';
import { getChatsByUserId, createChat, getDefaultModelId } from '@/server/database';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const chats = getChatsByUserId(user.id);
    return NextResponse.json(chats);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { title, model_id } = await request.json();
    const defaultModelId = getDefaultModelId();
    const resolvedModelId = (typeof model_id === 'string' && model_id.trim())
      ? model_id.trim()
      : defaultModelId || undefined;
    const chat = createChat({
      user_id: user.id,
      title,
      model_id: resolvedModelId,
    });
    return NextResponse.json(chat);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
