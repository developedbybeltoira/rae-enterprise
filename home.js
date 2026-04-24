// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Home Page
// ═══════════════════════════════════════════════════════

const CATEGORIES = [
  { icon: '✨', label: 'All' },
  { icon: '👗', label: 'Fashion' },
  { icon: '💄', label: 'Beauty' },
  { icon: '📱', label: 'Tech' },
  { icon: '🏠', label: 'Home' },
  { icon: '👟', label: 'Shoes' },
  { icon: '💎', label: 'Accessories' },
  { icon: '🎁', label: 'Gifts' },
];

let homeCategory = 'All';
let flashEndTime = Date.now() + 4 * 60 * 60 * 1000; // 4 hours from now

async function renderHome() {
  document.getElementById('app').innerHTML = `
    <div class="home-page page-enter">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-eyebrow">🌟 Nigeria's Premium Shopping Destination</div>
          <h1 class="hero-title">
            <span class="text-gradient">Shop with</span><br/>
            <em class="italic-accent text-gradient-pink">Glamour</em>
            <span class="text-gradient"> & Style</span>
          </h1>
          <p class="hero-subtitle">Discover thousands of premium products at unbeatable prices. Earn rewards, refer friends, and unlock exclusive deals ✨</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" onclick="document.getElementById('products-section').scrollIntoView({behavior:'smooth'})">
              Shop Now 🛍️
            </button>
            ${!Store.user ? `<button class="btn btn-outline btn-lg" onclick="navigate('register')">Join Free & Earn</button>` : ''}
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-num text-neon-purple">10K+</div>
              <div class="hero-stat-label">Happy Shoppers</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-num text-neon-cyan">50K+</div>
              <div class="hero-stat-label">Products</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-num text-neon-pink">₦5M+</div>
              <div class="hero-stat-label">Rewards Paid</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Flash Sale Banner -->
      <div class="flash-banner">
        <div class="flash-banner-label">
          <span class="flash-fire">🔥</span>
          <span class="text-neon-pink fw-700">FLASH SALE</span>
          <span style="color:var(--text-secondary);font-size:0.85rem">— Up to 70% OFF selected items</span>
        </div>
        <div class="countdown" id="flash-countdown"></div>
      </div>

      <!-- Marquee -->
      <div class="marquee-wrap">
        <div class="marquee" id="marquee-inner"></div>
      </div>

      <!-- Categories -->
      <section class="category-section">
        <div class="container">
          <h2 class="section-title text-center">Shop by <span class="text-gradient">Category</span></h2>
          <p class="section-sub text-center">Find exactly what you're looking for 💅</p>
          <div class="category-pills">
            ${CATEGORIES.map(c => `
              <div class="category-pill ${c.label === homeCategory ? 'active' : ''}"
                onclick="filterCategory('${c.label}')">
                ${c.icon} ${c.label}
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Products -->
      <section class="products-section container" id="products-section">
        <div class="flex-between mb-16">
          <div>
            <h2 class="section-title">
              ${homeCategory === 'All' ? '✨ Featured Products' : homeCategory + ' Collection'}
            </h2>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <select class="input-field" style="padding:8px 14px;width:auto" id="sort-select" onchange="sortProducts(this.value)">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low-High</option>
              <option value="price-desc">Price: High-Low</option>
              <option value="discount">Best Deals</option>
            </select>
          </div>
        </div>
        <div class="products-grid" id="products-grid">
          ${productsSkeleton(8)}
        </div>
        <div style="text-align:center;margin-top:32px">
          <button class="btn btn-outline" id="load-more-btn" onclick="loadMoreProducts()">
            Load More Products
          </button>
        </div>
      </section>

      <!-- Referral CTA -->
      ${Store.user ? '' : `
        <div class="referral-cta">
          <h2>🎁 Earn While You Share</h2>
          <p>Refer a friend and earn up to ₦10,000 in wallet rewards when they shop!</p>
          <button class="btn btn-cyan btn-lg" onclick="navigate('register')">Start Earning Today ✨</button>
        </div>
      `}

      <!-- Support Widget -->
      <div style="text-align:center;padding:40px 24px;border-top:1px solid var(--glass-border)">
        <p style="color:var(--text-muted);margin-bottom:16px">Need help? We're here for you 💜</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a href="tel:08117706203" class="btn btn-ghost">📞 Call Us</a>
          <a href="https://wa.me/2348117706203" target="_blank" class="btn btn-ghost">💬 WhatsApp</a>
        </div>
      </div>
    </div>
  `;

  loadProducts();
  startCountdown();
  renderMarquee();
}

let productsOffset = 0;
let allProducts = [];

async function loadProducts(reset = true) {
  if (reset) { productsOffset = 0; }
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let query = db.from('products').select('*').eq('in_stock', true);
  if (homeCategory !== 'All') query = query.eq('category', homeCategory);

  const sort = document.getElementById('sort-select')?.value || 'newest';
  if (sort === 'price-asc') query = query.order('discount_price', { ascending: true });
  else if (sort === 'price-desc') query = query.order('discount_price', { ascending: false });
  else if (sort === 'discount') query = query.order('discount_price', { ascending: true });
  else query = query.order('created_at', { ascending: false });

  query = query.range(productsOffset, productsOffset + 11);

  const { data, error } = await query;
  if (error) { console.error(error); return; }

  if (reset) { allProducts = data || []; grid.innerHTML = ''; }
  else { allProducts = [...allProducts, ...(data || [])]; }

  if (!allProducts.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px">
      <div style="font-size:3rem;margin-bottom:12px">🛍️</div>
      <p style="color:var(--text-muted)">No products found. Check back soon!</p>
    </div>`;
    return;
  }

  if (reset) grid.innerHTML = '';
  allProducts.slice(reset ? 0 : productsOffset).forEach(p => {
    grid.insertAdjacentHTML('beforeend', productCardHTML(p));
  });

  productsOffset += 12;
}

