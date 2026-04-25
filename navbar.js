// RAE ENTERPRISE — Navbar + Premium Bottom Nav

var currentPage = 'home';

function renderNavbar() {
  var isLoggedIn = !!Store.user;
  var initials = Store.profile && Store.profile.username ? Store.profile.username.slice(0,2).toUpperCase() : '??';
  var isAdmin = Store.isAdmin();

  var nav = document.getElementById('navbar');
  if (!nav) {
    nav = document.createElement('nav');
    nav.id = 'navbar';
    document.body.insertBefore(nav, document.body.firstChild);
  }

  nav.innerHTML =
    '<div class="nav-logo" onclick="navigate(\'home\')">' +
    '<img src="logo.png" alt="Rae" onerror="this.style.display=\'none\'" />' +
    '<span class="nav-logo-text">Rae Enterprise</span></div>' +

    '<div class="nav-search">' +
    '<span class="nav-search-icon">🔍</span>' +
    '<input type="text" id="nsi" placeholder="Search — try &quot;shoes&quot;, &quot;big bag&quot;..." autocomplete="off" />' +
    '<div class="search-dropdown hidden" id="sdrop"></div>' +
    '</div>' +

    '<div class="nav-actions">' +
    (isLoggedIn ?
      '<button class="nav-icon-btn" onclick="navigate(\'cart\')" title="Cart">' +
      '🛒<span id="cart-badge">0</span></button>' +
      '<button class="nav-icon-btn" onclick="navigate(\'notifications\')" title="Notifications">🔔</button>' +
      '<div class="nav-avatar-wrap">' +
      '<div class="nav-avatar" id="nav-av">' + initials + '</div>' +
      '<div class="nav-dropdown hidden" id="nav-dd">' +
      (isAdmin ? '<div class="nav-dropdown-item" onclick="navigate(\'admin\')">⚙️ Admin Panel</div>' : '') +
      '<div class="nav-dropdown-item" onclick="navigate(\'dashboard\')">👤 My Account</div>' +
      '<div class="nav-dropdown-item" onclick="navigate(\'orders\')">📦 My Orders</div>' +
      '<div class="nav-dropdown-item" onclick="navigate(\'referrals\')">🎁 Referrals</div>' +
      '<div class="nav-dropdown-item" onclick="navigate(\'wallet\')">💰 Wallet</div>' +
      '<div class="nav-dropdown-item danger" onclick="handleLogout()">🚪 Logout</div>' +
      '</div></div>'
    :
      '<button class="btn btn-outline btn-sm" onclick="navigate(\'login\')">Sign In</button>' +
      '<button class="btn btn-primary btn-sm" onclick="navigate(\'register\')">Join Free ✨</button>'
    ) +
    '<button class="theme-toggle" id="theme-btn" title="Toggle theme"></button>' +
    '</div>';

  // Theme
  var tb = document.getElementById('theme-btn');
  if (tb) tb.onclick = function() {
    var h = document.documentElement;
    h.setAttribute('data-theme', h.getAttribute('data-theme')==='dark'?'light':'dark');
  };

  // Avatar dropdown
  var av = document.getElementById('nav-av');
  if (av) {
    av.onclick = function(e) {
      e.stopPropagation();
      var dd = document.getElementById('nav-dd');
      if (dd) dd.classList.toggle('hidden');
    };
  }
  document.addEventListener('click', function() {
    var dd = document.getElementById('nav-dd');
    if (dd) dd.classList.add('hidden');
  });

  // Smart search
  var si = document.getElementById('nsi');
  var sd = document.getElementById('sdrop');
  if (si && sd) {
    si.addEventListener('input', debounce(function(e) { smartSearch(e.target.value, sd); }, 300));
    document.addEventListener('click', function(ev) { if (!si.contains(ev.target)) sd.classList.add('hidden'); });
  }

  Store.updateCartBadge();
  renderBottomNav(isLoggedIn, isAdmin);
}

