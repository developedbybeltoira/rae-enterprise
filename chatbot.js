// RAE ENTERPRISE — AI Support Chatbot (support icon, moved up)

var chatOpen = false;
var chatHistory = [];
var BOT = {
  greet: ['Hey gorgeous! 💜 I\'m your Rae support assistant. How can I help?','Hello beautiful! \u2728 Need help with an order, deals, or anything else?'],
  deals: ['🔥 Flash deals are live right now — up to 70% OFF! Check the countdown on the homepage.','✨ Best deals are in Fashion & Beauty. Use the category filter to browse!'],
  track: ['📦 Track your orders in My Account → My Orders. You\'ll see a live progress bar for each order!','Go to the Orders tab in your bottom menu to track any order in real-time 💜'],
  referral: ['🎁 Share your referral link and earn ₦1,000 for every ₦10K purchase your friend makes — and ₦10,000 for ₦100K!','Visit the Referral section in your dashboard to get your unique link and share via WhatsApp 💜'],
  payment: ['💳 Transfer to OPay account: 8166666667 (Rae Enterprises). Upload your payment screenshot when checking out.','We accept bank transfers. After payment, upload proof and orders are approved within 24hrs \u2728'],
  support: ['📞 Call or WhatsApp us: 08117706203. We\'re always available for you 💜','Tap the Call or WhatsApp buttons at the bottom of the homepage anytime!'],
  wallet: ['💰 Your wallet earns from referral rewards and admin bonuses. Use it to pay for orders instantly — no transfer needed!','Wallet credits never expire and can be used on any purchase. Check your balance in the Wallet tab \u2728'],
  size: ['👗 Select your size on the product page before adding to cart. Available sizes: S, M, L, XL for clothing and 39-45 for shoes.','Size options appear on each product page. Your selected size is saved with your order \u2728'],
  fallback: ['I\'m not sure about that 💔 I can help with: deals, orders, payment, referrals, sizes, or support!','Try asking about our deals, tracking orders, or our referral program 💜','For more help, contact us on 08117706203 or WhatsApp!']
};

function renderChatbot() {
  var w = document.getElementById('chatbot-widget');
  if (!w) return;
  w.innerHTML =
    '<button class="chatbot-toggle" id="chat-btn" onclick="toggleChat()">' +
    '<span id="chat-ico">🎧</span>' +
    '<div class="chatbot-notif" id="chat-notif" style="display:none"></div>' +
    '</button>' +
    '<div class="chatbot-window hidden" id="chat-win">' +
    '<div class="chatbot-header">' +
    '<div class="chatbot-avatar">🎧</div>' +
    '<div class="chatbot-header-info"><div class="chatbot-header-name">Rae Support</div><div class="chatbot-header-status">● Always here for you</div></div>' +
    '<button class="chatbot-close" onclick="toggleChat()">✕</button>' +
    '</div>' +
    '<div class="chatbot-messages" id="chat-msgs"></div>' +
    '<div class="chatbot-quick-replies">' +
    ['🔥 Deals','📦 Track Order','💳 Payment','🎁 Referrals','📞 Support'].map(function(q){
      return '<button class="chatbot-quick-btn" onclick="sendQuick(\''+q+'\')">'+q+'</button>';
    }).join('') +
    '</div>' +
    '<div class="chatbot-input-row">' +
    '<input class="chatbot-input" id="chat-in" placeholder="Ask me anything... 💜" onkeydown="if(event.key===\'Enter\')sendChat()" />' +
    '<button class="chatbot-send" onclick="sendChat()">➤</button>' +
    '</div></div>';

  // Show notification dot after 5s
  setTimeout(function() {
    var n = document.getElementById('chat-notif');
    if (n && !chatOpen) n.style.display = 'flex';
  }, 5000);
}

function toggleChat() {
  chatOpen = !chatOpen;
  var win = document.getElementById('chat-win');
  var ico = document.getElementById('chat-ico');
  var notif = document.getElementById('chat-notif');
  if (win) win.classList.toggle('hidden', !chatOpen);
  if (ico) ico.textContent = chatOpen ? '✕' : '🎧';
  if (notif) notif.style.display = 'none';
  if (chatOpen && chatHistory.length === 0) {
    setTimeout(function() { addBot(BOT.greet[0]); }, 350);
  }
  if (chatOpen) setTimeout(function() { var el=document.getElementById('chat-in'); if(el) el.focus(); }, 200);
}

function addBot(text) {
  var c = document.getElementById('chat-msgs'); if (!c) return;
  // Show typing
  var typing = document.createElement('div');
  typing.className = 'chat-msg bot'; typing.id = 'chat-typing-ind';
  typing.innerHTML = '<div class="chat-msg-av">🎧</div><div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div>';
  c.appendChild(typing); c.scrollTop = c.scrollHeight;
  setTimeout(function() {
    var t = document.getElementById('chat-typing-ind'); if (t) t.remove();
    var msg = document.createElement('div');
    msg.className = 'chat-msg bot';
    msg.innerHTML = '<div class="chat-msg-av">🎧</div><div class="chat-bubble">'+text+'</div>';
    c.appendChild(msg); c.scrollTop = c.scrollHeight;
    chatHistory.push({role:'bot',text:text});
  }, 700 + Math.random()*400);
}

function addUser(text) {
  var c = document.getElementById('chat-msgs'); if (!c) return;
  var msg = document.createElement('div');
  msg.className = 'chat-msg user';
  msg.innerHTML = '<div class="chat-bubble">'+text+'</div>';
  c.appendChild(msg); c.scrollTop = c.scrollHeight;
  chatHistory.push({role:'user',text:text});
}

function sendQuick(t) { var el=document.getElementById('chat-in'); if(el){el.value=t;} sendChat(); }

function sendChat() {
  var el = document.getElementById('chat-in'); if (!el) return;
  var text = el.value.trim(); if (!text) return;
  el.value = '';
  addUser(text);
  var l = text.toLowerCase();
  var r;
  if (/hi|hello|hey|start/.test(l)) r = BOT.greet;
  else if (/deal|sale|discount|flash|offer/.test(l)) r = BOT.deals;
  else if (/track|order|delivery|status|ship/.test(l)) r = BOT.track;
  else if (/refer|friend|earn|reward|link/.test(l)) r = BOT.referral;
  else if (/pay|bank|transfer|opay|proof/.test(l)) r = BOT.payment;
  else if (/support|help|call|contact|whatsapp|phone/.test(l)) r = BOT.support;
  else if (/wallet|balance|credit|bonus/.test(l)) r = BOT.wallet;
  else if (/size|sizing|fit|small|medium|large/.test(l)) r = BOT.size;
  else r = BOT.fallback;
  addBot(r[Math.floor(Math.random()*r.length)]);
}
