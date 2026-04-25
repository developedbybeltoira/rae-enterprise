// RAE ENTERPRISE — Home Page (fully featured)

var CATEGORIES = [
  {icon:'✨',label:'All'}, {icon:'👗',label:'Fashion'}, {icon:'💄',label:'Beauty'},
  {icon:'📱',label:'Tech'}, {icon:'🏠',label:'Home'}, {icon:'👟',label:'Shoes'},
  {icon:'💎',label:'Accessories'}, {icon:'🎁',label:'Gifts'}
];

var homeCategory = 'All';
var flashEndTime = Date.now() + 4 * 60 * 60 * 1000;
var productsOffset = 0;

async function renderHome() {
  var loggedIn = !!Store.user;
  var username = Store.profile ? Store.profile.username : '';

  document.getElementById('app').innerHTML =
    '<div class="home-page page-enter">' +

    // ── Hero ──
    '<section class="hero">' +
    '<div class="hero-content">' +
    '<div class="hero-eyebrow">🌟 Nigeria\'s Premium Shopping Destination</div>' +
    '<h1 class="hero-title">' +
    '<span class="text-gradient">Shop with</span><br/>' +
    '<em class="italic-accent text-gradient-pink">Glamour</em>' +
    '<span class="text-gradient"> & Style</span>' +
    '</h1>' +
    '<p class="hero-subtitle">Discover thousands of premium products at unbeatable prices. Earn rewards, refer friends, and unlock exclusive deals ✨</p>' +
    '<div class="hero-actions">' +
    '<button class="btn btn-primary btn-lg" onclick="document.getElementById(\'products-section\').scrollIntoView({behavior:\'smooth\'})">Shop Now 🛍️</button>' +
    (!loggedIn ? '<button class="btn btn-outline btn-lg" onclick="navigate(\'register\')">Join Free & Earn 🎁</button>' : '') +
    '</div>' +
    '<div class="hero-stats">' +
    '<div class="hero-stat"><div class="hero-stat-num text-neon-purple">10K+</div><div class="hero-stat-label">Happy Shoppers</div></div>' +
    '<div class="hero-stat"><div class="hero-stat-num text-neon-cyan">50K+</div><div class="hero-stat-label">Products</div></div>' +
    '<div class="hero-stat"><div class="hero-stat-num text-neon-pink">₦5M+</div><div class="hero-stat-label">Rewards Paid</div></div>' +
    '</div>' +
    (loggedIn ? '<div style="margin-top:20px"><span class="badge badge-purple">👋 Welcome back, '+username+'! 💜</span></div>' : '') +
    '</div></section>' +

    // ── Flash Sale Banner ──
    '<div class="flash-banner">' +
    '<div class="flash-banner-label"><span class="flash-fire">🔥</span>' +
    '<span class="text-neon-pink fw-700">FLASH SALE</span>' +
    '<span style="color:var(--text-secondary);font-size:0.85rem"> — Up to 70% OFF selected items</span></div>' +
    '<div class="countdown" id="flash-countdown"></div>' +
    '</div>' +

    // ── Marquee ──
    '<div class="marquee-wrap"><div class="marquee" id="marquee-inner"></div></div>' +

    // ── Search (mobile) ──
    '<div style="padding:16px 20px 0;display:none" id="mobile-search-bar">' +
    '<div style="position:relative">' +
    '<span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:0.9rem">🔍</span>' +
    '<input type="text" id="mob-search" class="input-field" placeholder="Search products..." style="padding-left:40px" oninput="doMobSearch(this.value)" />' +
    '</div>' +
    '<div id="mob-search-results" style="margin-top:8px"></div>' +
    '</div>' +

    // ── Categories ──
    '<section class="category-section">' +
    '<div class="container">' +
    '<h2 class="section-title text-center">Shop by <span class="text-gradient">Category</span></h2>' +
    '<p class="section-sub text-center">Find exactly what you\'re looking for 💅</p>' +
    '<div class="category-pills">' +
    CATEGORIES.map(function(c) {
      return '<div class="category-pill '+(c.label===homeCategory?'active':'')+'" onclick="filterCategory(\''+c.label+'\')">'+c.icon+' '+c.label+'</div>';
    }).join('') +
    '</div></div></section>' +

    // ── Products ──
    '<section class="products-section container" id="products-section">' +
    '<div class="flex-between mb-16">' +
    '<h2 class="section-title">'+(homeCategory==='All'?'✨ Featured Products':homeCategory+' Collection')+'</h2>' +
    '<select class="input-field" style="padding:8px 14px;width:auto" id="sort-select" onchange="loadProducts(true)">' +
    '<option value="newest">Newest</option>' +
    '<option value="price-asc">Price: Low–High</option>' +
    '<option value="price-desc">Price: High–Low</option>' +
    '<option value="discount">Best Deals</option>' +
    '</select></div>' +
    '<div class="products-grid" id="products-grid">'+productsSkeleton(8)+'</div>' +
    '<div style="text-align:center;margin-top:32px">' +
    '<button class="btn btn-outline" id="load-more-btn" onclick="loadProducts(false)">Load More ✨</button>' +
    '</div></section>' +

    // ── Referral CTA ──
    (!loggedIn ?
    '<div class="referral-cta">' +
    '<h2>🎁 Earn While You Share</h2>' +
    '<p>Refer a friend and earn up to ₦10,000 in wallet rewards when they shop!</p>' +
    '<button class="btn btn-cyan btn-lg" onclick="navigate(\'register\')">Start Earning Today ✨</button>' +
    '</div>' : '') +

    // ── Level Banner (logged in) ──
    (loggedIn ?
    '<div style="margin:0 20px 32px;padding:24px 28px;border-radius:var(--radius-lg);background:linear-gradient(135deg,rgba(123,46,255,0.15),rgba(0,245,255,0.08));border:1px solid rgba(123,46,255,0.25);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">' +
    '<div>' +
    '<div style="font-weight:700;font-size:1rem;margin-bottom:4px">'+getLevelDisplay()+'</div>' +
    '<div style="font-size:0.8rem;color:var(--text-muted)">Wallet: <span style="color:var(--neon-cyan);font-weight:700">'+formatNaira(Store.profile.wallet_balance||0)+'</span> &nbsp;|&nbsp; Referrals: <span style="color:var(--neon-purple-light);font-weight:700">'+(Store.profile.referral_count||0)+'</span></div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-ghost btn-sm" onclick="navigate(\'referrals\')">🎁 Refer Friends</button>' +
    '<button class="btn btn-outline btn-sm" onclick="navigate(\'dashboard\')">My Account</button>' +
    '</div></div>'
    : '') +

    // ── Support ──
    '<div style="text-align:center;padding:32px 24px;border-top:1px solid var(--glass-border)">' +
    '<p style="color:var(--text-muted);margin-bottom:14px">Need help? We\'re here for you 💜</p>' +
    '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
    '<a href="tel:08117706203" class="btn btn-ghost">📞 08117706203</a>' +
    '<a href="https://wa.me/2348117706203" target="_blank" class="btn btn-ghost">💬 WhatsApp</a>' +
    '</div></div>' +
    '</div>';

  // Show mobile search bar on small screens
  var mSearch = document.getElementById('mobile-search-bar');
  if (mSearch && window.innerWidth <= 768) mSearch.style.display = 'block';

  loadProducts(true);
  startCountdown();
  renderMarquee();
}