function productCardHTML(p) {
  const discount = getDiscount(p.price, p.discount_price);
  const imgSrc = p.images?.[0] || 'https://placehold.co/400x400/7B2EFF/fff?text=✨';
  const rating = (3.8 + Math.random() * 1.2).toFixed(1);
  const reviews = Math.floor(20 + Math.random() * 200);
  const stock = p.stock_count;
  const isLow = stock > 0 && stock <= 10;

  return `
    <div class="product-card" onclick="navigate('product', {id:'${p.id}'})">
      <div class="product-img-wrap">
        <img class="product-img" src="${imgSrc}" alt="${p.name}" loading="lazy"
          onerror="this.src='https://placehold.co/400x400/7B2EFF/fff?text=✨'" />
        <div class="product-badges">
          ${discount > 0 ? `<span class="badge badge-off">-${discount}% OFF</span>` : ''}
          ${isLow ? `<span class="badge badge-pink">🔥 Only ${stock} left!</span>` : ''}
          ${p.is_flash ? `<span class="badge badge-gold">⚡ Flash</span>` : ''}
        </div>
        <button class="product-wishlist" onclick="event.stopPropagation();toggleWishlist(this, '${p.id}')">🤍</button>
        <div class="product-img-overlay">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();quickAdd('${p.id}')">
            + Add to Cart
          </button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price-row">
          ${discount > 0 ? `<span class="price-original">${formatNaira(p.price)}</span>` : ''}
          <span class="price-discount">${formatNaira(p.discount_price || p.price)}</span>
        </div>
        <div class="product-rating">
          <span class="stars">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</span>
          <span class="product-rating-count">(${reviews})</span>
        </div>
        <button class="product-add-btn" onclick="event.stopPropagation();quickAdd('${p.id}')">
          🛒 Add to Cart
        </button>
      </div>
    </div>
  `;
}

function productsSkeleton(n) {
  return Array(n).fill(`
    <div class="product-card" style="pointer-events:none">
      <div class="product-img-wrap" style="background:var(--glass);animation:pulse 1.5s ease infinite alternate">
      </div>
      <div class="product-info">
        <div style="height:14px;background:var(--glass);border-radius:4px;margin-bottom:8px;animation:pulse 1.5s ease infinite alternate"></div>
        <div style="height:18px;background:var(--glass);border-radius:4px;width:60%;animation:pulse 1.5s ease infinite alternate"></div>
      </div>
    </div>
  `).join('');
}

async function quickAdd(productId) {
  if (!Store.user) { toast('Please sign in to add to cart 💜', 'warn'); navigate('login'); return; }
  const { data } = await db.from('products').select('*').eq('id', productId).single();
  if (data) Store.addToCart(data);
}

function toggleWishlist(btn, id) {
  btn.textContent = btn.textContent === '🤍' ? '❤️' : '🤍';
}

function filterCategory(cat) {
  homeCategory = cat;
  document.querySelectorAll('.category-pill').forEach(p => {
    p.classList.toggle('active', p.textContent.trim().includes(cat));
  });
  loadProducts(true);
}

function sortProducts(val) { loadProducts(true); }

function loadMoreProducts() { loadProducts(false); }

function startCountdown() {
  function update() {
    const el = document.getElementById('flash-countdown');
    if (!el) return;
    const diff = flashEndTime - Date.now();
    if (diff <= 0) { el.innerHTML = '<span style="color:var(--text-muted)">Sale Ended</span>'; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `
      <div class="countdown-unit"><span class="countdown-num">${String(h).padStart(2,'0')}</span><span class="countdown-label">Hrs</span></div>
      <div class="countdown-unit"><span class="countdown-num">${String(m).padStart(2,'0')}</span><span class="countdown-label">Min</span></div>
      <div class="countdown-unit"><span class="countdown-num">${String(s).padStart(2,'0')}</span><span class="countdown-label">Sec</span></div>
    `;
  }
  update();
  setInterval(update, 1000);
}

function renderMarquee() {
  const items = ['Free delivery on ₦20K+', '✨ New arrivals daily', '🔥 Flash deals every hour',
    '💜 Earn referral rewards', '🎁 Gift wrapping available', '💳 Buy now pay later', '⭐ 10K+ 5-star reviews'];
  const el = document.getElementById('marquee-inner');
  if (!el) return;
  const doubled = [...items, ...items];
  el.innerHTML = doubled.map(i => `<div class="marquee-item">${i}</div>`).join('');
}
