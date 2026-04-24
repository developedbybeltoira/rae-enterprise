// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Helpers
// ═══════════════════════════════════════════════════════

function formatNaira(amount) {
  return '₦' + Number(amount || 0).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function getDiscount(original, discount) {
  if (!original || !discount) return 0;
  return Math.round(((original - discount) / original) * 100);
}

function generateOrderId() {
  return 'RAE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function getLevel(totalSpend) {
  if (totalSpend >= 100000) return { name: 'Gold', icon: '🥇', class: 'level-gold' };
  if (totalSpend >= 30000) return { name: 'Silver', icon: '🥈', class: 'level-silver' };
  return { name: 'Bronze', icon: '🥉', class: 'level-bronze' };
}

function toast(msg, type = 'success') {
  const icons = { success: '✨', error: '💔', warn: '⚠️', info: '💜' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;"></span>';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

function debounce(fn, delay) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard! 🔗'));
}

function shareWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Typing placeholder animation
function animatePlaceholder(input, phrases, speed = 80) {
  let pi = 0, ci = 0, deleting = false;
  function type() {
    const phrase = phrases[pi];
    if (!deleting) {
      input.setAttribute('placeholder', phrase.slice(0, ++ci));
      if (ci === phrase.length) { deleting = true; setTimeout(type, 1400); return; }
    } else {
      input.setAttribute('placeholder', phrase.slice(0, --ci));
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
    }
    setTimeout(type, deleting ? 40 : speed);
  }
  type();
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
}

function navigate(page, params = {}) {
  window.history.pushState({ page, params }, '', `#${page}`);
  window.dispatchEvent(new CustomEvent('routeChange', { detail: { page, params } }));
}
