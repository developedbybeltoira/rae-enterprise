// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Admin Panel
// ═══════════════════════════════════════════════════════

let adminTab = 'orders';

async function renderAdmin() {
  if (!Store.isAdmin()) { toast('Access denied 💔', 'error'); navigate('home'); return; }

  document.getElementById('app').innerHTML = `
    <div class="admin-page container page-enter">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <h1 class="section-title">⚙️ Admin Panel</h1>
        <span class="badge badge-pink">Admin</span>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab ${adminTab==='orders'?'active':''}" onclick="switchAdminTab('orders')">📦 Orders</button>
        <button class="admin-tab ${adminTab==='products'?'active':''}" onclick="switchAdminTab('products')">🛍️ Products</button>
        <button class="admin-tab ${adminTab==='users'?'active':''}" onclick="switchAdminTab('users')">👥 Users</button>
        <button class="admin-tab ${adminTab==='add-product'?'active':''}" onclick="switchAdminTab('add-product')">➕ Add Product</button>
      </div>

      <div id="admin-tab-content">
        <div style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></div>
      </div>
    </div>
  `;

  loadAdminTab(adminTab);
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.toLowerCase().includes(tab.replace('-', ' ')));
  });
  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  if (tab === 'orders') await renderAdminOrders(container);
  else if (tab === 'products') await renderAdminProducts(container);
  else if (tab === 'users') await renderAdminUsers(container);
  else if (tab === 'add-product') renderAddProductForm(container);
}

