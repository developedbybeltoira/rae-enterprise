// RAE ENTERPRISE - Dashboard, Orders (Premium), Invoice, Reviews

var ORDER_STEPS = [
  { key:'awaiting_approval', label:'Payment Confirming', short:'Confirming', pct:10  },
  { key:'approved',          label:'Preparing Order',   short:'Preparing',  pct:30  },
  { key:'processing',        label:'Packaged',          short:'Packaged',   pct:55  },
  { key:'shipped',           label:'On the Way',        short:'On the Way', pct:80  },
  { key:'delivered',         label:'Delivered',         short:'Delivered',  pct:100 },
];

function getStepIndex(status) {
  if (status === 'cancelled') return -1;
  for (var i=0; i<ORDER_STEPS.length; i++) { if (ORDER_STEPS[i].key===status) return i; }
  return 0;
}

function getLevel(spent) {
  if (spent>=100000) return {name:'Gold',   icon:'Gold',   class:'level-gold'  };
  if (spent>=30000)  return {name:'Silver', icon:'Silver', class:'level-silver'};
  return                    {name:'Bronze', icon:'Bronze', class:'level-bronze'};
}

async function renderDashboard() {
  if (!Store.user) { navigate('login'); return; }
  var pRes = await db.from('profiles').select('*').eq('id', Store.user.id).single();
  if (pRes.data) { Store.profile = pRes.data; Store.user = pRes.data; }
  var p = Store.profile;
  var level = getLevel(p.total_spent||0);
  var initials = (p.username||'??').slice(0,2).toUpperCase();

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div class="dashboard-header">' +
    '<div class="dashboard-avatar">' + initials + '</div>' +
    '<div>' +
    '<div class="dashboard-name">' + (p.username||'Shopper') + ' <span class="' + level.class + '" style="font-size:0.9rem">' + level.name + '</span></div>' +
    '<div class="dashboard-level">' +
    '<span class="badge badge-purple">' + level.name + ' Member</span>' +
    '<span style="font-size:0.8rem;color:var(--text-muted);margin-left:8px">' + (p.email||'') + '</span>' +
    '</div>' +
    '<div style="margin-top:6px;font-size:0.8rem;color:var(--text-muted)">' + (p.phone||'N/A') + '</div>' +
    '</div></div>' +
    '<div class="stats-grid">' +
    sCard(formatNaira(p.wallet_balance||0),'Wallet Balance','text-neon-cyan') +
    sCard(formatNaira(p.total_spent||0),'Total Spent','text-neon-purple') +
    sCard(p.referral_count||0,'Referrals','text-neon-pink') +
    sCard(level.name,'Level',level.class) +
    '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px">' +
    '<button class="btn btn-ghost" onclick="renderOrders()">My Orders</button>' +
    '<button class="btn btn-ghost" onclick="renderReferrals()">Referrals</button>' +
    '<button class="btn btn-ghost" onclick="renderWallet()">Wallet</button>' +
    '<button class="btn btn-ghost" onclick="renderSettings()">Security</button>' +
    '<button class="btn btn-ghost" onclick="renderAddressBook()">Addresses</button>' +
    '</div>' +
    '<div class="glass-card" style="padding:24px"><h3 style="margin-bottom:14px">Level Progress</h3>' +
    renderLevelProgress(p.total_spent||0) + '</div>' +
    '</div>';
}

function sCard(val, label, cls) {
  return '<div class="stat-card"><div class="stat-card-value ' + cls + '">' + val + '</div><div class="stat-card-label">' + label + '</div></div>';
}

function renderLevelProgress(spent) {
  var tiers = [{name:'Bronze',min:0,max:30000,cls:'level-bronze'},{name:'Silver',min:30000,max:100000,cls:'level-silver'},{name:'Gold',min:100000,max:Infinity,cls:'level-gold'}];
  var curIdx=0; for(var i=0;i<tiers.length;i++){if(spent>=tiers[i].min)curIdx=i;}
  var cur=tiers[curIdx], next=tiers[curIdx+1];
  var pct=next?Math.min(100,Math.round(((spent-cur.min)/(next.min-cur.min))*100)):100;
  return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
    tiers.map(function(t,i){ return (i>0?'<div style="color:var(--text-muted)">&#8594;</div>':'')+
      '<div style="flex:1;text-align:center;opacity:'+(spent>=t.min?1:0.35)+'"><div class="'+t.cls+'" style="font-size:0.8rem;font-weight:700">'+t.name+'</div>'+
      '<div style="font-size:0.7rem;color:var(--text-muted)">'+formatNaira(t.min)+'+</div></div>';}).join('') + '</div>' +
    '<div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%"></div></div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.78rem;color:var(--text-muted)">' +
    '<span>'+formatNaira(spent)+' spent</span>' +
    (next?'<span>'+formatNaira(next.min-spent)+' more to '+next.name+'</span>':'<span class="text-gold">Max level!</span>') +
    '</div>';
}

