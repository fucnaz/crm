import { NextResponse } from 'next/server';
import { updateUser, deleteUser, getUserById } from '@/lib/db';
import { hashPassword, getSessionUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores pueden modificar usuarios.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userToEdit = await getUserById(id);
    if (!userToEdit) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (email !== undefined) updatedData.email = email;
    if (role !== undefined) {
      // Si se está cambiando su propio rol de administrador, bloquearlo para evitar perder el acceso total
      if (id === sessionUser.id && role !== 'administrador') {
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
    if (!sessionUser || sessionUser.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores pueden eliminar usuarios.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Evitar que el administrador se elimine a sí mismo
    if (id === sessionUser.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta de administrador en sesión.' },
        { status: 400 }
      );
    }

    const userToDelete = await getUserById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
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
