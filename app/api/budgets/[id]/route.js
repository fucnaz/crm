import { NextResponse } from 'next/server';
import { getBudgets, updateBudget, deleteBudget, getContactById } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.role === 'secretario') {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar presupuestos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const budgets = await getBudgets();
    const budget = budgets.find(b => b.id === id);
    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    const contact = await getContactById(budget.contact_id);

    // RBAC: Vendedores solo pueden editar presupuestos de sus propios clientes
    const isOwner = contact && contact.assigned_to === user.id;
    if (user.role === 'vendedor' && !isOwner) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar presupuestos de clientes de otros agentes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, amount, status, description } = body;

    const updatedData = {};
    if (title !== undefined) updatedData.title = title;
    if (amount !== undefined) updatedData.amount = Number(amount) || 0;
    if (status !== undefined) updatedData.status = status;
    if (description !== undefined) updatedData.description = description;

    const updatedBudget = await updateBudget(id, updatedData);
    return NextResponse.json({ budget: updatedBudget });
  } catch (error) {
    console.error(`PUT Budget [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar el presupuesto' },
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

    // Solo administrador o propietario pueden eliminar presupuestos
    if (user.role !== 'administrador' && user.role !== 'propietario') {
      return NextResponse.json(
        { error: 'Solo los administradores o propietarios pueden eliminar presupuestos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const success = await deleteBudget(id);
    if (!success) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Presupuesto eliminado correctamente' });
  } catch (error) {
    console.error(`DELETE Budget [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al eliminar el presupuesto' },
      { status: 500 }
    );
  }
}