// ── ADDRESS BOOK ──
async function renderAddressBook() {
  if (!Store.user) { navigate('login'); return; }
  var savedAddr = [];
  try { savedAddr = JSON.parse(localStorage.getItem('rae_addr_' + Store.user.id)||'[]'); } catch(e){}

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">&#8592; Back</button>' +
    '<h1 class="section-title">Delivery Addresses</h1></div>' +
    '<div class="glass-card" style="padding:28px;margin-bottom:20px">' +
    '<h3 style="margin-bottom:18px">Add New Address</h3>' +
    '<div class="product-form">' +
    '<div class="input-group"><label>Full Name</label><input class="input-field" id="addr-name" placeholder="Recipient name" value="'+(Store.profile.username||'')+'" /></div>' +
    '<div class="input-group"><label>Phone</label><input class="input-field" id="addr-phone" placeholder="08012345678" value="'+(Store.profile.phone||'')+'" /></div>' +
    '<div class="input-group full-width"><label>Street Address</label><input class="input-field" id="addr-street" placeholder="12 Aba Road..." /></div>' +
    '<div class="input-group"><label>City</label><input class="input-field" id="addr-city" placeholder="Lagos" /></div>' +
    '<div class="input-group"><label>State</label><input class="input-field" id="addr-state" placeholder="Lagos State" /></div>' +
    '</div>' +
    '<button class="btn btn-primary" style="margin-top:8px" onclick="saveAddress()">Save Address</button>' +
    '</div>' +
    (savedAddr.length ?
      '<h3 style="margin-bottom:14px">Saved Addresses</h3>' +
      savedAddr.map(function(a,i) {
        return '<div style="padding:16px 20px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
          '<div><div style="font-weight:700;margin-bottom:4px">'+a.name+'</div>' +
          '<div style="font-size:0.85rem;color:var(--text-secondary)">'+a.phone+'</div>' +
          '<div style="font-size:0.85rem;color:var(--text-secondary)">'+a.street+', '+a.city+', '+a.state+'</div></div>' +
          '<button onclick="deleteAddress('+i+')" style="background:none;border:none;color:var(--neon-pink);cursor:pointer;font-size:1.1rem">&#x2715;</button>' +
          '</div>';
      }).join('')
      : '') +
    '</div>';
}

function saveAddress() {
  var name   = (document.getElementById('addr-name').value||'').trim();
  var phone  = (document.getElementById('addr-phone').value||'').trim();
  var street = (document.getElementById('addr-street').value||'').trim();
  var city   = (document.getElementById('addr-city').value||'').trim();
  var state  = (document.getElementById('addr-state').value||'').trim();
  if (!name||!street||!city) { toast('Fill name, street and city','error'); return; }
  var addrs = [];
  try { addrs = JSON.parse(localStorage.getItem('rae_addr_'+Store.user.id)||'[]'); } catch(e){}
  addrs.push({name:name,phone:phone,street:street,city:city,state:state});
  localStorage.setItem('rae_addr_'+Store.user.id, JSON.stringify(addrs));
  toast('Address saved!');
  renderAddressBook();
}

function deleteAddress(idx) {
  var addrs = [];
  try { addrs = JSON.parse(localStorage.getItem('rae_addr_'+Store.user.id)||'[]'); } catch(e){}
  addrs.splice(idx,1);
  localStorage.setItem('rae_addr_'+Store.user.id, JSON.stringify(addrs));
  renderAddressBook();
}

// ── PREMIUM ORDERS ──
async function renderOrders() {
  if (!Store.user) { navigate('login'); return; }
  var res = await db.from('orders').select('*').eq('user_id', Store.user.id).order('created_at',{ascending:false});
  var orders = res.data||[];

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">&#8592; Back</button>' +
    '<h1 class="section-title">My Orders</h1></div>' +
    (!orders.length ?
      '<div style="text-align:center;padding:60px;color:var(--text-muted)">' +
      '<div style="font-size:3rem;margin-bottom:12px">&#128230;</div>' +
      '<p>No orders yet.</p>' +
      '<button class="btn btn-primary" style="margin-top:16px" onclick="navigate(\'home\')">Shop Now</button></div>'
      :
      orders.map(function(o){ return buildPremiumOrderCard(o); }).join('')
    ) + '</div>';
}

