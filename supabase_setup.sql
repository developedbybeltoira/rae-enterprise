-- ═══════════════════════════════════════════════════════
-- RAE ENTERPRISE — Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  wallet_balance NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  stock_count INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  images TEXT[],
  is_flash BOOLEAN DEFAULT FALSE,
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  items JSONB,
  total_amount NUMERIC NOT NULL,
  full_name TEXT,
  address TEXT,
  phone TEXT,
  sender_name TEXT,
  proof_url TEXT,
  status TEXT DEFAULT 'awaiting_approval',
  payment_method TEXT DEFAULT 'bank_transfer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- PRODUCTS policies
CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ORDERS policies
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- STORAGE BUCKETS (run in Dashboard > Storage)
-- ═══════════════════════════════════════════════════════
-- Create bucket: product-images (public)
-- Create bucket: order-proofs (private)

-- ═══════════════════════════════════════════════════════
-- SAMPLE PRODUCTS (optional - add some starter data)
-- ═══════════════════════════════════════════════════════
INSERT INTO public.products (name, description, price, discount_price, stock_count, category, tags, images, is_flash, in_stock) VALUES
('Luxe Silk Headwrap', 'Premium silk hair wrap with stunning neon pattern. Keeps hair moisturized overnight.', 8500, 4999, 50, 'Fashion', ARRAY['fashion', 'haircare', 'luxury'], ARRAY['https://placehold.co/600x600/7B2EFF/fff?text=Silk+Wrap'], true, true),
('Glow Serum Pro', 'Advanced vitamin C brightening serum. Get radiant, glowing skin in 2 weeks.', 15000, 9500, 30, 'Beauty', ARRAY['skincare', 'glow', 'beauty'], ARRAY['https://placehold.co/600x600/FF2EBD/fff?text=Glow+Serum'], false, true),
('Crystal Handbag', 'Stunning crystal-embellished evening bag. Perfect for special occasions.', 25000, 17500, 20, 'Accessories', ARRAY['bags', 'luxury', 'evening'], ARRAY['https://placehold.co/600x600/00F5FF/111?text=Crystal+Bag'], true, true),
('Wireless Earbuds Pro', 'Premium sound quality with 30-hour battery. Noise cancellation built-in.', 45000, 29999, 15, 'Tech', ARRAY['tech', 'audio', 'wireless'], ARRAY['https://placehold.co/600x600/7B2EFF/fff?text=Earbuds'], false, true),
('Stiletto Heels', 'Elegant 4-inch stiletto heels. Available in multiple colors. Genuine leather.', 18000, 12000, 25, 'Shoes', ARRAY['shoes', 'heels', 'fashion'], ARRAY['https://placehold.co/600x600/FF2EBD/fff?text=Heels'], false, true),
('Aromatherapy Set', 'Luxury 12-piece essential oil diffuser set. Transforms your home into a spa.', 12000, 7500, 40, 'Home', ARRAY['home', 'wellness', 'aromatherapy'], ARRAY['https://placehold.co/600x600/00F5FF/111?text=Aroma+Set'], true, true),
('Gold Necklace Set', '18K gold-plated layered necklace set with matching earrings. Hypoallergenic.', 9500, 5999, 60, 'Accessories', ARRAY['jewelry', 'gold', 'accessories'], ARRAY['https://placehold.co/600x600/FFD700/111?text=Gold+Set'], false, true),
('Luxury Gift Box', 'Curated luxury gift box filled with premium beauty and lifestyle products.', 35000, 24999, 10, 'Gifts', ARRAY['gifts', 'luxury', 'special'], ARRAY['https://placehold.co/600x600/7B2EFF/fff?text=Gift+Box'], true, true);

-- ═══════════════════════════════════════════════════════
-- MAKE YOURSELF ADMIN
-- Replace 'your@email.com' with your actual email
-- ═══════════════════════════════════════════════════════
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
