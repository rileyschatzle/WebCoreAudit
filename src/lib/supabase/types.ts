// Supabase Database Types
// Run this SQL in Supabase SQL Editor to create tables

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// EMAIL SUBSCRIBERS
// ============================================
export interface EmailSubscriber {
  id: string
  email: string
  source: 'audit' | 'newsletter' | 'waitlist'
  audit_url?: string // URL they audited when subscribing
  created_at: string
  verified: boolean
  unsubscribed_at?: string
  user_id?: string // Linked if they create an account
}

// ============================================
// AUDITS
// ============================================
export interface Audit {
  id: string
  url: string
  overall_score?: number | null
  category_scores?: CategoryScores | null
  summary?: string | null
  brief?: AuditBrief | null

  // Tracking
  created_at: string
  completed_at?: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string | null

  // User association (null for anonymous/free audits)
  user_id?: string | null

  // Token usage
  input_tokens?: number | null
  output_tokens?: number | null
  total_tokens?: number | null
  estimated_cost?: number | null

  // Source tracking
  source_ip?: string | null
  user_agent?: string | null

  // Admin flag - audits run by admins are stored separately
  is_admin?: boolean
}

export interface CategoryScores {
  business?: number
  technical?: number
  brand?: number
  ux?: number
  content?: number
  security?: number
  traffic?: number
  conversion?: number
  social?: number
  trust?: number
}

export interface AuditBrief {
  business_name: string
  business_description: string
  target_audience: string
  industry: string
  site_type: string
  total_pages?: number
}

// ============================================
// USERS & PROFILES
// ============================================
export interface UserProfile {
  id: string // Same as auth.users.id
  email: string
  full_name?: string
  company_name?: string
  avatar_url?: string

  // Subscription
  tier: 'free' | 'starter' | 'pro' | 'agency'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | null

  // Usage
  audits_used_this_month: number
  audits_limit: number // Based on tier
  purchased_audits?: number // One-time purchased audit packs

  // Timestamps
  created_at: string
  updated_at: string
  last_audit_at?: string

  // OAuth provider info (Apple/Facebook on roadmap)
  auth_provider?: 'email' | 'google'
  provider_user_id?: string
}

// ============================================
// AUTH TYPES
// ============================================
// Note: Apple and Facebook OAuth are on the roadmap
export type OAuthProvider = 'google'

export interface AuthUser {
  id: string
  email: string
  profile?: UserProfile
}

// ============================================
// BILLING & PRICING
// ============================================
export interface PricingTier {
  id: string
  name: 'free' | 'starter' | 'pro' | 'agency'
  display_name: string
  description: string

  // Pricing
  price_monthly: number // in cents
  price_yearly: number // in cents
  stripe_price_id_monthly?: string
  stripe_price_id_yearly?: string

  // Limits
  audits_per_month: number // -1 for unlimited
  pages_per_audit: number
  categories_included: string[] // Which categories are included

  // Features
  features: string[]
  has_pdf_export: boolean
  has_email_reports: boolean
  has_priority_support: boolean
  has_api_access: boolean
  has_white_label: boolean

  // Display
  is_popular: boolean
  sort_order: number
}

// ============================================
// TRANSACTIONS / PAYMENTS
// ============================================
export interface Transaction {
  id: string
  user_id: string
  amount: number // in cents
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'

  // Stripe
  stripe_payment_intent_id?: string
  stripe_invoice_id?: string

  // Details
  description: string
  tier?: string

  created_at: string
}

// ============================================
// ADD-ON FEATURES (one-time purchases)
// ============================================
export interface AddOnPurchase {
  id: string
  user_id: string
  audit_id?: string // If purchased for a specific audit

  addon_type: 'content_analysis' | 'competitor_report' | 'seo_deep_dive' | 'accessibility_audit' | 'extra_audit_pack'
  quantity: number
  price_paid: number // in cents

  // Stripe
  stripe_payment_intent_id?: string

  created_at: string
  used_at?: string
}

// ============================================
// DATABASE SCHEMA (Full definition)
// ============================================
export interface Database {
  public: {
    Tables: {
      email_subscribers: {
        Row: EmailSubscriber
        Insert: Omit<EmailSubscriber, 'id' | 'created_at'>
        Update: Partial<Omit<EmailSubscriber, 'id'>>
      }
      audits: {
        Row: Audit
        Insert: Omit<Audit, 'id' | 'created_at'>
        Update: Partial<Omit<Audit, 'id'>>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
      pricing_tiers: {
        Row: PricingTier
        Insert: Omit<PricingTier, 'id'>
        Update: Partial<Omit<PricingTier, 'id'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id'>>
      }
      addon_purchases: {
        Row: AddOnPurchase
        Insert: Omit<AddOnPurchase, 'id' | 'created_at'>
        Update: Partial<Omit<AddOnPurchase, 'id'>>
      }
    }
  }
}

// ============================================
// PRICING TIERS CONFIG (for reference)
// ============================================
export const PRICING_TIERS = {
  free: {
    name: 'Free',
    audits_per_month: 1,
    pages_per_audit: 1,
    categories: ['business', 'technical', 'brand'],
    price_monthly: 0,
  },
  starter: {
    name: 'Starter',
    audits_per_month: 5,
    pages_per_audit: 3,
    categories: ['business', 'technical', 'brand', 'ux', 'content', 'security'],
    price_monthly: 1900, // $19
  },
  pro: {
    name: 'Pro',
    audits_per_month: 25,
    pages_per_audit: 10,
    categories: 'all',
    price_monthly: 4900, // $49
  },
  agency: {
    name: 'Agency',
    audits_per_month: -1, // unlimited
    pages_per_audit: 50,
    categories: 'all',
    price_monthly: 14900, // $149
  },
} as const