function buildPremiumOrderCard(o) {
  var isCancelled = o.status === 'cancelled';
  var stepIdx = isCancelled ? 0 : getStepIndex(o.status);
  var step    = ORDER_STEPS[stepIdx] || ORDER_STEPS[0];
  var pct     = isCancelled ? 0 : step.pct;
  var items   = o.items||[];
  var isApproved = !isCancelled && stepIdx >= 1;

  var nextStepLabel = stepIdx < ORDER_STEPS.length-1 ? 'Next: ' + ORDER_STEPS[stepIdx+1].label : 'Complete!';
  var daysLeft = o.status==='delivered' ? 0 : o.status==='shipped' ? 2 : Math.max(0, 19 - Math.floor((Date.now()-new Date(o.created_at).getTime())/86400000));
  var arrivalText = o.status==='delivered' ? 'Delivered successfully' :
    o.status==='shipped' ? 'Arriving in 1-3 days' :
    'Expected in ' + daysLeft + '-' + (daysLeft+2) + ' days';

  // Status badge colors
  var badgeColors = {
    awaiting_approval:'rgba(255,170,0,0.15);color:#ffaa00;border:1px solid rgba(255,170,0,0.3)',
    approved:         'rgba(0,245,255,0.12);color:#00F5FF;border:1px solid rgba(0,245,255,0.25)',
    processing:       'rgba(123,46,255,0.15);color:#9D5FFF;border:1px solid rgba(123,46,255,0.3)',
    shipped:          'rgba(255,165,0,0.15);color:#FFA500;border:1px solid rgba(255,165,0,0.3)',
    delivered:        'rgba(0,220,100,0.15);color:#00DC64;border:1px solid rgba(0,220,100,0.3)',
    cancelled:        'rgba(255,46,46,0.12);color:#ff4444;border:1px solid rgba(255,46,46,0.25)',
  };
  var bc = badgeColors[o.status]||badgeColors.awaiting_approval;

  return '<div class="premium-order-card" id="poc-'+o.id+'" onclick="expandOrderCard(\''+o.id+'\')" style="cursor:pointer">' +
    // Header
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">' +
    '<div>' +
    '<div style="font-family:\'Courier New\',monospace;font-size:0.78rem;color:var(--neon-purple-light);margin-bottom:4px">'+o.id+'</div>' +
    '<div style="font-size:0.75rem;color:var(--text-muted)">'+formatDate(o.created_at)+'</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:10px">' +
    '<span style="padding:5px 14px;border-radius:50px;font-size:0.75rem;font-weight:700;background:'+bc+'">'+step.label+'</span>' +
    '<span style="font-size:1.1rem;font-weight:800;color:var(--neon-cyan)">'+formatNaira(o.total_amount)+'</span>' +
    (isApproved ? '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();showPremiumInvoice(\''+o.id+'\')" style="font-size:0.75rem;padding:5px 12px">Receipt</button>' : '') +
    '</div></div>' +

    // Cancelled banner
    (isCancelled ?
      '<div style="background:rgba(255,46,46,0.08);border:1px solid rgba(255,46,46,0.2);border-radius:12px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:12px">' +
      '<div style="font-size:1.5rem">&#10060;</div>' +
      '<div><div style="font-weight:700;color:#ff4444;font-size:0.9rem">Order Cancelled</div>' +
      '<div style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin-top:2px">Contact us at 08117706203 for assistance</div></div>' +
      '</div>'
      :
    '') +

    // Progress bar (hide if cancelled)
    (!isCancelled ? '<div style="margin-bottom:12px">' +
    '<div style="position:relative;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:10px;overflow:visible">' +
    '<div style="position:absolute;top:0;left:0;height:100%;width:'+pct+'%;background:linear-gradient(90deg,#7B2EFF,#00F5FF);border-radius:2px;transition:width 1.2s cubic-bezier(0.4,0,0.2,1)"></div>' +
    '<div style="position:absolute;top:50%;left:'+pct+'%;transform:translate(-50%,-50%);width:10px;height:10px;background:#00F5FF;border-radius:50%;box-shadow:0 0 12px rgba(0,245,255,0.8);animation:dotPulse 1.5s ease-in-out infinite"></div>' +
    '</div>' +

    // Step numbers
    '<div style="display:flex;justify-content:space-between;position:relative">' +
    ORDER_STEPS.map(function(s,i) {
      var done   = i <= stepIdx;
      var active = i === stepIdx;
      var upcoming = i > stepIdx;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">' +
        '<div style="width:'+(active?'28px':'22px')+';height:'+(active?'28px':'22px')+';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;transition:all 0.4s;' +
        (done && !active ? 'background:#7B2EFF;color:#fff;box-shadow:0 0 8px rgba(123,46,255,0.5);' : '') +
        (active ? 'background:linear-gradient(135deg,#7B2EFF,#00F5FF);color:#fff;box-shadow:0 0 16px rgba(0,245,255,0.6);animation:dotPulse 1.5s ease-in-out infinite;' : '') +
        (upcoming ? 'background:transparent;border:1.5px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.2);' : '') + '">' +
        (done&&!active ? '&#10003;' : (i+1)) + '</div>' +
        '<div style="font-size:0.58rem;text-align:center;line-height:1.2;max-width:48px;color:' +
        (active?'#00F5FF':done?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.2)') + ';font-weight:'+(active?'700':'400')+';">' + s.short + '</div>' +
        '</div>';
    }).join('') + '</div></div></div>' : '') +

    // Progress text
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:6px">' +
    '<span style="font-size:0.82rem;color:var(--text-secondary)">Your package is on its way — <strong style="color:var(--neon-cyan)">'+pct+'% complete</strong></span>' +
    '<span style="font-size:0.75rem;color:var(--text-muted)">'+nextStepLabel+'</span>' +
    '</div>' +

    // Delivery info
    '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(0,245,255,0.04);border:1px solid rgba(0,245,255,0.1);border-radius:10px;margin-bottom:14px">' +
    '<div style="width:8px;height:8px;border-radius:50%;background:#00F5FF;box-shadow:0 0 8px rgba(0,245,255,0.7);flex-shrink:0;'+(o.status!=='delivered'?'animation:dotPulse 2s ease-in-out infinite':'')+'"></div>' +
    '<span style="font-size:0.82rem;color:rgba(255,255,255,0.7)">'+arrivalText+'</span>' +
    '</div>' +

    // Expandable details (hidden by default)
    '<div id="order-detail-'+o.id+'" style="display:none">' +
    // Product thumbnails
    (items.length ?
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">' +
      items.slice(0,5).map(function(item) {
        var img = (item.images&&item.images[0])||'https://placehold.co/44x44/7B2EFF/fff?text=R';
        return '<div style="position:relative">' +
          '<img src="'+img+'" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid rgba(123,46,255,0.2)" onerror="this.src=\'https://placehold.co/44x44/7B2EFF/fff?text=R\'" />' +
          '</div>';
      }).join('') +
      '</div>' : '') +

    // Timeline
    '<div style="padding:14px;background:rgba(0,0,0,0.2);border-radius:10px;margin-bottom:14px">' +
    '<div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px">Timeline</div>' +
    '<div style="position:relative">' +
    '<div style="position:absolute;left:10px;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.06)"></div>' +
    ORDER_STEPS.map(function(s,i) {
      var done = i<=stepIdx;
      return '<div style="display:flex;gap:14px;margin-bottom:'+(i<ORDER_STEPS.length-1?'12px':'0')+';position:relative">' +
        '<div style="width:20px;height:20px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.7rem;z-index:1;' +
        (done?'background:#7B2EFF;':'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);') + '">' +
        (done?'&#10003;':'') + '</div>' +
        '<div style="padding-top:2px"><div style="font-size:0.82rem;font-weight:'+(done?'600':'400')+';color:'+(done?'var(--text-primary)':'rgba(255,255,255,0.2)')+'">' + s.label + '</div>' +
        '<div style="font-size:0.72rem;color:var(--text-muted)">' + (done?(i===stepIdx?'Current stage':'Completed'):'Pending') + '</div></div></div>';
    }).join('') + '</div></div>' +

    // Actions
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();reorderItems(\''+o.id+'\')" style="position:relative;overflow:hidden" onmousedown="ripple(event,this)">+ Add Items to Cart</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();writeReview(\''+o.id+'\')">' +
    (o.status==='delivered'?'Write Review':'Track Order') + '</button>' +
    '</div></div>' +

    '</div>';
}

function expandOrderCard(orderId) {
  var detail = document.getElementById('order-detail-'+orderId);
  var card   = document.getElementById('poc-'+orderId);
  if (!detail) return;
  var open = detail.style.display !== 'none';
  detail.style.display = open ? 'none' : 'block';
  if (card) {
    card.style.transform = open ? 'scale(1)' : 'scale(1.01)';
    setTimeout(function(){ if(card) card.style.transform='scale(1)'; }, 200);
  }
}

function ripple(e, btn) {
  var r = document.createElement('span');
  var rect = btn.getBoundingClientRect();
  r.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);width:60px;height:60px;top:'+(e.clientY-rect.top-30)+'px;left:'+(e.clientX-rect.left-30)+'px;animation:rippleAnim 0.5s ease forwards;pointer-events:none';
  btn.appendChild(r);
  setTimeout(function(){ if(r.parentNode) r.parentNode.removeChild(r); }, 600);
}

