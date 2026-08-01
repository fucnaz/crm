import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const MOCK_DB_PATH = path.join(process.cwd(), 'mock_db.json');

// 1. Verificar si las variables de entorno de Firebase están configuradas
export function isFirebaseConfigured() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return false;
  }

  // Evitar valores predeterminados de la plantilla
  if (
    projectId.includes('tu-proyecto-firebase-id') ||
    clientEmail.includes('firebase-adminsdk-xxxxx') ||
    privateKey.includes('MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3')
  ) {
    return false;
  }

  return true;
}

// 2. Inicializar Firebase Admin SDK de forma segura
let firestoreDb = null;
if (isFirebaseConfigured()) {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Reemplazar los saltos de línea literales \n por caracteres reales y limpiar comillas/comas accidentales
          privateKey: process.env.FIREBASE_PRIVATE_KEY
            ?.replace(/^"/, '')
            ?.replace(/",?$/, '')
            ?.replace(/\\n/g, '\n'),
        }),
      });
    }
    firestoreDb = getFirestore();
  } catch (error) {
    console.error('Error al inicializar Firebase Admin SDK:', error);
  }
}

// ==========================================
// SISTEMA DE RESPALDO (OFFLINE MOCK DB)
// ==========================================

const DEFAULT_MOCK_DATA = {
  users: [
    {
      id: 'usr_admin',
      name: 'Admin Smart',
      email: 'admin@gestionsmart.com',
      password_hash: '$2b$10$Y7MFeXz3Jsw0aFbYBV53ouPlprsIac3cY.lP4NK2Q0GEAYZAdKgmu',
      role: 'administrador'
    },
    {
      id: 'usr_propietario',
      name: 'Carlos Smart (Owner)',
      email: 'propietario@gestionsmart.com',
      password_hash: '$2b$10$fOVvkHXiRqdhmdY5P4XJO.7BgCIRCt45RpzT8ta8bBRum08mNrVkK',
      role: 'propietario'
    },
    {
      id: 'usr_vendedor1',
      name: 'Juan Vendedor',
      email: 'vendedor@gestionsmart.com',
      password_hash: '$2b$10$lx0oN0g7ohh5SK9WlV018efDvHVNHKTM5/I8M2IhoUjWDf78ltp..',
      role: 'vendedor'
    },
    {
      id: 'usr_secretario1',
      name: 'Sofia Secretaria',
      email: 'secretario@gestionsmart.com',
      password_hash: '$2b$10$em5So3MtnBlmnE86NeQ/teAZ/o8ZZYwFyQVzTdUx5nEFJPFlvAsSq',
      role: 'secretario'
    }
  ],
  contacts: [
    {
      id: 'con_1',
      name: 'Alejandro',
      last_name: 'Gómez',
      email: 'alejandro.gomez@gmail.com',
      phones: '+34 612 345 678',
      address: 'Calle Mayor 12, Madrid, España',
      social_profiles: 'LinkedIn: linkedin.com/in/alejandrogomez',
      job_title: 'Director de IT',
      preferences: 'Interesado en software SaaS, prefiere soporte rápido y videollamadas.',
      segmentation: 'Demográfico: 35-45 años, Madrid. Psicográfico: Innovador, busca automatización.',
      channel: 'Correo electrónico',
      assigned_to: 'usr_vendedor1',
      created_at: '2026-07-01T10:00:00.000Z'
    },
    {
      id: 'con_2',
      name: 'María',
      last_name: 'Fernández',
      email: 'maria.fernandez@techcorp.com',
      phones: '+34 699 888 777',
      address: 'Avenida de la Constitución 45, Barcelona',
      social_profiles: 'Twitter: @maria_tech',
      job_title: 'Gerente de Compras',
      preferences: 'Orientada al precio, valora descuentos por volumen y reuniones presenciales.',
      segmentation: 'Demográfico: 40-50 años, Directiva. Psicográfico: Pragmática, adversa al riesgo.',
      channel: 'Reunión presencial',
      assigned_to: 'usr_vendedor1',
      created_at: '2026-07-05T11:30:00.000Z'
    },
    {
      id: 'con_3',
      name: 'Roberto',
      last_name: 'Díaz',
      email: 'roberto.diaz@logisticaexpress.es',
      phones: '+34 655 444 333',
      address: 'Polígono Industrial Las Monjas, Parcela 4, Torrejón de Ardoz',
      social_profiles: 'LinkedIn: linkedin.com/in/robertodiazlog',
      job_title: 'Director de Operaciones',
      preferences: 'Busca optimización de flotas, prefiere contacto telefónico directo.',
      segmentation: 'Demográfico: 50+ años, Empresa logística. Psicográfico: Tradicional, busca confianza.',
      channel: 'Llamada telefónica',
      assigned_to: 'usr_vendedor1',
      created_at: '2026-07-10T09:15:00.000Z'
    }
  ],
  interactions: [
    {
      id: 'int_1',
      contact_id: 'con_1',
      type: 'Llamada',
      date: '2026-07-02T15:30:00.000Z',
      description: 'Llamada de presentación de servicios de software de gestión comercial. Interesado.',
      agent_id: 'usr_vendedor1'
    },
    {
      id: 'int_2',
      contact_id: 'con_1',
      type: 'Reunión',
      date: '2026-07-06T10:00:00.000Z',
      description: 'Demostración en vivo de la plataforma. Preguntó por integraciones y costos.',
      agent_id: 'usr_vendedor1'
    },
    {
      id: 'int_3',
      contact_id: 'con_2',
      type: 'Correo',
      date: '2026-07-07T09:00:00.000Z',
      description: 'Envío de propuesta económica inicial y catálogo de productos.',
      agent_id: 'usr_vendedor1'
    },
    {
      id: 'int_4',
      contact_id: 'con_3',
      type: 'Soporte',
      date: '2026-07-12T16:00:00.000Z',
      description: 'Dificultad técnica al ingresar a la plataforma de pruebas. Resuelto en 15 minutos.',
      agent_id: 'usr_secretario1'
    }
  ],
  transactions: [
    {
      id: 'trx_1',
      contact_id: 'con_1',
      product_name: 'Licencia CRM Enterprise Anual',
      quantity: 5,
      price: 150,
      date: '2026-07-15T12:00:00.000Z',
      total: 750
    },
    {
      id: 'trx_2',
      contact_id: 'con_1',
      product_name: 'Servicio de Consultoría e Implantación',
      quantity: 1,
      price: 500,
      date: '2026-07-16T14:00:00.000Z',
      total: 500
    },
    {
      id: 'trx_3',
      contact_id: 'con_2',
      product_name: 'Licencia CRM Standard Anual',
      quantity: 10,
      price: 100,
      date: '2026-07-20T10:00:00.000Z',
      total: 1000
    }
  ],
  opportunities: [
    {
      id: 'opp_1',
      contact_id: 'con_1',
      title: 'Venta Licencias Enterprise + Implantación',
      value: 1250,
      stage: 'Cerrado Ganado',
      close_date: '2026-07-15',
      notes: 'Ganado. Contrato firmado y primer pago recibido.',
      assigned_to: 'usr_vendedor1'
    },
    {
      id: 'opp_2',
      contact_id: 'con_2',
      title: 'Venta Licencias Standard Corporativas',
      value: 1000,
      stage: 'Cerrado Ganado',
      close_date: '2026-07-20',
      notes: 'Firmado tras negociación de descuento por volumen.',
      assigned_to: 'usr_vendedor1'
    },
    {
      id: 'opp_3',
      contact_id: 'con_3',
      title: 'Proyecto Integración de Flotas Logísticas',
      value: 3000,
      stage: 'Negociación',
      close_date: '2026-08-15',
      notes: 'Revisando términos del acuerdo y plazos de entrega.',
      assigned_to: 'usr_vendedor1'
    }
  ],
  budgets: [
    {
      id: 'bud_1',
      contact_id: 'con_1',
      title: 'Presupuesto CRM Enterprise v1.2',
      amount: 1250,
      status: 'Firmado',
      description: '5 licencias Enterprise (750€) + Servicios profesionales de configuración (500€)',
      date_created: '2026-07-08'
    },
    {
      id: 'bud_2',
      contact_id: 'con_2',
      title: 'Propuesta 10x Standard CRM con Descuento',
      amount: 1000,
      status: 'Firmado',
      description: '10 licencias Standard (precio normal 120€, rebajado a 100€ por volumen)',
      date_created: '2026-07-12'
    },
    {
      id: 'bud_3',
      contact_id: 'con_3',
      title: 'Presupuesto Integración y Consultoría Smart Flotas',
      amount: 3000,
      status: 'Enviado',
      description: 'Análisis de procesos (1000€) + Desarrollo de integración API (2000€)',
      date_created: '2026-07-22'
    }
  ],
  tasks: [
    {
      id: 'tsk_1',
      contact_id: 'con_3',
      title: 'Llamar para concretar reunión de presupuestos',
      description: 'Llamar a Roberto Díaz para verificar si recibió el presupuesto y resolver dudas.',
      due_date: '2026-08-05',
      status: 'Pendiente',
      assigned_to: 'usr_vendedor1'
    },
    {
      id: 'tsk_2',
      contact_id: 'con_1',
      title: 'Hacer seguimiento de configuración inicial',
      description: 'Asegurar que el equipo técnico le ha dado de alta los accesos.',
      due_date: '2026-07-28',
      status: 'Completada',
      assigned_to: 'usr_secretario1'
    },
    {
      id: 'tsk_3',
      contact_id: '',
      title: 'Revisión semanal de pipeline comercial',
      description: 'Revisar oportunidades en negociación con todo el equipo.',
      due_date: '2026-08-01',
      status: 'Pendiente',
      assigned_to: 'usr_propietario'
    }
  ]
};

