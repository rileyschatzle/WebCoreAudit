'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { updateProfile } from '@/lib/supabase/auth';
import {
  User,
  Building2,
  Mail,
  CreditCard,
  Zap,
  Crown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateProfile({
        full_name: fullName,
        company_name: companyName,
      });
      await refreshProfile();
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const tierConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    free: { icon: <User className="w-5 h-5" />, color: 'text-gray-600', bg: 'bg-gray-100' },
    starter: { icon: <Zap className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-100' },
    pro: { icon: <Zap className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-100' },
    agency: { icon: <Crown className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-100' },
  };

  const tier = tierConfig[profile?.tier || 'free'] || tierConfig.free;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and subscription</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wc-cyan/50 focus:border-wc-cyan"
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wc-cyan/50 focus:border-wc-cyan"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-wc-blue to-wc-cyan text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${tier.bg} ${tier.color}`}>
                {tier.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 capitalize">{profile?.tier || 'Free'} Plan</p>
                <p className="text-sm text-gray-500">
                  {profile?.audits_used_this_month || 0} / {profile?.audits_limit === -1 ? 'Unlimited' : profile?.audits_limit || 1} audits this month
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/billing"
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Billing
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-wc-blue to-wc-cyan text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                {profile?.tier === 'free' ? 'Upgrade' : 'Change Plan'}
              </Link>
            </div>
          </div>

          {/* Purchased Audits */}
          {(profile?.purchased_audits || 0) > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-700">
                <span className="font-semibold">{profile?.purchased_audits}</span> bonus audits available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => {
              // TODO: Implement account deletion
              alert('Please contact support to delete your account.');
            }}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
