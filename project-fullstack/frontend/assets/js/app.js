/**
 * State management for the app
 */
const State = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  login: (userData) => {
    State.user = userData;
    localStorage.setItem('user', JSON.stringify(userData));
    window.location.hash = '#/';
    renderNav();
  },
  logout: () => {
    State.user = null;
    localStorage.removeItem('user');
    window.location.hash = '#/login';
    renderNav();
  }
};

/**
 * Helper to fetch data and handle errors.
 */
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Templates for different pages.
 */
const Templates = {
  error: (msg) => `<p style="text-align:center; padding: 20px; color: #ff4d4d;">Error: ${msg}</p>`,
  loading: '<p style="text-align: center; padding: 50px;">Loading...</p>',

  home: (playlists) => {
    const cards = playlists.map(item => `
        <article class="menu-item">
            <div class="image-placeholder">ID: ${item.id}</div>
            <div class="content">
                <h3>${item.title}</h3>
                <span class="price">Public</span>
                <p>${item.body.substring(0, 60)}...</p>
                <a href="#/watch/${item.id}" class="btn-secondary btn-link">Open Playlist</a>
            </div>
        </article>`).join("");
    
    return `
        <section class="hero">
            <h1>Welcome, <span>${State.user ? State.user.name : 'Guest'}!</span></h1>
            <p>Your personal music dashboard. Status: ${State.user ? State.user.role : 'Logged out'}</p>
        </section>
        <h2>Featured Public Playlists</h2>
        <section class="menu-grid">${cards}</section>`;
  },

  login: () => `
        <div class="form-container">
            <h2>Login</h2>
            <p style="text-align: center; font-size: 0.8em; margin-bottom: 20px;">
                Admin: admin / admin123<br>
                User: user / user123
            </p>
            <form id="login-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" placeholder="Username" required />
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Password" required />
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Sign In</button>
                </div>
            </form>
        </div>`,

  admin: (users) => {
    if (!State.user || State.user.role !== 'admin') {
        return `<section class="admin-panel"><h2>Access Denied</h2><p>Only admins can see this.</p></section>`;
    }
    const rows = users.map(user => `
        <tr id="user-row-${user.id}">
            <td>#${user.id}</td>
            <td>${user.username}</td>
            <td>${user.name}</td>
            <td>${user.role}</td>
            <td class="actions">
                <button class="btn-danger btn-delete-user" data-id="${user.id}">Delete</button>
            </td>
        </tr>`).join("");
    
    return `
        <section class="admin-panel">
            <div class="heder">
                <h2>User Management</h2>
                <button class="btn-primary" id="btn-add-user">Add New User</button>
            </div>
            <div class="user-table-container">
                <table>
                    <thead>
                        <tr><th>ID</th><th>Username</th><th>Name</th><th>Role</th><th>Actions</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </section>`;
  },

  watch: (post, tracks) => {
    const trackItems = tracks.map((track, index) => `
        <div class="track-item ${index === 0 ? "active" : ""}" data-title="${track.name}">
            <span class="track-number">${index + 1}</span>
            <div class="track-info">
                <span class="track-title">${track.name}</span>
                <span class="track-artist">${track.artist}</span>
            </div>
        </div>`).join("");

    return `
        <div class="watch-container">
            <section class="player-section">
                <div class="video-placeholder">
                    <div class="play-icon">▶</div>
                    <p id="now-playing">Playing: ${tracks[0]?.name || 'N/A'}</p>
                </div>
                <div class="playlist-details">
                    <h1>${post.title}</h1>
                    <p>${post.body}</p>
                    <div class="hero-actions">
                        <a href="#/" class="btn-secondary btn-link">Back to Home</a>
                    </div>
                </div>
            </section>
            <aside class="tracklist-container">
                <h3>Tracks</h3>
                <div class="track-list">${trackItems}</div>
            </aside>
        </div>`;
  }
};

/**
 * Handle Navigation display
 */
function renderNav() {
    const navLogin = document.getElementById('nav-login');
    const navAdmin = document.getElementById('nav-admin');

    if (State.user) {
        navLogin.innerText = `Logout (${State.user.username})`;
        navLogin.href = '#/logout';
        navAdmin.style.display = State.user.role === 'admin' ? 'block' : 'none';
    } else {
        navLogin.innerText = 'Login';
        navLogin.href = '#/login';
        navAdmin.style.display = 'none';
    }
}

/**
 * Page-specific initializations
 */
const Inits = {
    login: () => {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const res = await fetchData('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            if (!res.error) State.login(res);
            else alert('Login failed: ' + res.error);
        });
    },
    admin: () => {
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Delete this user?')) {
                    const res = await fetchData(`/api/users/${id}`, { method: 'DELETE' });
                    if (!res.error) document.getElementById(`user-row-${id}`).remove();
                }
            });
        });
        
        document.getElementById('btn-add-user').addEventListener('click', async () => {
            const username = prompt('Username:');
            const password = prompt('Password:');
            const name = prompt('Full Name:');
            const company = prompt('Company:');
            const role = prompt('Role (user/admin):', 'user');
            
            if (username && password && name) {
                const res = await fetchData('/api/users', {
                    method: 'POST',
                    body: JSON.stringify({ username, password, name, company_name: company, role })
                });
                if (!res.error) router();
            }
        });
    },
    watch: () => {
        const trackItems = document.querySelectorAll(".track-item");
        const nowPlayingText = document.getElementById("now-playing");
        trackItems.forEach((item) => {
            item.addEventListener("click", () => {
                trackItems.forEach((i) => i.classList.remove("active"));
                item.classList.add("active");
                nowPlayingText.innerText = `Playing: ${item.getAttribute("data-title")}`;
            });
        });
    }
};

/**
 * Router
 */
async function router() {
  const app = document.getElementById("app");
  const hash = window.location.hash || '#/';
  
  if (hash === '#/logout') {
      State.logout();
      return;
  }

  app.innerHTML = Templates.loading;
  renderNav();

  if (hash === "#/") {
    const data = await fetchData("/api/playlists");
    app.innerHTML = data.error ? Templates.error(data.error) : Templates.home(data);
  } else if (hash === "#/login") {
    app.innerHTML = Templates.login();
    Inits.login();
  } else if (hash === "#/admin") {
    const data = await fetchData("/api/users");
    app.innerHTML = data.error ? Templates.error(data.error) : Templates.admin(data);
    if (!data.error && State.user?.role === 'admin') Inits.admin();
  } else if (hash.startsWith("#/watch/")) {
    const id = hash.split("/")[2];
    const post = await fetchData(`/api/playlists/${id}`);
    const tracks = await fetchData(`/api/playlists/${id}/tracks`);
    if (post.error) app.innerHTML = Templates.error(post.error);
    else {
        app.innerHTML = Templates.watch(post, tracks);
        Inits.watch();
    }
  } else {
    app.innerHTML = "<h2>404 Page Not Found</h2>";
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);

// Export for tests
if (typeof module !== 'undefined') {
    module.exports = { State, Templates, fetchData };
}
