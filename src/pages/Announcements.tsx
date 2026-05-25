import { useState, useEffect } from 'react';
import { Plus, Send, Trash2, Users, Bell, X, Megaphone, Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function Announcements() {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '' });

  const loadAnnouncements = () => {
    adminApi.announcements.list().then(res => {
      if (res.success && res.data) setAnnouncements(res.data as Announcement[]);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    const res = await adminApi.announcements.create({ title: form.title, message: form.message });
    if (res.success && res.data) {
      setAnnouncements([res.data as Announcement, ...announcements]);
      setShowModal(false);
      setForm({ title: '', message: '' });
      toast.success('Announcement sent', form.title);
    } else {
      toast.error('Failed to send', res.message || 'Please try again.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    const res = await adminApi.announcements.delete(id);
    if (res.success) {
      setAnnouncements(announcements.filter(a => a._id !== id));
      toast.success('Deleted', 'Announcement removed.');
    } else {
      toast.error('Failed to delete', res.message || 'Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Announcements
          </h1>
          <p className="text-gray-500 text-sm">Post messages visible to all users on the platform</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold"
          style={{ background: '#F5820A', boxShadow: '0 4px 20px rgba(245,130,10,0.3)' }}
        >
          <Plus size={18} /> New Announcement
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total', value: announcements.length, icon: Megaphone, color: 'text-gray-700', bg: 'bg-gray-100' },
          { label: 'This Month', value: announcements.filter(a => new Date(a.createdAt).getMonth() === new Date().getMonth()).length, icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 p-5">
            <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={28} style={{ color: '#F5820A' }} />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Megaphone size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No announcements yet. Create your first one!</p>
            </div>
          ) : announcements.map(ann => (
            <div key={ann._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,130,10,0.1)' }}>
                    <Users size={18} style={{ color: '#F5820A' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{ann.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ann.message}</p>
                    <span className="text-xs text-gray-400">{new Date(ann.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(ann._id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">New Announcement</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={22} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g., New course available!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={4}
                  placeholder="Write your announcement here..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowModal(false); setForm({ title: '', message: '' }); }}
                className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.title.trim() || !form.message.trim() || saving}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: '#F5820A' }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {saving ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
