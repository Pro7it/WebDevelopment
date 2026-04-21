/**
 * @jest-environment jsdom
 */
const { State, Templates } = require('./app');

describe('Frontend Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    State.user = null;
    
    // Setup minimal DOM for tests that interact with navigation
    document.body.innerHTML = `
      <div id="app"></div>
      <a id="nav-home"></a>
      <a id="nav-login"></a>
      <a id="nav-admin" style="display: none;"></a>
    `;
  });

  describe('State Management', () => {
    it('should login a user and save to localStorage', () => {
      const userData = { username: 'test', role: 'user', name: 'Test User' };
      State.login(userData);
      
      expect(State.user).toEqual(userData);
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(userData);
    });

    it('should logout a user and clear localStorage', () => {
      const userData = { username: 'test', role: 'user' };
      State.login(userData);
      State.logout();
      
      expect(State.user).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Templates Rendering', () => {
    it('home template should show Welcome Guest for non-logged user', () => {
      const playlists = [{ id: 1, title: 'Test', body: 'Body' }];
      const html = Templates.home(playlists);
      // Fixed: matches "Guest!" with exclamation mark
      expect(html).toContain('Welcome, <span>Guest!</span>');
      expect(html).toContain('Test');
    });

    it('home template should show username for logged user', () => {
      State.user = { name: 'Alex' };
      const html = Templates.home([]);
      // Fixed: matches "Alex!" with exclamation mark
      expect(html).toContain('Welcome, <span>Alex!</span>');
    });

    it('login template should contain username and password fields', () => {
      const html = Templates.login();
      expect(html).toContain('type="text" id="username"');
      expect(html).toContain('type="password" id="password"');
    });

    it('admin template should show access denied for non-admins', () => {
      State.user = { role: 'user' };
      const html = Templates.admin([]);
      expect(html).toContain('Access Denied');
    });

    it('admin template should show user table for admins', () => {
      State.user = { role: 'admin' };
      const users = [{ id: 1, username: 'tester', name: 'Tester', role: 'user' }];
      const html = Templates.admin(users);
      expect(html).toContain('User Management');
      expect(html).toContain('tester');
    });
  });
});
