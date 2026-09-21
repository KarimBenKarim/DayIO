import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (isProd) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production environment.');
  }
}

const EFFECTIVE_SECRET = JWT_SECRET || 'test-dev-secret-key';

export function generateToken(payload: { userId: string; email: string }): string {
  if (!JWT_SECRET && isProd) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, EFFECTIVE_SECRET) as { userId: string; email: string };
  } catch (err) {
    return null;
  }
}
