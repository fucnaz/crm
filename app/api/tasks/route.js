import { NextResponse } from 'next/server';
import { getTasks, addTask } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tasks = await getTasks();
    // Ordenar por fecha de vencimiento (más antiguas/urgentes primero)
    tasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET Tasks Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { contact_id, title, description, due_date, assigned_to } = body;

    if (!title || !due_date) {
      return NextResponse.json(
        { error: 'El título de la tarea y la fecha de vencimiento son requeridos' },
        { status: 400 }
      );
    }

    const taskData = {
      contact_id: contact_id || '',
      title,
      description: description || '',
      due_date,
      assigned_to: assigned_to || user.id,
      status: 'Pendiente'
    };

    const newTask = await addTask(taskData);
    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error('POST Task Error:', error);
    return NextResponse.json(
      { error: 'Error al crear la tarea' },
      { status: 500 }
    );
  }
}
