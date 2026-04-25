// RAE ENTERPRISE — Admin Panel
// Admin login: Chinedu / Jopoboy2010.

var ADMIN_USERNAME = 'Chinedu';
var ADMIN_PASSWORD = 'Jopoboy2010.';
var adminTab = 'orders';

var DEFAULT_CATEGORIES = ['Fashion','Beauty','Tech','Home','Shoes','Accessories','Gifts','Jewelry','Kids','Sports','Electronics','Food','Books','Art','Music'];

async function renderAdmin() {
  // Check hardcoded admin OR profile role
  var isHardAdmin = Store.profile && Store.profile.username === ADMIN_USERNAME;
  var isRoleAdmin = Store.isAdmin();
  if (!isHardAdmin && !isRoleAdmin) {
    // Show admin login
    renderAdminLogin(); return;
  }

  document.getElementById('app').innerHTML =
    '<div class="admin-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">' +
    '<h1 class="section-title">⚙️ Admin Panel</h1><span class="badge badge-pink">Admin</span>' +
    '</div>' +
    '<div class="admin-tabs">' +
    ['orders','products','users','add-product','categories','requests'].map(function(t){
      var labels={orders:'📦 Orders',products:'🛍️ Products',users:'👥 Users','add-product':'➕ Add Product',categories:'🏷️ Categories',requests:'📣 Requests'};
      return '<button class="admin-tab '+(adminTab===t?'active':'')+'" onclick="switchAdminTab(\''+t+'\')">'+labels[t]+'</button>';
    }).join('') +
    '</div>' +
    '<div id="admin-content"><div style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></div></div>' +
    '</div>';

  loadAdminTab(adminTab);
}

function renderAdminLogin() {
  document.getElementById('app').innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;padding-top:80px">' +
    '<div class="auth-card glow-border" style="max-width:380px;width:100%">' +
    '<div style="text-align:center;margin-bottom:24px">' +
    '<div style="font-size:2.5rem;margin-bottom:8px">⚙️</div>' +
    '<h2 class="text-gradient" style="font-family:var(--font-display)">Admin Access</h2>' +
    '</div>' +
    '<div class="input-group"><label>Username</label>' +
    '<input class="input-field" type="text" id="adm-user" placeholder="Admin username" /></div>' +
    '<div class="input-group"><label>Password</label>' +
    '<input class="input-field" type="password" id="adm-pw" placeholder="Admin password" /></div>' +
    '<button class="btn btn-primary btn-full" onclick="checkAdminLogin()" style="margin-top:8px">Enter Admin Panel ⚙️</button>' +
    '<div style="text-align:center;margin-top:16px">' +
    '<button class="btn btn-ghost btn-sm" onclick="navigate(\'home\')">← Back to Store</button>' +
    '</div></div></div>';
}

function checkAdminLogin() {
  var u = (document.getElementById('adm-user').value||'').trim();
  var p = (document.getElementById('adm-pw').value||'').trim();
  if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
    // Grant temp admin session
    if (Store.profile) Store.profile.role = 'admin';
    toast('Welcome, Admin Chinedu! 💜');
    renderAdmin();
  } else {
    toast('Wrong credentials 💔', 'error');
  }
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(function(t,i){
    var tabs=['orders','products','users','add-product','categories'];
    t.classList.toggle('active', tabs[i]===tab);
  });
  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  var c = document.getElementById('admin-content'); if(!c) return;
  if (tab==='orders') await renderAdminOrders(c);
  else if (tab==='products') await renderAdminProducts(c);
  else if (tab==='users') await renderAdminUsers(c);
  else if (tab==='add-product') renderAddProductForm(c, null);
  else if (tab==='categories') renderCategoriesTab(c);
  else if (tab==='requests') renderAdminRequests(c);
}