async function renderAdminOrders(container) {
  const { data: orders } = await db.from('orders').select('*, profiles(username, email)')
    .order('created_at', { ascending: false }).limit(50);

  container.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders?.map(o => `
            <tr>
              <td style="font-family:monospace;color:var(--neon-purple-light);font-size:0.78rem">${o.id}</td>
              <td>
                <div style="font-weight:600">${o.full_name || o.profiles?.username || '—'}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${o.profiles?.email || ''}</div>
              </td>
              <td class="text-neon-cyan fw-700">${formatNaira(o.total_amount)}</td>
              <td style="font-size:0.8rem;color:var(--text-muted)">${formatDate(o.created_at)}</td>
              <td>
                <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)">
                  ${['awaiting_approval','approved','processing','shipped','delivered'].map(s =>
                    `<option value="${s}" ${o.status===s?'selected':''}>${s.replace(/_/g,' ')}</option>`
                  ).join('')}
                </select>
              </td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  ${o.proof_url ? `<a href="${o.proof_url}" target="_blank" class="btn btn-ghost btn-sm">📷 Proof</a>` : ''}
                  <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${o.id}')">👁 View</button>
                </div>
              </td>
            </tr>
          `).join('') || '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">No orders yet</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

async function updateOrderStatus(orderId, status) {
  const { error } = await db.from('orders').update({ status }).eq('id', orderId);
  if (error) { toast('Failed to update status 💔', 'error'); return; }
  toast(`Order updated to: ${status} ✨`);

  // Notify user
  const { data: order } = await db.from('orders').select('user_id').eq('id', orderId).single();
  if (order) {
    await db.from('notifications').insert({
      user_id: order.user_id,
      message: `Your order ${orderId} is now: ${status.replace(/_/g, ' ')} 📦`,
      type: 'order_update', created_at: new Date().toISOString(),
    });
  }
}

function viewOrderDetails(orderId) {
  toast(`Opening order ${orderId}...`, 'info');
}

async function renderAdminProducts(container) {
  const { data: products } = await db.from('products').select('*').order('created_at', { ascending: false });

  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <button class="btn btn-primary btn-sm" onclick="switchAdminTab('add-product')">➕ Add New Product</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Discount</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products?.map(p => `
            <tr>
              <td><img class="admin-img-preview" src="${p.images?.[0] || 'https://placehold.co/48x48/7B2EFF/fff?text=✨'}" 
                onerror="this.src='https://placehold.co/48x48/7B2EFF/fff?text=✨'" /></td>
              <td style="max-width:180px">
                <div style="font-weight:600;font-size:0.875rem">${p.name}</div>
              </td>
              <td style="color:var(--text-muted);text-decoration:line-through">${formatNaira(p.price)}</td>
              <td class="text-neon-cyan fw-700">${formatNaira(p.discount_price)}</td>
              <td>
                <span class="${p.stock_count <= 5 ? 'text-neon-pink' : 'text-neon-cyan'} fw-700">
                  ${p.stock_count}
                </span>
              </td>
              <td><span class="badge badge-purple">${p.category || '—'}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-ghost btn-sm" onclick="editProduct('${p.id}')">✏️ Edit</button>
                  <button class="btn btn-sm" style="background:rgba(255,46,189,0.15);color:var(--neon-pink);border:1px solid rgba(255,46,189,0.3)" onclick="deleteProduct('${p.id}')">🗑</button>
                </div>
              </td>
            </tr>
          `).join('') || '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No products yet</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

async function renderAdminUsers(container) {
  const { data: users } = await db.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);

  container.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Wallet</th>
            <th>Spent</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users?.map(u => `
            <tr>
              <td style="font-weight:700">${u.username || '—'}</td>
              <td style="font-size:0.8rem;color:var(--text-muted)">${u.email}</td>
              <td style="font-size:0.8rem">${u.phone || '—'}</td>
              <td class="text-neon-cyan">${formatNaira(u.wallet_balance || 0)}</td>
              <td style="color:var(--text-secondary)">${formatNaira(u.total_spent || 0)}</td>
              <td><span class="badge ${u.role==='admin'?'badge-pink':'badge-purple'}">${u.role || 'user'}</span></td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-outline btn-sm" onclick="adjustWallet('${u.id}', '${u.username}')">💰 Wallet</button>
                  <button class="btn btn-ghost btn-sm" onclick="toggleAdminRole('${u.id}', '${u.role}')">
                    ${u.role === 'admin' ? '👤 Demote' : '⚙️ Make Admin'}
                  </button>
                </div>
              </td>
            </tr>
          `).join('') || '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No users yet</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function adjustWallet(userId, username) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <h3 style="margin-bottom:20px">Adjust Wallet — <span class="text-neon-purple">${username}</span></h3>
      <div class="input-group">
        <label>Action</label>
        <select class="input-field" id="wallet-action">
          <option value="add">Add Balance</option>
          <option value="remove">Remove Balance</option>
        </select>
      </div>
      <div class="input-group">
        <label>Amount (₦)</label>
        <input class="input-field" type="number" id="wallet-amount" placeholder="0" min="0" />
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-primary" onclick="applyWalletAdjust('${userId}')">Apply ✨</button>
        <button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function applyWalletAdjust(userId) {
  const action = document.getElementById('wallet-action').value;
  const amount = parseFloat(document.getElementById('wallet-amount').value);
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'warn'); return; }

  const { data: u } = await db.from('profiles').select('wallet_balance').eq('id', userId).single();
  const current = u?.wallet_balance || 0;
  const newBalance = action === 'add' ? current + amount : Math.max(0, current - amount);

  await db.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId);
  document.querySelector('.overlay')?.remove();
  toast(`Wallet ${action === 'add' ? 'credited' : 'debited'} ${formatNaira(amount)} ✨`);
  loadAdminTab('users');
}

async function toggleAdminRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  await db.from('profiles').update({ role: newRole }).eq('id', userId);
  toast(`Role updated to ${newRole} ✨`);
  loadAdminTab('users');
}

