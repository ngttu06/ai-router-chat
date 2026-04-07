import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getUserByEmail, getUserByGoogleId, createUser, updateUserLogin, getSetting } from '@/server/database';
import { generateToken } from '@/server/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'Google credential is required' }, { status: 400 });
    }

    const googleEnabled = getSetting('google_enabled');
    if (googleEnabled !== 'true') {
      return NextResponse.json({ error: 'Google authentication is not enabled' }, { status: 403 });
    }

    const clientId = getSetting('google_client_id');
    if (!clientId) {
      return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    // Check allowed email domains
    const allowedDomains = getSetting('allowed_email_domains');
    if (allowedDomains) {
      const domains = allowedDomains.split(',').map(d => d.trim()).filter(Boolean);
      if (domains.length > 0) {
        const emailDomain = payload.email.split('@')[1];
        if (!domains.includes(emailDomain)) {
          return NextResponse.json({ error: 'Email domain not allowed' }, { status: 403 });
        }
      }
    }

    let user = getUserByGoogleId(payload.sub);

    if (!user) {
      user = getUserByEmail(payload.email);

      if (!user) {
        const registrationEnabled = getSetting('registration_enabled');
        if (registrationEnabled !== 'true') {
          return NextResponse.json({ error: 'New user registration is disabled' }, { status: 403 });
        }

        user = createUser({
          email: payload.email,
          name: payload.name || payload.email,
          avatar: payload.picture || undefined,
          auth_provider: 'google',
          google_id: payload.sub,
        });
      }
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    updateUserLogin(user.id);
    const token = generateToken(user.id, user.role);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Google authentication failed' }, { status: 500 });
  }
}