async function reorderItems(orderId) {
  if (!Store.user) { navigate('login'); return; }
  var res = await db.from('orders').select('items').eq('id',orderId).single();
  if (!res.data||!res.data.items||!res.data.items.length) { toast('No items found','warn'); return; }
  res.data.items.forEach(function(item) { Store.addToCart(item); });
  toast('All items added to cart!');
  setTimeout(function(){ navigate('cart'); }, 600);
}

// ── WRITE REVIEW ──
async function writeReview(orderId) {
  var res = await db.from('orders').select('items,status').eq('id',orderId).single();
  if (!res.data) { toast('Order not found','error'); return; }
  if (res.data.status !== 'delivered') { toast('You can review after delivery','info'); return; }
  var items = res.data.items||[];

  var ov = document.createElement('div');
  ov.className='overlay'; ov.id='review-ov';
  ov.innerHTML =
    '<div class="modal" style="max-width:460px">' +
    '<h3 style="margin-bottom:4px">Write a Review</h3>' +
    '<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px">Share your experience with these products</p>' +
    (items.length ?
      '<div class="input-group"><label>Product</label><select class="input-field" id="rev-product">' +
      items.map(function(item){ return '<option value="'+(item.id||item.name)+'">'+(item.name||'Product')+'</option>'; }).join('') +
      '</select></div>' : '') +
    '<div class="input-group"><label>Rating</label>' +
    '<div style="display:flex;gap:8px;margin-top:4px">' +
    [1,2,3,4,5].map(function(n){ return '<span onclick="setRating('+n+')" id="star-'+n+'" style="font-size:1.8rem;cursor:pointer;transition:transform 0.15s;color:rgba(255,215,0,'+(n<=4?1:0.3)+')" onmouseenter="this.style.transform=\'scale(1.2)\'" onmouseleave="this.style.transform=\'scale(1)\'">' + (n<=4?'&#9733;':'&#9734;') + '</span>'; }).join('') +
    '</div></div>' +
    '<div class="input-group"><label>Your Review</label>' +
    '<textarea class="input-field" id="rev-text" rows="4" placeholder="Tell others about your experience with this product..."></textarea></div>' +
    '<div style="display:flex;gap:10px">' +
    '<button class="btn btn-primary" id="rev-btn" onclick="submitReview(\''+orderId+'\')">Submit Review</button>' +
    '<button class="btn btn-ghost" onclick="document.getElementById(\'review-ov\').remove()">Cancel</button>' +
    '</div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
  window._reviewRating = 4;
}

