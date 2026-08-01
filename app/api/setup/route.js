import { NextResponse } from 'next/server';
import { initializeFirebaseDatabase as initializeDatabase, isFirebaseConfigured } from '@/lib/firebase';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const isConfigured = isFirebaseConfigured();
    const mode = isConfigured ? 'firebase_firestore' : 'mock';
    return NextResponse.json({
      configured: isConfigured,
      mode,
      projectId: process.env.FIREBASE_PROJECT_ID || null,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || null,
      message: isConfigured 
        ? 'El motor de Firebase Firestore está configurado correctamente.' 
        : 'Firebase no está configurado. Usando base de datos mock local.'
    });
  } catch (error) {
    console.error('Setup GET API Error:', error);
    return NextResponse.json(
      { error: 'Error al consultar la configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Solo permitir inicializar a usuarios autenticados (opcional, pero seguro)
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado para inicializar la base de datos' },
        { status: 401 }
      );
    }

    if (user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo el administrador puede inicializar la base de datos' },
        { status: 403 }
      );
    }

    let force = false;
    try {
      const body = await request.json();
      force = !!body.force;
    } catch (e) {
      // Ignorar si no hay cuerpo JSON
    }

    const result = await initializeDatabase(force);

    if (result.success) {
      return NextResponse.json({
        success: true,
        mode: result.mode,
        message: result.mode === 'firebase_firestore'
          ? 'Las colecciones de Firebase Firestore han sido inicializadas y los datos de prueba han sido sembrados.'
          : 'La base de datos local de respaldo ha sido reestablecida con los datos de prueba.'
      });
    } else {
      return NextResponse.json({
        success: false,
        mode: result.mode,
        error: result.error,
        message: 'No se pudo conectar con Firebase Firestore. Verifica las credenciales en tu archivo .env.local.'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Setup POST API Error:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor durante la inicialización' },
      { status: 500 }
    );
  }
}
