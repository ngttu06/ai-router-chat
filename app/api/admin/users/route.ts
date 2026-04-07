import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth-helpers';
import { getAllUsers, createUser } from '@/server/database';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const users = getAllUsers().map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });
    return NextResponse.json(users);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const { email, name, password, role } = await request.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }
    const user = createUser({ email, name, password, role });
    const { password: _password, ...rest } = user;
    return NextResponse.json(rest);
  } catch (response) {
    if (response instanceof Response) return response;
    const error = response as any;
    if (error?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
