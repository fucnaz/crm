import { NextResponse } from 'next/server';
import { getContactById, updateContact, deleteContact } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const contact = await getContactById(id);
    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    // Reglas de Rol (RBAC) para Modificar:
    // - Vendedores solo pueden editar si son propietarios asignados del contacto
    if (user.role === 'vendedor' && contact.assigned_to !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar contactos de otros agentes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, last_name, email, phones, address, social_profiles, job_title, preferences, segmentation, channel, assigned_to } = body;

    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (last_name !== undefined) updatedData.last_name = last_name;
    if (email !== undefined) updatedData.email = email;
    if (phones !== undefined) updatedData.phones = phones;
    if (address !== undefined) updatedData.address = address;
    if (social_profiles !== undefined) updatedData.social_profiles = social_profiles;
    if (job_title !== undefined) updatedData.job_title = job_title;
    if (preferences !== undefined) updatedData.preferences = preferences;
    if (segmentation !== undefined) updatedData.segmentation = segmentation;
    if (channel !== undefined) updatedData.channel = channel;
    
    // Solo administrador y propietario pueden cambiar el agente asignado
    if (assigned_to !== undefined && (user.role === 'administrador' || user.role === 'propietario')) {
      updatedData.assigned_to = assigned_to;
    }

    const updatedContact = await updateContact(id, updatedData);
    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    console.error(`PUT Contact [${id}] Error:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar el contacto' },
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

    // Reglas de Rol (RBAC) para Eliminar:
    // - Vendedores y Secretarios NO pueden eliminar contactos
    if (user.role !== 'administrador' && user.role !== 'propietario') {
      return NextResponse.json(
        { error: 'Solo los administradores o propietarios pueden eliminar contactos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const success = await deleteContact(id);
    if (!success) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Contacto eliminado correctamente' });
  } catch (error) {
    console.error(`DELETE Contact Error:`, error);
    return NextResponse.json(
      { error: 'Error al eliminar el contacto' },
      { status: 500 }
    );
  }
}
