// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Product Detail Page
// ═══════════════════════════════════════════════════════

let currentProductQty = 1;
let currentProduct = null;

async function renderProduct(id) {
  document.getElementById('app').innerHTML = `
    <div class="product-page container page-enter">
      <div style="padding:60px;text-align:center"><div class="spinner" style="margin:auto"></div></div>
    </div>`;

  const { data: p, error } = await db.from('products').select('*').eq('id', id).single();
  if (error || !p) { document.getElementById('app').innerHTML = '<div style="text-align:center;padding:80px;padding-top:140px"><h2>Product not found 💔</h2></div>'; return; }

  currentProduct = p;
  currentProductQty = 1;
  const discount = getDiscount(p.price, p.discount_price);
  const images = p.images?.length ? p.images : ['https://placehold.co/600x600/7B2EFF/fff?text=✨'];
  const reviews = generateFakeReviews(p.id);

  document.getElementById('app').innerHTML = `
    <div class="product-page container page-enter">
      <div class="product-breadcrumb">
        <span onclick="navigate('home')">Home</span> ›
        <span onclick="filterCategory('${p.category}')">${p.category || 'Products'}</span> ›
        <span style="color:var(--text-primary)">${p.name}</span>
      </div>

      <div class="product-detail-grid">
        <!-- Gallery -->
        <div class="product-gallery">
          <div class="product-main-img-wrap" id="main-img-wrap">
            <img class="product-main-img" id="main-product-img" src="${images[0]}" alt="${p.name}"
              onerror="this.src='https://placehold.co/600x600/7B2EFF/fff?text=✨'" />
            ${discount > 0 ? `<div style="position:absolute;top:14px;left:14px"><span class="badge badge-off">-${discount}% OFF</span></div>` : ''}
          </div>
          ${images.length > 1 ? `
            <div class="product-thumbnails">
              ${images.map((img, i) => `
                <img class="product-thumb ${i === 0 ? 'active' : ''}"
                  src="${img}" onclick="switchImg('${img}', this)"
                  onerror="this.style.display='none'" />
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Info -->
        <div class="product-detail-info">
          ${p.category ? `<span class="badge badge-purple mb-16">${p.category}</span>` : ''}
          <h1 class="product-detail-name">${p.name}</h1>

          <div class="product-detail-price-row">
            ${discount > 0 ? `<span class="price-original">${formatNaira(p.price)}</span>` : ''}
            <span class="price-big">${formatNaira(p.discount_price || p.price)}</span>
            ${discount > 0 ? `<span class="badge badge-off">Save ${formatNaira(p.price - p.discount_price)}</span>` : ''}
          </div>

          <div class="product-detail-rating">
            <span class="stars">★★★★★</span>
            <span style="font-weight:700;font-size:0.9rem">4.8</span>
            <span style="color:var(--text-muted);font-size:0.85rem">(${Math.floor(50 + Math.random() * 300)} reviews)</span>
          </div>

          ${p.stock_count <= 10 && p.stock_count > 0 ? `
            <div style="margin-bottom:16px">
              <span class="badge badge-pink">🔥 Only ${p.stock_count} left in stock!</span>
            </div>
          ` : ''}

          ${p.description ? `<p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7;margin-bottom:20px">${p.description}</p>` : ''}

          <!-- Qty -->
          <div style="margin-bottom:8px"><label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);letter-spacing:0.04em;text-transform:uppercase">Quantity</label></div>
          <div class="qty-selector">
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <div class="qty-display" id="qty-display">1</div>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>

          <!-- Actions -->
          <div class="product-actions">
            <button class="btn btn-primary btn-lg" onclick="addProductToCart()">🛒 Add to Cart</button>
            <button class="btn btn-cyan btn-lg" onclick="buyNow()">⚡ Buy Now</button>
            <button class="btn btn-ghost" onclick="toggleWishlistProduct(this)" style="width:44px;padding:0;height:44px;border-radius:50%;justify-content:center">🤍</button>
          </div>

          <!-- Tags -->
          ${p.tags?.length ? `
            <div class="product-tags">
              ${p.tags.map(t => `<span class="product-tag">#${t}</span>`).join('')}
            </div>
          ` : ''}

          <!-- Guarantees -->
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px">
            ${['🚚 Fast Delivery across Nigeria', '🔒 Secure Payment', '✅ Quality Guaranteed', '↩️ Easy Returns'].map(g => `
              <div style="display:flex;align-items:center;gap:10px;font-size:0.85rem;color:var(--text-secondary)">
                ${g}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Reviews -->
      <div class="reviews-section">
        <h2 class="section-title mb-16">Customer Reviews <span class="text-gradient">(${reviews.length})</span></h2>
        <div id="reviews-list">
          ${reviews.map(r => `
            <div class="review-card">
              <div class="review-header">
                <div>
                  <div class="review-author">${r.name}</div>
                  <div class="stars" style="font-size:0.85rem">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
                </div>
                <span class="review-date">${r.date}</span>
              </div>
              <p class="review-text">${r.text}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Related Products -->
      <div class="related-section">
        <h2 class="section-title mb-16">You May Also Like 💜</h2>
        <div class="products-grid" id="related-grid">
          <div style="text-align:center;padding:40px;color:var(--text-muted)">Loading...</div>
        </div>
      </div>
    </div>
  `;

  loadRelatedProducts(p.category, p.id);
}

function switchImg(src, thumb) {
  document.getElementById('main-product-img').src = src;
  document.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function changeQty(delta) {
  currentProductQty = Math.max(1, currentProductQty + delta);
  document.getElementById('qty-display').textContent = currentProductQty;
}

function addProductToCart() {
  if (!Store.user) { toast('Sign in to add to cart 💜', 'warn'); navigate('login'); return; }
  if (!currentProduct) return;
  for (let i = 0; i < currentProductQty; i++) Store.addToCart(currentProduct);
}

function buyNow() {
  addProductToCart();
  navigate('cart');
}

function toggleWishlistProduct(btn) {
  btn.textContent = btn.textContent === '🤍' ? '❤️' : '🤍';
}

async function loadRelatedProducts(category, excludeId) {
  const { data } = await db.from('products').select('*')
    .eq('category', category).neq('id', excludeId).limit(4);
  const grid = document.getElementById('related-grid');
  if (!grid) return;
  if (!data?.length) { grid.innerHTML = '<div style="color:var(--text-muted)">No related products</div>'; return; }
  grid.innerHTML = data.map(p => productCardHTML(p)).join('');
}

function generateFakeReviews(seed) {
  const names = ['Chioma A.', 'Fatima B.', 'Grace O.', 'Adaeze N.', 'Blessing K.', 'Ngozi P.', 'Amina S.', 'Joy E.'];
  const texts = [
    'Absolutely love this product! Exactly as described and arrived quickly 🥰',
    'Great quality! My friends keep asking where I got it.',
    'Perfect! Will definitely order again. Packaging was so cute 💜',
    'Exceeded my expectations. The quality is amazing for the price.',
    'Super fast delivery! Product is stunning, highly recommend!',
    'Love it! Bought 2 extra for my sisters. 10/10!',
  ];
  const rand = (arr) => arr[Math.floor(arr.length * 0.5)];
  return Array.from({length: 5}, (_, i) => ({
    name: names[i % names.length],
    rating: 4 + (i % 2),
    text: texts[i % texts.length],
    date: formatDate(new Date(Date.now() - i * 5 * 24 * 3600000).toISOString()),
  }));
}
