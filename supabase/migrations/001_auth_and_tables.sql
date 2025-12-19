-- WebCore Audit Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- EMAIL SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('audit', 'newsletter', 'waitlist')),
  audit_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMPTZ,

  -- Link to user if they create an account
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_user_id ON public.email_subscribers(user_id);

-- RLS Policies
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for email capture)
CREATE POLICY "Allow anonymous email capture" ON public.email_subscribers
  FOR INSERT WITH CHECK (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.email_subscribers
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.email_subscribers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,

  -- Subscription
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', NULL)),

  -- Usage
  audits_used_this_month INTEGER DEFAULT 0,
  audits_limit INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_audit_at TIMESTAMPTZ,

  -- OAuth provider info
  auth_provider TEXT,
  provider_user_id TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON public.user_profiles(stripe_customer_id);

-- RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role can do everything
CREATE POLICY "Service role full access profiles" ON public.user_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- ============================================
-- AUDITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  overall_score INTEGER,
  category_scores JSONB,
  summary TEXT,
  brief JSONB,
  full_report JSONB,

  -- Status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- User association (null for anonymous)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_subscriber_id UUID REFERENCES public.email_subscribers(id) ON DELETE SET NULL,

  -- Token usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost DECIMAL(10, 6),

  -- Source tracking
  source_ip_hash TEXT,
  user_agent TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_url ON public.audits(url);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON public.audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(status);

-- RLS Policies
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Users can view their own audits
CREATE POLICY "Users can view own audits" ON public.audits
  FOR SELECT USING (auth.uid() = user_id);

-- Allow inserting audits (will be associated with user if logged in)
CREATE POLICY "Allow audit creation" ON public.audits
  FOR INSERT WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role full access audits" ON public.audits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- ============================================
-- PRICING TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('free', 'starter', 'pro', 'agency')),
  display_name TEXT NOT NULL,
  description TEXT,

  -- Pricing (in cents)
  price_monthly INTEGER DEFAULT 0,
  price_yearly INTEGER DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,

  -- Limits
  audits_per_month INTEGER DEFAULT 1,
  pages_per_audit INTEGER DEFAULT 1,
  categories_included TEXT[] DEFAULT ARRAY['business', 'technical', 'brand'],

  -- Features
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  has_pdf_export BOOLEAN DEFAULT FALSE,
  has_email_reports BOOLEAN DEFAULT FALSE,
  has_priority_support BOOLEAN DEFAULT FALSE,
  has_api_access BOOLEAN DEFAULT FALSE,
  has_white_label BOOLEAN DEFAULT FALSE,

  -- Display
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

-- RLS - Everyone can read pricing
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing" ON public.pricing_tiers
  FOR SELECT USING (true);


-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,

  description TEXT,
  tier TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);


-- ============================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider'
  );

  -- Link any existing email subscriber records
  UPDATE public.email_subscribers
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================
-- INSERT DEFAULT PRICING TIERS
-- ============================================
INSERT INTO public.pricing_tiers (name, display_name, description, price_monthly, price_yearly, audits_per_month, pages_per_audit, categories_included, features, has_pdf_export, has_email_reports, is_popular, sort_order)
VALUES
  ('free', 'Free', 'Try it out', 0, 0, 1, 1, ARRAY['business', 'technical', 'brand'], ARRAY['1 audit per month', 'Basic categories', 'Standard support'], FALSE, FALSE, FALSE, 0),
  ('starter', 'Starter', 'For individuals', 1900, 19000, 5, 3, ARRAY['business', 'technical', 'brand', 'ux', 'content', 'security'], ARRAY['5 audits per month', '6 categories', 'PDF export', 'Email reports'], TRUE, TRUE, FALSE, 1),
  ('pro', 'Pro', 'For growing businesses', 4900, 49000, 25, 10, ARRAY['business', 'technical', 'brand', 'ux', 'content', 'security', 'traffic', 'conversion', 'social', 'trust'], ARRAY['25 audits per month', 'All categories', 'Priority support', 'API access'], TRUE, TRUE, TRUE, 2),
  ('agency', 'Agency', 'For agencies & teams', 14900, 149000, -1, 50, ARRAY['business', 'technical', 'brand', 'ux', 'content', 'security', 'traffic', 'conversion', 'social', 'trust'], ARRAY['Unlimited audits', 'White-label reports', 'Dedicated support', 'Custom integrations'], TRUE, TRUE, FALSE, 3)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  audits_per_month = EXCLUDED.audits_per_month,
  pages_per_audit = EXCLUDED.pages_per_audit,
  categories_included = EXCLUDED.categories_included,
  features = EXCLUDED.features,
  has_pdf_export = EXCLUDED.has_pdf_export,
  has_email_reports = EXCLUDED.has_email_reports,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order;
