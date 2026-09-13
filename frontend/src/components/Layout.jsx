import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { api } from '../api/client.js';
import { ROLE_LABELS, formatTimeAgo } from './utils.js';
import { cn } from 'cn';
import { Breadcrumbs, PulseDot } from './ui.jsx';
import { AnimatedContent } from '../lib/reactbits/index.js';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Map,
  Sprout,
  CloudSun,
  TrendingUp,
  Sparkles,
  FlaskConical,
  Bug,
  Droplets,
  Banknote,
  BarChart3,
  BrainCircuit,
  UserCog,
  Bell,
  BellRing,
  CheckCheck,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Languages,
  UserRound,
  Component as ComponentIcon,
  ChevronRight,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

const NAV = [
  { to: '/dashboard', label: 'ড্যাশবোর্ড', en: 'Dashboard', Icon: LayoutDashboard, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/farmers', label: 'কৃষক', en: 'Farmers', Icon: Users, roles: ['OFFICER', 'ADMIN'] },
  { to: '/lands', label: 'জমি', en: 'Lands', Icon: Map, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/crops', label: 'ফসল', en: 'Crops', Icon: Sprout, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/weather', label: 'আবহাওয়া', en: 'Weather', Icon: CloudSun, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/forecast', label: 'ফলন পূর্বাভাস', en: 'Yield Forecast', Icon: TrendingUp, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/recommendations', label: 'AI ফসল সুপারিশ', en: 'AI Crop Recommendations', Icon: Sparkles, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/soil', label: 'মৃত্তিকা পরীক্ষা', en: 'Soil Test', Icon: FlaskConical, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/diseases', label: 'রোগ-পোকা', en: 'Pests & Diseases', Icon: Bug, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/advisories', label: 'সার ও সেচ পরামর্শ', en: 'Fertilizer & Irrigation', Icon: Droplets, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/market', label: 'বাজারদর', en: 'Market Prices', Icon: Banknote, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/reports', label: 'রিপোর্ট', en: 'Reports', Icon: BarChart3, roles: ['OFFICER', 'ADMIN'] },
  { to: '/ai-monitor', label: 'AI মনিটরিং', en: 'AI Monitoring', Icon: BrainCircuit, roles: ['ADMIN'] },
  { to: '/users', label: 'ব্যবহারকারী', en: 'Users', Icon: UserCog, roles: ['ADMIN'] },
  { to: '/elements', label: 'UI এলিমেন্টস', en: 'UI Elements', Icon: ComponentIcon, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
  { to: '/notifications', label: 'বিজ্ঞপ্তি', en: 'Notifications', Icon: Bell, roles: ['FARMER', 'OFFICER', 'ADMIN'] },
];

function sidebarOpenFromStorage() {
  try {
    return localStorage.getItem('cy_sidebar') !== 'closed';
  } catch {
    return true;
  }
}

function Brand({ collapsed }) {
  const { t } = useLanguage();
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
        <Sprout className="size-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="font-heading text-sm font-bold text-foreground">{t('কৃষি ফলন সিস্টেম', 'Crop Yield System')}</p>
          <p className="text-[11px] text-muted-foreground">AI-Based Crop Management</p>
        </div>
      )}
    </Link>
  );
}