function renderAddProductForm(container, existingProduct = null) {
  const p = existingProduct;
  container.innerHTML = `
    <div class="glass-card" style="padding:28px">
      <h3 style="margin-bottom:24px">${p ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
      <form onsubmit="saveProduct(event, '${p?.id || ''}')">
        <div class="product-form">
          <div class="input-group">
            <label>Product Name</label>
            <input class="input-field" id="p-name" placeholder="Amazing Product" required value="${p?.name || ''}" />
          </div>
          <div class="input-group">
            <label>Category</label>
            <select class="input-field" id="p-category">
              ${['Fashion','Beauty','Tech','Home','Shoes','Accessories','Gifts'].map(c =>
                `<option value="${c}" ${p?.category===c?'selected':''}>${c}</option>`
              ).join('')}
            </select>
          </div>
          <div class="input-group">
            <label>Original Price (₦)</label>
            <input class="input-field" id="p-price" type="number" placeholder="5000" required value="${p?.price || ''}" />
          </div>
          <div class="input-group">
            <label>Discount Price (₦)</label>
            <input class="input-field" id="p-discount" type="number" placeholder="3500" required value="${p?.discount_price || ''}" />
          </div>
          <div class="input-group">
            <label>Stock Count</label>
            <input class="input-field" id="p-stock" type="number" placeholder="100" required value="${p?.stock_count || ''}" />
          </div>
          <div class="input-group">
            <label>Tags (comma-separated)</label>
            <input class="input-field" id="p-tags" placeholder="fashion, trending, new" value="${p?.tags?.join(', ') || ''}" />
          </div>
          <div class="input-group full-width">
            <label>Description</label>
            <textarea class="input-field" id="p-desc" rows="3" placeholder="Beautiful product description...">${p?.description || ''}</textarea>
          </div>
          <div class="input-group full-width">
            <label>Product Images (upload multiple)</label>
            <input class="input-field" type="file" id="p-images" accept="image/*" multiple />
            ${p?.images?.length ? `
              <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
                ${p.images.map(img => `<img src="${img}" style="width:60px;height:60px;border-radius:8px;object-fit:cover" />`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="input-group">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none">
              <input type="checkbox" id="p-flash" ${p?.is_flash ? 'checked' : ''} />
              ⚡ Flash Sale Item
            </label>
          </div>
          <div class="input-group">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none">
              <input type="checkbox" id="p-instock" ${!p || p?.in_stock ? 'checked' : ''} />
              ✅ In Stock
            </label>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button type="submit" class="btn btn-primary" id="save-product-btn">
            ${p ? '💾 Update Product' : '✨ Add Product'}
          </button>
          <button type="button" class="btn btn-ghost" onclick="switchAdminTab('products')">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

async function saveProduct(e, existingId) {
  e.preventDefault();
  const btn = document.getElementById('save-product-btn');
  setLoading(btn, true);

  const imageFiles = document.getElementById('p-images').files;
  const imageUrls = [];

  for (const file of imageFiles) {
    const path = `products/${Date.now()}_${file.name}`;
    const { data } = await db.storage.from('product-images').upload(path, file, { upsert: true });
    if (data) {
      const { data: urlData } = db.storage.from('product-images').getPublicUrl(path);
      if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
    }
  }

  const productData = {
    name: document.getElementById('p-name').value,
    category: document.getElementById('p-category').value,
    price: parseFloat(document.getElementById('p-price').value),
    discount_price: parseFloat(document.getElementById('p-discount').value),
    stock_count: parseInt(document.getElementById('p-stock').value),
    description: document.getElementById('p-desc').value,
    tags: document.getElementById('p-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    is_flash: document.getElementById('p-flash').checked,
    in_stock: document.getElementById('p-instock').checked,
    ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
    updated_at: new Date().toISOString(),
  };

  let error;
  if (existingId) {
    ({ error } = await db.from('products').update(productData).eq('id', existingId));
  } else {
    productData.created_at = new Date().toISOString();
    ({ error } = await db.from('products').insert(productData));
  }

  setLoading(btn, false);
  if (error) { toast('Failed to save product 💔', 'error'); return; }
  toast(existingId ? 'Product updated! ✨' : 'Product added! ✨');
  switchAdminTab('products');
}

async function editProduct(id) {
  const { data: p } = await db.from('products').select('*').eq('id', id).single();
  if (p) {
    adminTab = 'add-product';
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    renderAddProductForm(document.getElementById('admin-tab-content'), p);
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  await db.from('products').delete().eq('id', id);
  toast('Product deleted 🗑', 'info');
  loadAdminTab('products');
}
