// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Global Store
// ═══════════════════════════════════════════════════════

const Store = {
  user: null,
  profile: null,
  cart: [],
  cartCount: 0,

  async loadUser() {
    const { data: { user } } = await db.auth.getUser();
    this.user = user;
    if (user) {
      const { data } = await db.from('profiles').select('*').eq('id', user.id).single();
      this.profile = data;
      await this.loadCart();
    }
    return user;
  },

  async loadCart() {
    if (!this.user) { this.cart = []; return; }
    // Load from localStorage for speed; sync with DB optional
    const saved = localStorage.getItem(`rae_cart_${this.user.id}`);
    this.cart = saved ? JSON.parse(saved) : [];
    this.cartCount = this.cart.reduce((a, i) => a + i.qty, 0);
    this.updateCartBadge();
  },

  saveCart() {
    if (!this.user) return;
    localStorage.setItem(`rae_cart_${this.user.id}`, JSON.stringify(this.cart));
    this.cartCount = this.cart.reduce((a, i) => a + i.qty, 0);
    this.updateCartBadge();
  },

  addToCart(product) {
    const existing = this.cart.find(i => i.id === product.id);
    if (existing) { existing.qty += 1; }
    else { this.cart.push({ ...product, qty: 1 }); }
    this.saveCart();
    toast(`${product.name} added to cart! 🛒`);
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
    return this.profile?.role === 'admin';
  }
};

// Supabase auth state changes
db.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    await Store.loadUser();
    renderNavbar();
  } else if (event === 'SIGNED_OUT') {
    Store.user = null;
    Store.profile = null;
    Store.cart = [];
    Store.cartCount = 0;
    renderNavbar();
  }
});
