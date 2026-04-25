// RAE ENTERPRISE — Product Page

var currentProduct = null;
var currentQty = 1;
var currentSize = '';
var galleryIndex = 0;
var touchStartX = 0;

async function renderProduct(id) {
  document.getElementById('app').innerHTML =
    '<div class="product-page container page-enter" style="display:flex;align-items:center;justify-content:center;min-height:60vh">' +
    '<div class="spinner" style="margin:auto"></div></div>';

  var res = await db.from('products').select('*').eq('id', id).single();
  if (res.error || !res.data) {
    document.getElementById('app').innerHTML =
      '<div style="text-align:center;padding:80px 20px;padding-top:140px">' +
      '<h2>Product not found \ud83d\udc94</h2>' +
      '<button class="btn btn-primary" onclick="navigate(\'home\')" style="margin-top:16px">Go Home</button></div>';
    return;
  }

  var p = res.data;
  currentProduct = p; currentQty = 1; currentSize = ''; galleryIndex = 0;
  var images = (p.images && p.images.length) ? p.images : ['https://placehold.co/600x600/7B2EFF/fff?text=\u2728'];
  var discount = getDiscount(p.price, p.discount_price);
  var reviews = fakeReviews(p.id);
  var isClothing = ['Fashion','Accessories','Gifts','Kids','Sports','Clothing'].indexOf(p.category) !== -1;
  var isShoes = p.category === 'Shoes';
  var clothingSizes = p.sizes || ['S','M','L','XL','XXL'];
  var shoeSizes = p.shoe_sizes || ['39','40','41','42','43','44','45'];
  var inStock = p.in_stock !== false && (p.stock_count === null || p.stock_count === undefined || p.stock_count > 0);

  // Track view for recommendations
  try {
    var viewed = JSON.parse(localStorage.getItem('rae_viewed') || '[]');
    if (viewed.indexOf(id) === -1) { viewed.unshift(id); }
    localStorage.setItem('rae_viewed', JSON.stringify(viewed.slice(0, 20)));
  } catch(e) {}

  document.getElementById('app').innerHTML =
    '<div class="product-page container page-enter">' +

    '<div class="product-breadcrumb">' +
    '<span onclick="navigate(\'home\')" style="cursor:pointer">Home</span> \u203a ' +
    '<span style="color:var(--text-primary)">' + (p.category || 'Product') + '</span>' +
    '</div>' +

    '<div class="product-detail-grid">' +

    // Gallery
    '<div class="product-gallery">' +
    '<div class="product-main-img-wrap" id="gallery-wrap" ' +
    'ontouchstart="touchStart(event)" ontouchend="touchEnd(event)" style="position:relative;overflow:hidden;border-radius:var(--radius);aspect-ratio:1;background:var(--glass);border:1px solid var(--glass-border);cursor:zoom-in">' +
    '<img class="product-main-img" id="main-img" src="' + images[0] + '" alt="' + p.name + '" ' +
    'style="width:100%;height:100%;object-fit:cover;transition:opacity 0.25s,transform 0.4s" ' +
    'onerror="this.src=\'https://placehold.co/600x600/7B2EFF/fff?text=\u2728\'" />' +
    (discount > 0 ? '<div style="position:absolute;top:12px;left:12px"><span class="badge badge-off">-' + discount + '% OFF</span></div>' : '') +
    (!inStock ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span class="badge badge-pink" style="font-size:1rem;padding:10px 20px">Out of Stock</span></div>' : '') +
    (images.length > 1 ?
      '<button onclick="prevImg()" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.55);border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;backdrop-filter:blur(8px)">\u2039</button>' +
      '<button onclick="nextImg()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.55);border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;backdrop-filter:blur(8px)">\u203a</button>'
    : '') +
    (images.length > 1 ?
      '<div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px" id="img-dots">' +
      images.map(function(_, i) {
        var dotColor = i === 0 ? '#7B2EFF' : 'rgba(255,255,255,0.4)';
        return '<div onclick="goImg(' + i + ')" style="width:8px;height:8px;border-radius:50%;background:' + dotColor + ';cursor:pointer;transition:all 0.25s"></div>';
      }).join('') +
      '</div>'
    : '') +
    '</div>' +
    (images.length > 1 ?
      '<div class="product-thumbnails" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      images.map(function(img, i) {
        return '<img class="product-thumb' + (i === 0 ? ' active' : '') + '" id="thumb-' + i + '" src="' + img + '" ' +
          'onclick="goImg(' + i + ')" style="width:64px;height:64px;border-radius:10px;object-fit:cover;cursor:pointer;border:2px solid ' + (i === 0 ? 'var(--neon-purple)' : 'var(--glass-border)') + ';transition:all 0.2s" ' +
          'onerror="this.style.display=\'none\'" />';
      }).join('') +
      '</div>'
    : '') +
    '</div>' +

    // Info
    '<div class="product-detail-info">' +
    (p.category ? '<span class="badge badge-purple" style="margin-bottom:12px;display:inline-block">' + p.category + '</span>' : '') +
    '<h1 class="product-detail-name">' + p.name + '</h1>' +

    '<div class="product-detail-price-row">' +
    (discount > 0 ? '<span class="price-original">' + formatNaira(p.price) + '</span>' : '') +
    '<span class="price-big">' + formatNaira(p.discount_price || p.price) + '</span>' +
    (discount > 0 ? '<span class="badge badge-off">Save ' + formatNaira(p.price - (p.discount_price || 0)) + '</span>' : '') +
    '</div>' +

    '<div class="product-detail-rating" style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
    '<span class="stars">\u2605\u2605\u2605\u2605\u2605</span>' +
    '<span style="font-weight:700;font-size:0.9rem">4.8</span>' +
    '<span style="color:var(--text-muted);font-size:0.85rem">(' + (Math.floor(50 + (p.id.charCodeAt(0) * 3) % 250)) + ' reviews)</span>' +
    '</div>' +

    (inStock && p.stock_count > 0 && p.stock_count <= 10 ?
      '<div style="margin-bottom:14px"><span class="badge badge-pink">\ud83d\udd25 Only ' + p.stock_count + ' left!</span></div>' : '') +

    (p.description ? '<p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7;margin-bottom:18px">' + p.description + '</p>' : '') +

    // Sizes
    (isClothing ?
      '<div style="margin-bottom:18px">' +
      '<div style="font-size:0.8rem;font-weight:700;color:var(--text-secondary);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:10px">Select Size</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      clothingSizes.map(function(s) {
        return '<button class="size-btn" id="sz-' + s + '" onclick="selectSize(\'' + s + '\')" ' +
          'style="padding:8px 16px;border-radius:10px;background:var(--glass);border:1.5px solid var(--glass-border);color:var(--text-primary);cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.2s;font-family:var(--font-body)">' + s + '</button>';
      }).join('') +
      '</div></div>'
    : '') +

    (isShoes ?
      '<div style="margin-bottom:18px">' +
      '<div style="font-size:0.8rem;font-weight:700;color:var(--text-secondary);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:10px">Select Shoe Size (EU)</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      shoeSizes.map(function(s) {
        return '<button class="size-btn" id="sz-' + s + '" onclick="selectSize(\'' + s + '\')" ' +
          'style="padding:8px 14px;border-radius:10px;background:var(--glass);border:1.5px solid var(--glass-border);color:var(--text-primary);cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.2s;font-family:var(--font-body)">' + s + '</button>';
      }).join('') +
      '</div></div>'
    : '') +

    // Qty (only when in stock)
    (inStock ?
      '<div style="margin-bottom:8px;font-size:0.8rem;font-weight:700;color:var(--text-secondary);letter-spacing:0.05em;text-transform:uppercase">Quantity</div>' +
      '<div class="qty-selector" style="margin-bottom:18px">' +
      '<button class="qty-btn" onclick="changeQty(-1)">\u2212</button>' +
      '<div class="qty-display" id="qty-d">1</div>' +
      '<button class="qty-btn" onclick="changeQty(1)">+</button>' +
      '</div>'
    : '') +

    // Action buttons
    '<div class="product-actions">' +
    (inStock ?
      '<button class="btn btn-primary btn-lg" onclick="addToCartProduct()">\ud83d\uded2 Add to Cart</button>' +
      '<button class="btn btn-cyan btn-lg" onclick="buyNow()">\u26a1 Buy Now</button>'
    :
      '<button class="btn btn-outline btn-lg" onclick="requestItem(\'' + p.id + '\',\'' + p.name.replace(/'/g,'') + '\')">\ud83d\udce3 Request Item</button>' +
      '<div id="req-status-' + p.id + '" style="margin-top:8px"></div>'
    ) +
    '<button class="btn btn-ghost" style="width:44px;height:44px;border-radius:50%;padding:0;justify-content:center;display:flex" onclick="this.textContent=this.textContent===\'\ud83e\udd0d\'?\'\u2764\ufe0f\':\'\ud83e\udd0d\'">\ud83e\udd0d</button>' +
    '</div>' +

    '<div style="display:flex;flex-direction:column;gap:10px;margin-top:18px">' +
    ['\ud83d\ude9a Free delivery on orders \u20a620K+','\ud83d\udd12 Secure payment via OPay','\u2705 Quality guaranteed or refund','\ud83d\udcde Support: 08117706203'].map(function(g) {
      return '<div style="display:flex;align-items:center;gap:10px;font-size:0.84rem;color:var(--text-secondary)">' + g + '</div>';
    }).join('') +
    '</div></div></div>' +

    // Reviews
    '<div class="reviews-section">' +
    '<h2 class="section-title" style="margin-bottom:16px">Customer Reviews <span class="text-gradient">(' + reviews.length + ')</span></h2>' +
    reviews.map(function(r) {
      return '<div class="review-card">' +
        '<div class="review-header">' +
        '<div><div class="review-author">' + r.name + '</div>' +
        '<div class="stars" style="font-size:0.85rem">' + '\u2605'.repeat(r.rating) + '\u2606'.repeat(5 - r.rating) + '</div></div>' +
        '<span class="review-date">' + r.date + '</span></div>' +
        '<p class="review-text">' + r.text + '</p></div>';
    }).join('') +
    '</div>' +

    // Related
    '<div class="related-section">' +
    '<h2 class="section-title" style="margin-bottom:16px">You May Also Like \ud83d\udc9c</h2>' +
    '<div class="products-grid" id="related-grid"><div style="color:var(--text-muted);padding:20px">Loading...</div></div>' +
    '</div></div>';

  loadRelated(p.category, p.id);
}

