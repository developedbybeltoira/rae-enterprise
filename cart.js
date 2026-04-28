// RAE ENTERPRISE — Cart Page

function renderCart() {
  if (!Store.user) { navigate('login'); return; }
  var cart = Store.cart;
  var total = Store.getCartTotal();
  var balance = Store.profile ? (Store.profile.wallet_balance || 0) : 0;

  document.getElementById('app').innerHTML =
    '<div class="cart-page container page-enter">' +
    '<h1 class="section-title" style="margin-bottom:28px">Shopping Cart <span class="text-neon-purple">(' + cart.length + ' items)</span></h1>' +

    (!cart.length ?
      '<div style="text-align:center;padding:80px 20px">' +
      '<div style="font-size:4rem;margin-bottom:16px">&#128722;</div>' +
      '<h2 style="margin-bottom:12px">Your cart is empty</h2>' +
      '<p style="color:var(--text-muted);margin-bottom:24px">Time to discover amazing products!</p>' +
      '<button class="btn btn-primary btn-lg" onclick="navigate(\'home\')">Start Shopping</button>' +
      '</div>'
      :
      '<div class="cart-grid">' +
      '<div>' +
      '<div class="cart-items-list" id="cart-items-list">' +
      cart.map(function(item) { return cartItemHTML(item); }).join('') +
      '</div>' +
      '</div>' +
      '<div class="order-summary">' +
      '<h3>Order Summary</h3>' +
      '<div class="summary-row"><span>Subtotal</span><span>' + formatNaira(total) + '</span></div>' +
      '<div class="summary-row"><span>Delivery</span><span class="text-neon-cyan">Free</span></div>' +
      (balance > 0 ?
        '<div class="summary-row"><span>Wallet Balance</span><span class="text-neon-purple">' + formatNaira(balance) + '</span></div>'
        : '') +
      '<div class="summary-row summary-total"><span>Total</span><span class="price-discount">' + formatNaira(total) + '</span></div>' +

      // Minimum order notice
      (total < 7000 ?
        '<div style="background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.25);border-radius:10px;padding:12px 14px;margin:14px 0;font-size:0.82rem;color:#ffaa00">' +
        '&#9888;&#65039; Minimum order is <strong>&#8358;7,000</strong>. Add ' + formatNaira(7000 - total) + ' more to checkout.' +
        '</div>'
        :
        '<div style="background:rgba(0,220,100,0.06);border:1px solid rgba(0,220,100,0.15);border-radius:10px;padding:10px 14px;margin:14px 0;font-size:0.8rem;color:rgba(0,220,100,0.8)">' +
        '&#10003; Ready to checkout!' +
        '</div>'
      ) +

      '<div style="margin-top:16px;display:flex;flex-direction:column;gap:10px">' +
      (balance >= total && total >= 7000 ?
        '<button class="btn btn-cyan btn-full" onclick="checkoutWithWallet()">Pay with Wallet</button>'
        : '') +
      '<button class="btn btn-primary btn-full" onclick="showCheckoutModal()" ' + (total < 7000 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : '') + '>' +
      'Checkout (' + formatNaira(total) + ')' +
      '</button>' +
      '</div>' +
      '<div style="margin-top:14px;font-size:0.8rem;color:var(--text-muted);text-align:center">&#128274; Secure Payment</div>' +
      '</div></div>'
    ) +
    '</div>';
}

