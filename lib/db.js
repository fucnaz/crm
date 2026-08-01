import { 
  getFirebaseData as getSheetData, 
  appendFirebaseDoc as appendRow, 
  updateFirebaseDoc as updateRow, 
  deleteFirebaseDoc as deleteRow 
} from './firebase';

// ==========================================
// USUARIOS (USERS)
// ==========================================

export async function getUsers() {
  return await getSheetData('users');
}

export async function getUserByEmail(email) {
  const users = await getUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) {
    // Si la hoja ya fue inicializada previamente pero contiene el hash antiguo corrupto,
    // interceptarlo en memoria al correcto para permitir al administrador iniciar sesión.
    if (found.email.toLowerCase() === 'admin@gestionsmart.com' && found.password_hash === '$2a$10$tZk52T7P1p0P/Z9HqB.05Og0/eBq62v1aNn475m8aP.e/Hl8rU92C') {
      found.password_hash = '$2b$10$Y7MFeXz3Jsw0aFbYBV53ouPlprsIac3cY.lP4NK2Q0GEAYZAdKgmu';
    }
    return found;
  }

  // Salvaguarda: si la hoja de cálculo de Google está vacía o sin inicializar,
  // permitir el inicio de sesión del administrador por defecto para configurar el sistema.
  if (email.toLowerCase() === 'admin@gestionsmart.com') {
    const hasAdmin = users.some(u => u.role === 'administrador');
    if (!hasAdmin) {
      return {
        id: 'usr_admin',
        name: 'Admin Smart',
        email: 'admin@gestionsmart.com',
        password_hash: '$2b$10$Y7MFeXz3Jsw0aFbYBV53ouPlprsIac3cY.lP4NK2Q0GEAYZAdKgmu',
        role: 'administrador'
      };
    }
  }
  return null;
}

export async function getUserById(id) {
  const users = await getUsers();
  const found = users.find(u => u.id === id);
  if (found) {
    if (found.id === 'usr_admin' && found.password_hash === '$2a$10$tZk52T7P1p0P/Z9HqB.05Og0/eBq62v1aNn475m8aP.e/Hl8rU92C') {
      found.password_hash = '$2b$10$Y7MFeXz3Jsw0aFbYBV53ouPlprsIac3cY.lP4NK2Q0GEAYZAdKgmu';
    }
    return found;
  }

  if (id === 'usr_admin') {
    return {
      id: 'usr_admin',
      name: 'Admin Smart',
      email: 'admin@gestionsmart.com',
      password_hash: '$2b$10$Y7MFeXz3Jsw0aFbYBV53ouPlprsIac3cY.lP4NK2Q0GEAYZAdKgmu',
      role: 'administrador'
    };
  }
  return null;
}

export async function addUser(user) {
  const users = await getUsers();
  const id = `usr_${Date.now()}`;
  const newUser = { id, ...user };
  return await appendRow('users', newUser);
}

export async function updateUser(id, updatedFields) {
  // Evitar modificar el hash de la contraseña si viene vacío
  if (updatedFields.password_hash === '') {
    delete updatedFields.password_hash;
  }
  return await updateRow('users', id, updatedFields);
}

export async function deleteUser(id) {
  return await deleteRow('users', id);
}

// ==========================================
// CONTACTOS (CONTACTS)
// ==========================================

export async function getContacts() {
  return await getSheetData('contacts');
}

export async function getContactById(id) {
  const contacts = await getContacts();
  return contacts.find(c => c.id === id) || null;
}

export async function addContact(contact) {
  const id = `con_${Date.now()}`;
  const newContact = { 
    id, 
    created_at: new Date().toISOString(),
    ...contact 
  };
  return await appendRow('contacts', newContact);
}

export async function updateContact(id, updatedFields) {
  return await updateRow('contacts', id, updatedFields);
}

export async function deleteContact(id) {
  return await deleteRow('contacts', id);
}

// ==========================================
// INTERACCIONES (INTERACTIONS)
// ==========================================

export async function getInteractions() {
  return await getSheetData('interactions');
}

export async function addInteraction(interaction) {
  const id = `int_${Date.now()}`;
  const newInteraction = { id, ...interaction };
  return await appendRow('interactions', newInteraction);
}

export async function deleteInteraction(id) {
  return await deleteRow('interactions', id);
}

// ==========================================
// TRANSACCIONES (TRANSACTIONS)
// ==========================================

export async function getTransactions() {
  return await getSheetData('transactions');
}

export async function addTransaction(transaction) {
  const id = `trx_${Date.now()}`;
  // Asegurar que quantity, price y total sean números
  const qty = Number(transaction.quantity) || 1;
  const price = Number(transaction.price) || 0;
  const total = qty * price;
  
  const newTransaction = { 
    id, 
    ...transaction,
    quantity: qty,
    price: price,
    total: total
  };
  return await appendRow('transactions', newTransaction);
}

// ==========================================
// OPORTUNIDADES (OPPORTUNITIES)
// ==========================================

export async function getOpportunities() {
  return await getSheetData('opportunities');
}

export async function addOpportunity(opportunity) {
  const id = `opp_${Date.now()}`;
  const newOpportunity = { 
    id, 
    value: Number(opportunity.value) || 0,
    ...opportunity 
  };
  return await appendRow('opportunities', newOpportunity);
}

export async function updateOpportunity(id, updatedFields) {
  if (updatedFields.value !== undefined) {
    updatedFields.value = Number(updatedFields.value) || 0;
  }
  return await updateRow('opportunities', id, updatedFields);
}

export async function deleteOpportunity(id) {
  return await deleteRow('opportunities', id);
}

// ==========================================
// PRESUPUESTOS (BUDGETS)
// ==========================================

export async function getBudgets() {
  return await getSheetData('budgets');
}

export async function addBudget(budget) {
  const id = `bud_${Date.now()}`;
  const newBudget = { 
    id, 
    amount: Number(budget.amount) || 0,
    date_created: new Date().toISOString().split('T')[0],
    ...budget 
  };
  return await appendRow('budgets', newBudget);
}

export async function updateBudget(id, updatedFields) {
  if (updatedFields.amount !== undefined) {
    updatedFields.amount = Number(updatedFields.amount) || 0;
  }
  return await updateRow('budgets', id, updatedFields);
}

export async function deleteBudget(id) {
  return await deleteRow('budgets', id);
}

// ==========================================
// TAREAS (TASKS)
// ==========================================

export async function getTasks() {
  return await getSheetData('tasks');
}

export async function addTask(task) {
  const id = `tsk_${Date.now()}`;
  const newTask = { 
    id, 
    status: 'Pendiente', 
    ...task 
  };
  return await appendRow('tasks', newTask);
}

export async function updateTask(id, updatedFields) {
  return await updateRow('tasks', id, updatedFields);
}

export async function deleteTask(id) {
  return await deleteRow('tasks', id);
}
