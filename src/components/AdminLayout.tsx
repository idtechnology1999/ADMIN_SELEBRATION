import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, DollarSign, Wallet,
  Settings, LogOut, Menu, X, ChevronRight, TrendingUp, Megaphone, Bell, Mail,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/users', icon: Users, label: 'Users', end: false },
  { to: '/courses', icon: BookOpen, label: 'Courses', end: false },
  { to: '/commissions', icon: DollarSign, label: 'Commissions', end: false },
  { to: '/withdrawals', icon: Wallet, label: 'Withdrawals', end: false, badgeKey: 'withdrawals' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics', end: false },
  { to: '/announcements', icon: Megaphone, label: 'Announcements', end: false },
  { to: '/email-blast', icon: Mail, label: 'Email Blast', end: false },
  { to: '/settings', icon: Settings, label: 'Settings', end: false },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; read: boolean }>>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    setNotifLoading(true);
    const res = await adminApi.notifications.list();
    if (res.success && res.data) {
      setNotifications(res.data as any);
    }
    setNotifLoading(false);
  };

  const fetchPendingCount = async () => {
    const res = await adminApi.withdrawals.pendingCount();
    if (res.success && (res as any).data?.count !== undefined) {
      setPendingWithdrawals((res as any).data.count);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchNotifications();
      fetchPendingCount();
    }
  }, [admin]);

  const markAllRead = async () => {
    await adminApi.notifications.markAllRead();
    fetchNotifications();
    fetchPendingCount();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0F2F5' }}>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-40 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: 'linear-gradient(180deg, #08192E 0%, #050F1C 100%)' }}
      >
        <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Selebration" className="h-8 w-auto object-contain" />
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,130,10,0.2)', color: '#F5820A' }}>ADMIN</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const badge = item.badgeKey === 'withdrawals' ? pendingWithdrawals : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={({ isActive }) => isActive
                  ? { background: 'rgba(245,130,10,0.15)', color: '#F5820A', borderLeft: '3px solid #F5820A' }
                  : { color: 'rgba(255,255,255,0.6)' }
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative shrink-0">
                      <item.icon size={18} style={isActive ? { color: '#F5820A' } : {}} />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white rounded-full" style={{ background: '#EF4444' }}>
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </div>
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && !isActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#EF4444', color: '#fff' }}>
                        {badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={14} style={{ color: '#F5820A' }} />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {admin && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-white/40">Signed in as</p>
              <p className="text-sm text-white/80 font-medium truncate">{admin.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors hover:bg-red-500/10"
            style={{ color: 'rgba(255,120,120,0.8)' }}
          >
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 lg:left-64 z-20 bg-white/95 backdrop-blur-sm"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', height: '60px' }}
      >
        <div className="flex items-center justify-between px-4 md:px-6 h-full">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-gray-500">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => { setShowNotif(!showNotif); if (!showNotif) fetchNotifications(); }}
                className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-full" style={{ background: '#EF4444' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs" style={{ color: '#F5820A' }}>Mark all read</button>
                    )}
                  </div>
                  {notifLoading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                    <div>
                      {notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-gray-50 ${n.read ? '' : 'bg-amber-50/50'}`}>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {admin && (
              <span className="text-sm text-gray-600 hidden sm:block">{admin.name}</span>
            )}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#0D2847' }}>
              {admin?.name?.charAt(0) ?? 'A'}
            </div>
          </div>
        </div>
      </header>

      <main className="lg:ml-64 pt-15 min-h-screen">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
