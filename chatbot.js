// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — AI Chatbot Widget
// ═══════════════════════════════════════════════════════

let chatOpen = false;
const chatHistory = [];

const BOT_RESPONSES = {
  greeting: [
    "Hey gorgeous! 💜 Welcome to Rae Enterprise! How can I help you today?",
    "Hello beautiful! ✨ I'm Rae, your personal shopping assistant. What can I do for you?",
  ],
  deals: [
    "🔥 We have amazing flash deals right now — up to 70% OFF! Check the homepage banner for the countdown ⏱",
    "✨ Our best deals are in the Fashion and Beauty categories. Type 'show deals' to browse!",
  ],
  track: [
    "📦 To track your order, visit My Account → My Orders. You'll see a live progress bar for each order!",
    "Your orders are tracked in real-time! Go to the Orders page in your dashboard 💜",
  ],
  referral: [
    "🎁 Our referral program is amazing! Share your link and earn ₦1,000 for ₦10K purchases, and ₦10,000 for ₦100K purchases!",
    "Refer friends and earn wallet rewards! Visit the Referral section in your dashboard to get your unique link 💜",
  ],
  payment: [
    "💳 We accept bank transfers to OPay (Account: 8166666667, Rae Enterprises). Upload your proof and we'll approve your order!",
    "Payment is via bank transfer to our OPay account. After payment, upload the screenshot and we'll process your order within 24hrs ✨",
  ],
  support: [
    "📞 You can reach us at 08117706203 or WhatsApp us for faster response! We're here 24/7 💜",
    "Need human support? Call 08117706203 or click the WhatsApp button! We love hearing from you 💅",
  ],
  wallet: [
    "💰 Your wallet balance can be used to pay for orders directly — no transfer needed! Earn via referrals and bonuses.",
    "Your wallet earns from referral rewards and admin bonuses. Use it at checkout for instant payment! ✨",
  ],
  default: [
    "I'm not sure about that 💔 But I can help with: deals, orders, payment, referrals, or connect you with our support team!",
    "Hmm, let me think... 🤔 Try asking about our deals, how to track orders, or our referral program!",
    "I'm still learning! 💜 For that question, please contact us at 08117706203 or WhatsApp.",
  ],
};

const QUICK_REPLIES = ['🔥 Flash Deals', '📦 Track Order', '🎁 Referrals', '💳 Payment Info', '📞 Support'];

function renderChatbot() {
  const widget = document.getElementById('chatbot-widget');
  widget.innerHTML = `
    <button class="chatbot-toggle" id="chatbot-btn" onclick="toggleChat()">
      <span id="chat-icon">💜</span>
      <div class="chatbot-notif" id="chat-notif"></div>
    </button>
    <div class="chatbot-window hidden" id="chatbot-window">
      <div class="chatbot-header">
        <div class="chatbot-avatar">✨</div>
        <div class="chatbot-header-info">
          <div class="chatbot-header-name">Rae Assistant</div>
          <div class="chatbot-header-status">● Online — Always here for you</div>
        </div>
        <button class="chatbot-close" onclick="toggleChat()">✕</button>
      </div>
      <div class="chatbot-messages" id="chatbot-messages">
        <!-- Messages rendered here -->
      </div>
      <div style="padding:0 16px 8px">
        <div class="chatbot-quick-replies">
          ${QUICK_REPLIES.map(q => `<button class="chatbot-quick-btn" onclick="sendQuick('${q}')">${q}</button>`).join('')}
        </div>
      </div>
      <div class="chatbot-input-row">
        <input class="chatbot-input" id="chat-input" placeholder="Ask me anything... 💜"
          onkeydown="if(event.key==='Enter') sendChatMessage()" />
        <button class="chatbot-send" onclick="sendChatMessage()">➤</button>
      </div>
    </div>
  `;

  // Greet after a delay if not yet opened
  setTimeout(() => {
    const notif = document.getElementById('chat-notif');
    if (notif && !chatOpen) notif.style.display = 'flex';
  }, 4000);
}

function toggleChat() {
  chatOpen = !chatOpen;
  const win = document.getElementById('chatbot-window');
  const icon = document.getElementById('chat-icon');
  const notif = document.getElementById('chat-notif');

  win?.classList.toggle('hidden', !chatOpen);
  if (icon) icon.textContent = chatOpen ? '✕' : '💜';
  if (notif) notif.style.display = 'none';

  if (chatOpen && chatHistory.length === 0) {
    setTimeout(() => {
      addBotMessage(BOT_RESPONSES.greeting[0]);
    }, 400);
  }

  if (chatOpen) {
    setTimeout(() => document.getElementById('chat-input')?.focus(), 200);
  }
}

function addBotMessage(text, showTyping = true) {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;

  if (showTyping) {
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.id = 'chat-typing';
    typing.innerHTML = `
      <div class="chat-msg-avatar">✨</div>
      <div class="chat-bubble">
        <div class="chat-typing"><span></span><span></span><span></span></div>
      </div>`;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
      typing.remove();
      renderBotBubble(text, container);
    }, 900 + Math.random() * 500);
  } else {
    renderBotBubble(text, container);
  }
}

function renderBotBubble(text, container) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg bot';
  msg.innerHTML = `
    <div class="chat-msg-avatar">✨</div>
    <div class="chat-bubble">${text}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  chatHistory.push({ role: 'bot', text });
}

function addUserMessage(text) {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = 'chat-msg user';
  msg.innerHTML = `<div class="chat-bubble">${text}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  chatHistory.push({ role: 'user', text });
}

function sendQuick(text) {
  document.getElementById('chat-input').value = text;
  sendChatMessage();
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value.trim();
  if (!text) return;
  input.value = '';

  addUserMessage(text);

  // Determine response
  const lower = text.toLowerCase();
  let response;

  if (/hi|hello|hey|start|hola/.test(lower)) {
    response = BOT_RESPONSES.greeting[Math.floor(Math.random() * BOT_RESPONSES.greeting.length)];
  } else if (/deal|sale|discount|flash|offer/.test(lower)) {
    response = BOT_RESPONSES.deals[Math.floor(Math.random() * BOT_RESPONSES.deals.length)];
  } else if (/track|order|delivery|status|ship/.test(lower)) {
    response = BOT_RESPONSES.track[Math.floor(Math.random() * BOT_RESPONSES.track.length)];
  } else if (/refer|friend|link|earn|reward/.test(lower)) {
    response = BOT_RESPONSES.referral[Math.floor(Math.random() * BOT_RESPONSES.referral.length)];
  } else if (/pay|payment|bank|transfer|opay|proof/.test(lower)) {
    response = BOT_RESPONSES.payment[Math.floor(Math.random() * BOT_RESPONSES.payment.length)];
  } else if (/support|help|call|contact|whatsapp|phone/.test(lower)) {
    response = BOT_RESPONSES.support[Math.floor(Math.random() * BOT_RESPONSES.support.length)];
  } else if (/wallet|balance|credit|bonus/.test(lower)) {
    response = BOT_RESPONSES.wallet[Math.floor(Math.random() * BOT_RESPONSES.wallet.length)];
  } else if (/product|recommend|suggest|find|look/.test(lower)) {
    response = `✨ I'd love to help you find products! Try browsing our categories on the homepage, or use the search bar to find exactly what you're looking for. We have Fashion, Beauty, Tech, Home & more! 💜`;
  } else {
    response = BOT_RESPONSES.default[Math.floor(Math.random() * BOT_RESPONSES.default.length)];
  }

  addBotMessage(response);
}
