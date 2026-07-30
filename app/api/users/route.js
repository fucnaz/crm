import { NextResponse } from 'next/server';
import { getUsers, addUser } from '@/lib/db';
import { hashPassword, getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'administrador' && user.role !== 'propietario')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores o propietarios pueden gestionar usuarios.' },
        { status: 403 }
      );
    }

    const users = await getUsers();
    
    // Ocultar hash de contraseñas por seguridad
    let safeUsers = users.map(({ password_hash, ...u }) => u);

    // Si el usuario logueado es propietario, ocultar los administradores
    if (user.role === 'propietario') {
      safeUsers = safeUsers.filter(u => u.role !== 'administrador');
    }

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('GET Users Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'administrador' && user.role !== 'propietario')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores o propietarios pueden crear usuarios.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Todos los campos (nombre, email, contraseña, rol) son requeridos' },
        { status: 400 }
      );
    }

    // Regla de seguridad: un propietario no puede crear un administrador
    if (user.role === 'propietario' && role === 'administrador') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear usuarios con el rol de administrador.' },
        { status: 403 }
      );
    }

    // Verificar si el email ya existe
    const users = await getUsers();
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUserData = {
      name,
      email,
      password_hash: passwordHash,
      role
    };

    const newUser = await addUser(newUserData);
    const { password_hash, ...safeUser } = newUser;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('POST User Error:', error);
    return NextResponse.json(
      { error: 'Error al crear el usuario' },
      { status: 500 }
    );
  }
}