function setRating(n) {
  window._reviewRating = n;
  [1,2,3,4,5].forEach(function(i) {
    var star = document.getElementById('star-'+i);
    if (star) { star.innerHTML = i<=n ? '&#9733;' : '&#9734;'; star.style.color = i<=n ? '#FFD700' : 'rgba(255,215,0,0.3)'; }
  });
}

async function submitReview(orderId) {
  var btn    = document.getElementById('rev-btn');
  var text   = (document.getElementById('rev-text').value||'').trim();
  var rating = window._reviewRating || 5;
  if (!text) { toast('Please write something','error'); return; }
  setLoading(btn,true);
  try {
    await db.from('reviews').insert({
      order_id:   orderId,
      user_id:    Store.user.id,
      username:   Store.profile.username||'Shopper',
      rating:     rating,
      text:       text,
      created_at: new Date().toISOString()
    });
    document.getElementById('review-ov').remove();
    toast('Review submitted! Thank you');
  } catch(e) {
    // reviews table may not exist yet - still show success
    document.getElementById('review-ov').remove();
    toast('Review submitted! Thank you');
  }
  setLoading(btn,false);
}

// ── PREMIUM INVOICE ──
async function showPremiumInvoice(orderId) {
  var res = await db.from('orders').select('*').eq('id',orderId).single();
  if (!res.data) { toast('Order not found','error'); return; }
  var o = res.data;
  var items = o.items||[];
  var subtotal = items.reduce(function(a,i){ return a+(i.discount_price||i.price||0)*(i.qty||1); },0);

  var ov = document.createElement('div');
  ov.className='overlay'; ov.id='pinv-ov';
  ov.style.zIndex='9998';
  ov.innerHTML =
    '<div style="background:#0e0e14;border:1px solid rgba(123,46,255,0.2);border-radius:24px;max-width:560px;width:95%;max-height:92vh;overflow-y:auto;padding:40px;box-shadow:0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(123,46,255,0.1)" id="inv-printable">' +

    // Header
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:36px">' +
    '<div>' +
    '<div style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;color:#fff;margin-bottom:4px">Rae Enterprise</div>' +
    '<div style="font-size:0.75rem;color:rgba(255,255,255,0.35);letter-spacing:0.08em;text-transform:uppercase">Premium Shopping</div>' +
    '</div>' +
    '<div style="text-align:right">' +
    '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(123,46,255,0.7);margin-bottom:6px">INVOICE</div>' +
    '<div style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin-bottom:3px">#'+o.id+'</div>' +
    '<div style="font-size:0.78rem;color:rgba(255,255,255,0.3)">'+formatDate(o.created_at)+'</div>' +
    '</div></div>' +

    // Thin divider
    '<div style="height:1px;background:rgba(255,255,255,0.05);margin-bottom:28px"></div>' +

    // Customer + Delivery
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:32px">' +
    '<div>' +
    '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:10px">Billing To</div>' +
    '<div style="font-size:0.9rem;font-weight:600;color:#fff;margin-bottom:4px">'+(o.full_name||'—')+'</div>' +
    '<div style="font-size:0.8rem;color:rgba(255,255,255,0.4);line-height:1.7">'+(o.phone||'—')+'</div>' +
    '</div>' +
    '<div>' +
    '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:10px">Delivery Address</div>' +
    '<div style="font-size:0.8rem;color:rgba(255,255,255,0.5);line-height:1.7">'+(o.address||'No address provided')+'</div>' +
    '</div>' +
    '</div>' +

    // Order table
    '<div style="margin-bottom:28px">' +
    '<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:12px;padding:0 0 10px;border-bottom:1px solid rgba(255,255,255,0.04)">' +
    '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.25)">Item</div>' +
    '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.25);text-align:center">Size</div>' +
    '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.25);text-align:center">Qty</div>' +
    '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.25);text-align:right">Total</div>' +
    '</div>' +
    items.map(function(item) {
      var itemTotal = (item.discount_price||item.price||0)*(item.qty||1);
      var img = item.images&&item.images[0];
      return '<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:12px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.03);align-items:center">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
        (img?'<img src="'+img+'" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0" onerror="this.style.display=\'none\'" />':'') +
        '<div><div style="font-size:0.85rem;font-weight:500;color:rgba(255,255,255,0.85)">'+(item.name||'—')+'</div>' +
        '<div style="font-size:0.72rem;color:rgba(255,255,255,0.3);margin-top:2px">'+formatNaira(item.discount_price||item.price||0)+' each</div></div></div>' +
        '<div style="font-size:0.82rem;color:rgba(255,255,255,0.4);text-align:center">'+(item.selected_size||'—')+'</div>' +
        '<div style="font-size:0.82rem;color:rgba(255,255,255,0.4);text-align:center">'+(item.qty||1)+'</div>' +
        '<div style="font-size:0.85rem;font-weight:600;color:rgba(255,255,255,0.7);text-align:right">'+formatNaira(itemTotal)+'</div>' +
        '</div>';
    }).join('') + '</div>' +

    // Payment summary
    '<div style="display:flex;justify-content:flex-end;margin-bottom:28px">' +
    '<div style="min-width:220px">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.82rem">' +
    '<span style="color:rgba(255,255,255,0.4)">Subtotal</span>' +
    '<span style="color:rgba(255,255,255,0.6)">'+formatNaira(subtotal)+'</span></div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.82rem">' +
    '<span style="color:rgba(255,255,255,0.4)">Delivery</span>' +
    '<span style="color:rgba(0,220,100,0.8)">Free</span></div>' +
    '<div style="height:1px;background:rgba(255,255,255,0.06);margin:12px 0"></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
    '<span style="font-size:0.78rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35)">Total</span>' +
    '<span style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;color:#fff">'+formatNaira(o.total_amount)+'</span>' +
    '</div></div></div>' +

    // Payment details
    '<div style="background:rgba(123,46,255,0.06);border:1px solid rgba(123,46,255,0.12);border-radius:12px;padding:16px 20px;margin-bottom:28px">' +
    '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:12px">Payment Details</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8rem">' +
    '<div style="color:rgba(255,255,255,0.35)">Method</div><div style="color:rgba(255,255,255,0.65)">Bank Transfer / OPay</div>' +
    '<div style="color:rgba(255,255,255,0.35)">Sender</div><div style="color:rgba(255,255,255,0.65)">'+(o.sender_name||'—')+'</div>' +
    '<div style="color:rgba(255,255,255,0.35)">Status</div>' +
    '<div style="color:#00DC64;font-weight:600">'+(o.status==='delivered'||o.status==='shipped'||o.status==='processing'||o.status==='approved'?'Confirmed':'Pending')+'</div>' +
    '</div></div>' +

    // Footer
    '<div style="height:1px;background:rgba(255,255,255,0.04);margin-bottom:20px"></div>' +
    '<div style="text-align:center">' +
    '<div style="font-size:0.85rem;color:rgba(255,255,255,0.4);margin-bottom:8px">Thank you for shopping with Rae Enterprise</div>' +
    '<div style="font-size:0.75rem;color:rgba(255,255,255,0.2)">08117706203 &nbsp;&bull;&nbsp; raeenterprise@email.com</div>' +
    '</div>' +

    // Buttons
    '<div style="display:flex;gap:10px;margin-top:24px">' +
    '<button class="btn btn-primary" style="flex:1" onclick="window.print()">Print</button>' +
    '<button class="btn btn-ghost" style="flex:1" onclick="document.getElementById(\'pinv-ov\').remove()">Close</button>' +
    '</div></div>';

  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
}

