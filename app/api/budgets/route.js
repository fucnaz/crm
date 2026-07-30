import { NextResponse } from 'next/server';
import { getBudgets, addBudget, getContactById } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.role === 'secretario') {
      return NextResponse.json(
        { error: 'No tienes permiso para ver presupuestos' },
        { status: 403 }
      );
    }

    const budgets = await getBudgets();
    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('GET Budgets Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener presupuestos' },
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

    if (user.role === 'secretario') {
      return NextResponse.json(
        { error: 'No tienes permiso para crear presupuestos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contact_id, title, amount, status, description } = body;

    if (!contact_id || !title || amount === undefined || !status) {
      return NextResponse.json(
        { error: 'ID de contacto, título del presupuesto, monto y estado son requeridos' },
        { status: 400 }
      );
    }

    const contact = await getContactById(contact_id);
    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    // RBAC: Vendedores solo pueden crear presupuestos para sus propios clientes
    if (user.role === 'vendedor' && contact.assigned_to !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear presupuestos para clientes de otros agentes' },
        { status: 403 }
      );
    }

    const budgetData = {
      contact_id,
      title,
      amount: Number(amount) || 0,
      status,
      description: description || ''
    };

    const newBudget = await addBudget(budgetData);
    return NextResponse.json({ budget: newBudget }, { status: 201 });
  } catch (error) {
    console.error('POST Budget Error:', error);
    return NextResponse.json(
      { error: 'Error al crear el presupuesto' },
      { status: 500 }
    );
  }
}
