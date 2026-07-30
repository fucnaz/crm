// ==========================================================================
// GOOGLE APPS SCRIPT DATABASE ENDPOINT FOR CRM
// Paste this code into: Google Sheet > Extensions > Apps Script (Code.gs)
// Deploy as: Web App (Execute as: "Me", Who has access: "Anyone")
// ==========================================================================

const API_SECRET_KEY = "0651d9a3.1706EE7A*"; // Cambia esto por una clave segura

// Estructura de columnas para cada hoja
const HEADERS = {
  users: ['id', 'name', 'email', 'password_hash', 'role'],
  contacts: ['id', 'name', 'last_name', 'email', 'phones', 'address', 'social_profiles', 'job_title', 'preferences', 'segmentation', 'channel', 'assigned_to', 'created_at'],
  interactions: ['id', 'contact_id', 'type', 'date', 'description', 'agent_id'],
  transactions: ['id', 'contact_id', 'product_name', 'quantity', 'price', 'date', 'total'],
  opportunities: ['id', 'contact_id', 'title', 'value', 'stage', 'close_date', 'notes', 'assigned_to'],
  budgets: ['id', 'contact_id', 'title', 'amount', 'status', 'description', 'date_created'],
  tasks: ['id', 'contact_id', 'title', 'description', 'due_date', 'status', 'assigned_to']
};

