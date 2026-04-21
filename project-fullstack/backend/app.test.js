const request = require('supertest');
const { app, pool } = require('./index');

// Mocking the pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Backend API Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/playlists', () => {
    it('should return all playlists', async () => {
      const mockPlaylists = [
        { id: 1, title: 'Rock', body: 'Classic' },
        { id: 2, title: 'Jazz', body: 'Smooth' }
      ];
      pool.query.mockResolvedValueOnce({ rows: mockPlaylists });

      const res = await request(app).get('/api/playlists');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockPlaylists);
    });

    it('should return 500 on database error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/playlists');
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/playlists/:id', () => {
    it('should return a single playlist if it exists', async () => {
      const mockPlaylist = { id: 1, title: 'Rock', body: 'Classic' };
      pool.query.mockResolvedValueOnce({ rows: [mockPlaylist] });

      const res = await request(app).get('/api/playlists/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockPlaylist);
    });

    it('should return 404 if playlist not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/playlists/999');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = { username: 'admin', role: 'admin', name: 'Super Admin' };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const res = await request(app)
        .post('/api/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockUser);
    });

    it('should return 401 with incorrect credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .post('/api/login')
        .send({ username: 'wrong', password: 'wrong' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Invalid username or password');
    });

    it('should return 400 if credentials missing', async () => {
      const res = await request(app).post('/api/login').send({ username: 'admin' });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = { username: 'testuser', password: '123', name: 'Test' };
      const createdUser = { id: 3, username: 'testuser', name: 'Test', role: 'user' };
      pool.query.mockResolvedValueOnce({ rows: [createdUser] });

      const res = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(createdUser);
    });

    it('should return 400 if required fields missing', async () => {
      const res = await request(app).post('/api/users').send({ username: 'test' });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).delete('/api/users/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ success: true });
    });
  });
});
