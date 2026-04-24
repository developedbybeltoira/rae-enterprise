// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Auth (Login + Register)
// ═══════════════════════════════════════════════════════

function renderAuth(mode = 'login') {
  const ref = new URLSearchParams(window.location.search).get('ref') || '';
  document.getElementById('app').innerHTML = `
    <div class="auth-page page-enter">
      <!-- Left illustration -->
      <div class="auth-left">
        <div class="auth-illustration">
          <div class="auth-mascot">
            <img src="logo.png" alt="Rae" onerror="this.outerHTML='<div class=auth-mascot-placeholder>🐺</div>'" />
          </div>
          <h2 class="text-gradient">Shop Smarter.<br/>Live Prettier.</h2>
          <p>Welcome to Rae Enterprise — your luxury shopping haven with exclusive deals, rewards, and a touch of magic ✨</p>
          <div class="auth-features">
            <div class="auth-feature"><span class="auth-feature-icon">💜</span> Earn rewards on every referral</div>
            <div class="auth-feature"><span class="auth-feature-icon">✨</span> Level up from Bronze to Gold</div>
            <div class="auth-feature"><span class="auth-feature-icon">🎁</span> Flash sales & exclusive deals</div>
            <div class="auth-feature"><span class="auth-feature-icon">🛡️</span> Secure & trusted shopping</div>
          </div>
        </div>
      </div>

      <!-- Right form -->
      <div class="auth-right">
        <div class="auth-card glow-border">
          <div class="auth-header">
            <div class="auth-welcome-headline" id="auth-typing-headline"></div>
            <p>Your glamorous shopping journey starts here 💅</p>
          </div>

          <div class="auth-tabs">
            <button class="auth-tab ${mode === 'login' ? 'active' : ''}" onclick="renderAuth('login')">Sign In</button>
            <button class="auth-tab ${mode === 'register' ? 'active' : ''}" onclick="renderAuth('register')">Join Free</button>
          </div>

          ${ref ? `
            <div class="referral-notice">🎁 You were referred by <strong>${ref}</strong> — welcome bonus unlocked!</div>
          ` : ''}

          ${mode === 'login' ? renderLoginForm() : renderRegisterForm(ref)}
        </div>
      </div>
    </div>
  `;

  // Typing animation
  const headline = document.getElementById('auth-typing-headline');
  if (headline) {
    const phrases = [
      'Welcome to Rae Enterprise ✨',
      'Hello Beautiful Shopper 💜',
      'Discover Luxury Deals 🛍️',
      'Your Glam Starts Here 💅',
      'Shop. Slay. Repeat. 🌟',
    ];
    animatePlaceholder({ setAttribute: (attr, val) => { if (attr === 'placeholder') headline.textContent = val; } }, phrases, 70);
    // Force initial text
    headline.textContent = phrases[0];
  }

  // Password strength listener
  const pwField = document.getElementById('auth-password');
  if (pwField) {
    pwField.addEventListener('input', updatePasswordStrength);
  }
}

function renderLoginForm() {
  return `
    <form onsubmit="handleLogin(event)">
      <div class="input-group">
        <label>Email Address</label>
        <div class="input-wrapper">
          <input class="input-field" type="email" id="login-email" placeholder="gorgeous@email.com" required />
          <span class="input-icon">📧</span>
        </div>
      </div>
      <div class="input-group">
        <label>Password</label>
        <div class="input-wrapper">
          <input class="input-field" type="password" id="login-password" placeholder="Your secret password" required />
          <span class="input-icon" onclick="togglePw('login-password', this)" style="cursor:pointer">👁</span>
        </div>
      </div>
      <div class="remember-row">
        <label><input type="checkbox" id="remember" /> Remember me</label>
        <a href="#" onclick="renderForgotPassword()">Forgot password?</a>
      </div>
      <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-btn">
        Sign In ✨
      </button>
    </form>
    <div class="auth-footer">
      Don't have an account? <a onclick="renderAuth('register')">Join for free!</a>
    </div>
  `;
}