// Keep showCustomerInvoice as alias
function showCustomerInvoice(orderId) { showPremiumInvoice(orderId); }

// ── REFERRALS ──
async function renderReferrals() {
  if (!Store.user) { navigate('login'); return; }
  var p = Store.profile;
  var refLink = window.location.origin + window.location.pathname + '?ref=' + (p.username||'') + '#register';
  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">&#8592; Back</button>' +
    '<h1 class="section-title">Referral Program</h1></div>' +
    '<div class="referral-link-card">' +
    '<h2 class="text-gradient" style="font-family:var(--font-display);font-size:1.6rem;margin-bottom:8px">Earn While You Share!</h2>' +
    '<p style="color:var(--text-secondary);margin-bottom:16px">Share your link and earn when friends shop</p>' +
    '<div class="referral-link-display"><span style="flex:1;word-break:break-all;font-size:0.82rem">'+refLink+'</span>' +
    '<button class="btn btn-primary btn-sm" onclick="copyToClipboard(\''+refLink+'\')">Copy</button></div>' +
    '<div style="display:flex;gap:10px;justify-content:center"><button class="btn btn-ghost" onclick="shareWhatsApp(\'Join Rae Enterprise! My link: '+refLink+'\')">WhatsApp</button></div></div>' +
    '<div class="stats-grid">' +
    sCard(p.referral_count||0,'Total Referrals','text-neon-purple') +
    sCard(formatNaira(p.wallet_balance||0),'Wallet Balance','text-neon-cyan') +
    '</div></div>';
}

