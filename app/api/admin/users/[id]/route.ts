import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getUserById, updateUser, deleteUser } from '@/server/database';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const user = getUserById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const { password, ...rest } = user;
    return NextResponse.json(rest);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const user = updateUser(id, body);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const { password, ...rest } = user;
    return NextResponse.json(rest);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdmin(request);
    const { id } = await params;
    if (admin.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
