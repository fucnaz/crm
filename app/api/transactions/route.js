import { NextResponse } from 'next/server';
import { getTransactions, addTransaction, getContactById } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Secretarios no tienen acceso a datos transaccionales/financieros
    if (user.role === 'secretario') {
      return NextResponse.json(
        { error: 'Tu rol no tiene permisos para ver transacciones o datos financieros' },
        { status: 403 }
      );
    }

    const transactions = await getTransactions();
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('GET Transactions Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
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

    // Secretarios no pueden registrar transacciones
    if (user.role === 'secretario') {
      return NextResponse.json(
        { error: 'Tu rol no tiene permisos para registrar transacciones o datos financieros' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contact_id, product_name, quantity, price, date } = body;

    if (!contact_id || !product_name || quantity === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'ID de contacto, nombre de producto, cantidad y precio son requeridos' },
        { status: 400 }
      );
    }

    const contact = await getContactById(contact_id);
    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    // Vendedores solo pueden registrar transacciones de sus propios clientes
    if (user.role === 'vendedor' && contact.assigned_to !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para registrar transacciones para clientes de otros vendedores' },
        { status: 403 }
      );
    }

    const transactionData = {
      contact_id,
      product_name,
      quantity: Number(quantity),
      price: Number(price),
      date: date || new Date().toISOString()
    };

    const newTrx = await addTransaction(transactionData);
    return NextResponse.json({ transaction: newTrx }, { status: 201 });
  } catch (error) {
    console.error('POST Transaction Error:', error);
    return NextResponse.json(
      { error: 'Error al registrar la transacción' },
      { status: 500 }
    );
  }
}
