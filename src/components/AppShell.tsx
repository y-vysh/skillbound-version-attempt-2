import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  Calendar,
  Compass,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  ArrowLeftRight,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { NotificationItem } from '../types';
import { Avatar } from './Avatar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, levelInfo, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await apiRequest<{ notifications: NotificationItem[] }>('/notifications');
      setNotifications(data.notifications);
    } catch {
      // ignore silent poll errors
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, location.pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
      // ignore
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/skills', label: 'My Skills', icon: Sparkles },
    { to: '/requests', label: 'Requests', icon: ArrowLeftRight },
    { to: '/sessions', label: 'Sessions', icon: Calendar },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/rewards', label: 'Rewards', icon: Award },
    { to: '/profile', label: 'Profile', icon: UserIcon },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: ShieldCheck });
  }

  const mobileTabs = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/skills', label: 'My Skills', icon: Sparkles },
    { to: '/requests', label: 'Requests', icon: ArrowLeftRight },
    { to: '/sessions', label: 'Sessions', icon: Calendar },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  const isActive = (path: string) =>
    location.pathname === path || (path === '/discover' && location.pathname.startsWith('/peers/'));

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col lg:flex-row">
      {/* Desktop Permanent Sidebar (260px per design system) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-[#e2e8f0] z-30">
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-[#e2e8f0] shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/aistudio/Image_2_5cee0444.jpeg"
              alt="SkillBound Logo"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <span className="font-display font-bold text-lg text-[#4338ca] tracking-tight truncate">
              SkillBound
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#eff4ff] text-[#4338ca] font-semibold'
                    : 'text-[#464554] hover:bg-[#f8f9ff] hover:text-[#0b1c30]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-[#e2e8f0] flex flex-col gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f8f9ff] transition-colors"
            >
              <Avatar name={user.full_name} src={user.avatar_url} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0b1c30] truncate">{user.full_name}</p>
                <p className="text-xs text-[#64748b] truncate">
                  {levelInfo ? `${user.points} pts · Lvl ${levelInfo.level}` : user.major || user.email}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#464554] hover:bg-[#ffdad6]/40 hover:text-[#ba1a1a] hover:border-[#fca5a5] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 bg-white/90 backdrop-blur-md border-b border-[#e2e8f0] px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 lg:hidden min-w-0">
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
              <img
                src="/assets/aistudio/Image_2_5cee0444.jpeg"
                alt="SkillBound Logo"
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
              <span className="font-display font-bold text-base text-[#4338ca] truncate">
                SkillBound
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-sm text-[#64748b]">
            <span className="font-medium text-[#0b1c30]">{user?.location || 'Campus Network'}</span>
            <span>·</span>
            <span>1:1 Peer Reciprocal Learning</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/rewards"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#4338ca] text-xs font-semibold tabular-nums hover:bg-[#e0e0ff] transition-colors"
            >
              <Award className="w-4 h-4 text-[#f59e0b]" />
              <span>{user?.points ?? 0} pts</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#eff4ff] text-[#4338ca] text-xs font-semibold"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setNotifOpen((o) => !o)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#464554] hover:bg-[#eff4ff] transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-[#e2e8f0] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
                    <span className="font-display font-semibold text-sm text-[#0b1c30]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-semibold text-[#4338ca] hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#f1f5f9]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#64748b]">
                        You are all caught up.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            navigate(n.link || '/dashboard');
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-[#f8f9ff] transition-colors flex flex-col gap-0.5 ${
                            !n.is_read ? 'bg-[#eff4ff]/60' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#0b1c30] truncate">
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className="text-[10px] font-bold text-[#4338ca] shrink-0">New</span>
                            )}
                          </div>
                          <p className="text-xs text-[#464554] line-clamp-2">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/profile"
              aria-label="Profile"
              className="lg:hidden flex items-center"
            >
              <Avatar name={user?.full_name || 'Student'} src={user?.avatar_url} size="sm" />
            </Link>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Dock */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2e8f0] grid grid-cols-6 h-16 px-1"
      >
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
                active ? 'text-[#4338ca] font-semibold' : 'text-[#464554]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight truncate max-w-full px-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
