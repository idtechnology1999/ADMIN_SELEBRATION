import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Ban, CheckCircle, XCircle, Phone, GitBranch, ChevronLeft, ChevronRight, X, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { adminApi } from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  stage: number;
  referrals: number;
  subscription: 'active' | 'trial' | 'expired' | 'cancelled';
  status: 'active' | 'banned';
  joined: string;
  referralCode?: string;
  referralTree?: ReferralNode[];
}

interface ReferralNode {
  id: string;
  name: string;
  stage: number;
  subscription: 'active' | 'trial' | 'expired' | 'cancelled';
  referrals: number;
  level: number;
  children?: ReferralNode[];
}

const PAGE_SIZE = 8;

const subColor = (s: string) => ({
  active: 'bg-green-100 text-green-700',
  trial: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
}[s] ?? 'bg-gray-100 text-gray-700');

function ReferralTree({ nodes, depth = 0 }: { nodes: ReferralNode[]; depth?: number }) {
  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4 space-y-2' : 'space-y-2'}>
      {nodes.map(node => (
        <div key={node.id}>
          <div className={`flex items-center gap-3 p-3 rounded-xl ${depth === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: depth === 0 ? '#F5820A' : '#0D2847' }}>
              {node.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{node.name}</p>
              <p className="text-xs text-gray-500">Stage {node.stage} · {node.referrals} referrals</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${subColor(node.subscription)}`}>{node.subscription}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">L{node.level}</span>
            </div>
          </div>
          {node.children && node.children.length > 0 && <ReferralTree nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [treeUser, setTreeUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await adminApi.users.list();
    if (res.success && res.data) {
      setUsers(res.data as User[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
    connectSocket();
    socket.on('user:new', loadUsers);
    return () => {
      socket.off('user:new', loadUsers);
      disconnectSocket();
    };
  }, [loadUsers]);

  const filtered = users.filter(u => {
    const name = u.name || '';
    const email = u.email || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'banned') return u.status === 'banned';
    return u.subscription === filter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage = () => setPage(1);

  const handleBan = async (id: string) => {
    try {
      const res = await adminApi.users.ban(id);
      if (res.success) {
        setUsers(users.map(u => u._id === id ? { ...u, status: 'banned' } : u));
        setSelectedUser(null);
        toast.warning('User banned', 'The user has been banned from the platform.');
      } else {
        toast.error('Action failed', res.message || 'Please try again.');
      }
    } catch (err: any) {
      toast.error('Action failed', err.message || 'Please try again.');
    }
  };

  const handleUnban = async (id: string) => {
    try {
      const res = await adminApi.users.unban(id);
      if (res.success) {
        setUsers(users.map(u => u._id === id ? { ...u, status: 'active' } : u));
        setSelectedUser(null);
        toast.success('User unbanned', 'The user can now access the platform again.');
      } else {
        toast.error('Action failed', res.message || 'Please try again.');
      }
    } catch (err: any) {
      toast.error('Action failed', err.message || 'Please try again.');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await adminApi.users.activate(id);
      if (res.success) {
        setUsers(users.map(u => u._id === id ? { ...u, subscription: 'active' } : u));
        toast.success('Subscription activated');
      } else {
        toast.error('Action failed', res.message || 'Please try again.');
      }
    } catch (err: any) {
      toast.error('Action failed', err.message || 'Please try again.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await adminApi.users.cancel(id);
      if (res.success) {
        setUsers(users.map(u => u._id === id ? { ...u, subscription: 'cancelled' } : u));
        setSelectedUser(null);
        toast.info('Subscription cancelled');
      } else {
        toast.error('Action failed', res.message || 'Please try again.');
      }
    } catch (err: any) {
      toast.error('Action failed', err.message || 'Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to DELETE this user? This cannot be undone.')) return;
    const res = await adminApi.users.delete(id);
    if (res.success) {
      setUsers(users.filter(u => u._id !== id));
      setSelectedUser(null);
      toast.success('User deleted', 'The user and all related data have been removed.');
    } else {
      toast.error('Delete failed', res.message || 'Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Users</h1>
          <p className="text-gray-500 text-sm">Manage all registered users</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search users..." value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-52" />
          </div>
          <select value={filter} onChange={e => { setFilter(e.target.value); resetPage(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: users.length, color: 'text-gray-900' },
          { label: 'Active', value: users.filter(u => u.subscription === 'active').length, color: 'text-green-600' },
          { label: 'On Trial', value: users.filter(u => u.subscription === 'trial').length, color: 'text-yellow-600' },
          { label: 'Banned', value: users.filter(u => u.status === 'banned').length, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Phone', 'Stage', 'Referrals', 'Subscription', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: '#F5820A' }}>
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name || '-'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm">{user.phone || '-'}</td>
                    <td className="px-5 py-3.5"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">Stage {user.stage}</span></td>
                    <td className="px-5 py-3.5 font-medium text-sm">{user.referrals}</td>
                    <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${subColor(user.subscription)}`}>{user.subscription}</span></td>
                    <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${user.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{user.status === 'banned' ? 'Banned' : 'Active'}</span></td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm">{user.joined}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedUser(user)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye size={15} className="text-gray-500" /></button>
                        <button onClick={() => setTreeUser(user)} className="p-1.5 hover:bg-gray-100 rounded-lg"><GitBranch size={15} className="text-blue-500" /></button>
                        {user.subscription !== 'active' && <button onClick={() => handleActivate(user._id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><CheckCircle size={15} className="text-green-500" /></button>}
                        {user.subscription === 'active' && <button onClick={() => handleCancel(user._id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><XCircle size={15} className="text-yellow-500" /></button>}
                        {user.status === 'active'
                          ? <button onClick={() => handleBan(user._id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Ban size={15} className="text-red-500" /></button>
                          : <button onClick={() => handleUnban(user._id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><CheckCircle size={15} className="text-green-500" /></button>}
                        <button onClick={() => handleDelete(user._id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={15} className="text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === p ? 'text-white' : 'hover:bg-gray-100 text-gray-600'}`} style={page === p ? { background: '#F5820A' } : {}}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="flex items-center gap-4 pb-4 mb-4 border-b">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: '#F5820A' }}>{selectedUser.name?.charAt(0) || '?'}</div>
              <div>
                <h4 className="text-lg font-bold">{selectedUser.name || '-'}</h4>
                <p className="text-gray-500 text-sm">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Phone', value: <span className="flex items-center gap-1"><Phone size={13} className="text-gray-400" />{selectedUser.phone || '-'}</span> },
                { label: 'Referral Code', value: <span className="font-mono text-sm" style={{ color: '#F5820A' }}>{selectedUser.referralCode || '-'}</span> },
                { label: 'Stage', value: `Stage ${selectedUser.stage}` },
                { label: 'Total Referrals', value: selectedUser.referrals },
                { label: 'Subscription', value: <span className={`capitalize font-medium ${selectedUser.subscription === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedUser.subscription}</span> },
                { label: 'Joined', value: selectedUser.joined },
              ].map(({ label, value }, i) => (
                <div key={i}>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
                  <p className="font-medium mt-0.5 text-sm">{value}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t flex gap-2">
              <button onClick={() => { setSelectedUser(null); setTreeUser(selectedUser); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm hover:bg-gray-50">
                <GitBranch size={15} /> View Tree
              </button>
              {selectedUser.subscription !== 'active' && <button onClick={() => handleActivate(selectedUser._id)} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600">Activate</button>}
              {selectedUser.status === 'active'
                ? <button onClick={() => handleBan(selectedUser._id)} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">Ban User</button>
                : <button onClick={() => handleUnban(selectedUser._id)} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600">Unban User</button>}
              <button onClick={() => handleDelete(selectedUser._id)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm hover:bg-red-50">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {treeUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold">Referral Tree</h3>
                <p className="text-sm text-gray-500">{treeUser.name}'s downline network</p>
              </div>
              <button onClick={() => setTreeUser(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'rgba(13,40,71,0.06)', border: '1px solid rgba(13,40,71,0.15)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#0D2847' }}>{treeUser.name?.charAt(0) || '?'}</div>
                <div>
                  <p className="font-bold text-gray-900">{treeUser.name} <span className="text-xs font-normal text-gray-500">(root)</span></p>
                  <p className="text-xs text-gray-500">Stage {treeUser.stage} · {treeUser.referrals} direct referrals</p>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${subColor(treeUser.subscription)}`}>{treeUser.subscription}</span>
              </div>
              {treeUser.referralTree && treeUser.referralTree.length > 0
                ? <ReferralTree nodes={treeUser.referralTree} />
                : <div className="text-center py-8"><GitBranch size={36} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-400 text-sm">No referrals yet</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}