function goImg(i) {
  var p = currentProduct;
  if (!p || !p.images || !p.images.length) return;
  galleryIndex = Math.max(0, Math.min(i, p.images.length - 1));
  var main = document.getElementById('main-img');
  if (main) { main.style.opacity = '0'; setTimeout(function() { main.src = p.images[galleryIndex]; main.style.opacity = '1'; }, 150); }
  document.querySelectorAll('.product-thumb').forEach(function(t, idx) {
    t.style.borderColor = idx === galleryIndex ? 'var(--neon-purple)' : 'var(--glass-border)';
  });
  var dots = document.querySelectorAll('#img-dots div');
  dots.forEach(function(d, idx) { d.style.background = idx === galleryIndex ? '#7B2EFF' : 'rgba(255,255,255,0.4)'; });
}
function nextImg() { if (!currentProduct || !currentProduct.images) return; goImg(galleryIndex + 1 >= currentProduct.images.length ? 0 : galleryIndex + 1); }
function prevImg() { if (!currentProduct || !currentProduct.images) return; goImg(galleryIndex - 1 < 0 ? currentProduct.images.length - 1 : galleryIndex - 1); }
function touchStart(e) { touchStartX = e.changedTouches[0].screenX; }
function touchEnd(e) { var diff = touchStartX - e.changedTouches[0].screenX; if (Math.abs(diff) > 40) { diff > 0 ? nextImg() : prevImg(); } }

