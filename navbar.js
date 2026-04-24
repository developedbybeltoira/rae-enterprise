// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Navbar
// ═══════════════════════════════════════════════════════

function renderNavbar() {
  const isLoggedIn = !!Store.user;
  const initials = Store.profile?.username?.slice(0, 2).toUpperCase() || '??';
  const isAdmin = Store.isAdmin();

  const nav = document.getElementById('navbar') || (() => {
    const n = document.createElement('nav');
    n.id = 'navbar';
    document.body.insertBefore(n, document.body.firstChild);
    return n;
  })();

  nav.innerHTML = `
    <div class="nav-logo" onclick="navigate('home')">
      <img src="logo.png" alt="Rae" onerror="this.style.display='none'" />
      <span class="nav-logo-text">Rae Enterprise</span>
    </div>

    <div class="nav-search">
      <span class="nav-search-icon">🔍</span>
      <input type="text" id="nav-search-input" placeholder="Search gorgeous finds..." autocomplete="off" />
      <div class="search-dropdown hidden" id="search-dropdown"></div>
    </div>

    <div class="nav-actions">
      ${isLoggedIn ? `
        <button class="nav-icon-btn" onclick="navigate('cart')" title="Cart">
          🛒
          <span id="cart-badge" class="hidden">0</span>
        </button>
        <button class="nav-icon-btn" onclick="navigate('notifications')" title="Notifications">🔔</button>
        <div class="nav-avatar-wrap">
          <div class="nav-avatar" id="nav-avatar-btn">${initials}</div>
          <div class="nav-dropdown hidden" id="nav-dropdown">
            ${isAdmin ? `<div class="nav-dropdown-item" onclick="navigate('admin')">⚙️ Admin Panel</div>` : ''}
            <div class="nav-dropdown-item" onclick="navigate('dashboard')">👤 My Account</div>
            <div class="nav-dropdown-item" onclick="navigate('orders')">📦 My Orders</div>
            <div class="nav-dropdown-item" onclick="navigate('referrals')">🎁 Referrals</div>
            <div class="nav-dropdown-item" onclick="navigate('wallet')">💰 Wallet</div>
            <div class="nav-dropdown-item danger" onclick="handleLogout()">🚪 Logout</div>
          </div>
        </div>
      ` : `
        <button class="btn btn-outline btn-sm" onclick="navigate('login')">Sign In</button>
        <button class="btn btn-primary btn-sm" onclick="navigate('register')">Join Free ✨</button>
      `}
      <button class="theme-toggle" id="theme-toggle" title="Toggle theme"></button>
    </div>
  `;

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // Avatar dropdown
  document.getElementById('nav-avatar-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('nav-dropdown')?.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    document.getElementById('nav-dropdown')?.classList.add('hidden');
  });

  // Search
  const searchInput = document.getElementById('nav-search-input');
  const searchDrop = document.getElementById('search-dropdown');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e) => {
      const q = e.target.value.trim();
      if (q.length < 2) { searchDrop?.classList.add('hidden'); return; }
      const { data } = await db.from('products').select('id,name,price,discount_price,images').ilike('name', `%${q}%`).limit(6);
      if (!data?.length) { searchDrop?.classList.add('hidden'); return; }
      searchDrop.innerHTML = data.map(p => `
        <div class="search-item" onclick="navigate('product', { id: '${p.id}' })">
          <img class="search-item-img" src="${p.images?.[0] || ''}" onerror="this.src='https://placehold.co/36x36/7B2EFF/fff?text=R'" />
          <div>
            <div class="search-item-name">${p.name}</div>
            <div class="search-item-price">${formatNaira(p.discount_price || p.price)}</div>
          </div>
        </div>
      `).join('');
      searchDrop?.classList.remove('hidden');
    }, 300));

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target)) searchDrop?.classList.add('hidden');
    });
  }

  // Update cart badge
  Store.updateCartBadge();
}

async function handleLogout() {
  await db.auth.signOut();
  toast('Logged out — see you soon! 💜', 'info');
  navigate('home');
}
