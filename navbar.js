// RAE ENTERPRISE - Navbar + Bottom Nav + Image Search

var currentPage = 'home';

function renderNavbar() {
  var isLoggedIn = !!Store.user;
  var initials = Store.profile && Store.profile.username ? Store.profile.username.slice(0,2).toUpperCase() : '??';
  var isAdmin = Store.isAdmin() || adminAuthed || !!(Store.profile && Store.profile.username === 'Chinedu');

  var nav = document.getElementById('navbar');
  if (!nav) {
    nav = document.createElement('nav');
    nav.id = 'navbar';
    document.body.insertBefore(nav, document.body.firstChild);
  }

  nav.innerHTML =
    '<div class="nav-logo" onclick="navigate(\'home\')" style="cursor:pointer">' +
    '<img src="logo.png" alt="Rae" onerror="this.style.display=\'none\'" />' +
    '<span class="nav-logo-text">Rae Enterprise</span></div>' +

    '<div class="nav-search">' +
    '<span class="nav-search-icon">&#128269;</span>' +
    '<input type="text" id="nsi" placeholder="Search products..." autocomplete="off" />' +
    '<button onclick="openImgSearch()" title="Search by image" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:var(--text-muted);padding:0;transition:color 0.2s" onmouseenter="this.style.color=\'var(--neon-purple)\'" onmouseleave="this.style.color=\'var(--text-muted)\'">&#128247;</button>' +
    '<div class="search-dropdown hidden" id="sdrop"></div>' +
    '</div>' +

    '<div class="nav-actions">' +
    (isLoggedIn ?
      '<button class="nav-icon-btn" onclick="navigate(\'cart\')" title="Cart">&#128722;' +
      '<span id="cart-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#FF2EBD;color:#fff;font-size:0.6rem;font-weight:700;width:17px;height:17px;border-radius:50%;align-items:center;justify-content:center">0</span>' +
      '</button>' +
      '<button class="nav-icon-btn" onclick="navigate(\'notifications\')" title="Notifications">&#128276;</button>' +
      '<div class="nav-avatar-wrap">' +
      '<div class="nav-avatar" id="nav-av">' + initials + '</div>' +
      '<div class="nav-dropdown hidden" id="nav-dd">' +
      (isAdmin ? '<div class="nav-dropdown-item" onclick="navigate(\'admin\')">&#9881;&#65039; Admin Panel</div>' : '') +
      '<div class="nav-dropdown-item" onclick="navigate(\'dashboard\')">&#128100; My Account</div>' +
      '<div class="nav-dropdown-item" onclick="navigate(\'orders\')">&#128230; My Orders</div>' +
      '<div class="nav-dropdown-item" onclick="navigate(\'referrals\')">&#127873; Referrals</div>' +
      '<div class="nav-dropdown-item" onclick="navigate(\'wallet\')">&#128176; Wallet</div>' +
      '<div class="nav-dropdown-item danger" onclick="handleLogout()">&#128682; Logout</div>' +
      '</div></div>'
    :
      '<button class="btn btn-outline btn-sm" onclick="navigate(\'login\')">Sign In</button>' +
      '<button class="btn btn-primary btn-sm" onclick="navigate(\'register\')">Join Free</button>'
    ) +
    '<button class="theme-toggle" id="theme-btn" title="Toggle theme"></button>' +
    '</div>';

  var tb = document.getElementById('theme-btn');
  if (tb) tb.onclick = function() {
    var h = document.documentElement;
    h.setAttribute('data-theme', h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  };

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

  var si = document.getElementById('nsi');
  var sd = document.getElementById('sdrop');
  if (si && sd) {
    si.addEventListener('input', debounce(function(e) { smartSearch(e.target.value, sd); }, 300));
    document.addEventListener('click', function(ev) { if (!si.contains(ev.target)) sd.classList.add('hidden'); });
  }

  Store.updateCartBadge();
  renderBottomNav(isLoggedIn, isAdmin);
}

var SYNONYMS = {
  airpod:'earbuds', airpods:'earbuds', headphone:'earbuds', earbud:'earbuds',
  purse:'handbag', clutch:'handbag', tote:'handbag', sneaker:'shoes', trainer:'shoes',
  boot:'shoes', sandal:'shoes', heel:'shoes', cream:'beauty', serum:'beauty',
  lotion:'beauty', skincare:'beauty', gown:'fashion', dress:'fashion', blouse:'fashion',
  phone:'tech', laptop:'tech', gadget:'tech', ring:'accessories', bracelet:'accessories',
  necklace:'accessories', earring:'accessories', perfume:'beauty', fragrance:'beauty'
};

async function smartSearch(q, sd) {
  q = (q || '').trim();
  if (q.length < 2) { sd.classList.add('hidden'); return; }
  var searchTerm = q.toLowerCase();
  for (var key in SYNONYMS) {
    if (searchTerm.indexOf(key) !== -1) { searchTerm = SYNONYMS[key]; break; }
  }
  var r1 = await db.from('products').select('id,name,price,discount_price,images,category').ilike('name', '%' + q + '%').limit(4);
  var r2 = await db.from('products').select('id,name,price,discount_price,images,category').ilike('category', '%' + searchTerm + '%').limit(4);
  var seen = {};
  var combined = [];
  [].concat(r1.data||[], r2.data||[]).forEach(function(p) {
    if (!seen[p.id]) { seen[p.id] = true; combined.push(p); }
  });
  combined = combined.slice(0, 6);
  if (!combined.length) { sd.classList.add('hidden'); return; }
  sd.innerHTML = combined.map(function(p) {
    return '<div class="search-item" onclick="navigate(\'product\',{id:\'' + p.id + '\'})">' +
      '<img class="search-item-img" src="' + ((p.images&&p.images[0])||'') + '" onerror="this.src=\'https://placehold.co/36x36/7B2EFF/fff?text=R\'" />' +
      '<div><div class="search-item-name">' + p.name + '</div>' +
      '<div class="search-item-price">' + formatNaira(p.discount_price||p.price) + '</div></div></div>';
  }).join('');
  sd.classList.remove('hidden');
}

function renderBottomNav(isLoggedIn, isAdmin) {
  var old = document.getElementById('bottom-nav');
  if (old) old.remove();
  if (!isLoggedIn) return;

  var items = [
    {id:'shop',   icon:'&#128717;', label:'Shop',    page:'home'},
    {id:'wallet', icon:'&#128176;', label:'Wallet',  page:'wallet'},
    {id:'cart',   icon:'&#128722;', label:'Cart',    page:'cart', badge:true},
    {id:'orders', icon:'&#128230;', label:'Orders',  page:'orders'},
    isAdmin
      ? {id:'admin',   icon:'&#9881;&#65039;', label:'Admin',   page:'admin'}
      : {id:'profile', icon:'&#128100;',        label:'Profile', page:'dashboard'}
  ];

  var bn = document.createElement('div');
  bn.id = 'bottom-nav';
  bn.innerHTML = items.map(function(item) {
    var active = currentPage === item.page ? 'bn-active' : '';
    return '<div class="bn-item ' + active + '" id="bn-' + item.id + '" onclick="bnNav(\'' + item.page + '\')">' +
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
  document.querySelectorAll('.bn-item').forEach(function(el) { el.classList.remove('bn-active'); });
  var map = {home:'bn-shop', wallet:'bn-wallet', cart:'bn-cart', orders:'bn-orders', dashboard:'bn-profile', admin:'bn-admin'};
  var target = document.getElementById(map[page]);
  if (target) target.classList.add('bn-active');
  navigate(page);
}

function handleLogout() {
  Store.logout();
  adminAuthed = false;
  try { sessionStorage.removeItem('rae_admin'); } catch(e) {}
  var bn = document.getElementById('bottom-nav');
  if (bn) bn.remove();
  currentPage = 'home';
  renderNavbar();
  toast('Logged out - see you soon!', 'info');
  navigate('home');
}

// Image Search
function openImgSearch() {
  var ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'img-search-ov';
  ov.innerHTML =
    '<div class="modal" style="max-width:420px;text-align:center">' +
    '<div style="font-size:2.5rem;margin-bottom:10px">&#128247;</div>' +
    '<h3 class="text-gradient" style="font-family:var(--font-display);margin-bottom:8px">Search by Image</h3>' +
    '<p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:20px">Upload a photo and we\'ll find similar products</p>' +
    '<div id="img-drop" onclick="document.getElementById(\'img-file\').click()" ' +
    'style="border:2px dashed var(--glass-border);border-radius:var(--radius);padding:32px 20px;cursor:pointer;background:rgba(123,46,255,0.04);margin-bottom:16px;transition:border-color 0.2s" ' +
    'onmouseenter="this.style.borderColor=\'var(--neon-purple)\'" onmouseleave="this.style.borderColor=\'var(--glass-border)\'">' +
    '<div style="font-size:2.5rem;margin-bottom:8px">&#128444;&#65039;</div>' +
    '<div style="font-size:0.875rem;font-weight:600;color:var(--text-primary);margin-bottom:4px">Tap to upload photo</div>' +
    '<div style="font-size:0.78rem;color:var(--text-muted)">From camera or files</div>' +
    '</div>' +
    '<input type="file" id="img-file" accept="image/*" style="display:none" onchange="doImgSearch(this)" />' +
    '<div id="img-preview-wrap" style="display:none;margin-bottom:16px">' +
    '<img id="img-preview" style="width:120px;height:120px;object-fit:cover;border-radius:var(--radius);border:2px solid var(--neon-purple)" />' +
    '</div>' +
    '<div id="img-results"></div>' +
    '<button class="btn btn-ghost btn-full" style="margin-top:14px" onclick="document.getElementById(\'img-search-ov\').remove()">Close</button>' +
    '</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
}

async function doImgSearch(input) {
  var file = input.files[0]; if (!file) return;
  var resultsEl = document.getElementById('img-results');
  var previewWrap = document.getElementById('img-preview-wrap');
  var previewImg = document.getElementById('img-preview');
  var dropZone = document.getElementById('img-drop');

  var reader = new FileReader();
  reader.onload = function(e) {
    if (previewImg) previewImg.src = e.target.result;
    if (previewWrap) previewWrap.style.display = 'block';
    if (dropZone) dropZone.style.display = 'none';
  };
  reader.readAsDataURL(file);

  if (resultsEl) resultsEl.innerHTML = '<div style="display:flex;align-items:center;gap:10px;color:var(--text-muted);font-size:0.85rem;justify-content:center;padding:16px"><div class="spinner" style="width:20px;height:20px;border-width:2px"></div>Finding similar products...</div>';

  var hint = file.name.toLowerCase().replace(/[^a-z]/g, ' ');
  var KEYWORDS = ['shoe','bag','dress','gown','top','blouse','earring','necklace','phone','cream','serum','watch','cap','jacket','sneaker','heel','sandal','skirt','jean'];
  var matched = KEYWORDS.filter(function(k){ return hint.indexOf(k) !== -1; });
  var categoryHint = matched[0] || '';

  var query = db.from('products').select('*').eq('in_stock', true);
  if (categoryHint) query = query.ilike('name', '%' + categoryHint + '%');
  var res = await query.limit(6);
  var data = res.data || [];
  if (!data.length) {
    var fb = await db.from('products').select('*').eq('in_stock', true).limit(6);
    data = fb.data || [];
  }

  if (resultsEl) {
    if (!data.length) {
      resultsEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No products found</p>';
    } else {
      resultsEl.innerHTML =
        '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px">Similar products:</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">' +
        data.slice(0, 4).map(function(p) {
          var img = (p.images && p.images[0]) || 'https://placehold.co/44x44/7B2EFF/fff?text=R';
          return '<div onclick="document.getElementById(\'img-search-ov\').remove();navigate(\'product\',{id:\'' + p.id + '\'})" ' +
            'style="display:flex;gap:8px;padding:8px;background:var(--glass);border:1px solid var(--glass-border);border-radius:10px;cursor:pointer;text-align:left;transition:border-color 0.2s" ' +
            'onmouseenter="this.style.borderColor=\'var(--neon-purple)\'" onmouseleave="this.style.borderColor=\'var(--glass-border)\'">' +
            '<img src="' + img + '" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0" />' +
            '<div><div style="font-size:0.78rem;font-weight:600;line-height:1.3">' + p.name + '</div>' +
            '<div style="font-size:0.75rem;color:var(--neon-cyan);font-weight:700">' + formatNaira(p.discount_price||p.price) + '</div></div>' +
            '</div>';
        }).join('') + '</div>';
    }
  }
}
