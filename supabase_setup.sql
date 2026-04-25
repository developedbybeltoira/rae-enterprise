-- =====================================================
-- STEP 1: Drop everything and start fresh
-- =====================================================
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- STEP 2: Create tables
-- =====================================================
CREATE TABLE public.profiles (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username       TEXT UNIQUE NOT NULL,
  email          TEXT,
  phone          TEXT,
  password       TEXT NOT NULL,
  role           TEXT DEFAULT 'user',
  wallet_balance NUMERIC DEFAULT 0,
  total_spent    NUMERIC DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  referred_by    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  description    TEXT,
  price          NUMERIC DEFAULT 0,
  discount_price NUMERIC DEFAULT 0,
  stock_count    INTEGER DEFAULT 0,
  category       TEXT DEFAULT 'Fashion',
  tags           TEXT[],
  images         TEXT[],
  is_flash       BOOLEAN DEFAULT FALSE,
  in_stock       BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
  id             TEXT PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  items          JSONB DEFAULT '[]',
  total_amount   NUMERIC DEFAULT 0,
  full_name      TEXT,
  address        TEXT,
  phone          TEXT,
  sender_name    TEXT,
  proof_url      TEXT,
  status         TEXT DEFAULT 'awaiting_approval',
  payment_method TEXT DEFAULT 'bank_transfer',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    TEXT,
  type       TEXT DEFAULT 'info',
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: DISABLE RLS on every table (critical!)
-- =====================================================
ALTER TABLE public.profiles      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Grant anon role full access
-- =====================================================
GRANT ALL ON public.profiles      TO anon;
GRANT ALL ON public.products      TO anon;
GRANT ALL ON public.orders        TO anon;
GRANT ALL ON public.notifications TO anon;
GRANT ALL ON public.profiles      TO authenticated;
GRANT ALL ON public.products      TO authenticated;
GRANT ALL ON public.orders        TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- =====================================================
-- STEP 5: Sample products
-- =====================================================
INSERT INTO public.products (name,description,price,discount_price,stock_count,category,tags,images,is_flash,in_stock) VALUES
('Luxe Silk Headwrap','Premium silk hair wrap. Keeps hair moisturized overnight.',8500,4999,50,'Fashion',ARRAY['fashion','haircare'],ARRAY['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'],true,true),
('Glow Serum Pro','Vitamin C brightening serum. Radiant skin in 2 weeks.',15000,9500,30,'Beauty',ARRAY['skincare','glow'],ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'],false,true),
('Crystal Evening Bag','Crystal-embellished evening bag.',25000,17500,20,'Accessories',ARRAY['bags','luxury'],ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'],true,true),
('Wireless Earbuds Pro','30-hour battery. Noise cancellation.',45000,29999,15,'Tech',ARRAY['tech','audio'],ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],false,true),
('Stiletto Heels','Elegant 4-inch heels. Genuine leather.',18000,12000,25,'Shoes',ARRAY['shoes','heels'],ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'],false,true),
('Aromatherapy Set','Luxury 12-piece essential oil set.',12000,7500,40,'Home',ARRAY['home','wellness'],ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600'],true,true),
('Gold Necklace Set','18K gold-plated necklace with earrings.',9500,5999,60,'Accessories',ARRAY['jewelry','gold'],ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600'],false,true),
('Luxury Gift Box','Curated luxury gift box.',35000,24999,10,'Gifts',ARRAY['gifts','luxury'],ARRAY['https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600'],true,true);

-- =====================================================
-- STEP 6: Verify it worked (should return 0 for RLS)
-- =====================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- To make yourself admin after registering:
-- UPDATE public.profiles SET role = 'admin' WHERE username = 'yourusername';

-- ITEM REQUESTS TABLE (out of stock requests)
CREATE TABLE IF NOT EXISTS public.item_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   TEXT NOT NULL,
  product_name TEXT,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  username     TEXT,
  count        INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.item_requests DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.item_requests TO anon;
GRANT ALL ON public.item_requests TO authenticated;

-- Add sizes columns to products if not exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shoe_sizes TEXT[];