function cartItemHTML(item) {
  var price = item.discount_price || item.price;
  var img = (item.images && item.images[0]) || 'https://placehold.co/80x80/7B2EFF/fff?text=R';
  return '<div class="cart-item" id="cart-item-' + item.id + '">' +
    '<img class="cart-item-img" src="' + img + '" alt="' + item.name + '" onerror="this.src=\'https://placehold.co/80x80/7B2EFF/fff?text=R\'" />' +
    '<div class="cart-item-info">' +
    '<div class="cart-item-name">' + item.name + '</div>' +
    (item.selected_size ? '<div style="font-size:0.78rem;color:var(--neon-purple-light);margin-bottom:4px">Size: ' + item.selected_size + '</div>' : '') +
    '<div class="cart-item-price">' + formatNaira(price) + ' each</div>' +
    '<div class="cart-item-controls">' +
    '<div class="qty-selector">' +
    '<button class="qty-btn" onclick="updateCartQty(\'' + item.id + '\',' + (item.qty - 1) + ')" style="width:32px;height:32px;font-size:1rem">\u2212</button>' +
    '<div class="qty-display" style="min-width:36px;height:32px;font-size:0.9rem">' + item.qty + '</div>' +
    '<button class="qty-btn" onclick="updateCartQty(\'' + item.id + '\',' + (item.qty + 1) + ')" style="width:32px;height:32px;font-size:1rem">+</button>' +
    '</div>' +
    '<span style="font-weight:700;color:var(--neon-cyan)">' + formatNaira(price * item.qty) + '</span>' +
    '<button class="cart-remove" onclick="removeCartItem(\'' + item.id + '\')">&#128465; Remove</button>' +
    '</div></div></div>';
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
  var total = Store.getCartTotal();
  // Minimum order check
  if (total < 7000) {
    toast('Minimum order is N7,000. Add ' + formatNaira(7000 - total) + ' more!', 'warn');
    return;
  }

  // Load saved addresses for autofill
  var savedAddrs = [];
  try { savedAddrs = JSON.parse(localStorage.getItem('rae_addr_' + Store.user.id) || '[]'); } catch(e){}
  var addrOptions = savedAddrs.length ?
    '<div class="input-group"><label>Saved Addresses</label>' +
    '<select class="input-field" id="saved-addr-sel" onchange="fillSavedAddr(this.value)">' +
    '<option value="">-- Select saved address --</option>' +
    savedAddrs.map(function(a, i) { return '<option value="' + i + '">' + a.name + ' - ' + a.street + '</option>'; }).join('') +
    '</select></div>' : '';

  var overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'checkout-overlay';
  overlay.innerHTML =
    '<div class="modal" style="max-width:520px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">' +
    '<h2 class="text-gradient">Complete Your Order</h2>' +
    '<button onclick="document.getElementById(\'checkout-overlay\').remove()" style="background:none;border:none;color:var(--text-muted);font-size:1.4rem;cursor:pointer">&#10005;</button>' +
    '</div>' +

    // Payment details
    '<div style="background:rgba(0,245,255,0.06);border:1px solid rgba(0,245,255,0.2);border-radius:12px;padding:18px;margin-bottom:20px">' +
    '<div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(0,245,255,0.6);margin-bottom:12px">Payment Account</div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.85rem"><span style="color:var(--text-muted)">Bank</span><span style="font-weight:700">OPay</span></div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.85rem"><span style="color:var(--text-muted)">Account Number</span><span style="font-weight:700;color:var(--neon-cyan)">8166666667</span></div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.85rem"><span style="color:var(--text-muted)">Account Name</span><span style="font-weight:700">Rae Enterprises</span></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:1rem;padding-top:10px;border-top:1px solid rgba(0,245,255,0.1);margin-top:4px"><span style="font-weight:700">Total to Pay</span><span style="font-weight:800;color:var(--neon-cyan);font-size:1.1rem">' + formatNaira(total) + '</span></div>' +
    '</div>' +

    '<form onsubmit="submitOrder(event)">' +
    addrOptions +
    '<div class="input-group"><label>Full Name</label><input class="input-field" id="order-name" placeholder="Your full name" required value="' + (Store.profile.username || '') + '" /></div>' +
    '<div class="input-group"><label>Delivery Address</label><textarea class="input-field" id="order-address" placeholder="Full delivery address (street, city, state)" required rows="2" style="resize:vertical">' + getDefaultAddress() + '</textarea></div>' +
    '<div class="input-group"><label>Phone Number</label><input class="input-field" id="order-phone" placeholder="08012345678" required value="' + (Store.profile.phone || '') + '" /></div>' +
    '<div class="input-group"><label>Transfer Sender Name</label><input class="input-field" id="order-sender" placeholder="Name on bank transfer" required /></div>' +
    '<div class="input-group"><label>Payment Proof (Screenshot)</label><input class="input-field" type="file" id="order-proof" accept="image/*" required /></div>' +
    '<button type="submit" class="btn btn-primary btn-full btn-lg" id="submit-order-btn">Submit Order</button>' +
    '</form></div>';

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if(e.target===overlay) overlay.remove(); });
  window._savedAddrsForCheckout = savedAddrs;
}

function getDefaultAddress() {
  if (!Store.user) return '';
  try {
    var addrs = JSON.parse(localStorage.getItem('rae_addr_' + Store.user.id) || '[]');
    if (addrs.length) return addrs[0].street + ', ' + addrs[0].city + ', ' + addrs[0].state;
  } catch(e) {}
  return '';
}

