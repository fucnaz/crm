import { NextResponse } from 'next/server';
import { updateOpportunity, deleteOpportunity, getOpportunities, getContactById } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.role === 'secretario') {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar oportunidades comerciales' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const opportunities = await getOpportunities();
    const opp = opportunities.find(o => o.id === id);
    if (!opp) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 });
    }

    const contact = await getContactById(opp.contact_id);

    // RBAC: Vendedores solo pueden editar sus propias oportunidades o del contacto asignado
    const isOwner = opp.assigned_to === user.id || (contact && contact.assigned_to === user.id);
    if (user.role === 'vendedor' && !isOwner) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar oportunidades de otros vendedores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, value, stage, close_date, notes, assigned_to } = body;

    const updatedData = {};
    if (title !== undefined) updatedData.title = title;
    if (value !== undefined) updatedData.value = Number(value) || 0;
    if (stage !== undefined) updatedData.stage = stage;
    if (close_date !== undefined) updatedData.close_date = close_date;
    if (notes !== undefined) updatedData.notes = notes;
    
    // Solo administrador y propietario pueden reasignar el agente de la oportunidad
    if (assigned_to !== undefined && (user.role === 'administrador' || user.role === 'propietario')) {
      updatedData.assigned_to = assigned_to;
    }

    const updatedOpp = await updateOpportunity(id, updatedData);
    return NextResponse.json({ opportunity: updatedOpp });
  } catch (error) {
    console.error(`PUT Opportunity [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar la oportunidad' },
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

    // Solo administrador o propietario pueden eliminar oportunidades comerciales
    if (user.role !== 'administrador' && user.role !== 'propietario') {
      return NextResponse.json(
        { error: 'Solo los administradores o propietarios pueden eliminar oportunidades' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const success = await deleteOpportunity(id);
    if (!success) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Oportunidad eliminada correctamente' });
  } catch (error) {
    console.error(`DELETE Opportunity [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al eliminar la oportunidad' },
      { status: 500 }
    );
  }
}
