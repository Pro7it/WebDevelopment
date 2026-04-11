/**
 * Helper to fetch data and handle errors.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Templates for different pages.
 */
const Templates = {
  error: (msg) =>
    `<p style="text-align:center; padding: 20px;">Error: ${msg}</p>`,
  loading: '<p style="text-align: center; padding: 50px;">Loading...</p>',

  home: (playlists) => {
    const cards = playlists
      .map(
        (item) => `
            <article class="menu-item">
                <div class="image-placeholder">ID: ${item.id}</div>
                <div class="content">
                    <h3>${item.title.substring(0, 20)}</h3>
                    <span class="price">Public</span>
                    <p>${item.body.substring(0, 60)}...</p>
                    <a href="#/watch/${item.id}" class="btn-secondary btn-link">Open Playlist</a>
                </div>
            </article>`,
      )
      .join("");
    return `
            <section class="hero">
                <h1>Create. Share. <span>Collaborate.</span></h1>
                <p>Data fetched from JSONPlaceholder API.</p>
            </section>
            <h2>Featured Public Playlists</h2>
            <section class="menu-grid">${cards}</section>`;
  },

  login: () => `
        <div class="form-container">
            <h2>Author Login</h2>
            <form id="login-form">
                <div class="form-group"><label for="username">Username</label>
                <input type="text" id="username" name="username" placeholder="Enter username" /></div>
                <div class="form-actions"><button type="submit" class="btn-primary">Login</button>
                <button type="button" class="btn-secondary">Forgot?</button></div>
            </form>
        </div>`,

  admin: (users) => {
    const rows = users
      .map(
        (user) => `
            <tr><td>#${user.id}</td><td>${user.name}</td><td>${user.company.name}</td><td>Active</td>
            <td class="actions"><button class="btn-secondary">Edit</button>
            <button class="btn-danger">Delete</button></td></tr>`,
      )
      .join("");
    return `
            <section class="admin-panel">
                <div class="heder"><h2>User Management</h2><button class="btn-primary">Add New User</button></div>
                <div class="user-table-container"><table><thead><tr>
                <th>ID</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th>
                </tr></thead><tbody>${rows}</tbody></table></div>
            </section>`;
  },

  watch: (post, tracks) => {
    const trackItems = tracks
      .map(
        (track, index) => `
            <div class="track-item ${index === 0 ? "active" : ""}" data-title="${track.name.substring(0, 30)}">
                <span class="track-number">${index + 1}</span>
                <div class="track-info">
                    <span class="track-title">${track.name.substring(0, 30)}</span>
                    <span class="track-artist">${track.email}</span>
                </div>
                <span class="track-duration">3:00</span>
            </div>`,
      )
      .join("");
    return `
            <div class="watch-container">
                <section class="player-section">
                    <div class="video-placeholder"><div class="play-icon">▶</div>
                    <p id="now-playing">Playing: ${tracks[0].name.substring(0, 30)}</p></div>
                    <div class="playlist-details">
                        <h1 id="player-title">${post.title}</h1>
                        <p>${post.body}</p>
                        <div class="hero-actions"><button class="btn-primary">Like</button>
                        <a href="#/" class="btn-secondary btn-link">Back</a></div>
                    </div>
                </section>
                <aside class="tracklist-container">
                    <h3>Tracks</h3>
                    <div class="track-list">${trackItems}</div>
                </aside>
            </div>`;
  },
};

/**
 * Initialize track switching logic.
 */
function initTrackSwitching() {
  const trackItems = document.querySelectorAll(".track-item");
  const nowPlayingText = document.getElementById("now-playing");

  trackItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Remove active class from all
      trackItems.forEach((i) => i.classList.remove("active"));
      // Add active to clicked
      item.classList.add("active");
      // Update player text
      const title = item.getAttribute("data-title");
      if (nowPlayingText) {
        nowPlayingText.innerText = `Playing: ${title}`;
      }
    });
  });
}

/**
 * Router to handle page navigation.
 */
async function router() {
  const app = document.getElementById("app");
  const { hash } = window.location;
  app.innerHTML = Templates.loading;

  if (!hash || hash === "#/") {
    const data = await fetchData(
      "https://jsonplaceholder.typicode.com/posts?_limit=3",
    );
    app.innerHTML = data.error
      ? Templates.error(data.error)
      : Templates.home(data);
  } else if (hash === "#/login") {
    app.innerHTML = Templates.login();
  } else if (hash === "#/admin") {
    const data = await fetchData(
      "https://jsonplaceholder.typicode.com/users?_limit=5",
    );
    app.innerHTML = data.error
      ? Templates.error(data.error)
      : Templates.admin(data);
  } else if (hash.startsWith("#/watch/")) {
    const id = hash.split("/")[2];
    const post = await fetchData(
      `https://jsonplaceholder.typicode.com/posts/${id}`,
    );
    const tracks = await fetchData(
      `https://jsonplaceholder.typicode.com/comments?postId=${id}`,
    );
    if (post.error || tracks.error) {
      app.innerHTML = Templates.error(post.error || tracks.error);
    } else {
      app.innerHTML = Templates.watch(post, tracks);
      initTrackSwitching();
    }
  } else {
    app.innerHTML = "<h2>404 Page Not Found</h2>";
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);