// Datos semilla de prueba
const DEFAULT_MOCK_DATA = {
  users: [
    { id: 'usr_admin', name: 'Admin Smart', email: 'admin@gestionsmart.com', password_hash: '$2b$10$Y7MFeXz3Jsw0aFbYBV53ouPlprsIac3cY.lP4NK2Q0GEAYZAdKgmu', role: 'administrador' },
    { id: 'usr_propietario', name: 'Carlos Smart (Owner)', email: 'propietario@gestionsmart.com', password_hash: '$2b$10$fOVvkHXiRqdhmdY5P4XJO.7BgCIRCt45RpzT8ta8bBRum08mNrVkK', role: 'propietario' },
    { id: 'usr_vendedor1', name: 'Juan Vendedor', email: 'vendedor@gestionsmart.com', password_hash: '$2b$10$lx0oN0g7ohh5SK9WlV018efDvHVNHKTM5/I8M2IhoUjWDf78ltp..', role: 'vendedor' },
    { id: 'usr_secretario1', name: 'Sofia Secretaria', email: 'secretario@gestionsmart.com', password_hash: '$2b$10$em5So3MtnBlmnE86NeQ/teAZ/o8ZZYwFyQVzTdUx5nEFJPFlvAsSq', role: 'secretario' }
  ],
  contacts: [
    { id: 'con_1', name: 'Alejandro', last_name: 'Gómez', email: 'alejandro.gomez@gmail.com', phones: '+34 612 345 678', address: 'Calle Mayor 12, Madrid, España', social_profiles: 'LinkedIn: linkedin.com/in/alejandrogomez', job_title: 'Director de IT', preferences: 'Interesado en software SaaS, prefiere soporte rápido y videollamadas.', segmentation: 'Demográfico: 35-45 años, Madrid. Psicográfico: Innovador, busca automatización.', channel: 'Correo electrónico', assigned_to: 'usr_vendedor1', created_at: '2026-07-01T10:00:00.000Z' },
    { id: 'con_2', name: 'María', last_name: 'Fernández', email: 'maria.fernandez@techcorp.com', phones: '+34 699 888 777', address: 'Avenida de la Constitución 45, Barcelona', social_profiles: 'Twitter: @maria_tech', job_title: 'Gerente de Compras', preferences: 'Orientada al precio, valora descuentos por volumen y reuniones presenciales.', segmentation: 'Demográfico: 40-50 años, Directiva. Psicográfico: Pragmática, adversa al riesgo.', channel: 'Reunión presencial', assigned_to: 'usr_vendedor1', created_at: '2026-07-05T11:30:00.000Z' },
    { id: 'con_3', name: 'Roberto', last_name: 'Díaz', email: 'roberto.diaz@logisticaexpress.es', phones: '+34 655 444 333', address: 'Polígono Industrial Las Monjas, Parcela 4, Torrejón de Ardoz', social_profiles: 'LinkedIn: linkedin.com/in/robertodiazlog', job_title: 'Director de Operaciones', preferences: 'Busca optimización de flotas, prefiere contacto telefónico directo.', segmentation: 'Demográfico: 50+ años, Empresa logística. Psicográfico: Tradicional, busca confianza.', channel: 'Llamada telefónica', assigned_to: 'usr_vendedor1', created_at: '2026-07-10T09:15:00.000Z' }
  ],
  interactions: [
    { id: 'int_1', contact_id: 'con_1', type: 'Llamada', date: '2026-07-02T15:30:00.000Z', description: 'Llamada de presentación de servicios de software de gestión comercial. Interesado.', agent_id: 'usr_vendedor1' },
    { id: 'int_2', contact_id: 'con_1', type: 'Reunión', date: '2026-07-06T10:00:00.000Z', description: 'Demostración en vivo de la plataforma. Preguntó por integraciones y costos.', agent_id: 'usr_vendedor1' },
    { id: 'int_3', contact_id: 'con_2', type: 'Correo', date: '2026-07-07T09:00:00.000Z', description: 'Envío de propuesta económica inicial y catálogo de productos.', agent_id: 'usr_vendedor1' },
    { id: 'int_4', contact_id: 'con_3', type: 'Soporte', date: '2026-07-12T16:00:00.000Z', description: 'Dificultad técnica al ingresar a la plataforma de pruebas. Resuelto en 15 minutos.', agent_id: 'usr_secretario1' }
  ],
  transactions: [
    { id: 'trx_1', contact_id: 'con_1', product_name: 'Licencia CRM Enterprise Anual', quantity: '5', price: '150', date: '2026-07-15T12:00:00.000Z', total: '750' },
    { id: 'trx_2', contact_id: 'con_1', product_name: 'Servicio de Consultoría e Implantación', quantity: '1', price: '500', date: '2026-07-16T14:00:00.000Z', total: '500' },
    { id: 'trx_3', contact_id: 'con_2', product_name: 'Licencia CRM Standard Anual', quantity: '10', price: '100', date: '2026-07-20T10:00:00.000Z', total: '1000' }
  ],
  opportunities: [
    { id: 'opp_1', contact_id: 'con_1', title: 'Venta Licencias Enterprise + Implantación', value: '1250', stage: 'Cerrado Ganado', close_date: '2026-07-15', notes: 'Ganado. Contrato firmado y primer pago recibido.', assigned_to: 'usr_vendedor1' },
    { id: 'opp_2', contact_id: 'con_2', title: 'Venta Licencias Standard Corporativas', value: '1000', stage: 'Cerrado Ganado', close_date: '2026-07-20', notes: 'Firmado tras negociación de descuento por volumen.', assigned_to: 'usr_vendedor1' },
    { id: 'opp_3', contact_id: 'con_3', title: 'Proyecto Integración de Flotas Logísticas', value: '3000', stage: 'Negociación', close_date: '2026-08-15', notes: 'Revisando términos del acuerdo y plazos de entrega.', assigned_to: 'usr_vendedor1' }
  ],
  budgets: [
    { id: 'bud_1', contact_id: 'con_1', title: 'Presupuesto CRM Enterprise v1.2', amount: '1250', status: 'Firmado', description: '5 licencias Enterprise (750€) + Servicios profesionales de configuración (500€)', date_created: '2026-07-08' },
    { id: 'bud_2', contact_id: 'con_2', title: 'Propuesta 10x Standard CRM con Descuento', amount: '1000', status: 'Firmado', description: '10 licencias Standard (precio normal 120€, rebajado a 100€ por volumen)', date_created: '2026-07-12' },
    { id: 'bud_3', contact_id: 'con_3', title: 'Presupuesto Integración y Consultoría Smart Flotas', amount: '3000', status: 'Enviado', description: 'Análisis de procesos (1000€) + Desarrollo de integración API (2000€)', date_created: '2026-07-22' }
  ],
  tasks: [
    { id: 'tsk_1', contact_id: 'con_3', title: 'Llamar para concretar reunión de presupuestos', description: 'Llamar a Roberto Díaz para verificar si recibió el presupuesto y resolver dudas.', due_date: '2026-08-05', status: 'Pendiente', assigned_to: 'usr_vendedor1' },
    { id: 'tsk_2', contact_id: 'con_1', title: 'Hacer seguimiento de configuración inicial', description: 'Asegurar que el equipo técnico le ha dado de alta los accesos.', due_date: '2026-07-28', status: 'Completada', assigned_to: 'usr_secretario1' },
    { id: 'tsk_3', contact_id: '', title: 'Revisión semanal de pipeline comercial', description: 'Revisar oportunidades en negociación con todo el equipo.', due_date: '2026-08-01', status: 'Pendiente', assigned_to: 'usr_propietario' }
  ]
};

