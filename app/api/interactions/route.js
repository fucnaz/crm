import { NextResponse } from 'next/server';
import { getInteractions, addInteraction, getContactById } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const interactions = await getInteractions();
    // Ordenar por fecha descendente (más recientes primero)
    interactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('GET Interactions Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener interacciones' },
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
    const { contact_id, type, date, description } = body;

    if (!contact_id || !type || !description) {
      return NextResponse.json(
        { error: 'ID de contacto, tipo de interacción y notas son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el contacto existe
    const contact = await getContactById(contact_id);
    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    // RBAC: Vendedores solo pueden registrar interacciones para sus contactos asignados
    if (user.role === 'vendedor' && contact.assigned_to !== user.id) {
      return NextResponse.json(
        { error: 'No puedes registrar interacciones para contactos asignados a otros vendedores' },
        { status: 403 }
      );
    }

    const interactionData = {
      contact_id,
      type,
      date: date || new Date().toISOString(),
      description,
      agent_id: user.id
    };

    const newInteraction = await addInteraction(interactionData);
    return NextResponse.json({ interaction: newInteraction }, { status: 201 });
  } catch (error) {
    console.error('POST Interaction Error:', error);
    return NextResponse.json(
      { error: 'Error al registrar la interacción' },
      { status: 500 }
    );
  }
}