function readMockDB() {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(DEFAULT_MOCK_DATA, null, 2), 'utf-8');
    return DEFAULT_MOCK_DATA;
  }
  try {
    const content = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return DEFAULT_MOCK_DATA;
  }
}

function writeMockDB(data) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ==========================================
// OPERACIONES CRUD FIRESTORE / MOCK DB
// ==========================================

// Obtener todos los documentos de una colección
export async function getFirebaseData(collectionName) {
  if (!isFirebaseConfigured() || !firestoreDb) {
    const db = readMockDB();
    return db[collectionName] || [];
  }

  try {
    const snapshot = await firestoreDb.collection(collectionName).get();
    const data = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() });
    });
    return data;
  } catch (error) {
    console.error(`Error al leer colección de Firestore ${collectionName}:`, error);
    // Fallback en caso de error de conexión o permisos
    const db = readMockDB();
    return db[collectionName] || [];
  }
}

// Agregar un nuevo documento (el id ya viene pre-generado en db.js en la propiedad .id)
export async function appendFirebaseDoc(collectionName, object) {
  if (!isFirebaseConfigured() || !firestoreDb) {
    const db = readMockDB();
    if (!db[collectionName]) db[collectionName] = [];
    db[collectionName].push(object);
    writeMockDB(db);
    return object;
  }

  try {
    const docId = object.id || firestoreDb.collection(collectionName).doc().id;
    const dataToSave = { ...object, id: docId };
    await firestoreDb.collection(collectionName).doc(docId).set(dataToSave);
    return dataToSave;
  } catch (error) {
    console.error(`Error al añadir documento en Firestore ${collectionName}:`, error);
    // Fallback
    const db = readMockDB();
    db[collectionName].push(object);
    writeMockDB(db);
    return object;
  }
}