// ==========================================
// RECEPCIÓN DE SOLICITUDES POST
// ==========================================
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const secret = requestData.secret;
    const action = requestData.action;
    const payload = requestData.payload;

    // Validación de seguridad
    if (secret !== API_SECRET_KEY) {
      return jsonResponse({ error: "No autorizado. Secret API Key incorrecto." }, 401);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case "ping":
        return jsonResponse({ success: true, message: "Conexión exitosa con Apps Script." });

      case "setup":
        return setupSheets(ss, payload && payload.force);

      case "getData":
        return getAllData(ss);

      case "insertRow":
        return insertRow(ss, payload.sheetName, payload.rowObject);

      case "updateRow":
        return updateRow(ss, payload.sheetName, payload.id, payload.rowObject);

      case "deleteRow":
        return deleteRow(ss, payload.sheetName, payload.id);

      default:
        return jsonResponse({ error: "Acción no reconocida." }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: "Error en el servidor de Apps Script: " + error.toString() }, 500);
  }
}

// Permitir solicitudes GET para verificación rápida
function doGet(e) {
  return HtmlService.createHtmlOutput("<h3>Gestion Smart CRM - Google Apps Script Endpoint Activo</h3>");
}

// ==========================================
// MANEJADORES DE ACCIONES
// ==========================================

// Inicializar Hojas y Sembrar datos
function setupSheets(ss, force = false) {
  const sheetKeys = Object.keys(HEADERS);
  
  for (const key of sheetKeys) {
    let sheet = ss.getSheetByName(key);
    
    if (sheet) {
      if (force) {
        ss.deleteSheet(sheet);
        sheet = ss.insertSheet(key);
      }
    } else {
      sheet = ss.insertSheet(key);
    }

    // Si la hoja acaba de ser creada o forzada a resetear
    if (sheet.getLastRow() === 0 || force) {
      const headers = HEADERS[key];
      sheet.appendRow(headers);
      
      // Sembrar datos mock por defecto
      if (DEFAULT_MOCK_DATA[key] && DEFAULT_MOCK_DATA[key].length > 0) {
        DEFAULT_MOCK_DATA[key].forEach(rowObj => {
          const values = headers.map(h => rowObj[h] !== undefined ? String(rowObj[h]) : '');
          sheet.appendRow(values);
        });
      }
    }
  }

  // Eliminar la hoja "Hoja 1" inicial por defecto si existe y no se usa
  const defaultSheet = ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  return jsonResponse({ success: true, message: "Estructura de CRM inicializada correctamente." });
}

// Obtener todas las hojas en un solo JSON
function getAllData(ss) {
  const result = {};
  const sheetKeys = Object.keys(HEADERS);

  sheetKeys.forEach(key => {
    const sheet = ss.getSheetByName(key);
    if (!sheet) {
      result[key] = [];
      return;
    }

    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      result[key] = [];
      return;
    }

    const headers = rows[0];
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = row[index] !== undefined ? String(row[index]) : '';
      });
      data.push(rowObj);
    }

    result[key] = data;
  });

  return jsonResponse({ success: true, data: result });
}

// Insertar Fila
function insertRow(ss, sheetName, rowObject) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: "Hoja " + sheetName + " no encontrada." }, 404);

  const headers = HEADERS[sheetName];
  const values = headers.map(h => rowObject[h] !== undefined ? String(rowObject[h]) : '');
  sheet.appendRow(values);

  return jsonResponse({ success: true, record: rowObject });
}

// Actualizar Fila
function updateRow(ss, sheetName, id, rowObject) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: "Hoja " + sheetName + " no encontrada." }, 404);

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) return jsonResponse({ error: "Columna ID no encontrada." }, 500);

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIndex]) === String(id)) {
      rowIndex = i + 1; // 1-indexed y saltar cabecera
      break;
    }
  }

  if (rowIndex === -1) return jsonResponse({ error: "Registro con ID " + id + " no encontrado." }, 404);

  const existingRow = rows[rowIndex - 1];
  const updatedRowValues = headers.map((header, colIdx) => {
    if (rowObject[header] !== undefined) {
      return String(rowObject[header]);
    }
    return existingRow[colIdx] !== undefined ? String(existingRow[colIdx]) : '';
  });

  const range = sheet.getRange(rowIndex, 1, 1, headers.length);
  range.setValues([updatedRowValues]);

  const resultObj = {};
  headers.forEach((h, idx) => {
    resultObj[h] = updatedRowValues[idx];
  });

  return jsonResponse({ success: true, record: resultObj });
}

// Eliminar Fila
function deleteRow(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: "Hoja " + sheetName + " no encontrada." }, 404);

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.indexOf('id');
  
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIndex]) === String(id)) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return jsonResponse({ error: "Registro con ID " + id + " no encontrado." }, 404);

  sheet.deleteRow(rowIndex);
  return jsonResponse({ success: true, message: "Registro eliminado correctamente." });
}

// Auxiliar para respuestas JSON
function jsonResponse(data, statusCode = 200) {
  const responseText = JSON.stringify(data);
  return ContentService.createTextOutput(responseText)
    .setMimeType(ContentService.MimeType.JSON);
}
