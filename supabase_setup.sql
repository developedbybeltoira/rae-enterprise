-- ═══════════════════════════════════════════════════════
-- RAE ENTERPRISE — Supabase Setup
-- Simple table storage — NO Supabase Auth needed
-- Run this entire script in SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. PROFILES (stores users with hashed password)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  wallet_balance NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  discount_price NUMERIC DEFAULT 0,
  stock_count INTEGER DEFAULT 0,
  category TEXT DEFAULT 'Fashion',
  tags TEXT[],
  images TEXT[],
  is_flash BOOLEAN DEFAULT FALSE,
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  items JSONB DEFAULT '[]',
  total_amount NUMERIC DEFAULT 0,
  full_name TEXT,
  address TEXT,
  phone TEXT,
  sender_name TEXT,
  proof_url TEXT,
  status TEXT DEFAULT 'awaiting_approval',
  payment_method TEXT DEFAULT 'bank_transfer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- RLS — Disable it so anon key can read/write
-- (We handle security in our app code)
-- ══════════════════════════════════════════════
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════
-- SAMPLE PRODUCTS (only inserts if table empty)
-- ══════════════════════════════════════════════
INSERT INTO public.products (name, description, price, discount_price, stock_count, category, tags, images, is_flash, in_stock)
SELECT name, description, price, discount_price, stock_count, category, tags, images, is_flash, in_stock
FROM (VALUES
  ('Luxe Silk Headwrap','Premium silk hair wrap. Keeps hair moisturized overnight.',8500,4999,50,'Fashion',ARRAY['fashion','haircare'],ARRAY['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'],true,true),
  ('Glow Serum Pro','Vitamin C brightening serum. Radiant skin in 2 weeks.',15000,9500,30,'Beauty',ARRAY['skincare','glow'],ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'],false,true),
  ('Crystal Evening Bag','Crystal-embellished evening bag. Perfect for occasions.',25000,17500,20,'Accessories',ARRAY['bags','luxury'],ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'],true,true),
  ('Wireless Earbuds Pro','Premium 30-hour battery. Noise cancellation built-in.',45000,29999,15,'Tech',ARRAY['tech','audio'],ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],false,true),
  ('Stiletto Heels','Elegant 4-inch heels. Genuine leather.',18000,12000,25,'Shoes',ARRAY['shoes','heels'],ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'],false,true),
  ('Aromatherapy Set','Luxury 12-piece essential oil diffuser set.',12000,7500,40,'Home',ARRAY['home','wellness'],ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600'],true,true),
  ('Gold Necklace Set','18K gold-plated layered necklace with earrings.',9500,5999,60,'Accessories',ARRAY['jewelry','gold'],ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600'],false,true),
  ('Luxury Gift Box','Curated luxury gift box with premium beauty products.',35000,24999,10,'Gifts',ARRAY['gifts','luxury'],ARRAY['https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600'],true,true)
) AS v(name,description,price,discount_price,stock_count,category,tags,images,is_flash,in_stock)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

-- ══════════════════════════════════════════════
-- MAKE YOURSELF ADMIN
-- Register normally first, then run this:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ══════════════════════════════════════════════
