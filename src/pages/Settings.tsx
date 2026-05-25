import { useState, useEffect } from 'react';
import { Save, CreditCard, DollarSign, Eye, EyeOff, Bell, Globe, Shield, Loader2, UserPlus, Mail, Lock, User } from 'lucide-react';
import type { PlatformSettings } from '../types';
import { adminApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const defaultSettings: PlatformSettings = {
  paystack: { publicKey: '', secretKey: '', planId: '' },
  bank: { bankName: '', accountNumber: '', accountName: '' },
  commissions: { level1: 65, level2: 15, level3: 5, level4: 3, level5: 2, level6: 1 },
  general: { trialDays: 7, minWithdrawal: 10000, subscriptionPrice: 5000, platformName: '', supportEmail: '' },
};

function serverToAdmin(d: Record<string, any>): PlatformSettings {
  return {
    paystack: {
      publicKey: d.paystackKey || '',
      secretKey: d.paystackSecret || '',
      planId: d.paystackPlanId || '',
    },
    bank: {
      bankName: d.bankName || '',
      accountNumber: d.bankAccount || '',
      accountName: d.bankAccountName || '',
    },
    commissions: {
      level1: d.commissionLevel1 ?? 65,
      level2: d.commissionLevel2 ?? 15,
      level3: d.commissionLevel3 ?? 5,
      level4: d.commissionLevel4 ?? 3,
      level5: d.commissionLevel5 ?? 2,
      level6: d.commissionLevel6 ?? 1,
    },
    general: {
      trialDays: d.trialDays ?? 7,
      minWithdrawal: d.minWithdrawal ?? 10000,
      subscriptionPrice: d.subscriptionPrice ?? 5000,
      platformName: d.platformName || '',
      supportEmail: d.supportEmail || '',
    },
  };
}

function adminToServer(s: PlatformSettings) {
  return {
    paystackKey: s.paystack.publicKey,
    paystackSecret: s.paystack.secretKey,
    paystackPlanId: s.paystack.planId,
    bankName: s.bank.bankName,
    bankAccount: s.bank.accountNumber,
    bankAccountName: s.bank.accountName,
    commissionLevel1: s.commissions.level1,
    commissionLevel2: s.commissions.level2,
    commissionLevel3: s.commissions.level3,
    commissionLevel4: s.commissions.level4,
    commissionLevel5: s.commissions.level5,
    commissionLevel6: s.commissions.level6,
    subscriptionPrice: s.general.subscriptionPrice,
    trialDays: s.general.trialDays,
    minWithdrawal: s.general.minWithdrawal,
    platformName: s.general.platformName,
    supportEmail: s.general.supportEmail,
  };
}

const tabs = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'paystack', label: 'Paystack', icon: CreditCard },
  { id: 'bank', label: 'Bank Account', icon: Shield },
  { id: 'commissions', label: 'Commissions', icon: DollarSign },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'admins', label: 'Add Admin', icon: UserPlus },
];

