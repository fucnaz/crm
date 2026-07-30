import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getUserByEmail } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-replace-in-env';
const COOKIE_NAME = 'gsm_crm_session';

// Hash de contraseña
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Comparar contraseña
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Crear token JWT
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verificar token JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Obtener sesión actual del usuario desde cookies (solo servidor)
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  return decoded;
}

// Iniciar sesión (establece la cookie)
export async function loginUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return { success: false, error: 'Usuario no encontrado' };

  const isPasswordValid = await verifyPassword(password, user.password_hash);
  if (!isPasswordValid) return { success: false, error: 'Contraseña incorrecta' };

  const token = generateToken(user);
  
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/'
  });

  return { 
    success: true, 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

// Cerrar sesión (borra la cookie)
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: -1, // Expira inmediatamente
    path: '/'
  });
  return { success: true };
}