// ── Smart semantic search ──
var SYNONYMS = {
  'airpod':'earbuds', 'airpods':'earbuds', 'headphone':'earbuds', 'earbud':'earbuds',
  'big bag':'handbag', 'purse':'handbag', 'clutch':'handbag', 'tote':'handbag',
  'sneaker':'shoes', 'trainer':'shoes', 'boot':'shoes', 'sandal':'shoes', 'heel':'shoes',
  'cream':'beauty', 'serum':'beauty', 'lotion':'beauty', 'moisturizer':'beauty', 'skincare':'beauty',
  'top':'fashion', 'gown':'fashion', 'dress':'fashion', 'blouse':'fashion', 'skirt':'fashion',
  'phone':'tech', 'laptop':'tech', 'gadget':'tech', 'charger':'tech', 'cable':'tech',
  'ring':'accessories', 'bracelet':'accessories', 'necklace':'accessories', 'earring':'accessories',
  'perfume':'beauty', 'fragrance':'beauty', 'cologne':'beauty'
};

async function smartSearch(q, sd) {
  q = (q || '').trim();
  if (q.length < 2) { sd.classList.add('hidden'); return; }

  // Resolve synonyms
  var searchTerm = q.toLowerCase();
  for (var key in SYNONYMS) {
    if (searchTerm.indexOf(key) !== -1) { searchTerm = SYNONYMS[key]; break; }
  }

  // Search by name AND category
  var res1 = await db.from('products').select('id,name,price,discount_price,images,category')
    .ilike('name', '%'+q+'%').limit(4);
  var res2 = await db.from('products').select('id,name,price,discount_price,images,category')
    .ilike('category', '%'+searchTerm+'%').limit(4);

  var seen = {};
  var combined = [];
  [].concat(res1.data||[], res2.data||[]).forEach(function(p) {
    if (!seen[p.id]) { seen[p.id]=true; combined.push(p); }
  });
  combined = combined.slice(0,6);

  if (!combined.length) { sd.classList.add('hidden'); return; }

  sd.innerHTML = combined.map(function(p) {
    return '<div class="search-item" onclick="navigate(\'product\',{id:\''+p.id+'\'})">' +
      '<img class="search-item-img" src="'+(p.images&&p.images[0]||'')+'" onerror="this.src=\'https://placehold.co/36x36/7B2EFF/fff?text=R\'" />' +
      '<div><div class="search-item-name">'+p.name+'</div>' +
      '<div class="search-item-price">'+formatNaira(p.discount_price||p.price)+'</div></div></div>';
  }).join('');
  sd.classList.remove('hidden');
}

// ── Premium Bottom Nav ──
function renderBottomNav(isLoggedIn, isAdmin) {
  var old = document.getElementById('bottom-nav');
  if (old) old.remove();
  if (!isLoggedIn) return;

  var items = [
    {id:'shop',   icon:'🛍️', label:'Shop',    page:'home'},
    {id:'wallet', icon:'💰', label:'Wallet',  page:'wallet'},
    {id:'cart',   icon:'🛒', label:'Cart',    page:'cart', badge:true},
    {id:'orders', icon:'📦', label:'Orders',  page:'orders'},
    isAdmin
      ? {id:'admin',   icon:'⚙️', label:'Admin',   page:'admin'}
      : {id:'profile', icon:'👤', label:'Profile', page:'dashboard'}
  ];

  var bn = document.createElement('div');
  bn.id = 'bottom-nav';

  bn.innerHTML = items.map(function(item) {
    var active = currentPage === item.page ? 'bn-active' : '';
    return '<div class="bn-item '+active+'" id="bn-'+item.id+'" onclick="bnNav(\''+item.page+'\')">' +
      '<span class="bn-icon">' + item.icon +
      (item.badge ? '<span class="bn-badge" id="cart-badge-m">0</span>' : '') +
      '</span>' +
      '<span class="bn-label">' + item.label + '</span>' +
      '</div>';
  }).join('');

  document.body.appendChild(bn);
  Store.updateCartBadge();
}

function bnNav(page) {
  currentPage = page;
  // Update active states
  document.querySelectorAll('.bn-item').forEach(function(el) { el.classList.remove('bn-active'); });
  var pages = {home:'bn-shop', wallet:'bn-wallet', cart:'bn-cart', orders:'bn-orders', dashboard:'bn-profile', admin:'bn-admin'};
  var target = document.getElementById(pages[page]);
  if (target) target.classList.add('bn-active');
  navigate(page);
}

function handleLogout() {
  Store.logout();
  var bn = document.getElementById('bottom-nav');
  if (bn) bn.remove();
  currentPage = 'home';
  renderNavbar();
  toast('Logged out — see you soon! 💜', 'info');
  navigate('home');
}
