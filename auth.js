// RAE ENTERPRISE — Auth
// Username + password against profiles table
// Password protected with SHA-256 (Web Crypto — works in all browsers)

async function sha256(str) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function(b){ return ('00'+b.toString(16)).slice(-2); }).join('');
}

function renderAuth(mode) {
  mode = mode || 'login';
  document.getElementById('app').innerHTML =
    '<div class="auth-page page-enter">' +
    '<div class="auth-left"><div class="auth-illustration">' +
    '<div class="auth-mascot"><img src="logo.png" alt="Rae" onerror="this.style.display=\'none\'" /></div>' +
    '<h2 class="text-gradient">Shop Smarter.<br/>Live Prettier.</h2>' +
    '<p style="color:var(--text-secondary);line-height:1.7">Luxury deals, referral rewards & exclusive drops \u2728</p>' +
    '<div class="auth-features">' +
    '<div class="auth-feature"><span class="auth-feature-icon">💜</span> Earn up to \u20a610,000 per referral</div>' +
    '<div class="auth-feature"><span class="auth-feature-icon">\u2728</span> Bronze \u2192 Silver \u2192 Gold</div>' +
    '<div class="auth-feature"><span class="auth-feature-icon">🔥</span> Daily flash sales</div>' +
    '<div class="auth-feature"><span class="auth-feature-icon">🛡\ufe0f</span> Safe & trusted checkout</div>' +
    '</div></div></div>' +
    '<div class="auth-right"><div class="auth-card glow-border">' +
    '<div class="auth-header">' +
    '<div class="auth-welcome-headline" id="auth-hl">Welcome to Rae Enterprise \u2728</div>' +
    '<p style="color:var(--text-secondary);font-size:0.875rem">Your glamorous journey starts here \ud83d\udc85</p>' +
    '</div>' +
    '<div class="auth-tabs">' +
    '<button class="auth-tab '+(mode==='login'?'active':'')+'" onclick="renderAuth(\'login\')">Sign In</button>' +
    '<button class="auth-tab '+(mode==='register'?'active':'')+'" onclick="renderAuth(\'register\')">Join Free</button>' +
    '</div>' +
    (mode==='login' ? loginFormHTML() : registerFormHTML()) +
    '</div></div></div>';

  // Typing headline
  var hl = document.getElementById('auth-hl');
  if (hl) {
    var pp=['Welcome to Rae Enterprise \u2728','Hello Beautiful Shopper 💜','Discover Luxury Deals 🛍️','Your Glam Starts Here 💅','Shop. Slay. Repeat. 🌟'];
    var pi=0,ci=pp[0].length,dl=false;
    function tick(){
      if(!document.getElementById('auth-hl'))return;
      var p=pp[pi];
      if(!dl){hl.textContent=p.slice(0,++ci);if(ci===p.length){dl=true;setTimeout(tick,1800);return;}}
      else{hl.textContent=p.slice(0,--ci);if(ci===0){dl=false;pi=(pi+1)%pp.length;}}
      setTimeout(tick,dl?35:75);
    }
    setTimeout(tick,2000);
  }
}

function loginFormHTML() {
  return '<form onsubmit="doLogin(event)">' +
    '<div class="input-group"><label>Username</label>' +
    '<div class="input-wrapper"><input class="input-field" type="text" id="l-user" placeholder="your_username" required autocomplete="username"/>' +
    '<span class="input-icon">💜</span></div></div>' +
    '<div class="input-group"><label>Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="l-pw" placeholder="Your password" required autocomplete="current-password"/>' +
    '<span class="input-icon" onclick="togglePw(\'l-pw\',this)" style="cursor:pointer">👁</span></div></div>' +
    '<button type="submit" class="btn btn-primary btn-full btn-lg" id="l-btn">Sign In \u2728</button>' +
    '</form>' +
    '<div class="auth-footer">No account? <span style="color:var(--neon-purple-light);cursor:pointer;font-weight:700" onclick="renderAuth(\'register\')">Join free!</span></div>' +
    '<div style="text-align:center;margin-top:20px">' +
    '<span onclick="openAdminModal()" style="font-size:1.5rem;cursor:pointer;opacity:0.15;transition:opacity 0.3s;user-select:none;display:inline-block" onmouseenter="this.style.opacity=\'0.45\'" onmouseleave="this.style.opacity=\'0.15\'">\u2699\ufe0f</span>' +
    '</div>';
}

