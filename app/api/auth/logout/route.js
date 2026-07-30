import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el servidor al cerrar sesión' },
      { status: 500 }
    );
  }
}