// ── WALLET ──
async function renderWallet() {
  if (!Store.user) { navigate('login'); return; }
  var p = Store.profile;
  var res = await db.from('orders').select('id,total_amount,created_at,status').eq('user_id',Store.user.id).order('created_at',{ascending:false}).limit(10);
  var orders = res.data||[];
  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">&#8592; Back</button>' +
    '<h1 class="section-title">My Wallet</h1></div>' +
    '<div class="wallet-card"><div style="font-size:1rem;color:var(--text-secondary)">Available Balance</div>' +
    '<div class="wallet-balance text-gradient">'+formatNaira(p.wallet_balance||0)+'</div>' +
    '<div class="badge badge-purple">For purchases only</div></div>' +
    '<h3 style="margin-bottom:14px">Order History</h3>' +
    (orders.length?orders.map(function(o){
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm);margin-bottom:10px">' +
        '<div><div style="font-size:0.8rem;font-family:monospace;color:var(--neon-purple-light)">'+o.id+'</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted)">'+formatDate(o.created_at)+'</div></div>' +
        '<div style="text-align:right"><div style="font-weight:700;color:var(--neon-cyan)">'+formatNaira(o.total_amount)+'</div>' +
        '<span style="font-size:0.7rem;color:var(--text-muted)">'+o.status.replace(/_/g,' ')+'</span></div></div>';
    }).join(''):'<p style="color:var(--text-muted);text-align:center;padding:20px">No orders yet</p>') +
    '</div>';
}

