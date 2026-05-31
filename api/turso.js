import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_URL || 'libsql://agendapro-mendes9923.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAwMTM2ODUsImlkIjoiMDE5ZTcxMTQtOTIwMS03NzJjLTg0M2QtNGQ3MGY1MDdjOTgxIiwicmlkIjoiNGM3MTY5NGYtY2E0MS00NmY4LTkzOWItYmI3OTUxZTAxYjliIn0.PuUu5kM7XBuk4XH0zAQrTPy1CnFP-ZRY8NbhWLKLlRHUVyUSf39nLxy3BgBUh-fldao0SFew6JgD1YfqdAIVBA'
});

// Helper para executar queries
async function executeQuery(sql, params = []) {
  try {
    const result = await turso.execute({ sql, args: params });
    return result;
  } catch (error) {
    console.error('Turso error:', error);
    throw error;
  }
}

// API Handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path, userId, id } = req.query;
  const action = path?.[0] || req.body?.action;

  try {
    // USERS
    if (req.method === 'GET' && action === 'user') {
      const result = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
      return res.json(result.rows[0] || null);
    }
    
    if (req.method === 'POST' && action === 'user') {
      const { id, name, email, business, setup_done } = req.body;
      await executeQuery(
        'UPDATE users SET name = ?, email = ?, business = ?, setup_done = ? WHERE id = ?',
        [name, email, JSON.stringify(business), setup_done ? 1 : 0, id]
      );
      return res.json({ success: true });
    }

    // APPOINTMENTS
    if (req.method === 'GET' && action === 'appointments') {
      const result = await executeQuery('SELECT * FROM appointments WHERE user_id = ?', [userId]);
      return res.json(result.rows);
    }
    
    if (req.method === 'POST' && action === 'appointment') {
      const { id, user_id, client_id, client_name, prof_id, prof_name, service_id, service_name, date, time, duration, price, status, notes } = req.body;
      await executeQuery(
        `INSERT OR REPLACE INTO appointments 
         (id, user_id, client_id, client_name, prof_id, prof_name, service_id, service_name, date, time, duration, price, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, user_id, client_id, client_name, prof_id, prof_name, service_id, service_name, date, time, duration, price, status, notes]
      );
      return res.json({ success: true });
    }
    
    if (req.method === 'PUT' && action === 'appointment') {
      const { status } = req.body;
      await executeQuery('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
      return res.json({ success: true });
    }

    // CLIENTS
    if (req.method === 'GET' && action === 'clients') {
      const result = await executeQuery('SELECT * FROM clients WHERE user_id = ?', [userId]);
      return res.json(result.rows);
    }
    
    if (req.method === 'POST' && action === 'client') {
      const { id, user_id, name, phone, email, notes } = req.body;
      await executeQuery(
        'INSERT OR REPLACE INTO clients (id, user_id, name, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [id, user_id, name, phone, email, notes]
      );
      return res.json({ success: true });
    }

    // PROFESSIONALS
    if (req.method === 'GET' && action === 'professionals') {
      const result = await executeQuery('SELECT * FROM professionals WHERE user_id = ?', [userId]);
      return res.json(result.rows);
    }
    
    if (req.method === 'POST' && action === 'professional') {
      const { id, user_id, name, specialty, phone, email, color, active } = req.body;
      await executeQuery(
        'INSERT OR REPLACE INTO professionals (id, user_id, name, specialty, phone, email, color, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, user_id, name, specialty, phone, email, color, active ? 1 : 0]
      );
      return res.json({ success: true });
    }
    
    if (req.method === 'PUT' && action === 'professional') {
      const { active, name, specialty, phone, email } = req.body;
      if (active !== undefined) {
        await executeQuery('UPDATE professionals SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
      } else {
        await executeQuery('UPDATE professionals SET name = ?, specialty = ?, phone = ?, email = ? WHERE id = ?', [name, specialty, phone, email, id]);
      }
      return res.json({ success: true });
    }

    // SERVICES
    if (req.method === 'GET' && action === 'services') {
      const result = await executeQuery('SELECT * FROM services WHERE user_id = ?', [userId]);
      return res.json(result.rows);
    }
    
    if (req.method === 'POST' && action === 'service') {
      const { id, user_id, name, duration, price, active } = req.body;
      await executeQuery(
        'INSERT OR REPLACE INTO services (id, user_id, name, duration, price, active) VALUES (?, ?, ?, ?, ?, ?)',
        [id, user_id, name, duration, price, active ? 1 : 0]
      );
      return res.json({ success: true });
    }
    
    if (req.method === 'DELETE' && action === 'service') {
      await executeQuery('DELETE FROM services WHERE id = ?', [id]);
      return res.json({ success: true });
    }

    // FOLGAS
    if (req.method === 'GET' && action === 'folgas') {
      const result = await executeQuery('SELECT date FROM folgas WHERE user_id = ?', [userId]);
      return res.json(result.rows.map(r => r.date));
    }
    
    if (req.method === 'POST' && action === 'folga') {
      const { id, user_id, date } = req.body;
      await executeQuery('INSERT OR REPLACE INTO folgas (id, user_id, date) VALUES (?, ?, ?)', [id, user_id, date]);
      return res.json({ success: true });
    }
    
    if (req.method === 'DELETE' && action === 'folga') {
      const { user_id, date } = req.body;
      await executeQuery('DELETE FROM folgas WHERE user_id = ? AND date = ?', [user_id, date]);
      return res.json({ success: true });
    }

    // ADMIN
    if (req.method === 'GET' && action === 'all-users') {
      const result = await executeQuery('SELECT * FROM users');
      return res.json(result.rows);
    }
    
    if (req.method === 'PUT' && action === 'subscription') {
      const { subscription } = req.body;
      await executeQuery('UPDATE users SET subscription = ? WHERE id = ?', [JSON.stringify(subscription), userId]);
      return res.json({ success: true });
    }

    // AUTH (simplificada para migração)
    if (req.method === 'POST' && action === 'login') {
      const { email, password } = req.body;
      // Buscar usuário por email (senha em texto plano APENAS para migração)
      const result = await executeQuery('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
      if (result.rows.length > 0) {
        return res.json({ user: result.rows[0] });
      }
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    if (req.method === 'POST' && action === 'register') {
      const { id, name, email, phone, area, password } = req.body;
      await executeQuery(
        'INSERT INTO users (id, name, email, phone, area, password, setup_done, subscription) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
        [id, name, email, phone, area, password, '{"status":"trial","plan":"trial"}']
      );
      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Endpoint não encontrado' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}