-- WebCoreAudit Supabase Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- EMAIL SUBSCRIBERS
-- ============================================
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('audit', 'newsletter', 'waitlist')),
  audit_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMPTZ
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_created ON email_subscribers(created_at DESC);

-- ============================================
-- AUDITS
-- ============================================
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  overall_score INTEGER,
  category_scores JSONB DEFAULT '{}',
  summary TEXT,
  brief JSONB DEFAULT '{}',

  -- Status tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- User association (null for anonymous/free)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Token usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost DECIMAL(10, 6),

  -- Source tracking
  source_ip TEXT,
  user_agent TEXT,

  -- Admin flag
  is_admin BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audits_user ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

-- ============================================
-- USER PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,

  -- Subscription
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),

  -- Usage
  audits_used_this_month INTEGER DEFAULT 0,
  audits_limit INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_audit_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe ON user_profiles(stripe_customer_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PRICING TIERS (reference table)
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,

  -- Pricing (in cents)
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,

  -- Limits
  audits_per_month INTEGER NOT NULL DEFAULT 1,
  pages_per_audit INTEGER NOT NULL DEFAULT 1,
  categories_included TEXT[] DEFAULT '{}',

  -- Features
  features TEXT[] DEFAULT '{}',
  has_pdf_export BOOLEAN DEFAULT FALSE,
  has_email_reports BOOLEAN DEFAULT FALSE,
  has_priority_support BOOLEAN DEFAULT FALSE,
  has_api_access BOOLEAN DEFAULT FALSE,
  has_white_label BOOLEAN DEFAULT FALSE,

  -- Display
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

-- Insert default tiers
INSERT INTO pricing_tiers (id, display_name, description, price_monthly, price_yearly, audits_per_month, pages_per_audit, categories_included, features, has_pdf_export, has_email_reports, is_popular, sort_order)
VALUES
  ('free', 'Free', 'Try it out', 0, 0, 1, 1, ARRAY['business', 'technical', 'brand'], ARRAY['1 free audit', 'Basic analysis', 'PDF export'], TRUE, FALSE, FALSE, 0),
  ('starter', 'Starter', 'For individuals', 1900, 15900, 5, 3, ARRAY['business', 'technical', 'brand', 'ux', 'content', 'security'], ARRAY['5 audits/month', 'Up to 3 pages', 'Email reports', 'Priority queue'], TRUE, TRUE, FALSE, 1),
  ('pro', 'Pro', 'For growing teams', 4900, 41900, 25, 10, ARRAY['all'], ARRAY['25 audits/month', 'Up to 10 pages', 'All categories', 'API access', 'Priority support'], TRUE, TRUE, TRUE, 2),
  ('agency', 'Agency', 'For agencies', 14900, 126900, -1, 50, ARRAY['all'], ARRAY['Unlimited audits', 'Up to 50 pages', 'White-label reports', 'Dedicated support', 'Custom branding'], TRUE, TRUE, FALSE, 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,

  -- Details
  description TEXT,
  tier TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe ON transactions(stripe_payment_intent_id);

-- ============================================
-- ADD-ON PURCHASES
-- ============================================
CREATE TABLE IF NOT EXISTS addon_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,

  addon_type TEXT NOT NULL CHECK (addon_type IN ('content_analysis', 'competitor_report', 'seo_deep_dive', 'accessibility_audit', 'extra_audit_pack')),
  quantity INTEGER DEFAULT 1,
  price_paid INTEGER NOT NULL, -- in cents

  stripe_payment_intent_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_addon_purchases_user ON addon_purchases(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_purchases ENABLE ROW LEVEL SECURITY;

-- Email subscribers: Only service role can access
CREATE POLICY "Service role only" ON email_subscribers FOR ALL USING (auth.role() = 'service_role');

-- Audits: Users can see their own, anonymous audits are public
CREATE POLICY "Users see own audits" ON audits FOR SELECT USING (
  user_id = auth.uid() OR user_id IS NULL
);
CREATE POLICY "Users create own audits" ON audits FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

-- User profiles: Users can only see/edit their own
CREATE POLICY "Users see own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());

-- Transactions: Users see their own
CREATE POLICY "Users see own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());

-- Addon purchases: Users see their own
CREATE POLICY "Users see own addons" ON addon_purchases FOR SELECT USING (user_id = auth.uid());

-- Pricing tiers: Public read
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tiers" ON pricing_tiers FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, tier, audits_limit)
  VALUES (NEW.id, NEW.email, 'free', 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Reset monthly usage (call via cron job on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles SET audits_used_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
