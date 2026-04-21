const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database with retries
const initDb = async () => {
  let retries = 5;
  while (retries) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS playlists (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          company_name TEXT NOT NULL,
          role TEXT DEFAULT 'user'
        );
        CREATE TABLE IF NOT EXISTS tracks (
          id SERIAL PRIMARY KEY,
          playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          artist TEXT NOT NULL
        );
      `);

      const { rowCount } = await pool.query('SELECT * FROM playlists LIMIT 1');
      if (rowCount === 0) {
        const res = await pool.query(`
          INSERT INTO playlists (title, body) VALUES 
          ('Local Rock Classics', 'A collection of the best local rock hits.'),
          ('Electronic Dreams', 'Dive into the world of synthesizer sounds.'),
          ('Acoustic Sessions', 'Pure music, raw emotions, acoustic guitars.')
          RETURNING id;
        `);
        
        const playlistIds = res.rows.map(r => r.id);

        await pool.query(`
          INSERT INTO users (username, password, name, company_name, role) VALUES 
          ('admin', 'admin123', 'Super Admin', 'Zak Muse Inc.', 'admin'),
          ('user', 'user123', 'Regular User', 'Music Fan Club', 'user');

          INSERT INTO tracks (playlist_id, name, artist) VALUES 
          (${playlistIds[0]}, 'Rock Anthem', 'The Rockers'),
          (${playlistIds[0]}, 'Stone Heart', 'Granite'),
          (${playlistIds[1]}, 'Neon Lights', 'SynthWave'),
          (${playlistIds[2]}, 'Morning Mist', 'Acoustic Guy');
        `);
      }
      console.log('Database initialized successfully');
      break;
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error initializing database, retrying...', err.message);
      }
      retries -= 1;
      if (retries === 0) break;
      await new Promise(res => setTimeout(res, 2000));
    }
  }
};

// Only init DB if not in test mode
if (process.env.NODE_ENV !== 'test') {
    initDb();
}

// API Endpoints
app.get('/api/playlists', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM playlists');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/playlists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM playlists WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/playlists/:id/tracks', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM tracks WHERE playlist_id = $1', [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, username, name, company_name, role FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const { rows } = await pool.query(
      'SELECT username, role, name FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (rows.length > 0) res.json(rows[0]);
    else res.status(401).json({ error: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, name, company_name, role } = req.body;
    if (!username || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
    const { rows } = await pool.query(
      'INSERT INTO users (username, password, name, company_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, role',
      [username, password, name, company_name, role || 'user']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = { app, pool };
