// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Dashboard, Orders, Referrals, Wallet
// ═══════════════════════════════════════════════════════

async function renderDashboard() {
  if (!Store.user) { navigate('login'); return; }
  const p = Store.profile;
  const level = getLevel(p?.total_spent || 0);
  const initials = p?.username?.slice(0, 2).toUpperCase() || '??';

  document.getElementById('app').innerHTML = `
    <div class="dashboard-page container page-enter">
      <div class="dashboard-header">
        <div class="dashboard-avatar">${initials}</div>
        <div>
          <div class="dashboard-name">${p?.username || 'Shopper'} <span class="${level.class}">${level.icon}</span></div>
          <div class="dashboard-level">
            <span class="badge badge-purple">${level.icon} ${level.name} Member</span>
            <span style="font-size:0.8rem;color:var(--text-muted)">${p?.email}</span>
          </div>
          <div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted)">📱 ${p?.phone || 'N/A'}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-icon">💰</div>
          <div class="stat-card-value text-neon-cyan">${formatNaira(p?.wallet_balance || 0)}</div>
          <div class="stat-card-label">Wallet Balance</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">🛍️</div>
          <div class="stat-card-value text-neon-purple">${formatNaira(p?.total_spent || 0)}</div>
          <div class="stat-card-label">Total Spent</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">👥</div>
          <div class="stat-card-value text-neon-pink">${p?.referral_count || 0}</div>
          <div class="stat-card-label">Referrals</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">${level.icon}</div>
          <div class="stat-card-value ${level.class}">${level.name}</div>
          <div class="stat-card-label">Current Level</div>
        </div>
      </div>

      <!-- Quick Nav -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px">
        <button class="btn btn-ghost" onclick="renderOrders()">📦 My Orders</button>
        <button class="btn btn-ghost" onclick="renderReferrals()">🎁 Referral Program</button>
        <button class="btn btn-ghost" onclick="renderWallet()">💰 Wallet</button>
        <button class="btn btn-ghost" onclick="navigate('home')">🛍️ Shop More</button>
      </div>

      <!-- Level Progress -->
      <div class="glass-card" style="padding:24px;margin-bottom:20px">
        <h3 style="margin-bottom:14px">Your Level Progress 🚀</h3>
        ${renderLevelProgress(p?.total_spent || 0)}
      </div>
    </div>
  `;
}

function renderLevelProgress(spent) {
  const tiers = [
    { name: 'Bronze', icon: '🥉', min: 0, max: 30000, class: 'level-bronze' },
    { name: 'Silver', icon: '🥈', min: 30000, max: 100000, class: 'level-silver' },
    { name: 'Gold', icon: '🥇', min: 100000, max: Infinity, class: 'level-gold' },
  ];
  const current = tiers.find((t, i) => spent >= t.min && (i === tiers.length - 1 || spent < tiers[i+1].min)) || tiers[0];
  const next = tiers[tiers.indexOf(current) + 1];
  const pct = next ? Math.min(100, ((spent - current.min) / (next.min - current.min)) * 100) : 100;

  return `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      ${tiers.map(t => `
        <div style="flex:1;text-align:center;opacity:${spent >= t.min ? 1 : 0.4}">
          <div style="font-size:1.8rem">${t.icon}</div>
          <div class="${t.class}" style="font-size:0.8rem;font-weight:700">${t.name}</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">${formatNaira(t.min)}+</div>
        </div>
      `).join('<div style="color:var(--text-muted)">→</div>')}
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.78rem;color:var(--text-muted)">
      <span>${formatNaira(spent)} spent</span>
      ${next ? `<span>${formatNaira(next.min - spent)} more to ${next.name} ${next.icon}</span>` : `<span class="text-gold">Max level reached! 🏆</span>`}
    </div>
  `;
}