function registerFormHTML() {
  return '<form onsubmit="doRegister(event)">' +
    '<div class="input-group"><label>Username</label>' +
    '<div class="input-wrapper"><input class="input-field" type="text" id="r-user" placeholder="your_glamorous_name" required minlength="3" autocomplete="username"/>' +
    '<span class="input-icon">💜</span></div></div>' +
    '<div class="input-group"><label>Email</label>' +
    '<div class="input-wrapper"><input class="input-field" type="email" id="r-email" placeholder="gorgeous@email.com" required autocomplete="email"/>' +
    '<span class="input-icon">📧</span></div></div>' +
    '<div class="input-group"><label>Phone</label>' +
    '<div class="input-wrapper"><input class="input-field" type="tel" id="r-phone" placeholder="08012345678" required/>' +
    '<span class="input-icon">📱</span></div></div>' +
    '<div class="input-group"><label>Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="r-pw" placeholder="Choose a strong password" required minlength="4" autocomplete="new-password"/>' +
    '<span class="input-icon" onclick="togglePw(\'r-pw\',this)" style="cursor:pointer">👁</span></div>' +
    '<div class="password-strength"><div class="strength-bar"><div class="strength-fill" id="s-fill" style="width:0%"></div></div>' +
    '<span id="s-lbl" style="font-size:0.75rem;color:var(--text-muted)"></span></div></div>' +
    '<div class="input-group"><label>Referral Code <span style="color:var(--text-muted);font-weight:400">(optional)</span></label>' +
    '<div class="input-wrapper"><input class="input-field" type="text" id="r-ref" placeholder="Friend\'s username"/>' +
    '<span class="input-icon">🎁</span></div></div>' +
    '<button type="submit" class="btn btn-primary btn-full btn-lg" id="r-btn">Create Account \u2728</button>' +
    '</form>' +
    '<div class="auth-footer">Have account? <span style="color:var(--neon-purple-light);cursor:pointer;font-weight:700" onclick="renderAuth(\'login\')">Sign in</span></div>';
}

// ── REGISTER ─────────────────────────────────────────
async function doRegister(e) {
  e.preventDefault();
  var btn      = document.getElementById('r-btn');
  var username = (document.getElementById('r-user').value  || '').trim();
  var email    = (document.getElementById('r-email').value || '').trim().toLowerCase();
  var phone    = (document.getElementById('r-phone').value || '').trim();
  var password = (document.getElementById('r-pw').value    || '').trim();
  var refBy    = (document.getElementById('r-ref').value   || '').trim();

  if (!username || !email || !phone || !password) {
    toast('Please fill all fields 💔', 'error'); return;
  }

  setLoading(btn, true);

  try {
    // Check username not taken
    var uChk = await db.from('profiles').select('id').eq('username', username);
    if (uChk.data && uChk.data.length > 0) {
      toast('Username taken — try another 💔', 'error');
      setLoading(btn, false); return;
    }

    // Check email not taken
    var eChk = await db.from('profiles').select('id').eq('email', email);
    if (eChk.data && eChk.data.length > 0) {
      toast('Email already registered — please sign in 💜', 'warn');
      setLoading(btn, false); renderAuth('login'); return;
    }

    // Hash password with SHA-256
    var hashed = await sha256(password);

    // Insert user
    var ins = await db.from('profiles').insert({
      username:       username,
      email:          email,
      phone:          phone,
      password:       hashed,
      referred_by:    refBy || null,
      role:           'user',
      wallet_balance: 0,
      total_spent:    0,
      referral_count: 0,
      created_at:     new Date().toISOString()
    }).select().single();

    if (ins.error || !ins.data) {
      var errMsg = ins.error ? ins.error.message : 'Insert failed';
      // If still RLS error, show clear instructions
      if (errMsg.toLowerCase().indexOf('security') !== -1 || errMsg.toLowerCase().indexOf('policy') !== -1) {
        toast('Database not set up yet! Please run supabase_setup.sql first.', 'error');
      } else {
        toast('Registration failed: ' + errMsg, 'error');
      }
      setLoading(btn, false); return;
    }

    // Credit referrer
    if (refBy) {
      try {
        var rr = await db.from('profiles').select('id,referral_count').eq('username', refBy).single();
        if (rr.data) await db.from('profiles').update({ referral_count: (rr.data.referral_count||0)+1 }).eq('id', rr.data.id);
      } catch(re) {}
    }

    // Log in
    Store.user = ins.data; Store.profile = ins.data;
    sessionStorage.setItem('rae_uid', ins.data.id);
    await Store.loadCart();
    renderNavbar();
    setLoading(btn, false);
    toast('Welcome to the family! 💜\u2728');
    navigate('home');

  } catch(err) {
    setLoading(btn, false);
    toast('Error: ' + (err.message || 'unknown'), 'error');
    console.error(err);
  }
}