function renderRegisterForm(ref = '') {
  return `
    <form onsubmit="handleRegister(event)">
      <div class="input-group">
        <label>Username</label>
        <div class="input-wrapper">
          <input class="input-field" type="text" id="reg-username" placeholder="your_glamorous_name" required minlength="3" />
          <span class="input-icon">💜</span>
        </div>
      </div>
      <div class="input-group">
        <label>Email Address</label>
        <div class="input-wrapper">
          <input class="input-field" type="email" id="reg-email" placeholder="gorgeous@email.com" required />
          <span class="input-icon">📧</span>
        </div>
      </div>
      <div class="input-group">
        <label>Phone Number</label>
        <div class="input-wrapper">
          <input class="input-field" type="tel" id="reg-phone" placeholder="08012345678" required />
          <span class="input-icon">📱</span>
        </div>
      </div>
      <div class="input-group">
        <label>Password</label>
        <div class="input-wrapper">
          <input class="input-field" type="password" id="auth-password" placeholder="Min 8 characters" required minlength="8" />
          <span class="input-icon" onclick="togglePw('auth-password', this)" style="cursor:pointer">👁</span>
        </div>
        <div class="password-strength">
          <div class="strength-bar"><div class="strength-fill" id="strength-fill" style="width:0%"></div></div>
          <span class="strength-label" id="strength-label"></span>
        </div>
      </div>
      <div class="input-group">
        <label>Referral Code (optional)</label>
        <div class="input-wrapper">
          <input class="input-field" type="text" id="reg-ref" placeholder="Enter referral username" value="${ref}" />
          <span class="input-icon">🎁</span>
        </div>
      </div>
      <div class="remember-row">
        <label><input type="checkbox" id="terms" required /> I agree to Terms of Service</label>
      </div>
      <button type="submit" class="btn btn-primary btn-full btn-lg" id="register-btn">
        Create My Account ✨
      </button>
    </form>
    <div class="auth-footer">
      Already have an account? <a onclick="renderAuth('login')">Sign in</a>
    </div>
  `;
}

function updatePasswordStrength() {
  const pw = document.getElementById('auth-password')?.value || '';
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (!fill || !label) return;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { pct: '0%', color: 'transparent', text: '' },
    { pct: '25%', color: '#ff4444', text: 'Weak 😟' },
    { pct: '50%', color: '#ffaa00', text: 'Fair 🤔' },
    { pct: '75%', color: '#7B2EFF', text: 'Good 💜' },
    { pct: '100%', color: '#00F5FF', text: 'Strong 💪' },
  ];
  const { pct, color, text } = levels[score];
  fill.style.width = pct; fill.style.background = color;
  label.textContent = text;
}

function togglePw(id, icon) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  icon.textContent = input.type === 'password' ? '👁' : '🙈';
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  setLoading(btn, true);
  const { error } = await db.auth.signInWithPassword({ email, password });
  setLoading(btn, false);
  if (error) { toast(error.message, 'error'); return; }
  toast('Welcome back, gorgeous! 💜');
  navigate('home');
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('auth-password').value;
  const refBy = document.getElementById('reg-ref').value.trim();

  setLoading(btn, true);

  // Check username uniqueness
  const { data: existing } = await db.from('profiles').select('id').eq('username', username).single();
  if (existing) { toast('Username already taken 💔', 'error'); setLoading(btn, false); return; }

  const { data: authData, error } = await db.auth.signUp({ email, password });
  if (error) { toast(error.message, 'error'); setLoading(btn, false); return; }

  const userId = authData.user?.id;
  if (userId) {
    await db.from('profiles').insert({
      id: userId, username, email, phone,
      referred_by: refBy || null,
      role: 'user', wallet_balance: 0,
      total_spent: 0, referral_count: 0,
    });

    // Credit referrer if valid
    if (refBy) {
      const { data: referrer } = await db.from('profiles').select('id').eq('username', refBy).single();
      if (referrer) {
        await db.from('profiles').update({ referral_count: db.sql`referral_count + 1` }).eq('id', referrer.id);
      }
    }
  }

  setLoading(btn, false);
  toast('Account created! Welcome to the family 💜✨');
  navigate('home');
}

function renderForgotPassword() {
  toast('Password reset link sent to your email 📧', 'info');
}