function selectSize(s) {
  currentSize = s;
  document.querySelectorAll('.size-btn').forEach(function(b) {
    var isActive = b.id === 'sz-' + s;
    b.style.borderColor = isActive ? '#7B2EFF' : 'var(--glass-border)';
    b.style.background  = isActive ? 'rgba(123,46,255,0.2)' : 'var(--glass)';
    b.style.color       = isActive ? '#9D5FFF' : 'var(--text-primary)';
    b.style.boxShadow   = isActive ? '0 0 14px rgba(123,46,255,0.4)' : 'none';
    b.style.transform   = isActive ? 'scale(1.05)' : 'scale(1)';
  });
}

function changeQty(d) {
  currentQty = Math.max(1, currentQty + d);
  var el = document.getElementById('qty-d'); if (el) el.textContent = currentQty;
}

function addToCartProduct() {
  if (!Store.user) { toast('Please sign in to add to cart \ud83d\udc9c', 'warn'); navigate('login'); return; }
  if (!currentProduct) return;
  var needsSize = currentProduct.category === 'Fashion' || currentProduct.category === 'Shoes' ||
    currentProduct.category === 'Accessories' || currentProduct.category === 'Clothing' || currentProduct.category === 'Kids';
  if (needsSize && !currentSize) { toast('Please select a size first \ud83d\udc94', 'warn'); return; }
  var item = {};
  for (var k in currentProduct) item[k] = currentProduct[k];
  if (currentSize) item.selected_size = currentSize;
  for (var i = 0; i < currentQty; i++) Store.addToCart(item);
}

