import { NextResponse } from 'next/server';
import { getContacts, addContact, getTransactions } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener contactos y transacciones en paralelo
    const [contacts, transactions] = await Promise.all([
      getContacts(),
      getTransactions()
    ]);

    // Calcular LTV dinámicamente para cada contacto
    const ltvMap = {};
    transactions.forEach(trx => {
      const contactId = trx.contact_id;
      const amount = Number(trx.total) || 0;
      ltvMap[contactId] = (ltvMap[contactId] || 0) + amount;
    });

    const contactsWithLtv = contacts.map(c => ({
      ...c,
      ltv: ltvMap[c.id] || 0
    }));

    return NextResponse.json({ contacts: contactsWithLtv });
  } catch (error) {
    console.error('GET Contacts API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener contactos' },
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

    // Todos los roles (incluyendo secretarios y vendedores) pueden crear contactos
    const body = await request.json();
    const { name, last_name, email, phones, address, social_profiles, job_title, preferences, segmentation, channel, assigned_to } = body;

    if (!name || !last_name) {
      return NextResponse.json(
        { error: 'Nombre y apellido son requeridos' },
        { status: 400 }
      );
    }

    // Por defecto, si el creador es vendedor, se auto-asigna como propietario
    let ownerId = assigned_to;
    if (!ownerId && user.role === 'vendedor') {
      ownerId = user.id;
    } else if (!ownerId) {
      ownerId = '';
    }

    const contactData = {
      name,
      last_name,
      email: email || '',
      phones: phones || '',
      address: address || '',
      social_profiles: social_profiles || '',
      job_title: job_title || '',
      preferences: preferences || '',
      segmentation: segmentation || '',
      channel: channel || 'Correo electrónico',
      assigned_to: ownerId
    };

    const newContact = await addContact(contactData);
    return NextResponse.json({ contact: newContact }, { status: 201 });
  } catch (error) {
    console.error('POST Contact API Error:', error);
    return NextResponse.json(
      { error: 'Error interno al crear el contacto' },
      { status: 500 }
    );
  }
}
