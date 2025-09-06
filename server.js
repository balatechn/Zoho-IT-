import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3.Database('./database.db');

// Initialize database tables
db.serialize(() => {
  // Assets table
  db.run(`CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_tag TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    status TEXT DEFAULT 'Available',
    location TEXT,
    assigned_to TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Requests table
  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    department TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_date DATETIME,
    approved_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Assignments table
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    assigned_to TEXT NOT NULL,
    assigned_to_email TEXT NOT NULL,
    assigned_to_department TEXT NOT NULL,
    assigned_to_employee_id TEXT NOT NULL,
    assignment_date DATE NOT NULL,
    location TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expected_return_date DATE,
    terms_and_conditions BOOLEAN DEFAULT 1,
    notes TEXT,
    assignee_signature TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_by_signature TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME,
    FOREIGN KEY (asset_id) REFERENCES assets (id)
  )`);

  // Insert default categories
  const categories = [
    'Laptop',
    'Desktop',
    'Monitor',
    'Keyboard',
    'Mouse',
    'Printer',
    'Scanner',
    'Tablet',
    'Phone',
    'Server',
    'Network Equipment',
    'Software License'
  ];

  categories.forEach(category => {
    db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [category]);
  });
});

// API Routes

// Assets endpoints
app.get('/api/assets', (req, res) => {
  db.all('SELECT * FROM assets ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM assets WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/assets', (req, res) => {
  const {
    asset_tag,
    name,
    category,
    brand,
    model,
    serial_number,
    purchase_date,
    warranty_expiry,
    status,
    location,
    assigned_to,
    notes
  } = req.body;

  const query = `INSERT INTO assets (
    asset_tag, name, category, brand, model, serial_number,
    purchase_date, warranty_expiry, status, location, assigned_to, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    asset_tag, name, category, brand, model, serial_number,
    purchase_date, warranty_expiry, status, location, assigned_to, notes
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Asset created successfully' });
  });
});

app.put('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  const {
    asset_tag,
    name,
    category,
    brand,
    model,
    serial_number,
    purchase_date,
    warranty_expiry,
    status,
    location,
    assigned_to,
    notes
  } = req.body;

  const query = `UPDATE assets SET
    asset_tag = ?, name = ?, category = ?, brand = ?, model = ?, serial_number = ?,
    purchase_date = ?, warranty_expiry = ?, status = ?, location = ?, assigned_to = ?, notes = ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`;

  db.run(query, [
    asset_tag, name, category, brand, model, serial_number,
    purchase_date, warranty_expiry, status, location, assigned_to, notes, id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json({ message: 'Asset updated successfully' });
  });
});

app.delete('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM assets WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json({ message: 'Asset deleted successfully' });
  });
});

// Requests endpoints
app.get('/api/requests', (req, res) => {
  db.all('SELECT * FROM requests ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/requests', (req, res) => {
  const {
    requester_name,
    requester_email,
    department,
    asset_type,
    description,
    priority
  } = req.body;

  const request_id = `REQ-${Date.now()}`;

  const query = `INSERT INTO requests (
    request_id, requester_name, requester_email, department,
    asset_type, description, priority
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    request_id, requester_name, requester_email, department,
    asset_type, description, priority
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, request_id, message: 'Request created successfully' });
  });
});

app.put('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const { status, approved_by, notes } = req.body;

  const query = `UPDATE requests SET
    status = ?, approved_by = ?, notes = ?, approved_date = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`;

  db.run(query, [status, approved_by, notes, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    res.json({ message: 'Request updated successfully' });
  });
});

// Categories endpoints
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Assignments endpoints
app.get('/api/assignments', (req, res) => {
  const query = `
    SELECT a.*, ast.name as asset_name, ast.asset_tag, ast.category 
    FROM assignments a 
    LEFT JOIN assets ast ON a.asset_id = ast.id 
    ORDER BY a.created_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/assignments', (req, res) => {
  const {
    asset_id,
    assigned_to,
    assigned_to_email,
    assigned_to_department,
    assigned_to_employee_id,
    assignment_date,
    location,
    purpose,
    expected_return_date,
    terms_and_conditions,
    notes,
    assignee_signature,
    assigned_by,
    assigned_by_signature
  } = req.body;

  const query = `
    INSERT INTO assignments (
      asset_id, assigned_to, assigned_to_email, assigned_to_department,
      assigned_to_employee_id, assignment_date, location, purpose,
      expected_return_date, terms_and_conditions, notes,
      assignee_signature, assigned_by, assigned_by_signature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    asset_id, assigned_to, assigned_to_email, assigned_to_department,
    assigned_to_employee_id, assignment_date, location, purpose,
    expected_return_date, terms_and_conditions, notes,
    assignee_signature, assigned_by, assigned_by_signature
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Assignment created successfully' });
  });
});

app.put('/api/assignments/:id/return', (req, res) => {
  const { id } = req.params;
  const { return_notes } = req.body;
  
  const query = `
    UPDATE assignments 
    SET status = 'Returned', returned_at = CURRENT_TIMESTAMP, notes = ?
    WHERE id = ?
  `;
  
  db.run(query, [return_notes, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    res.json({ message: 'Asset returned successfully' });
  });
});

app.get('/api/assignments/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT a.*, ast.name as asset_name, ast.asset_tag, ast.category 
    FROM assignments a 
    LEFT JOIN assets ast ON a.asset_id = ast.id 
    WHERE a.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    res.json(row);
  });
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {};
  
  // Get total assets
  db.get('SELECT COUNT(*) as total FROM assets', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    stats.totalAssets = row.total;
    
    // Get pending requests
    db.get('SELECT COUNT(*) as total FROM requests WHERE status = "Pending"', (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      stats.pendingRequests = row.total;
      
      // Get assets by status
      db.all('SELECT status, COUNT(*) as count FROM assets GROUP BY status', (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        stats.assetsByStatus = rows;
        res.json(stats);
      });
    });
  });
});

app.listen(port, () => {
  console.log(`National Group India IT Asset Tracker API server running on http://localhost:${port}`);
});

export default app;
