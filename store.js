// RAE ENTERPRISE — Store (sessionStorage session)
var Store = {
  user: null, profile: null, cart: [], cartCount: 0,

  async loadUser() {
    try {
      var uid = sessionStorage.getItem('rae_uid');
      if (!uid) { this.user=null; this.profile=null; return null; }
      var res = await db.from('profiles').select('*').eq('id', uid).single();
      if (res.error || !res.data) { sessionStorage.removeItem('rae_uid'); this.user=null; this.profile=null; return null; }
      this.user = res.data; this.profile = res.data;
      await this.loadCart();
      return res.data;
    } catch(e) { this.user=null; this.profile=null; return null; }
  },

  logout() {
    sessionStorage.removeItem('rae_uid');
    this.user=null; this.profile=null; this.cart=[]; this.cartCount=0;
    this.updateCartBadge();
  },

  async loadCart() {
    if (!this.user) { this.cart=[]; return; }
    try { var s=localStorage.getItem('rc_'+this.user.id); this.cart=s?JSON.parse(s):[]; } catch(e){this.cart=[];}
    this.cartCount=this.cart.reduce(function(a,i){return a+i.qty;},0);
    this.updateCartBadge();
  },

  saveCart() {
    if (!this.user) return;
    try{localStorage.setItem('rc_'+this.user.id,JSON.stringify(this.cart));}catch(e){}
    this.cartCount=this.cart.reduce(function(a,i){return a+i.qty;},0);
    this.updateCartBadge();
  },

  addToCart(p) {
    var f=null; for(var i=0;i<this.cart.length;i++){if(this.cart[i].id===p.id){f=this.cart[i];break;}}
    if(f){f.qty+=1;}else{var o={}; for(var k in p)o[k]=p[k]; o.qty=1; this.cart.push(o);}
    this.saveCart(); toast((p.name||'Item')+' added! 🛒');
  },

  removeFromCart(id){this.cart=this.cart.filter(function(i){return i.id!==id;});this.saveCart();},

  updateQty(id,qty){
    if(qty<=0){this.removeFromCart(id);return;}
    for(var i=0;i<this.cart.length;i++){if(this.cart[i].id===id){this.cart[i].qty=qty;break;}}
    this.saveCart();
  },

  getCartTotal(){return this.cart.reduce(function(a,i){return a+(i.discount_price||i.price||0)*i.qty;},0);},
  clearCart(){this.cart=[];this.saveCart();},

  updateCartBadge(){
    var b=document.getElementById('cart-badge');
    if(b){b.textContent=this.cartCount;b.style.display=this.cartCount===0?'none':'flex';}
  },

  isAdmin(){return !!(this.profile&&this.profile.role==='admin');}
};