export default function Settings() {
  const toast = useToast();
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === 'superadmin';
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [showKeys, setShowKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', role: 'admin' as 'admin' | 'superadmin' });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminsList, setAdminsList] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.settings.get().then(res => {
      if (res.success && res.data) {
        setSettings(serverToAdmin(res.data as Record<string, any>));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await adminApi.settings.update(adminToServer(settings));
    if (res.success) {
      toast.success('Settings saved', 'Platform settings updated successfully.');
    } else {
      toast.error('Save failed', res.message || 'Please try again.');
    }
    setSaving(false);
  };

  const handleAddAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      toast.error('Missing fields', 'Please fill all required fields.');
      return;
    }
    setAddingAdmin(true);
    const res = await adminApi.admins.create(adminForm);
    if (res.success) {
      toast.success('Admin added', `${adminForm.name} has been added as ${adminForm.role}.`);
      setAdminForm({ name: '', email: '', password: '', role: 'admin' });
      loadAdmins();
    } else {
      toast.error('Failed to add admin', res.message || 'Please try again.');
    }
    setAddingAdmin(false);
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    const res = await adminApi.admins.list();
    if (res.success && res.data) {
      setAdminsList(res.data as Array<{ id: string; name: string; email: string; role: string }>);
    }
    setLoadingAdmins(false);
  };

  const handleDeleteAdmin = async (id: string, name: string, role: string) => {
    if (role === 'superadmin') {
      toast.error('Cannot delete', 'Super Admin accounts cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete admin "${name}"?`)) return;
    setDeletingId(id);
    const res = await adminApi.admins.delete(id);
    if (res.success) {
      toast.success('Admin deleted', `${name} has been removed.`);
      loadAdmins();
    } else {
      toast.error('Delete failed', res.message || 'Please try again.');
    }
    setDeletingId(null);
  };

  useEffect(() => {
    if (activeTab === 'admins' && isSuperAdmin) {
      loadAdmins();
    }
  }, [activeTab, isSuperAdmin]);

  const update = <S extends keyof PlatformSettings>(section: S, field: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:border-amber-500 text-sm";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={36} style={{ color: '#F5820A' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Platform Settings</h1>
          <p className="text-gray-500 text-sm">Configure your platform settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-lg disabled:opacity-60"
          style={{ background: '#F5820A', boxShadow: '0 4px 20px rgba(245,130,10,0.3)' }}
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-56 md:shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex md:flex-col gap-1 overflow-x-auto">
            {tabs.filter(tab => tab.id !== 'admins' || isSuperAdmin).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-left transition-colors text-sm whitespace-nowrap ${
                  activeTab === tab.id ? 'font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={activeTab === tab.id ? { background: 'rgba(245,130,10,0.08)', color: '#F5820A' } : {}}
              >
                <tab.icon size={17} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <h2 className="text-base font-bold">General Settings</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform Name</label>
                  <input className={inputClass} value={settings.general.platformName} onChange={e => update('general', 'platformName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
                  <input type="email" className={inputClass} value={settings.general.supportEmail} onChange={e => update('general', 'supportEmail', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trial Duration (days)</label>
                  <input type="number" className={inputClass} value={settings.general.trialDays} onChange={e => update('general', 'trialDays', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subscription Price (₦/month)</label>
                  <input type="number" className={inputClass} value={settings.general.subscriptionPrice} onChange={e => update('general', 'subscriptionPrice', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Withdrawal (₦)</label>
                  <input type="number" className={inputClass} value={settings.general.minWithdrawal} onChange={e => update('general', 'minWithdrawal', parseInt(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paystack' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
              <h2 className="text-base font-bold">Paystack Integration</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                Create your Paystack account at paystack.com and get your API keys from the developer settings.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Public Key</label>
                <input className={inputClass + ' font-mono'} value={settings.paystack.publicKey} onChange={e => update('paystack', 'publicKey', e.target.value)} placeholder="pk_live_xxxxxxxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Secret Key</label>
                <div className="relative">
                  <input type={showKeys ? 'text' : 'password'} className={inputClass + ' font-mono pr-12'} value={settings.paystack.secretKey} onChange={e => update('paystack', 'secretKey', e.target.value)} placeholder="sk_live_xxxxxxxxxxxxx" />
                  <button type="button" onClick={() => setShowKeys(!showKeys)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showKeys ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan ID</label>
                <input className={inputClass + ' font-mono'} value={settings.paystack.planId} onChange={e => update('paystack', 'planId', e.target.value)} placeholder="PLN_xxxxxxxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Webhook URL</label>
                <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono">/api/payment/webhook</p>
                <p className="text-xs text-gray-500 mt-1">Prefix with your server domain and add this path in your Paystack webhook settings.</p>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold">Admin Bank Account</h2>
                <p className="text-sm text-gray-500 mt-0.5">Where subscription payments will be received.</p>
              </div>
              {[
                { key: 'bankName', label: 'Bank Name', placeholder: 'Guaranty Trust Bank (GTBank)' },
                { key: 'accountNumber', label: 'Account Number', placeholder: '0123456789' },
                { key: 'accountName', label: 'Account Name', placeholder: 'Digital World Tech Academy' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input className={inputClass} value={settings.bank[f.key as keyof typeof settings.bank]} onChange={e => update('bank', f.key, e.target.value)} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'commissions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold">Commission Rates</h2>
                <p className="text-sm text-gray-500 mt-0.5">Configure percentages for each referral level.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'level1', label: 'Level 1 (Direct Referral)' },
                  { key: 'level2', label: 'Level 2' },
                  { key: 'level3', label: 'Level 3' },
                  { key: 'level4', label: 'Level 4' },
                  { key: 'level5', label: 'Level 5' },
                  { key: 'level6', label: 'Level 6' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <label className="font-medium text-gray-700 text-sm">{item.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.commissions[item.key as keyof typeof settings.commissions]}
                        onChange={e => update('commissions', item.key, parseInt(e.target.value))}
                        className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-center text-sm"
                      />
                      <span className="text-gray-500 text-sm">%</span>
                      <span className="text-xs text-gray-400 w-16">
                        ₦{(settings.general.subscriptionPrice * (settings.commissions[item.key as keyof typeof settings.commissions] / 100)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(245,130,10,0.08)', border: '1px solid rgba(245,130,10,0.2)' }}>
                <span className="font-semibold" style={{ color: '#F5820A' }}>Total Commission: </span>
                <span style={{ color: '#c26200' }}>
                  {Object.values(settings.commissions).reduce((a, b) => a + b, 0)}% —{' '}
                  ₦{(settings.general.subscriptionPrice * Object.values(settings.commissions).reduce((a, b) => a + b, 0) / 100).toLocaleString()} per subscription
                </span>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold">Email Notifications</h2>
                <p className="text-sm text-gray-500 mt-0.5">Configure notifications sent to users.</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'welcome', label: 'Welcome email on registration', enabled: true },
                  { id: 'trial_end', label: 'Trial ending reminder (Day 5)', enabled: true },
                  { id: 'payment', label: 'Payment confirmation', enabled: true },
                  { id: 'commission', label: 'Commission earned', enabled: true },
                  { id: 'withdrawal', label: 'Withdrawal processed', enabled: true },
                  { id: 'referral', label: 'New referral signup', enabled: false },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <span className="text-gray-700 text-sm">{item.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admins' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold">Add New Admin</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Create new admin accounts. Super Admins can oversee all activities. Admins have limited access.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  <strong>Role Permissions:</strong><br />
                  • <strong>Super Admin</strong>: Full access, can add/remove admins and super admins, oversee all activities.<br />
                  • <strong>Admin</strong>: Limited access, cannot add any admin or super admin.
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:border-amber-500 text-sm"
                        placeholder="John Doe"
                        value={adminForm.name}
                        onChange={e => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:border-amber-500 text-sm"
                        placeholder="admin@example.com"
                        value={adminForm.email}
                        onChange={e => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:border-amber-500 text-sm"
                        placeholder="••••••••"
                        value={adminForm.password}
                        onChange={e => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:border-amber-500 text-sm bg-white"
                      value={adminForm.role}
                      onChange={e => setAdminForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'superadmin' }))}
                    >
                      <option value="admin">Admin - Limited access</option>
                      <option value="superadmin">Super Admin - Full access</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddAdmin}
                  disabled={addingAdmin}
                  className="w-full text-white font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg disabled:opacity-60"
                  style={{ background: '#F5820A', boxShadow: '0 4px 20px rgba(245,130,10,0.3)' }}
                >
                  {addingAdmin ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
                  {addingAdmin ? 'Adding...' : 'Add Admin'}
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-base font-bold">Existing Admins</h2>
                {loadingAdmins ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin" size={28} style={{ color: '#F5820A' }} />
                  </div>
                ) : adminsList.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No admin accounts found.</p>
                ) : (
                  <div className="space-y-3">
                    {adminsList.map(adm => (
                      <div key={adm.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{adm.name}</p>
                          <p className="text-xs text-gray-500 truncate">{adm.email}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            adm.role === 'superadmin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {adm.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                          </span>
                          {adm.role === 'admin' ? (
                            <button
                              onClick={() => handleDeleteAdmin(adm.id, adm.name, adm.role)}
                              disabled={deletingId === adm.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Delete admin"
                            >
                              {deletingId === adm.id ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400" title="Cannot delete Super Admin">Protected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
