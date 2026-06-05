import { useState } from 'react';
import { Mail, Send, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { adminApi } from '../services/api';

const TARGETS = [
  { value: 'all',       label: 'All Users',            desc: 'Every registered user' },
  { value: 'trial',     label: 'Free Trial',           desc: 'Users currently on 7-day trial' },
  { value: 'active',    label: 'Active Subscribers',   desc: 'Users with a paid active subscription' },
  { value: 'expired',   label: 'Expired',              desc: 'Users whose trial or subscription has expired' },
  { value: 'cancelled', label: 'Cancelled',            desc: 'Users who cancelled their subscription' },
  { value: 'stage-1',   label: 'Fish (Stage 1)',       desc: 'Users at stage 1 — Fish level' },
  { value: 'stage-2',   label: 'Shark (Stage 2)',      desc: 'Users at stage 2 — Shark level' },
  { value: 'stage-3',   label: 'Whale (Stage 3)',      desc: 'Users at stage 3 — Whale level' },
];

export default function EmailBlast() {
  const toast = useToast();
  const [target, setTarget] = useState('all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const selectedTarget = TARGETS.find(t => t.value === target)!;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Missing fields', 'Subject and message body are required.');
      return;
    }
    if (!window.confirm(`Send this email to all "${selectedTarget.label}" users? This cannot be undone.`)) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await adminApi.emailBlast.send(target, subject, body);
      if (res.success) {
        setResult((res as any).data);
        toast.success('Email blast sent!', res.message || 'Emails are on their way.');
        setSubject('');
        setBody('');
      } else {
        toast.error('Failed', res.message || 'Something went wrong.');
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to send email blast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Email Blast</h1>
        <p className="text-gray-500 text-sm mt-1">Send a targeted email to any group of users.</p>
      </div>

      {/* Target selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Users size={17} /> Select Target Audience</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TARGETS.map(t => (
            <button
              key={t.value}
              onClick={() => setTarget(t.value)}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                target === t.value
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <p className={`font-semibold text-sm ${target === t.value ? 'text-orange-600' : 'text-gray-800'}`}>{t.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Mail size={17} /> Compose Email</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Important update from Selebration"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Message Body</label>
            <span className="text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> to personalise with each user's name</span>
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={10}
            placeholder={`Hi {{name}},\n\nYour message here...\n\nRegards,\nThe Selebration Team`}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y font-mono"
          />
        </div>

        {/* Preview bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Sending to: <span className="font-semibold text-gray-900">{selectedTarget.label}</span>
            <span className="mx-2 text-gray-300">|</span>
            Subject: <span className="font-semibold text-gray-900">{subject || '—'}</span>
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(135deg,#F5820A,#e06900)' }}
          >
            <Send size={15} />
            {loading ? 'Sending...' : 'Send Email Blast'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="font-semibold text-green-800 mb-2">Email blast complete</p>
          <div className="flex gap-6 text-sm">
            <span className="text-gray-700">Total: <strong>{result.total}</strong></span>
            <span className="text-green-700">Sent: <strong>{result.sent}</strong></span>
            {result.failed > 0 && <span className="text-red-600">Failed: <strong>{result.failed}</strong></span>}
          </div>
        </div>
      )}
    </div>
  );
}
