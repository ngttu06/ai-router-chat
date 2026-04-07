import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth-helpers';
import { getChatById, updateChat, deleteChat } from '@/server/database';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const chat = getChatById(id);
    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const body = await request.json();
    const updated = updateChat(id, body);
    return NextResponse.json(updated);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const chat = getChatById(id);
    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    deleteChat(id);
    return NextResponse.json({ success: true });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
