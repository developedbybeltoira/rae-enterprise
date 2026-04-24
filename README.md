# ✨ Rae Enterprise — Premium E-Commerce Platform

A stunning glassmorphism neon e-commerce web app. Beautiful, girlish, and addictive to use.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1 — Files
Place all files in the same folder. Your folder structure:
```
rae-enterprise/
├── index.html
├── style.css
├── script.js
├── logo.png          ← PUT YOUR LOGO HERE
├── supabase_setup.sql
├── components/
│   ├── navbar.css / navbar.js
│   ├── auth.css / auth.js
│   ├── home.css / home.js
│   ├── product.css / product.js
│   ├── cart.css / cart.js
│   ├── dashboard.css / dashboard.js
│   ├── admin.css / admin.js
│   └── chatbot.css / chatbot.js
└── utils/
    ├── supabase.js
    ├── helpers.js
    └── store.js
```

### Step 2 — Supabase Database
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Open your project: `iweleinqgtvcsyvqaunv`
3. Go to **SQL Editor**
4. Paste and run the contents of `supabase_setup.sql`
5. Go to **Storage** → Create 2 buckets:
   - `product-images` (public)
   - `order-proofs` (private)

### Step 3 — Make Yourself Admin
In Supabase SQL Editor, run:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### Step 4 — Add Your Logo
- Place your logo image as `logo.png` in the root folder
- The cat/wolf mascot image also works as the auth page decoration

### Step 5 — Open the App
- Open `index.html` in your browser, OR
- Deploy to Netlify/Vercel by dragging the folder

---

## 🎨 Features

| Feature | Status |
|---------|--------|
| Glassmorphism neon UI (purple + cyan) | ✅ |
| Dark/Light mode toggle | ✅ |
| User registration with referral tracking | ✅ |
| JWT auth via Supabase | ✅ |
| Referral rewards system | ✅ |
| Wallet (no withdrawal) | ✅ |
| Product catalog with discounts | ✅ |
| Smart search with dropdown | ✅ |
| Shopping cart | ✅ |
| Manual payment flow (OPay) | ✅ |
| Order tracking with steps | ✅ |
| AI chatbot assistant | ✅ |
| Admin panel (full CRUD) | ✅ |
| Flash sale countdown | ✅ |
| Level system (Bronze/Silver/Gold) | ✅ |
| Fake reviews (realistic) | ✅ |
| WhatsApp integration | ✅ |
| Mobile responsive | ✅ |
| Push notifications (in-app) | ✅ |

---

## 💳 Payment Details (Pre-configured)
- **Bank:** OPay
- **Account:** 8166666667
- **Name:** Rae Enterprises
- **Support:** 08117706203

---

## 🧑‍💻 Admin Access
After signing up, run the SQL command above to grant admin access.
Admin panel: click your avatar → "Admin Panel"

---

## 🌐 Deploy Free
1. Go to https://netlify.com
2. Drag your `rae-enterprise` folder onto Netlify
3. Your store is live! Share the URL 🎉