function fillSavedAddr(idx) {
  if (!window._savedAddrsForCheckout || idx === '') return;
  var a = window._savedAddrsForCheckout[parseInt(idx)];
  if (!a) return;
  var nameEl = document.getElementById('order-name');
  var addrEl = document.getElementById('order-address');
  var phoneEl = document.getElementById('order-phone');
  if (nameEl) nameEl.value = a.name;
  if (addrEl) addrEl.value = a.street + ', ' + a.city + ', ' + a.state;
  if (phoneEl && a.phone) phoneEl.value = a.phone;
}

async function submitOrder(e) {
  e.preventDefault();
  var btn = document.getElementById('submit-order-btn');
  setLoading(btn, true);

  var proofFile = document.getElementById('order-proof').files[0];
  var proofUrl = null;

  if (proofFile) {
    try {
      var fileName = 'proofs/' + Store.user.id + '/' + Date.now() + '_' + proofFile.name.replace(/[^a-zA-Z0-9.]/g,'_');
      var uploadData = await db.storage.from('order-proofs').upload(fileName, proofFile);
      if (!uploadData.error) {
        var urlData = db.storage.from('order-proofs').getPublicUrl(fileName);
        proofUrl = urlData.data ? urlData.data.publicUrl : null;
      }
    } catch(uploadErr) { console.warn('proof upload failed:', uploadErr); }
  }

  var orderId = generateOrderId();
  var total = Store.getCartTotal();

  var orderData = {
    id:          orderId,
    user_id:     Store.user.id,
    items:       Store.cart,
    total_amount:total,
    full_name:   document.getElementById('order-name').value,
    address:     document.getElementById('order-address').value,
    phone:        document.getElementById('order-phone').value,
    sender_name: document.getElementById('order-sender').value,
    proof_url:   proofUrl,
    status:      'awaiting_approval',
    created_at:  new Date().toISOString(),
  };

  var result = await db.from('orders').insert(orderData);

  if (result.error) {
    toast('Error submitting order: ' + result.error.message, 'error');
    setLoading(btn, false);
    return;
  }

  // Check referral rewards
  await checkReferralRewards(total);

  Store.clearCart();
  document.getElementById('checkout-overlay').remove();
  setLoading(btn, false);
  toast('Order ' + orderId + ' submitted! Awaiting approval.');
  navigate('orders');
}

async function checkoutWithWallet() {
  var total = Store.getCartTotal();
  if (total < 7000) {
    toast('Minimum order is N7,000. Add ' + formatNaira(7000 - total) + ' more!', 'warn');
    return;
  }
  var balance = Store.profile ? (Store.profile.wallet_balance || 0) : 0;
  if (balance < total) { toast('Insufficient wallet balance', 'error'); return; }

  var orderId = generateOrderId();
  await db.from('orders').insert({
    id:          orderId,
    user_id:     Store.user.id,
    items:       Store.cart,
    total_amount:total,
    full_name:   Store.profile.username || '',
    address:     getDefaultAddress(),
    phone:        Store.profile.phone || '',
    status:      'approved',
    payment_method: 'wallet',
    created_at:  new Date().toISOString(),
  });

  // Deduct wallet + update total_spent
  var newBalance = balance - total;
  var currentSpent = Store.profile.total_spent || 0;
  await db.from('profiles').update({
    wallet_balance: newBalance,
    total_spent: currentSpent + total
  }).eq('id', Store.user.id);

  Store.profile.wallet_balance = newBalance;
  Store.profile.total_spent = currentSpent + total;
  Store.clearCart();
  toast('Order placed! Paid from wallet.');
  navigate('orders');
}

async function checkReferralRewards(orderTotal) {
  if (!Store.profile || !Store.profile.referred_by) return;
  var reward = 0;
  if (orderTotal >= 100000) reward = 10000;
  else if (orderTotal >= 10000) reward = 1000;
  if (reward > 0) {
    try {
      var refRes = await db.from('profiles').select('id,wallet_balance').eq('username', Store.profile.referred_by).single();
      if (refRes.data) {
        await db.from('profiles').update({ wallet_balance: (refRes.data.wallet_balance || 0) + reward }).eq('id', refRes.data.id);
        await db.from('notifications').insert({
          user_id: refRes.data.id,
          message: 'You earned ' + formatNaira(reward) + ' referral reward!',
          type: 'reward',
          created_at: new Date().toISOString()
        });
      }
    } catch(e) {}
  }
}