function getLevelDisplay() {
  var spent = Store.profile ? (Store.profile.total_spent || 0) : 0;
  if (spent >= 100000) return '🥇 Gold Member — You\'re amazing!';
  if (spent >= 30000)  return '🥈 Silver Member — Keep shopping!';
  return '🥉 Bronze Member — Level up by shopping more!';
}

async function loadProducts(reset) {
  if (reset) productsOffset = 0;
  var grid = document.getElementById('products-grid');
  if (!grid) return;
  if (reset) grid.innerHTML = productsSkeleton(8);

  var sort = (document.getElementById('sort-select') || {}).value || 'newest';
  var query = db.from('products').select('*').eq('in_stock', true);
  if (homeCategory !== 'All') query = query.eq('category', homeCategory);
  if (sort === 'price-asc')  query = query.order('discount_price', {ascending:true});
  else if (sort === 'price-desc') query = query.order('discount_price', {ascending:false});
  else query = query.order('created_at', {ascending:false});
  query = query.range(productsOffset, productsOffset + 11);

  var res = await query;
  var data = res.data || [];

  if (reset) grid.innerHTML = '';
  if (!data.length && reset) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px"><div style="font-size:3rem;margin-bottom:12px">🛍️</div><p style="color:var(--text-muted)">No products found yet. Check back soon!</p></div>';
    return;
  }

  data.forEach(function(p) { grid.insertAdjacentHTML('beforeend', productCardHTML(p)); });
  productsOffset += 12;
}

