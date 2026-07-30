import { NextResponse } from 'next/server';
import { getOpportunities, addOpportunity, getContactById } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const opportunities = await getOpportunities();
    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error('GET Opportunities Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener oportunidades' },
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

    // Secretarios no gestionan oportunidades comerciales
    if (user.role === 'secretario') {
      return NextResponse.json(
        { error: 'Tu rol no tiene permisos para crear oportunidades comerciales' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contact_id, title, value, stage, close_date, notes, assigned_to } = body;

    if (!contact_id || !title || !stage) {
      return NextResponse.json(
        { error: 'ID de contacto, título de oportunidad y fase del embudo son requeridos' },
        { status: 400 }
      );
    }

    const contact = await getContactById(contact_id);
    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    // Vendedores solo pueden registrar oportunidades para sus propios clientes
    if (user.role === 'vendedor' && contact.assigned_to !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear oportunidades para clientes de otros vendedores' },
        { status: 403 }
      );
    }

    const oppData = {
      contact_id,
      title,
      value: Number(value) || 0,
      stage,
      close_date: close_date || '',
      notes: notes || '',
      assigned_to: assigned_to || contact.assigned_to || user.id
    };

    const newOpp = await addOpportunity(oppData);
    return NextResponse.json({ opportunity: newOpp }, { status: 201 });
  } catch (error) {
    console.error('POST Opportunity Error:', error);
    return NextResponse.json(
      { error: 'Error al crear la oportunidad' },
      { status: 500 }
    );
  }
}