function NavList({ items, unread, collapsed, onNavigate }) {
  const { t } = useLanguage();
  return (
    <nav className={cn('flex-1 space-y-0.5 overflow-y-auto px-3 py-3 slim-scroll', collapsed && 'px-2')}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all before:absolute',
              collapsed ? 'justify-center px-0' : '',
              isActive
                ? 'bg-emerald-500/10 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.08)] dark:bg-emerald-500/15 dark:text-emerald-400 before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-emerald-500 dark:before:bg-emerald-400'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )
          }
        >
          <item.Icon className="icon-lift size-4 shrink-0" />
          {!collapsed && <span className="flex-1">{t(item.label, item.en)}</span>}
          {!collapsed && item.to === '/notifications' && unread > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
          {collapsed && (
            <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              {t(item.label, item.en)}
              {item.to === '/notifications' && unread > 0 && (
                <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
              )}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(sidebarOpenFromStorage);

  const toggleSidebar = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('cy_sidebar', c ? 'open' : 'closed');
      } catch { /* ignore */ }
      return !c;
    });
  };

  const refreshUnread = useCallback(() => {
    api
      .get('/notifications/unread-count')
      .then((res) => setUnread(res.data.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refreshUnread]);

  const loadNotifs = useCallback(() => {
    api
      .get('/notifications')
      .then((res) => {
        setNotifs(res.data.notifications.slice(0, 6));
        refreshUnread();
      })
      .catch(() => {});
  }, [refreshUnread]);

  const markRead = useCallback(
    async (id) => {
      try {
        await api.patch(`/notifications/${id}/read`);
        setNotifs((list) => list.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        refreshUnread();
      } catch { /* ignore */ }
    },
    [refreshUnread]
  );

  const readAll = useCallback(async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifs((list) => list.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
      toast.success(t('সব বিজ্ঞপ্তি পড়া হয়েছে', 'All notifications marked as read'));
    } catch { /* ignore */ }
  }, [t]);

  const items = NAV.filter((n) => n.roles.includes(user?.role));
  const activeItem = items.find((n) => n.to !== '/' && location.pathname.startsWith(n.to));
  const crumbLabel =
    (activeItem && t(activeItem.label, activeItem.en)) ||
    (location.pathname === '/' ? t('ড্যাশবোর্ড', 'Dashboard') : null);

  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme={theme} position="top-right" richColors closeButton />
      {/* ===================== desktop sidebar ===================== */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 md:flex',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <div className={cn('flex h-14 shrink-0 items-center border-b', collapsed ? 'justify-center px-0' : 'px-5')}>
          <Brand collapsed={collapsed} />
        </div>
        <NavList items={items} unread={unread} collapsed={collapsed} />
        <div className={cn('border-t px-5 py-3 text-xs text-muted-foreground', collapsed && 'px-0 text-center')}>
          {collapsed ? 'v1.0' : t('অ্যাপ সংস্করণ ১.০ · থিসিস প্রজেক্ট', 'App v1.0 · Thesis Project')}
        </div>
      </aside>

      {/* ===================== main column ===================== */}
      <div className={cn('transition-all duration-300', collapsed ? 'md:pl-[76px]' : 'md:pl-64')}>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex min-w-0 items-center gap-2">
            {/* mobile menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                  <span className="sr-only">{t('মেনু', 'Menu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>
                    <Brand />
                  </SheetTitle>
                  <SheetDescription className="sr-only">{t('নেভিগেশন মেনু', 'Navigation menu')}</SheetDescription>
                </SheetHeader>
                <div className="-mx-1 flex flex-1 flex-col overflow-hidden">
                  <NavList items={items} unread={unread} onNavigate={() => setMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:inline-flex">
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              <span className="sr-only">{t('সাইডবার', 'Sidebar')}</span>
            </Button>
            <div className="hidden min-w-0 md:block">
              <Breadcrumbs items={[activeItem ? t('নেভিগেশন', 'Navigation') : null, crumbLabel]} />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 xl:inline-flex">
              <PulseDot className="text-emerald-500" />
              {t('লাইভ', 'LIVE')}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLang}
              title={lang === 'bn' ? 'switch to English' : 'বাংলায় দেখুন'}
            >
              <Languages className="size-4" />
              <span className="ml-0.5 hidden text-xs font-semibold md:inline">{lang === 'bn' ? 'EN' : 'বাং'}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              title={theme === 'dark' ? t('লাইট মোড', 'Light mode') : t('ডার্ক মোড', 'Dark mode')}
            >
              <span className="relative inline-flex size-4">
                <Sun className={cn('absolute transition-all duration-300', theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0')} />
                <Moon className={cn('absolute transition-all duration-300', theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100')} />
              </span>
            </Button>

            <DropdownMenu onOpenChange={(o) => o && loadNotifs()}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <span className="relative inline-flex">
                    <Bell />
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-3 py-2.5">
                  <span className="text-sm font-semibold">{t('বিজ্ঞপ্তি', 'Notifications')}</span>
                  <Button variant="ghost" size="sm" onClick={readAll} className="gap-1 text-xs">
                    <CheckCheck />
                    {t('সব পড়ুন', 'Read all')}
                  </Button>
                </div>
                <div className="slim-scroll max-h-80 overflow-y-auto p-1">
                  {notifs.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t('কোনো বিজ্ঞপ্তি নেই', 'No notifications yet')}</p>
                  ) : (
                    notifs.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        disabled={n.is_read}
                        className={cn('flex items-start gap-2.5 px-3 py-2.5', !n.is_read && 'cursor-pointer')}
                      >
                        <span className={cn('mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', n.type === 'alert' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500')}>
                          <BellRing className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{n.title}</span>
                          <span className="block text-xs text-muted-foreground">{n.body}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground/70">
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </span>
                        {!n.is_read && <span className="mt-1.5 ml-auto size-1.5 shrink-0 rounded-full bg-primary" />}
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                <div className="border-t p-1">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/notifications" className="flex items-center justify-center gap-1 text-xs font-medium">
                      {t('সব বিজ্ঞপ্তি দেখুন', 'View all notifications')}
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="mx-1 h-5" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {ROLE_LABELS(user.role) || user.role} · {user.division || user.district || t('বাংলাদেশ', 'Bangladesh')}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/profile" className="flex items-center gap-1.5">
                    <UserRound />
                    {t('প্রোফাইল', 'Profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut />
                  {t('লগআউট', 'Logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ===================== mobile breadcrumb ===================== */}
        {crumbLabel && (
          <div className="border-b px-4 py-2 md:hidden">
            <Breadcrumbs items={[crumbLabel]} />
          </div>
        )}

        <main className="px-4 py-5 md:px-6 lg:px-8 lg:py-6">
          <AnimatedContent
            key={location.pathname}
            distance={30}
            direction="bottom"
            scale={0.99}
            duration={0.6}
            threshold={0.01}
          >
            <Outlet />
          </AnimatedContent>
        </main>
      </div>
    </div>
  );
}