async function renderOrders() {
  if (!Store.user) { navigate('login'); return; }
  const { data: orders } = await db.from('orders').select('*')
    .eq('user_id', Store.user.id).order('created_at', { ascending: false });

  const STATUS_STEPS = ['awaiting_approval', 'approved', 'processing', 'shipped', 'delivered'];

  document.getElementById('app').innerHTML = `
    <div class="dashboard-page container page-enter">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
        <button class="btn btn-ghost btn-sm" onclick="renderDashboard()">← Back</button>
        <h1 class="section-title">My Orders 📦</h1>
      </div>
      <div class="orders-list">
        ${!orders?.length ? `
          <div style="text-align:center;padding:60px;color:var(--text-muted)">
            <div style="font-size:3rem;margin-bottom:12px">📦</div>
            <p>No orders yet. Time to shop! 🛍️</p>
            <button class="btn btn-primary" style="margin-top:16px" onclick="navigate('home')">Shop Now</button>
          </div>
        ` : orders.map(o => `
          <div class="order-card">
            <div class="order-card-header">
              <div>
                <div class="order-id">${o.id}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${formatDate(o.created_at)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px">
                <span class="order-status-badge status-${o.status}">${o.status?.replace(/_/g, ' ').toUpperCase()}</span>
                <span class="price-discount" style="font-size:1rem">${formatNaira(o.total_amount)}</span>
              </div>
            </div>
            <!-- Progress Steps -->
            <div class="order-status-steps">
              ${STATUS_STEPS.map(s => {
                const idx = STATUS_STEPS.indexOf(s);
                const currentIdx = STATUS_STEPS.indexOf(o.status);
                const isDone = idx < currentIdx;
                const isActive = idx === currentIdx;
                return `
                  <div class="order-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
                    <div class="order-step-dot">${isDone ? '✓' : idx + 1}</div>
                    <div class="order-step-label">${s.replace(/_/g, ' ')}</div>
                  </div>
                `;
              }).join('')}
            </div>
            ${o.items?.length ? `
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${o.items.slice(0, 3).map(item => `
                  <img src="${item.images?.[0] || 'https://placehold.co/40x40/7B2EFF/fff?text=✨'}"
                    style="width:40px;height:40px;border-radius:8px;object-fit:cover" />
                `).join('')}
                ${o.items.length > 3 ? `<div style="width:40px;height:40px;border-radius:8px;background:var(--glass);display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--text-muted)">+${o.items.length - 3}</div>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function renderReferrals() {
  if (!Store.user) { navigate('login'); return; }
  const p = Store.profile;
  const refLink = `${window.location.origin}${window.location.pathname}?ref=${p?.username}#register`;

  document.getElementById('app').innerHTML = `
    <div class="dashboard-page container page-enter">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
        <button class="btn btn-ghost btn-sm" onclick="renderDashboard()">← Back</button>
        <h1 class="section-title">Referral Program 🎁</h1>
      </div>

      <div class="referral-link-card">
        <div style="font-size:2.5rem;margin-bottom:12px">🎁</div>
        <h2 class="text-gradient" style="font-family:var(--font-display);font-size:1.6rem;margin-bottom:8px">Earn While You Share!</h2>
        <p style="color:var(--text-secondary);margin-bottom:0">Share your unique link and earn rewards when friends shop 💜</p>

        <div class="referral-link-display" id="ref-link-display">
          <span style="flex:1">${refLink}</span>
          <button class="btn btn-primary btn-sm" onclick="copyToClipboard('${refLink}')">📋 Copy</button>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-ghost" onclick="shareWhatsApp('🛍️ Join Rae Enterprise and get amazing deals! Use my link: ${refLink}')">
            💬 Share on WhatsApp
          </button>
        </div>
      </div>

      <!-- Rewards Table -->
      <div class="glass-card" style="padding:24px;margin-bottom:20px">
        <h3 style="margin-bottom:16px">Reward Structure 💰</h3>
        <div style="display:grid;gap:12px">
          ${[['₦10,000 purchase', '₦1,000 reward'], ['₦100,000 purchase', '₦10,000 reward']].map(([trigger, reward]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm)">
              <span style="font-size:0.9rem">Friend spends <strong>${trigger}</strong></span>
              <span class="badge badge-cyan">${reward}</span>
            </div>
          `).join('')}
        </div>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-top:12px">
          ⚠️ Rewards are added to your wallet balance and can only be used for purchases.
        </p>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-icon">👥</div>
          <div class="stat-card-value text-neon-purple">${p?.referral_count || 0}</div>
          <div class="stat-card-label">Total Referrals</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">💰</div>
          <div class="stat-card-value text-neon-cyan">${formatNaira(p?.wallet_balance || 0)}</div>
          <div class="stat-card-label">Wallet Balance</div>
        </div>
      </div>
    </div>
  `;
}

async function renderWallet() {
  if (!Store.user) { navigate('login'); return; }
  const p = Store.profile;
  const { data: orders } = await db.from('orders').select('id,total_amount,created_at,status')
    .eq('user_id', Store.user.id).order('created_at', { ascending: false }).limit(10);

  document.getElementById('app').innerHTML = `
    <div class="dashboard-page container page-enter">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
        <button class="btn btn-ghost btn-sm" onclick="renderDashboard()">← Back</button>
        <h1 class="section-title">My Wallet 💰</h1>
      </div>

      <div class="wallet-card">
        <div style="font-size:1rem;color:var(--text-secondary)">Available Balance</div>
        <div class="wallet-balance text-gradient">${formatNaira(p?.wallet_balance || 0)}</div>
        <div class="badge badge-purple">Can only be used for purchases</div>
      </div>

      <div class="glass-card" style="padding:24px">
        <h3 style="margin-bottom:16px">How to earn wallet credits?</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${['🎁 Earn referral rewards when friends shop', '⭐ Admin bonuses & promotions', '💜 Level-up rewards'].map(item => `
            <div style="display:flex;align-items:center;gap:10px;font-size:0.875rem;color:var(--text-secondary)">
              ${item}
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-top:24px">
        <h3 style="margin-bottom:16px">Order History</h3>
        <div class="orders-list">
          ${orders?.map(o => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm)">
              <div>
                <div style="font-size:0.8rem;font-family:monospace;color:var(--neon-purple-light)">${o.id}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${formatDate(o.created_at)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;color:var(--neon-cyan)">${formatNaira(o.total_amount)}</div>
                <span class="order-status-badge status-${o.status}" style="font-size:0.65rem">${o.status?.replace(/_/g,'  ')}</span>
              </div>
            </div>
          `).join('') || '<p style="color:var(--text-muted);text-align:center;padding:20px">No orders yet</p>'}
        </div>
      </div>
    </div>
  `;
}