function buyNow() { addToCartProduct(); if (Store.cart && Store.cart.length) navigate('cart'); }

async function requestItem(productId, productName) {
  if (!Store.user) { toast('Please sign in to request items \ud83d\udc9c', 'warn'); navigate('login'); return; }
  var btn = event.target;
  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    var existing = await db.from('item_requests').select('id,count').eq('product_id', productId).eq('user_id', Store.user.id).single();
    if (existing.data) {
      await db.from('item_requests').update({ count: (existing.data.count || 1) + 1, updated_at: new Date().toISOString() }).eq('id', existing.data.id);
    } else {
      await db.from('item_requests').insert({
        product_id: productId, product_name: productName,
        user_id: Store.user.id, username: (Store.profile && Store.profile.username) || 'Unknown',
        count: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      });
    }
    btn.textContent = '\u2705 Requested!';
    btn.style.background = 'rgba(0,245,255,0.1)';
    btn.style.borderColor = 'var(--neon-cyan)';
    btn.style.color = 'var(--neon-cyan)';
    toast('Request sent! We\'ll notify you when it\'s back in stock \ud83d\udc9c');
  } catch(e) {
    btn.disabled = false; btn.textContent = '\ud83d\udce3 Request Item';
    toast('Error sending request. Try again \ud83d\udc94', 'error');
  }
}

async function loadRelated(category, excludeId) {
  var res = await db.from('products').select('*').eq('category', category).neq('id', excludeId).limit(4);
  var grid = document.getElementById('related-grid'); if (!grid) return;
  if (!res.data || !res.data.length) { grid.innerHTML = '<div style="color:var(--text-muted)">No related products</div>'; return; }
  grid.innerHTML = res.data.map(function(p) { return productCardHTML(p); }).join('');
}

function fakeReviews(seed) {
  var names = ['Chioma A.','Fatima B.','Grace O.','Adaeze N.','Blessing K.','Ngozi P.','Amina S.','Joy E.','Temi R.'];
  var texts = [
    'Absolutely love this! Exactly as described and arrived quickly \ud83e\udd70',
    'Great quality! My friends keep asking where I got it.',
    'Perfect! Will definitely order again. Packaging was so cute \ud83d\udc9c',
    'Exceeded my expectations. The quality is amazing for the price.',
    'Super fast delivery! Product is stunning, highly recommend!',
    'Love it! Bought 2 extra for my sisters. 10/10!',
    'Beautiful product, exactly what I needed. Rae Enterprise never disappoints! \u2728',
  ];
  return [0,1,2,3,4].map(function(i) {
    return { name: names[i % names.length], rating: 4 + (i % 2), text: texts[i % texts.length], date: formatDate(new Date(Date.now() - i * 5 * 86400000).toISOString()) };
  });
}