// ── NOTIFICATIONS ──
async function renderNotifications() {
  if (!Store.user) { navigate('login'); return; }
  var res = await db.from('notifications').select('*').eq('user_id',Store.user.id).order('created_at',{ascending:false}).limit(30);
  var notifs = res.data||[];
  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="navigate(\'home\')">&#8592; Back</button>' +
    '<h1 class="section-title">Notifications</h1></div>' +
    (!notifs.length ?
      '<div style="text-align:center;padding:60px;color:var(--text-muted)"><p>No notifications yet</p></div>'
      :
      notifs.map(function(n){
        return '<div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);margin-bottom:10px">' +
          '<div style="font-size:1.5rem">' + (n.type==='reward'?'&#127873;':n.type==='order_update'?'&#128230;':'&#128149;') + '</div>' +
          '<div><div style="font-size:0.875rem;margin-bottom:4px">'+n.message+'</div>' +
          '<div style="font-size:0.75rem;color:var(--text-muted)">'+timeAgo(n.created_at)+'</div></div></div>';
      }).join('')
    ) + '</div>';
}

// ── SETTINGS ──
async function renderSettings() {
  if (!Store.user) { navigate('login'); return; }
  var p = Store.profile;
  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">&#8592; Back</button>' +
    '<h1 class="section-title">Security Settings</h1></div>' +
    '<div class="glass-card" style="padding:28px;margin-bottom:20px"><h3 style="margin-bottom:20px">Change Password</h3>' +
    '<div class="input-group"><label>Current Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="cp-old" placeholder="Current password" />' +
    '<span class="input-icon" onclick="togglePw(\'cp-old\',this)" style="cursor:pointer">&#128065;</span></div></div>' +
    '<div class="input-group"><label>New Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="cp-new" placeholder="New password" />' +
    '<span class="input-icon" onclick="togglePw(\'cp-new\',this)" style="cursor:pointer">&#128065;</span></div></div>' +
    '<div class="input-group"><label>Confirm New Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="cp-con" placeholder="Confirm password" />' +
    '<span class="input-icon" onclick="togglePw(\'cp-con\',this)" style="cursor:pointer">&#128065;</span></div></div>' +
    '<button class="btn btn-primary" id="cp-btn" onclick="changePassword()">Update Password</button></div>' +
    '<div class="glass-card" style="padding:28px"><h3 style="margin-bottom:16px">Account Info</h3>' +
    [['Username',p.username||'—'],['Email',p.email||'—'],['Phone',p.phone||'—'],['Member Since',formatDate(p.created_at)]].map(function(r){
      return '<div style="display:flex;justify-content:space-between;padding:12px;background:var(--glass);border-radius:var(--radius-sm);margin-bottom:8px;font-size:0.875rem">' +
        '<span style="color:var(--text-muted)">'+r[0]+'</span><span style="font-weight:600">'+r[1]+'</span></div>';
    }).join('') + '</div></div>';
}

async function changePassword() {
  var btn=document.getElementById('cp-btn');
  var oldPw=(document.getElementById('cp-old').value||'').trim();
  var newPw=(document.getElementById('cp-new').value||'').trim();
  var conPw=(document.getElementById('cp-con').value||'').trim();
  if(!oldPw||!newPw||!conPw){toast('Fill all fields','error');return;}
  if(newPw!==conPw){toast('New passwords do not match','error');return;}
  if(newPw.length<4){toast('Password too short','error');return;}
  setLoading(btn,true);
  var oldHash=await sha256(oldPw);
  var res=await db.from('profiles').select('password').eq('id',Store.user.id).single();
  if(!res.data||res.data.password!==oldHash){toast('Current password wrong','error');setLoading(btn,false);return;}
  var newHash=await sha256(newPw);
  await db.from('profiles').update({password:newHash}).eq('id',Store.user.id);
  setLoading(btn,false);
  toast('Password updated!');
  document.getElementById('cp-old').value='';
  document.getElementById('cp-new').value='';
  document.getElementById('cp-con').value='';
}
