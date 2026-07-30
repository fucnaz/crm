import { NextResponse } from 'next/server';
import { getTasks, updateTask, deleteTask } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const tasks = await getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, due_date, status, assigned_to, contact_id } = body;

    const updatedData = {};
    if (title !== undefined) updatedData.title = title;
    if (description !== undefined) updatedData.description = description;
    if (due_date !== undefined) updatedData.due_date = due_date;
    if (status !== undefined) updatedData.status = status;
    if (assigned_to !== undefined) updatedData.assigned_to = assigned_to;
    if (contact_id !== undefined) updatedData.contact_id = contact_id;

    const updatedTask = await updateTask(id, updatedData);
    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error(`PUT Task [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar la tarea' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const tasks = await getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    // RBAC: Solo administrador, propietario, o el usuario asignado a la tarea pueden eliminarla
    const canDelete = user.role === 'administrador' || user.role === 'propietario' || task.assigned_to === user.id;
    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta tarea' },
        { status: 403 }
      );
    }

    const success = await deleteTask(id);
    if (!success) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error(`DELETE Task [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al eliminar la tarea' },
      { status: 500 }
    );
  }
}
