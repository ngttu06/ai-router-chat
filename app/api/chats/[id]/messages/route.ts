import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth-helpers';
import { getChatById, getMessagesByChatId, createMessage } from '@/server/database';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const chat = getChatById(id);
    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const messages = getMessagesByChatId(id);
    return NextResponse.json(messages);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const chat = getChatById(id);
    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const { role, content, files } = await request.json();
    const message = createMessage({
      chat_id: id,
      role,
      content,
      files: files ? JSON.stringify(files) : undefined,
    });
    return NextResponse.json(message);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