// ── Orders ──
async function renderAdminOrders(c) {
  var res = await db.from('orders').select('*').order('created_at',{ascending:false}).limit(50);
  var orders = res.data || [];
  var STEPS = ['awaiting_approval','approved','processing','shipped','delivered'];

  c.innerHTML = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Order ID</th><th>Name</th><th>Amount</th><th>Size</th><th>Date</th><th>Status</th><th>Actions</th>' +
    '</tr></thead><tbody>' +
    (orders.length ? orders.map(function(o){
      var items = o.items || [];
      var sizes = items.map(function(i){return i.selected_size||'—';}).filter(function(s){return s!=='—';}).join(', ') || '—';
      return '<tr>' +
        '<td style="font-family:monospace;color:var(--neon-purple-light);font-size:0.78rem">'+o.id+'</td>' +
        '<td><div style="font-weight:600">'+(o.full_name||'—')+'</div><div style="font-size:0.75rem;color:var(--text-muted)">'+(o.phone||'')+'</div></td>' +
        '<td class="text-neon-cyan fw-700">'+formatNaira(o.total_amount)+'</td>' +
        '<td style="font-size:0.82rem">'+(sizes)+'</td>' +
        '<td style="font-size:0.78rem;color:var(--text-muted)">'+formatDate(o.created_at)+'</td>' +
        '<td><select class="status-select" onchange="updateOrderStatus(\''+o.id+'\',this.value)">' +
        STEPS.map(function(s){return '<option value="'+s+'"'+(o.status===s?' selected':'')+'>'+s.replace(/_/g,' ')+'</option>';}).join('') +
        '</select></td>' +
        '<td><div style="display:flex;gap:6px;flex-wrap:wrap">' +
        (o.proof_url?'<a href="'+o.proof_url+'" target="_blank" class="btn btn-ghost btn-sm">📷</a>':'') +
        (o.status==='approved'?'<button class="btn btn-outline btn-sm" onclick="showInvoice(\''+o.id+'\')">🧾 Invoice</button>':'') +
        '</div></td></tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet</td></tr>') +
    '</tbody></table></div>';
}

async function updateOrderStatus(orderId, status) {
  await db.from('orders').update({status:status}).eq('id',orderId);
  toast('Order updated to: '+status+' ✨');
  // Notify user
  var res = await db.from('orders').select('user_id').eq('id',orderId).single();
  if (res.data) {
    await db.from('notifications').insert({user_id:res.data.user_id,message:'Your order '+orderId+' is now: '+status.replace(/_/g,' ')+' 📦',type:'order_update',created_at:new Date().toISOString()});
  }
  loadAdminTab('orders');
}

// ── Invoice generator ──
async function showInvoice(orderId) {
  var res = await db.from('orders').select('*').eq('id',orderId).single();
  if (!res.data) { toast('Order not found','error'); return; }
  var o = res.data;
  var items = o.items || [];

  var overlay = document.createElement('div');
  overlay.className = 'overlay'; overlay.id = 'inv-overlay';
  overlay.innerHTML =
    '<div class="modal" style="max-width:500px;font-family:var(--font-body)">' +
    '<div style="text-align:center;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--glass-border)">' +
    '<div style="font-family:var(--font-script);font-size:2rem;background:linear-gradient(135deg,#7B2EFF,#00F5FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Rae Enterprise</div>' +
    '<div style="font-size:0.8rem;color:var(--text-muted)">Premium Shopping — Nigeria\'s Finest</div>' +
    '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">📞 08117706203</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:0.85rem">' +
    '<div><strong>Invoice #</strong> '+o.id+'</div>' +
    '<div><strong>Date:</strong> '+formatDate(o.created_at)+'</div>' +
    '</div>' +
    '<div style="background:var(--glass);border-radius:12px;padding:14px;margin-bottom:16px;font-size:0.85rem">' +
    '<strong>Customer:</strong> '+(o.full_name||'—')+'<br>' +
    '<strong>Phone:</strong> '+(o.phone||'—')+'<br>' +
    '<strong>Address:</strong> '+(o.address||'—') +
    '</div>' +
    '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;margin-bottom:16px">' +
    '<thead><tr style="border-bottom:1px solid var(--glass-border)">' +
    '<th style="text-align:left;padding:8px 4px;color:var(--text-muted)">Product</th>' +
    '<th style="text-align:center;padding:8px 4px;color:var(--text-muted)">Size</th>' +
    '<th style="text-align:center;padding:8px 4px;color:var(--text-muted)">Qty</th>' +
    '<th style="text-align:right;padding:8px 4px;color:var(--text-muted)">Price</th>' +
    '</tr></thead><tbody>' +
    items.map(function(item){
      return '<tr style="border-bottom:1px solid rgba(123,46,255,0.08)">' +
        '<td style="padding:8px 4px">'+item.name+'</td>' +
        '<td style="text-align:center;padding:8px 4px">'+(item.selected_size||'—')+'</td>' +
        '<td style="text-align:center;padding:8px 4px">'+item.qty+'</td>' +
        '<td style="text-align:right;padding:8px 4px;color:var(--neon-cyan);font-weight:700">'+formatNaira((item.discount_price||item.price)*item.qty)+'</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table>' +
    '<div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:700;padding-top:12px;border-top:1px solid var(--glass-border)">' +
    '<span>Total</span><span style="color:var(--neon-cyan)">'+formatNaira(o.total_amount)+'</span>' +
    '</div>' +
    '<div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--glass-border);font-size:0.78rem;color:var(--text-muted)">Thank you for shopping with Rae Enterprise! 💜</div>' +
    '<div style="display:flex;gap:10px;margin-top:20px">' +
    '<button class="btn btn-primary" style="flex:1" onclick="printInvoice()">🖨️ Print</button>' +
    '<button class="btn btn-ghost" style="flex:1" onclick="document.getElementById(\'inv-overlay\').remove()">Close</button>' +
    '</div></div>';

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
}

function printInvoice() {
  window.print();
}

// ── Products ──
async function renderAdminProducts(c) {
  var res = await db.from('products').select('*').order('created_at',{ascending:false});
  var products = res.data || [];
  c.innerHTML =
    '<div style="display:flex;justify-content:flex-end;margin-bottom:14px">' +
    '<button class="btn btn-primary btn-sm" onclick="switchAdminTab(\'add-product\')">➕ Add Product</button></div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Image</th><th>Name</th><th>Price</th><th>Discount</th><th>Stock</th><th>Category</th><th>Actions</th>' +
    '</tr></thead><tbody>' +
    (products.length ? products.map(function(p){
      var img=(p.images&&p.images[0])||'https://placehold.co/48x48/7B2EFF/fff?text=R';
      return '<tr>' +
        '<td><img style="width:48px;height:48px;border-radius:8px;object-fit:cover" src="'+img+'" onerror="this.src=\'https://placehold.co/48x48/7B2EFF/fff?text=R\'" /></td>' +
        '<td style="font-weight:600;max-width:160px;font-size:0.875rem">'+p.name+'</td>' +
        '<td style="text-decoration:line-through;color:var(--text-muted)">'+formatNaira(p.price)+'</td>' +
        '<td class="text-neon-cyan fw-700">'+formatNaira(p.discount_price)+'</td>' +
        '<td style="color:'+(p.stock_count<=5?'var(--neon-pink)':'var(--neon-cyan)')+';font-weight:700">'+p.stock_count+'</td>' +
        '<td><span class="badge badge-purple">'+(p.category||'—')+'</span></td>' +
        '<td><div style="display:flex;gap:6px">' +
        '<button class="btn btn-ghost btn-sm" onclick="editProduct(\''+p.id+'\')">✏️</button>' +
        '<button class="btn btn-sm" style="background:rgba(255,46,189,0.15);color:var(--neon-pink);border:1px solid rgba(255,46,189,0.3)" onclick="deleteProduct(\''+p.id+'\')">🗑</button>' +
        '</div></td></tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No products yet</td></tr>') +
    '</tbody></table></div>';
}

// ── Users ──
async function renderAdminUsers(c) {
  var res = await db.from('profiles').select('*').order('created_at',{ascending:false}).limit(50);
  var users = res.data || [];
  c.innerHTML = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Username</th><th>Email</th><th>Phone</th><th>Wallet</th><th>Spent</th><th>Role</th><th>Actions</th>' +
    '</tr></thead><tbody>' +
    (users.length ? users.map(function(u){
      return '<tr>' +
        '<td style="font-weight:700">'+u.username+'</td>' +
        '<td style="font-size:0.8rem;color:var(--text-muted)">'+(u.email||'—')+'</td>' +
        '<td style="font-size:0.8rem">'+(u.phone||'—')+'</td>' +
        '<td class="text-neon-cyan">'+formatNaira(u.wallet_balance||0)+'</td>' +
        '<td style="color:var(--text-secondary)">'+formatNaira(u.total_spent||0)+'</td>' +
        '<td><span class="badge '+(u.role==='admin'?'badge-pink':'badge-purple')+'">'+(u.role||'user')+'</span></td>' +
        '<td><button class="btn btn-outline btn-sm" onclick="adjustWallet(\''+u.id+'\',\''+u.username+'\')">💰 Wallet</button></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No users yet</td></tr>') +
    '</tbody></table></div>';
}

function adjustWallet(userId, username) {
  var ov = document.createElement('div'); ov.className='overlay'; ov.id='wallet-ov';
  ov.innerHTML = '<div class="modal" style="max-width:360px">' +
    '<h3 style="margin-bottom:20px">Wallet — <span class="text-neon-purple">'+username+'</span></h3>' +
    '<div class="input-group"><label>Action</label>' +
    '<select class="input-field" id="wal-act"><option value="add">Add Balance</option><option value="remove">Remove Balance</option></select></div>' +
    '<div class="input-group"><label>Amount (₦)</label>' +
    '<input class="input-field" type="number" id="wal-amt" placeholder="Enter amount" min="0" /></div>' +
    '<div style="display:flex;gap:10px;margin-top:4px">' +
    '<button class="btn btn-primary" onclick="applyWallet(\''+userId+'\')">Apply ✨</button>' +
    '<button class="btn btn-ghost" onclick="document.getElementById(\'wallet-ov\').remove()">Cancel</button>' +
    '</div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
}

async function applyWallet(userId) {
  var action = document.getElementById('wal-act').value;
  var amount = parseFloat(document.getElementById('wal-amt').value);
  if (!amount||amount<=0) { toast('Enter a valid amount','warn'); return; }
  var res = await db.from('profiles').select('wallet_balance').eq('id',userId).single();
  var cur = (res.data&&res.data.wallet_balance)||0;
  var newBal = action==='add' ? cur+amount : Math.max(0,cur-amount);
  await db.from('profiles').update({wallet_balance:newBal}).eq('id',userId);
  document.getElementById('wallet-ov').remove();
  toast((action==='add'?'Credited':'Debited')+' '+formatNaira(amount)+' ✨');
  loadAdminTab('users');
}

// ── Categories ──
async function renderCategoriesTab(c) {
  var existing = [];
  try {
    var cats = localStorage.getItem('rae_categories');
    existing = cats ? JSON.parse(cats) : DEFAULT_CATEGORIES;
  } catch(e) { existing = DEFAULT_CATEGORIES; }

  c.innerHTML =
    '<div class="glass-card" style="padding:24px;margin-bottom:20px">' +
    '<h3 style="margin-bottom:16px">Manage Categories</h3>' +
    '<div style="display:flex;gap:10px;margin-bottom:20px">' +
    '<input class="input-field" id="new-cat" placeholder="Add new category..." style="flex:1" />' +
    '<button class="btn btn-primary" onclick="addCategory()">+ Add</button>' +
    '</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:10px" id="cat-list">' +
    existing.map(function(cat){
      return '<div style="display:flex;align-items:center;gap:8px;background:var(--glass);border:1px solid var(--glass-border);border-radius:50px;padding:8px 16px">' +
        '<span>'+cat+'</span>' +
        '<button onclick="removeCategory(\''+cat+'\')" style="background:none;border:none;color:var(--neon-pink);cursor:pointer;font-size:1rem">×</button>' +
        '</div>';
    }).join('') +
    '</div>' +
    '<p style="margin-top:16px;font-size:0.8rem;color:var(--text-muted)">These categories appear on the home page and product form.</p>' +
    '</div>';
}

function addCategory() {
  var input = document.getElementById('new-cat');
  var val = (input.value||'').trim();
  if (!val) return;
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories')||'[]')||DEFAULT_CATEGORIES; } catch(e){ cats=DEFAULT_CATEGORIES; }
  if (cats.indexOf(val)===-1) { cats.push(val); localStorage.setItem('rae_categories', JSON.stringify(cats)); }
  input.value='';
  renderCategoriesTab(document.getElementById('admin-content'));
  toast('Category "'+val+'" added! ✨');
}

function removeCategory(cat) {
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories')||'[]')||DEFAULT_CATEGORIES; } catch(e){ cats=DEFAULT_CATEGORIES; }
  cats = cats.filter(function(c){return c!==cat;});
  localStorage.setItem('rae_categories', JSON.stringify(cats));
  renderCategoriesTab(document.getElementById('admin-content'));
  toast('Category removed');
}

// ── Add/Edit Product ──
function renderAddProductForm(c, existing) {
  var p = existing || {};
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories')||'[]')||DEFAULT_CATEGORIES; } catch(e){ cats=DEFAULT_CATEGORIES; }

  c.innerHTML =
    '<div class="glass-card" style="padding:28px">' +
    '<h3 style="margin-bottom:24px">'+(p.id?'✏️ Edit Product':'➕ Add New Product')+'</h3>' +
    '<form onsubmit="saveProduct(event,\''+(p.id||'')+'\')">' +
    '<div class="product-form">' +
    '<div class="input-group"><label>Product Name</label><input class="input-field" id="pf-name" required placeholder="Amazing Product" value="'+(p.name||'')+'" /></div>' +
    '<div class="input-group"><label>Category</label><select class="input-field" id="pf-cat">' +
    cats.map(function(cat){return '<option value="'+cat+'"'+(p.category===cat?' selected':'')+'>'+cat+'</option>';}).join('') +
    '</select></div>' +
    '<div class="input-group"><label>Original Price (₦)</label><input class="input-field" id="pf-price" type="number" required placeholder="5000" value="'+(p.price||'')+'" /></div>' +
    '<div class="input-group"><label>Discount Price (₦)</label><input class="input-field" id="pf-disc" type="number" required placeholder="3500" value="'+(p.discount_price||'')+'" /></div>' +
    '<div class="input-group"><label>Stock Count</label><input class="input-field" id="pf-stock" type="number" required placeholder="100" value="'+(p.stock_count||'')+'" /></div>' +
    '<div class="input-group"><label>Tags (comma-separated)</label><input class="input-field" id="pf-tags" placeholder="fashion, trending" value="'+((p.tags||[]).join(', '))+'" /></div>' +
    '<div class="input-group full-width"><label>Description</label><textarea class="input-field" id="pf-desc" rows="3" placeholder="Beautiful product description...">'+(p.description||'')+'</textarea></div>' +
    '<div class="input-group full-width"><label>Image URLs (one per line, up to 5)</label><textarea class="input-field" id="pf-imgs" rows="4" placeholder="https://image1.jpg\nhttps://image2.jpg">'+(p.images||[]).join('\n')+'</textarea></div>' +
    '<div class="input-group"><label>Clothing Sizes (comma-separated)</label><input class="input-field" id="pf-sizes" placeholder="S,M,L,XL,XXL" value="'+((p.sizes||['S','M','L','XL','XXL']).join(','))+'" /></div>' +
    '<div class="input-group"><label>Shoe Sizes (comma-separated)</label><input class="input-field" id="pf-shoe" placeholder="39,40,41,42,43,44" value="'+((p.shoe_sizes||['39','40','41','42','43','44']).join(','))+'" /></div>' +
    '<div class="input-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none"><input type="checkbox" id="pf-flash" '+(p.is_flash?'checked':'')+' /> ⚡ Flash Sale Item</label></div>' +
    '<div class="input-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none"><input type="checkbox" id="pf-stock-on" '+(!p.id||p.in_stock?'checked':'')+' /> ✅ In Stock</label></div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:12px">' +
    '<button type="submit" class="btn btn-primary" id="pf-btn">'+(p.id?'💾 Update':'✨ Add Product')+'</button>' +
    '<button type="button" class="btn btn-ghost" onclick="switchAdminTab(\'products\')">Cancel</button>' +
    '</div></form></div>';
}

async function saveProduct(e, existingId) {
  e.preventDefault();
  var btn = document.getElementById('pf-btn');
  setLoading(btn, true);

  var imgs = (document.getElementById('pf-imgs').value||'').split('\n').map(function(s){return s.trim();}).filter(Boolean).slice(0,5);
  var tags = (document.getElementById('pf-tags').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  var sizes = (document.getElementById('pf-sizes').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  var shoeSizes = (document.getElementById('pf-shoe').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean);

  var data = {
    name: document.getElementById('pf-name').value,
    category: document.getElementById('pf-cat').value,
    price: parseFloat(document.getElementById('pf-price').value),
    discount_price: parseFloat(document.getElementById('pf-disc').value),
    stock_count: parseInt(document.getElementById('pf-stock').value),
    description: document.getElementById('pf-desc').value,
    tags: tags, images: imgs, sizes: sizes, shoe_sizes: shoeSizes,
    is_flash: document.getElementById('pf-flash').checked,
    in_stock: document.getElementById('pf-stock-on').checked,
    updated_at: new Date().toISOString(),
  };

  var err;
  if (existingId) {
    var r = await db.from('products').update(data).eq('id',existingId);
    err = r.error;
  } else {
    data.created_at = new Date().toISOString();
    var r2 = await db.from('products').insert(data);
    err = r2.error;
  }
  setLoading(btn, false);
  if (err) { toast('Error: '+err.message,'error'); return; }
  toast(existingId?'Product updated! ✨':'Product added! ✨');
  switchAdminTab('products');
}

async function editProduct(id) {
  var res = await db.from('products').select('*').eq('id',id).single();
  if (res.data) renderAddProductForm(document.getElementById('admin-content'), res.data);
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? Cannot be undone.')) return;
  await db.from('products').delete().eq('id',id);
  toast('Product deleted 🗑','info');
  loadAdminTab('products');
}

// Send promotional notification to all users
async function sendPromoNotification(message) {
  var res = await db.from('profiles').select('id');
  if (!res.data) return;
  var notifs = res.data.map(function(u){
    return {user_id:u.id,message:message,type:'promo',created_at:new Date().toISOString()};
  });
  await db.from('notifications').insert(notifs);
  toast('Notification sent to all users! 📢');
}

async function renderAdminRequests(c) {
  var res = await db.from('item_requests').select('*').order('count', {ascending:false});
  var requests = res.data || [];

  // Group by product
  var grouped = {};
  requests.forEach(function(r) {
    if (!grouped[r.product_id]) {
      grouped[r.product_id] = { name: r.product_name, total: 0, users: [] };
    }
    grouped[r.product_id].total += (r.count || 1);
    grouped[r.product_id].users.push(r.username || 'Unknown');
  });

  var rows = Object.keys(grouped).map(function(pid) {
    var g = grouped[pid];
    return '<tr>' +
      '<td style="font-weight:600">' + (g.name || pid) + '</td>' +
      '<td><span class="badge badge-pink" style="font-size:1rem">' + g.total + ' requests</span></td>' +
      '<td style="font-size:0.8rem;color:var(--text-muted)">' + g.users.slice(0,5).join(', ') + (g.users.length > 5 ? ' +' + (g.users.length-5) + ' more' : '') + '</td>' +
      '<td><button class="btn btn-outline btn-sm" onclick="switchAdminTab(&quot;products&quot;)">Restock</button></td>' +
      '</tr>';
  });

  c.innerHTML = '<div class="glass-card" style="padding:16px;margin-bottom:16px">' +
    '<p style="font-size:0.875rem;color:var(--text-secondary)">These products were requested by users when out of stock. Restock to meet demand!</p></div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Product</th><th>Total Requests</th><th>Requested By</th><th>Action</th></tr></thead><tbody>' +
    (rows.length ? rows.join('') : '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">No requests yet</td></tr>') +
    '</tbody></table></div>';
}
