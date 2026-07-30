import { NextResponse } from 'next/server';
import { updateUser, deleteUser, getUserById } from '@/lib/db';
import { hashPassword, getSessionUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'administrador' && sessionUser.role !== 'propietario')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores o propietarios pueden modificar usuarios.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userToEdit = await getUserById(id);
    if (!userToEdit) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Regla de seguridad: el propietario no puede editar cuentas administrador
    if (userToEdit.role === 'administrador' && sessionUser.role === 'propietario') {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar cuentas de administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Regla de seguridad: el propietario no puede promover a nadie a administrador
    if (role === 'administrador' && sessionUser.role === 'propietario') {
      return NextResponse.json(
        { error: 'No tienes permisos para promover usuarios al rol de administrador.' },
        { status: 403 }
      );
    }

    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (email !== undefined) updatedData.email = email;
    if (role !== undefined) {
      // Si se está cambiando su propio rol de administrador, bloquearlo para evitar perder el acceso total
      if (id === sessionUser.id && sessionUser.role === 'administrador' && role !== 'administrador') {
        return NextResponse.json(
          { error: 'No puedes cambiar tu propio rol de administrador para evitar bloqueos del sistema.' },
          { status: 400 }
        );
      }
      updatedData.role = role;
    }
    
    if (password) {
      updatedData.password_hash = await hashPassword(password);
    } else {
      updatedData.password_hash = '';
    }

    const updatedUser = await updateUser(id, updatedData);
    const { password_hash, ...safeUser } = updatedUser;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error(`PUT User [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar el usuario' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'administrador' && sessionUser.role !== 'propietario')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores o propietarios pueden eliminar usuarios.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Evitar que el administrador se elimine a sí mismo
    if (id === sessionUser.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta en sesión.' },
        { status: 400 }
      );
    }

    const userToDelete = await getUserById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Regla de seguridad: el propietario no puede eliminar cuentas administrador
    if (userToDelete.role === 'administrador' && sessionUser.role === 'propietario') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar cuentas de administradores.' },
        { status: 403 }
      );
    }

    await deleteUser(id);
    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(`DELETE User [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al eliminar el usuario' },
      { status: 500 }
    );
  }
}
