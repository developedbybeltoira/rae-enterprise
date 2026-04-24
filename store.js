// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Global Store
// ═══════════════════════════════════════════════════════

const Store = {
  user: null,
  profile: null,
  cart: [],
  cartCount: 0,

  async loadUser() {
    try {
      const { data: { user } } = await db.auth.getUser();
      this.user = user;
      if (user) {
        const { data } = await db.from('profiles').select('*').eq('id', user.id).single();
        this.profile = data;
        await this.loadCart();
      }
      return user;
    } catch (e) {
      console.warn('loadUser error:', e);
      return null;
    }
  },

  async loadCart() {
    if (!this.user) { this.cart = []; return; }
    try {
      const saved = localStorage.getItem('rae_cart_' + this.user.id);
      this.cart = saved ? JSON.parse(saved) : [];
    } catch(e) {
      this.cart = [];
    }
    this.cartCount = this.cart.reduce((a, i) => a + i.qty, 0);
    this.updateCartBadge();
  },

  saveCart() {
    if (!this.user) return;
    try {
      localStorage.setItem('rae_cart_' + this.user.id, JSON.stringify(this.cart));
    } catch(e) {}
    this.cartCount = this.cart.reduce((a, i) => a + i.qty, 0);
    this.updateCartBadge();
  },

  addToCart(product) {
    const existing = this.cart.find(i => i.id === product.id);
    if (existing) { existing.qty += 1; }
    else { this.cart.push(Object.assign({}, product, { qty: 1 })); }
    this.saveCart();
    toast(product.name + ' added to cart! 🛒');
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.id !== productId);
    this.saveCart();
  },

  updateQty(productId, qty) {
    if (qty <= 0) { this.removeFromCart(productId); return; }
    const item = this.cart.find(i => i.id === productId);
    if (item) item.qty = qty;
    this.saveCart();
  },

  getCartTotal() {
    return this.cart.reduce((a, i) => a + (i.discount_price || i.price) * i.qty, 0);
  },

  clearCart() {
    this.cart = [];
    this.saveCart();
  },

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = this.cartCount;
      badge.classList.toggle('hidden', this.cartCount === 0);
    }
  },

  isAdmin() {
    return this.profile && this.profile.role === 'admin';
  }
};

// Auth state listener — registered AFTER initApp, inside script.js
// (moved out of module level to avoid timing issues)