// Actualizar un documento por ID
export async function updateFirebaseDoc(collectionName, id, updatedObject) {
  if (!isFirebaseConfigured() || !firestoreDb) {
    const db = readMockDB();
    const list = db[collectionName] || [];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedObject, id };
      writeMockDB(db);
      return list[index];
    }
    throw new Error(`Registro con ID ${id} no encontrado en mock ${collectionName}`);
  }

  try {
    const docRef = firestoreDb.collection(collectionName).doc(id);
    await docRef.update(updatedObject);
    const docSnap = await docRef.get();
    return { id, ...docSnap.data() };
  } catch (error) {
    console.error(`Error al actualizar documento en Firestore ${collectionName}:`, error);
    // Fallback
    const db = readMockDB();
    const list = db[collectionName] || [];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedObject, id };
      writeMockDB(db);
      return list[index];
    }
    throw error;
  }
}

// Eliminar un documento por ID
export async function deleteFirebaseDoc(collectionName, id) {
  if (!isFirebaseConfigured() || !firestoreDb) {
    const db = readMockDB();
    const list = db[collectionName] || [];
    db[collectionName] = list.filter(item => item.id !== id);
    writeMockDB(db);
    return true;
  }

  try {
    await firestoreDb.collection(collectionName).doc(id).delete();
    return true;
  } catch (error) {
    console.error(`Error al eliminar documento en Firestore ${collectionName}:`, error);
    // Fallback
    const db = readMockDB();
    const list = db[collectionName] || [];
    db[collectionName] = list.filter(item => item.id !== id);
    writeMockDB(db);
    return true;
  }
}

// Inicializar base de datos / sembrar datos
export async function initializeFirebaseDatabase(force = false) {
  if (!isFirebaseConfigured() || !firestoreDb) {
    const db = readMockDB();
    if (force) {
      writeMockDB(DEFAULT_MOCK_DATA);
    }
    return { success: true, mode: 'mock' };
  }

  try {
    for (const collectionName of Object.keys(DEFAULT_MOCK_DATA)) {
      const collectionRef = firestoreDb.collection(collectionName);
      
      let shouldSeed = force;
      if (!shouldSeed) {
        // Verificar si la colección está vacía
        const limitSnap = await collectionRef.limit(1).get();
        shouldSeed = limitSnap.empty;
      }

      if (shouldSeed) {
        // Si se fuerza la reinstalación, borrar los documentos existentes de esta colección
        if (force) {
          const snapshot = await collectionRef.get();
          // Firestore batch puede procesar hasta 500 operaciones
          const batch = firestoreDb.batch();
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }

        // Sembrar datos predeterminados en lote
        const items = DEFAULT_MOCK_DATA[collectionName] || [];
        const batch = firestoreDb.batch();
        for (const item of items) {
          const docRef = collectionRef.doc(item.id);
          batch.set(docRef, item);
        }
        
        if (items.length > 0) {
          await batch.commit();
        }
      }
    }
    return { success: true, mode: 'firebase_firestore' };
  } catch (error) {
    console.error('Error al inicializar la base de datos de Firebase:', error);
    return { success: false, error: error.message, mode: 'mock_fallback' };
  }
}
