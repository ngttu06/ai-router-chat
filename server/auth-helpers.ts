import jwt from 'jsonwebtoken';
import { getUserById, getSetting } from './database';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'trollllm-jwt-secret-key-change-in-production';

// ============ JWT HELPERS ============
export function generateToken(userId: string, role: string): string {
  const timeoutHours = parseInt(getSetting('session_timeout_hours') || '72', 10);
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: `${timeoutHours}h` });
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// ============ AUTH HELPERS FOR API ROUTES ============
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
};

/**
 * Extract the Bearer token from the request Authorization header.
 */
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Authenticate the request. Returns the user or null.
 */
export function authenticateRequest(request: Request): AuthUser | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = getUserById(decoded.userId);
  if (!user || !user.is_active) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
  };
}

/**
 * Require authentication. Returns user or throws a Response.
 */
export function requireAuth(request: Request): AuthUser {
  const user = authenticateRequest(request);
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}

/**
 * Require admin role. Returns user or throws a Response.
 */
export function requireAdmin(request: Request): AuthUser {
  const user = requireAuth(request);
  if (user.role !== 'admin') {
    throw new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
