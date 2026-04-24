// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Cart Page
// ═══════════════════════════════════════════════════════

function renderCart() {
  if (!Store.user) { navigate('login'); return; }
  const cart = Store.cart;
  const total = Store.getCartTotal();
  const balance = Store.profile?.wallet_balance || 0;

  document.getElementById('app').innerHTML = `
    <div class="cart-page container page-enter">
      <h1 class="section-title" style="margin-bottom:28px">
        Shopping Cart <span class="text-neon-purple">(${cart.length} items)</span>
      </h1>

      ${!cart.length ? `
        <div style="text-align:center;padding:80px 20px">
          <div style="font-size:4rem;margin-bottom:16px">🛒</div>
          <h2 style="margin-bottom:12px">Your cart is empty</h2>
          <p style="color:var(--text-muted);margin-bottom:24px">Time to discover amazing products!</p>
          <button class="btn btn-primary btn-lg" onclick="navigate('home')">Start Shopping ✨</button>
        </div>
      ` : `
        <div class="cart-grid">
          <!-- Items -->
          <div>
            <div class="cart-items-list" id="cart-items-list">
              ${cart.map(item => cartItemHTML(item)).join('')}
            </div>
          </div>

          <!-- Summary -->
          <div class="order-summary">
            <h3>Order Summary 💜</h3>

            <div class="summary-row"><span>Subtotal</span><span>${formatNaira(total)}</span></div>
            <div class="summary-row"><span>Delivery</span><span class="text-neon-cyan">Free 🎁</span></div>
            ${balance > 0 ? `
              <div class="summary-row"><span>💜 Wallet Balance</span><span>${formatNaira(balance)}</span></div>
            ` : ''}
            <div class="summary-row summary-total">
              <span>Total</span>
              <span class="price-discount">${formatNaira(total)}</span>
            </div>

            <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
              ${balance >= total ? `
                <button class="btn btn-cyan btn-full" onclick="checkoutWithWallet()">💜 Pay with Wallet</button>
              ` : ''}
              <button class="btn btn-primary btn-full" onclick="showCheckoutModal()">
                💳 Checkout (${formatNaira(total)})
              </button>
            </div>

            <div style="margin-top:16px;font-size:0.8rem;color:var(--text-muted);text-align:center">
              🔒 Secure & Protected Payment
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

function cartItemHTML(item) {
  const price = item.discount_price || item.price;
  return `
    <div class="cart-item" id="cart-item-${item.id}">
      <img class="cart-item-img" src="${item.images?.[0] || 'https://placehold.co/80x80/7B2EFF/fff?text=✨'}"
        alt="${item.name}" onerror="this.src='https://placehold.co/80x80/7B2EFF/fff?text=✨'" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatNaira(price)} each</div>
        <div class="cart-item-controls">
          <div class="qty-selector">
            <button class="qty-btn" onclick="updateCartQty('${item.id}', ${item.qty - 1})" style="width:32px;height:32px;font-size:1rem">−</button>
            <div class="qty-display" style="min-width:36px;height:32px;font-size:0.9rem">${item.qty}</div>
            <button class="qty-btn" onclick="updateCartQty('${item.id}', ${item.qty + 1})" style="width:32px;height:32px;font-size:1rem">+</button>
          </div>
          <span style="font-weight:700;color:var(--neon-cyan)">${formatNaira(price * item.qty)}</span>
          <button class="cart-remove" onclick="removeCartItem('${item.id}')">🗑 Remove</button>
        </div>
      </div>
    </div>
  `;
}

function updateCartQty(id, qty) {
  Store.updateQty(id, qty);
  renderCart();
}

function removeCartItem(id) {
  Store.removeFromCart(id);
  renderCart();
}

function showCheckoutModal() {
  const total = Store.getCartTotal();
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'checkout-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <h2 class="text-gradient">Complete Your Order</h2>
        <button onclick="document.getElementById('checkout-overlay').remove()" style="background:none;border:none;color:var(--text-muted);font-size:1.4rem;cursor:pointer">✕</button>
      </div>

      <!-- Payment Details -->
      <div class="payment-details">
        <h4>💳 Payment Account Details</h4>
        <div class="payment-detail-row"><span>Bank</span><span class="fw-700">OPay</span></div>
        <div class="payment-detail-row"><span>Account Number</span><span class="fw-700 text-neon-cyan">8166666667</span></div>
        <div class="payment-detail-row"><span>Account Name</span><span class="fw-700">Rae Enterprises</span></div>
        <div class="payment-detail-row"><span style="font-weight:700">Total to Pay</span><span class="price-big" style="font-size:1.3rem">${formatNaira(total)}</span></div>
      </div>

      <form onsubmit="submitOrder(event)">
        <div class="input-group">
          <label>Full Name</label>
          <input class="input-field" id="order-name" placeholder="Your full name" required />
        </div>
        <div class="input-group">
          <label>Delivery Address</label>
          <textarea class="input-field" id="order-address" placeholder="Your full delivery address" required rows="2" style="resize:vertical"></textarea>
        </div>
        <div class="input-group">
          <label>Phone Number</label>
          <input class="input-field" id="order-phone" placeholder="08012345678" required />
        </div>
        <div class="input-group">
          <label>Sender Name (Bank Transfer)</label>
          <input class="input-field" id="order-sender" placeholder="Name used on transfer" required />
        </div>
        <div class="input-group">
          <label>Payment Proof (Screenshot)</label>
          <input class="input-field" type="file" id="order-proof" accept="image/*" required />
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="submit-order-btn">
          Submit Order ✨
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

async function submitOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-order-btn');
  setLoading(btn, true);

  const proofFile = document.getElementById('order-proof').files[0];
  let proofUrl = null;

  if (proofFile) {
    const fileName = `proofs/${Store.user.id}/${Date.now()}_${proofFile.name}`;
    const { data: uploadData } = await db.storage.from('order-proofs').upload(fileName, proofFile);
    if (uploadData) {
      const { data: urlData } = db.storage.from('order-proofs').getPublicUrl(fileName);
      proofUrl = urlData?.publicUrl;
    }
  }

  const orderId = generateOrderId();
  const total = Store.getCartTotal();

  const { error } = await db.from('orders').insert({
    id: orderId,
    user_id: Store.user.id,
    items: Store.cart,
    total_amount: total,
    full_name: document.getElementById('order-name').value,
    address: document.getElementById('order-address').value,
    phone: document.getElementById('order-phone').value,
    sender_name: document.getElementById('order-sender').value,
    proof_url: proofUrl,
    status: 'awaiting_approval',
    created_at: new Date().toISOString(),
  });

  setLoading(btn, false);

  if (error) { toast('Error submitting order. Please try again 💔', 'error'); return; }

  // Check referral rewards
  await checkReferralRewards(total);

  Store.clearCart();
  document.getElementById('checkout-overlay')?.remove();
  toast(`Order ${orderId} submitted! 🎉 Awaiting approval.`, 'success');
  navigate('orders');
}

async function checkoutWithWallet() {
  const total = Store.getCartTotal();
  const balance = Store.profile?.wallet_balance || 0;
  if (balance < total) { toast('Insufficient wallet balance 💔', 'error'); return; }

  const orderId = generateOrderId();
  await db.from('orders').insert({
    id: orderId, user_id: Store.user.id, items: Store.cart,
    total_amount: total, status: 'approved',
    payment_method: 'wallet', created_at: new Date().toISOString(),
  });

  await db.from('profiles').update({ wallet_balance: balance - total, total_spent: (Store.profile.total_spent || 0) + total })
    .eq('id', Store.user.id);

  Store.clearCart();
  toast(`Order placed! Paid from wallet 💜`, 'success');
  navigate('orders');
}

async function checkReferralRewards(orderTotal) {
  if (!Store.profile?.referred_by) return;
  let reward = 0;
  if (orderTotal >= 100000) reward = 10000;
  else if (orderTotal >= 10000) reward = 1000;
  if (reward > 0) {
    const { data: referrer } = await db.from('profiles').select('id,wallet_balance').eq('username', Store.profile.referred_by).single();
    if (referrer) {
      await db.from('profiles').update({ wallet_balance: (referrer.wallet_balance || 0) + reward }).eq('id', referrer.id);
      await db.from('notifications').insert({
        user_id: referrer.id,
        message: `You earned ${formatNaira(reward)} referral reward! 🎁`,
        type: 'reward', created_at: new Date().toISOString(),
      });
    }
  }
}