function productCardHTML(p) {
  var discount = getDiscount(p.price, p.discount_price);
  var img = (p.images && p.images[0]) || 'https://placehold.co/400x400/7B2EFF/fff?text=✨';
  var stars = '★★★★' + (Math.random()>0.5?'★':'☆');
  var reviews = Math.floor(20 + Math.random()*200);
  var stock = p.stock_count || 0;

  return '<div class="product-card" onclick="navigate(\'product\',{id:\''+p.id+'\'})">' +
    '<div class="product-img-wrap">' +
    '<img class="product-img" src="'+img+'" alt="'+p.name+'" loading="lazy" onerror="this.src=\'https://placehold.co/400x400/7B2EFF/fff?text=✨\'" />' +
    '<div class="product-badges">' +
    (discount>0?'<span class="badge badge-off">-'+discount+'% OFF</span>':'') +
    (stock>0&&stock<=10?'<span class="badge badge-pink">🔥 Only '+stock+' left!</span>':'') +
    (p.is_flash?'<span class="badge badge-gold">⚡ Flash</span>':'') +
    '</div>' +
    '<button class="product-wishlist" onclick="event.stopPropagation();this.textContent=this.textContent===\'🤍\'?\'❤️\':\'🤍\'">🤍</button>' +
    '<div class="product-img-overlay">' +
    '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();quickAdd(\''+p.id+'\')">+ Cart</button>' +
    '</div></div>' +
    '<div class="product-info">' +
    '<div class="product-name">'+p.name+'</div>' +
    '<div class="product-price-row">' +
    (discount>0?'<span class="price-original">'+formatNaira(p.price)+'</span>':'') +
    '<span class="price-discount">'+formatNaira(p.discount_price||p.price)+'</span>' +
    '</div>' +
    '<div class="product-rating"><span class="stars">'+stars+'</span><span class="product-rating-count">('+reviews+')</span></div>' +
    '<button class="product-add-btn" onclick="event.stopPropagation();quickAdd(\''+p.id+'\')">🛒 Add to Cart</button>' +
    '</div></div>';
}

function productsSkeleton(n) {
  var s = '';
  for (var i=0;i<n;i++) {
    s += '<div class="product-card" style="pointer-events:none">' +
    '<div class="product-img-wrap" style="background:var(--glass)"></div>' +
    '<div class="product-info">' +
    '<div style="height:14px;background:var(--glass);border-radius:4px;margin-bottom:8px"></div>' +
    '<div style="height:18px;background:var(--glass);border-radius:4px;width:60%"></div>' +
    '</div></div>';
  }
  return s;
}

async function quickAdd(productId) {
  if (!Store.user) { toast('Please sign in to add to cart 💜','warn'); navigate('login'); return; }
  var res = await db.from('products').select('*').eq('id', productId).single();
  if (res.data) Store.addToCart(res.data);
}

function filterCategory(cat) {
  homeCategory = cat;
  document.querySelectorAll('.category-pill').forEach(function(p) {
    p.classList.toggle('active', p.textContent.trim().indexOf(cat) !== -1);
  });
  // Update section title
  var t = document.querySelector('.products-section .section-title');
  if (t) t.innerHTML = cat==='All' ? '✨ Featured Products' : cat+' Collection';
  loadProducts(true);
}

function startCountdown() {
  function update() {
    var el = document.getElementById('flash-countdown');
    if (!el) return;
    var diff = flashEndTime - Date.now();
    if (diff <= 0) { el.innerHTML = '<span style="color:var(--text-muted)">Sale Ended</span>'; return; }
    var h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
    el.innerHTML =
      '<div class="countdown-unit"><span class="countdown-num">'+String(h).padStart(2,'0')+'</span><span class="countdown-label">Hrs</span></div>' +
      '<div class="countdown-unit"><span class="countdown-num">'+String(m).padStart(2,'0')+'</span><span class="countdown-label">Min</span></div>' +
      '<div class="countdown-unit"><span class="countdown-num">'+String(s).padStart(2,'0')+'</span><span class="countdown-label">Sec</span></div>';
  }
  update(); setInterval(update, 1000);
}

function renderMarquee() {
  var items = ['Free delivery on ₦20K+','✨ New arrivals daily','🔥 Flash deals every hour','💜 Earn referral rewards','🎁 Gift wrapping available','💳 Wallet payments accepted','⭐ 10K+ 5-star reviews'];
  var el = document.getElementById('marquee-inner');
  if (!el) return;
  var doubled = items.concat(items);
  el.innerHTML = doubled.map(function(i){return '<div class="marquee-item">'+i+'</div>';}).join('');
}

async function doMobSearch(q) {
  var res_el = document.getElementById('mob-search-results');
  if (!res_el) return;
  if (!q || q.length < 2) { res_el.innerHTML = ''; return; }
  var res = await db.from('products').select('id,name,price,discount_price,images').ilike('name','%'+q+'%').limit(5);
  if (!res.data || !res.data.length) { res_el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px">No results found</p>'; return; }
  res_el.innerHTML = '<div style="background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);padding:8px">' +
    res.data.map(function(p){
      return '<div class="search-item" onclick="navigate(\'product\',{id:\''+p.id+'\'})">' +
        '<img class="search-item-img" src="'+(p.images&&p.images[0]||'')+'" onerror="this.src=\'https://placehold.co/36x36/7B2EFF/fff?text=R\'" />' +
        '<div><div class="search-item-name">'+p.name+'</div><div class="search-item-price">'+formatNaira(p.discount_price||p.price)+'</div></div></div>';
    }).join('') + '</div>';
}