// ── LOGIN ─────────────────────────────────────────────
async function doLogin(e) {
  e.preventDefault();
  var btn      = document.getElementById('l-btn');
  var username = (document.getElementById('l-user').value || '').trim();
  var password = (document.getElementById('l-pw').value   || '').trim();

  if (!username || !password) {
    toast('Enter username and password 💔', 'error'); return;
  }

  setLoading(btn, true);

  try {
    // Hash the entered password
    var hashed = await sha256(password);

    // Check username exists first
    var uRes = await db.from('profiles').select('id,password').eq('username', username).single();

    if (uRes.error || !uRes.data) {
      toast('Username not found 💔 Please register first.', 'error');
      setLoading(btn, false); return;
    }

    // Compare hashed passwords
    if (uRes.data.password !== hashed) {
      toast('Wrong password 💔 Please try again.', 'error');
      setLoading(btn, false); return;
    }

    // Fetch full profile
    var full = await db.from('profiles').select('*').eq('username', username).single();
    Store.user = full.data; Store.profile = full.data;
    sessionStorage.setItem('rae_uid', full.data.id);
    await Store.loadCart();
    renderNavbar();
    setLoading(btn, false);
    toast('Welcome back, gorgeous! 💜');
    navigate('home');

  } catch(err) {
    setLoading(btn, false);
    toast('Error: ' + (err.message || 'unknown'), 'error');
    console.error(err);
  }
}

function togglePw(id, icon) {
  var el = document.getElementById(id); if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
  icon.textContent = el.type === 'password' ? '👁' : '🙈';
}

// Password strength meter
document.addEventListener('input', function(e) {
  if (e.target.id !== 'r-pw') return;
  var pw = e.target.value;
  var s = 0;
  if (pw.length >= 6) s++; if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
  var lvl = [{p:'0%',c:'transparent',t:''},{p:'25%',c:'#ff4444',t:'Weak'},{p:'50%',c:'#ffaa00',t:'Fair'},{p:'75%',c:'#7B2EFF',t:'Good 💜'},{p:'100%',c:'#00F5FF',t:'Strong 💪'}][s];
  var f=document.getElementById('s-fill'), l=document.getElementById('s-lbl');
  if(f){f.style.width=lvl.p;f.style.background=lvl.c;}
  if(l)l.textContent=lvl.t;
});


// ── Secret Admin Modal ──
function openAdminModal() {
  var ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'admin-modal-ov';
  ov.style.zIndex = '9999';
  ov.innerHTML =
    '<div class="modal" style="max-width:360px">' +
    '<div style="text-align:center;margin-bottom:20px">' +
    '<div style="font-size:2rem;margin-bottom:6px">\u2699\ufe0f</div>' +
    '<h3 class="text-gradient" style="font-family:var(--font-display)">Admin Access</h3>' +
    '</div>' +
    '<div class="input-group"><label>Username</label>' +
    '<input class="input-field" type="text" id="am-u" placeholder="Admin username" autocomplete="off" /></div>' +
    '<div class="input-group"><label>Password</label>' +
    '<div class="input-wrapper">' +
    '<input class="input-field" type="password" id="am-p" placeholder="Admin password" autocomplete="off" onkeydown="if(event.key===\'Enter\')submitAdminModal()" />' +
    '<span class="input-icon" onclick="togglePw(\'am-p\',this)" style="cursor:pointer">\ud83d\udc41</span>' +
    '</div></div>' +
    '<div style="display:flex;gap:10px;margin-top:4px">' +
    '<button class="btn btn-primary" style="flex:1" onclick="submitAdminModal()">\u2192 Enter</button>' +
    '<button class="btn btn-ghost" style="flex:1" onclick="document.getElementById(\'admin-modal-ov\').remove()">Cancel</button>' +
    '</div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
  setTimeout(function(){ var el=document.getElementById('am-u'); if(el) el.focus(); }, 100);
}

function submitAdminModal() {
  var u = (document.getElementById('am-u').value || '').trim();
  var p = (document.getElementById('am-p').value || '').trim();
  if (u === 'Chinedu' && p === 'Jopoboy2010.') {
    adminAuthed = true;
    try { sessionStorage.setItem('rae_admin','1'); } catch(e){}
    document.getElementById('admin-modal-ov').remove();
    toast('Welcome, Admin Chinedu! \ud83d\udc9c');
    navigate('admin');
  } else {
    toast('Wrong credentials \ud83d\udc94', 'error');
    var el = document.getElementById('am-p');
    if(el){ el.value=''; el.style.borderColor='var(--neon-pink)'; setTimeout(function(){ el.style.borderColor=''; },1000); }
  }
}
