import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform, useMotionValueEvent } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowRight, ArrowUpRight, Banknote, Bell, Bug, Droplets, Search, Sprout, TrendingUp } from 'lucide-react';
import '@fontsource-variable/inter';
import '@fontsource/hind-siliguri/400.css';
import '@fontsource/hind-siliguri/500.css';
import '@fontsource/hind-siliguri/600.css';
import '@fontsource/hind-siliguri/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import { SpringCountUp } from '../../lib/reactbits/index.js';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { features, problems, howItWorks } from './features.js';

const iC = { strokeWidth: 1.5 };
const EASE = [0.22, 1, 0.36, 1];

const featureByKey = (key) => features.find((f) => f.key === key);

const head = (lang) => (lang === 'bn' ? 'font-bn font-semibold tracking-[-0.01em]' : 'font-satoshi font-medium tracking-[-0.02em]');
const body = (lang) => (lang === 'bn' ? 'font-bn' : 'font-inter');

const toneCls = {
  emerald: 'text-vivid-green bg-emerald-50',
  green: 'text-vivid-green bg-emerald-50',
  rose: 'text-tangerine bg-[#fff1e6]',
  amber: 'text-tangerine bg-[#fff1e6]',
  yellow: 'text-tangerine bg-[#fff1e6]',
  sky: 'text-electric-blue bg-[#eef4ff]',
  blue: 'text-electric-blue bg-[#eef4ff]',
  indigo: 'text-electric-blue bg-[#eef4ff]',
  teal: 'text-vivid-green bg-emerald-50',
  cyan: 'text-electric-blue bg-[#eef4ff]',
  violet: 'text-lavender bg-violet-50',
};

function Reveal({ children, delay = 0, y = 24, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Tag({ children }) {
  return <p className="font-inter text-[15px] font-medium text-steel">{children}</p>;
}

function BtnDark({ to, onClick, children, className = '' }) {
  const cls = `dub-btn inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-midnight-ink px-5 font-inter text-[15px] font-medium text-canvas-white shadow-subtle hover:bg-charcoal ${className}`;
  return to ? (
    <Link to={to} className={cls}>{children}</Link>
  ) : (
    <button onClick={onClick} className={cls}>{children}</button>
  );
}

function BtnOutline({ to, onClick, children, className = '' }) {
  const cls = `dub-btn inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ash bg-canvas-white px-5 font-inter text-[15px] font-medium text-charcoal hover:border-pebble hover:bg-paper-mist ${className}`;
  return to ? (
    <Link to={to} className={cls}>{children}</Link>
  ) : (
    <button onClick={onClick} className={cls}>{children}</button>
  );
}

function LinkArrow({ to, onClick, children, className = '' }) {
  const inner = (
    <>
      <span>{children}</span>
      <ArrowUpRight {...iC} className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </>
  );
  const cls = `group inline-flex items-center gap-1.5 font-inter text-[15px] font-medium text-electric-blue ${className}`;
  return to ? (
    <Link to={to} className={cls}>{inner}</Link>
  ) : (
    <button onClick={onClick} className={cls}>{inner}</button>
  );
}

function Card({ className = '', children }) {
  return <div className={`rounded-xl border border-ash bg-canvas-white ${className}`}>{children}</div>;
}

function Badge({ children, tone = 'mint' }) {
  const tones = {
    mint: 'bg-soft-mint text-charcoal',
    blue: 'bg-[#eef4ff] text-electric-blue',
    orange: 'bg-[#fff1e6] text-tangerine',
    gray: 'bg-paper-mist text-graphite',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-inter text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

const yieldTrend = [
  { m: 'Mar', v: 38 }, { m: 'Apr', v: 42 }, { m: 'May', v: 47 }, { m: 'Jun', v: 51 },
  { m: 'Jul', v: 58 }, { m: 'Aug', v: 63 }, { m: 'Sep', v: 69 },
];

function YieldChart({ gid, tall = false }) {
  return (
    <ResponsiveContainer width="100%" height={tall ? 150 : 96}>
      <AreaChart data={yieldTrend} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={1.75} fill={`url(#${gid})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const sideKeys = ['dashboard', 'farmers', 'lands', 'crops', 'weather', 'forecast', 'market', 'reports'];

function DashboardMockup({ lang, t }) {
  const kpis = [
    { label: t('নিবন্ধিত কৃষক', 'Registered farmers'), value: '5,000+', note: '+22% this year', tone: 'mint' },
    { label: t('গড় ফলন', 'Avg yield'), value: '3,410', unit: 'kg/ha', note: '+12.4%', tone: 'blue' },
    { label: t('ধান বাজার', 'Rice market'), value: '42.5', unit: 'Tk/kg', note: '+6%', tone: 'orange' },
  ];
  const tableRows = [
    { d: 'Barishal', v: '3.42', dlt: '+8%', st: 'Completed' },
    { d: 'Rajshahi', v: '2.94', dlt: '+2%', st: 'Completed' },
    { d: 'Khulna', v: '3.03', dlt: '+5%', st: 'Completed' },
    { d: 'Rangpur', v: '2.87', dlt: '−1%', st: 'In progress' },
  ];
  return (
    <div className="overflow-hidden rounded-t-2xl border border-ash bg-canvas-white shadow-subtle-2">
      <div className="flex">
        <aside className="hidden w-[190px] shrink-0 flex-col border-r border-ash bg-paper-mist p-3 md:flex">
          <div className="flex items-center gap-2 px-1.5 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-midnight-ink text-canvas-white">
              <Sprout {...iC} className="size-3.5" />
            </span>
            <span className="font-inter text-[13px] font-semibold text-charcoal">CropYield</span>
          </div>
          <nav className="mt-3 flex flex-col gap-1">
            {sideKeys.map((k, i) => {
              const f = featureByKey(k);
              const active = i === 0;
              return (
                <span
                  key={k}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-[7px] font-inter text-[13px] ${active ? 'bg-electric-blue/10 font-medium text-electric-blue' : 'text-graphite'}`}
                >
                  <f.icon {...iC} className="size-4 shrink-0" />
                  {f.title.en}
                  {k === 'advisories' && false}
                </span>
              );
            })}
          </nav>
          <div className="mt-auto flex items-center gap-2 rounded-lg border border-ash bg-canvas-white px-2.5 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-deep-sapphire text-[9px] font-medium text-canvas-white">OK</span>
            <div className="min-w-0">
              <p className="truncate font-inter text-[12px] font-medium text-charcoal">Officer Kazi</p>
              <p className="font-mono-lb text-[9px] uppercase tracking-[0.12em] text-silver">admin</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-paper-mist">
          <div className="flex items-center justify-between gap-3 border-b border-ash px-4 py-3">
            <div>
              <p className="font-inter text-[13px] font-semibold text-charcoal">{t('ড্যাশবোর্ড', 'Dashboard')}</p>
              <p className="font-inter text-[11px] text-fog">{t('বোরো ২০২৬ · ৮ বিভাগ', 'Boro 2026 · all 8 divisions')}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-ash bg-canvas-white px-3 py-[7px] sm:flex">
                <Search {...iC} className="size-3.5 text-silver" />
                <span className="font-inter text-[12px] text-silver">{t('খুঁজুন…', 'Search…')}</span>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-mint">
                <Bell {...iC} className="size-3.5 text-charcoal" />
              </span>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-ash bg-canvas-white p-3.5">
                  <p className="font-inter text-[12px] text-fog">{kpi.label}</p>
                  <p className="mt-1.5 flex items-baseline gap-1 font-satoshi text-[26px] font-medium leading-none tracking-[-0.02em] text-charcoal">
                    {kpi.value}
                    {kpi.unit && <span className="font-inter text-[13px] font-medium text-fog">{kpi.unit}</span>}
                  </p>
                  <div className="mt-2"><Badge tone={kpi.tone}>{kpi.note}</Badge></div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-ash bg-canvas-white p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="font-inter text-[13px] font-semibold text-charcoal">{t('ফলন প্রবণতা', 'Yield trend')}</p>
                  <Badge tone="blue">+12.4%</Badge>
                </div>
                <div className="mt-2"><YieldChart gid="lb-dash-yield" tall /></div>
                <div className="flex items-center justify-between border-t border-ash pt-3">
                  <span className="inline-flex items-center gap-1.5 font-mono-lb text-[10px] uppercase tracking-[0.14em] text-silver">
                    <span className="size-1.5 rounded-full bg-electric-blue" /> {t('পূর্বাভাস', 'forecast')}
                  </span>
                  <span className="font-mono-lb text-[12px] text-graphite">3,410 kg/ha</span>
                </div>
              </div>

              <div className="rounded-xl border border-ash bg-canvas-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-inter text-[13px] font-semibold text-charcoal">{t('বিভাগভিত্তিক ফলন', 'By division')}</p>
                  <ArrowUpRight {...iC} className="size-3.5 text-silver" />
                </div>
                <div className="mt-2 divide-y divide-ash">
                  {tableRows.map((r) => (
                    <div key={r.d} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-inter text-[12px] font-medium text-charcoal">{r.d}</p>
                        <p className="font-mono-lb text-[10px] text-silver">boro 26</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-inter text-[12px] font-medium text-charcoal">{r.v}</span>
                        <span className={`font-mono-lb text-[11px] ${r.dlt.startsWith('−') ? 'text-tangerine' : 'text-vivid-green'}`}>{r.dlt}</span>
                        <span className="hidden rounded-full bg-soft-mint px-2 py-0.5 font-inter text-[9px] font-medium text-charcoal sm:inline">{r.st}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon: Icon, cls, children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ash bg-canvas-white px-3.5 py-1.5 font-inter text-[14px] font-medium text-charcoal shadow-sm">
      <Icon {...iC} className={`size-4 ${cls}`} />
      {children}
    </span>
  );
}

function FloatingChip({ style, className, icon: Icon, cls, title, sub }) {
  return (
    <motion.div style={style} className={`pointer-events-none absolute z-10 hidden lg:block ${className}`}>
      <div className="flex items-center gap-2.5 rounded-xl border border-ash bg-canvas-white px-3.5 py-2.5 shadow-md">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
          <Icon {...iC} className="size-4" />
        </span>
        <div>
          <p className="font-inter text-[12px] font-medium text-charcoal">{title}</p>
          <p className="font-mono-lb text-[9px] uppercase tracking-[0.1em] text-fog">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Nav() {
  const { lang, toggle, t } = useLanguage();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24));

  const links = [
    { id: 'why', label: t('কেন', 'Why') },
    { id: 'modules', label: t('মডিউল', 'Modules') },
    { id: 'how', label: t('প্রক্রিয়া', 'Process') },
  ];
  const go = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-ash bg-canvas-white/80 backdrop-blur-xl' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-midnight-ink text-canvas-white shadow-subtle">
              <Sprout {...iC} className="size-4" />
            </span>
            <span className={`font-inter text-[18px] font-semibold tracking-[-0.02em] text-charcoal ${lang === 'bn' ? 'font-bn' : ''}`}>
              CropYield<span className="text-electric-blue">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <button
                key={l.id + l.label}
                onClick={() => go(l.id)}
                className="rounded-full px-4 py-2 font-inter text-[14px] text-graphite transition-colors duration-200 hover:bg-paper-mist hover:text-charcoal"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle language"
              className="rounded-full border border-ash bg-canvas-white px-3 py-[7px] font-inter text-[13px] font-medium text-graphite transition-colors duration-200 hover:text-charcoal"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="dub-btn hidden h-9 items-center rounded-lg border border-ash bg-canvas-white px-4 font-inter text-[13px] font-medium text-charcoal transition-colors duration-200 hover:bg-paper-mist sm:inline-flex"
            >
              {t('লগইন', 'Log in')}
            </Link>
            <Link
              to={user ? '/dashboard' : '/register'}
              className="dub-btn hidden h-9 items-center rounded-lg bg-midnight-ink px-4 font-inter text-[13px] font-medium text-canvas-white shadow-subtle hover:bg-charcoal sm:inline-flex"
            >
              {t('ড্যাশবোর্ড চালু করুন', 'Launch App')}
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-ash bg-canvas-white md:hidden"
            >
              <span className={`absolute h-0.5 w-4 rounded-full bg-charcoal transition-all duration-300 ${open ? 'rotate-45' : '-translate-y-[3px]'}`} />
              <span className={`absolute h-0.5 w-4 rounded-full bg-charcoal transition-all duration-300 ${open ? '-rotate-45' : 'translate-y-[3px]'}`} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-canvas-white px-6 pb-8 pt-24 md:hidden"
          >
            <div className="flex flex-col">
              {links.map((l, i) => (
                <motion.button
                  key={l.id}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.05, ease: EASE }}
                  onClick={() => go(l.id)}
                  className={`border-b border-ash px-2 py-5 text-left font-satoshi text-[30px] font-medium tracking-[-0.02em] text-charcoal ${lang === 'bn' ? 'font-bn font-semibold text-[26px]' : ''}`}
                >
                  {l.label}
                </motion.button>
              ))}
            </div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
              className="flex flex-col gap-2"
            >
              <BtnDark to={user ? '/dashboard' : '/register'}>{t('ড্যাশবোর্ড চালু করুন', 'Launch App')}</BtnDark>
              <BtnOutline to={user ? '/dashboard' : '/login'}>{t('লগইন', 'Log in')}</BtnOutline>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const p = useSpring(scrollYProgress, { stiffness: 130, damping: 28, mass: 0.4 });

  const pills = [
    { icon: TrendingUp, cls: 'text-electric-blue bg-[#eef4ff]', label: t('এআই ফলন পূর্বাভাস', 'AI Yield Forecast') },
    { icon: Bug, cls: 'text-vivid-green bg-soft-mint', label: t('রোগ শনাক্তকরণ', 'Disease Detection') },
    { icon: Banknote, cls: 'text-tangerine bg-[#fff1e6]', label: t('বাজারদর', 'Market Prices') },
  ];

  const contentY = useTransform(p, [0, 1], [0, reduce ? 0 : -40]);
  const contentOpacity = useTransform(p, [0, 0.6], [1, reduce ? 1 : 0]);
  const mockY = useTransform(p, [0, 1], [0, reduce ? 0 : 90]);
  const mockOpacity = useTransform(p, [0, 0.4, 1], [1, 1, reduce ? 1 : 0]);
  const chipLY = useTransform(p, [0, 1], [0, reduce ? 0 : -50]);
  const chipRY = useTransform(p, [0, 1], [0, reduce ? 0 : -90]);
  const chipBY = useTransform(p, [0, 1], [0, reduce ? 0 : -30]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-canvas-white">
      <div className="landing-dots pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-60 [mask-image:radial-gradient(60%_60%_at_50%_20%,black,transparent)]" />
      <div className="relative mx-auto max-w-[1200px] px-6 pb-24 pt-32 lg:pb-28 lg:pt-40">
        <motion.div style={{ y: contentY, opacity: contentOpacity }} className="mx-auto max-w-3xl text-center">
          <Reveal y={14}>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pills.map((p) => (
                <FeaturePill key={p.label} icon={p.icon} cls={p.cls}>{p.label}</FeaturePill>
              ))}
            </div>
          </Reveal>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
            className={`mt-8 text-[36px] leading-[1.08] text-charcoal md:text-[44px] lg:text-[52px] ${head(lang)}`}
          >
            {lang === 'bn' ? (
              <>এক মৌসুমের ফলন <em className="not-italic text-electric-blue">ডেটা দিয়ে</em> — বোনার আগেই জানুন।</>
            ) : (
              <>Know this season's yield <em className="not-italic text-electric-blue">before you plant.</em></>
            )}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
            className={`mx-auto mt-6 max-w-xl text-[16px] leading-[1.55] text-fog md:text-[17px] ${body(lang)}`}
          >
            {t(
              'আবহাওয়া, মাটি আর বাজারদর মিলিয়ে একটি সিদ্ধান্ত — ফলন পূর্বাভাস, রোগ শনাক্তকরণ আর বিক্রয় পরামর্শ সব এক দ্বিভাষিক প্ল্যাটফর্মে।',
              'Weather, soil and market data turned into one clear decision — forecasts, disease detection and selling advice in a single bilingual platform.'
            )}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <BtnDark to={user ? '/dashboard' : '/register'}>
              {t('ড্যাশবোর্ড চালু করুন', 'Launch App')}
              <ArrowRight {...iC} className="size-4" />
            </BtnDark>
            <BtnOutline onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('যেভাবে কাজ করে', 'How it works')}
            </BtnOutline>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-inter text-[13px] text-fog"
          >
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-vivid-green" />
              {t('লাইভ ডেটা', 'Live data')}
            </span>
            <span>·</span>
            <span>{t('৫,০০০+ কৃষক', '5,000+ farmers')}</span>
            <span>·</span>
            <span>{t('৮ বিভাগ', '8 divisions')}</span>
            <span>·</span>
            <span>{t('বাংলা + English', 'Bengali + English')}</span>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: mockY, opacity: mockOpacity }} className="relative mx-auto mt-16 max-w-4xl lg:mt-20">
          <FloatingChip
            style={{ y: chipLY }}
            className="-left-10 top-20"
            icon={TrendingUp}
            cls="text-electric-blue bg-[#eef4ff]"
            title={t('এআই পূর্বাভাস', 'AI Forecast')}
            sub="+12.4% · boro 26"
          />
          <FloatingChip
            style={{ y: chipRY }}
            className="-right-12 top-44"
            icon={Bug}
            cls="text-vivid-green bg-soft-mint"
            title={t('লিফ ব্লাইট সনাক্ত', 'Leaf blight found')}
            sub={t('তামার স্প্রে করুন', 'spray copper')}
          />
          <FloatingChip
            style={{ y: chipBY }}
            className="-left-8 bottom-10"
            icon={Droplets}
            cls="text-electric-blue bg-[#eef4ff]"
            title={t('সেচ পরামর্শ', 'Irrigation advice')}
            sub={t('২ দিন পর সেচ', 'irrigate in 2 days')}
          />
          <DashboardMockup lang={lang} t={t} />
        </motion.div>
      </div>
    </section>
  );
}

function LogoCloud() {
  const { lang, t } = useLanguage();
  const orgs = ['DAM', 'BADC', 'BRRI', 'Katalyst', 'DAE', 'a2i', 'BRAC Agar', 'DAP-21'];
  return (
    <section className="border-y border-ash bg-canvas-white">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <Reveal y={12}>
          <p className={`text-center font-inter text-[13px] font-medium text-silver ${body(lang)}`}>
            {t('বাংলাদেশের কৃষি খাতের দলগুলো যেভাবে কাজ করছে', 'Trusted by teams across Bangladesh agriculture')}
          </p>
          <div className="mx-auto mt-7 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {orgs.map((o) => (
              <span key={o} className="text-center font-satoshi text-[17px] font-medium tracking-[-0.01em] text-graphite opacity-70">
                {o}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const proofItems = [
  { n: 5000, suffix: '+', dec: false, labelB: 'নিবন্ধিত কৃষক', labelE: 'Registered farmers', deltaE: '+22% this year', deltaB: 'এই বছর +২২%' },
  { n: 8, suffix: '', dec: false, labelB: 'বিভাগ কভারেজ', labelE: 'Division coverage', deltaE: '+100% country', deltaB: '+১০০% সারাদেশে' },
  { n: 120, suffix: 'k+', dec: false, labelB: 'পূর্বাভাস ও পরামর্শ', labelE: 'Forecasts delivered', deltaE: '+140% YoY', deltaB: 'বছরে +১৪০%' },
  { n: 92.4, suffix: '%', dec: true, labelB: 'মডেল নির্ভুলতা', labelE: 'Model accuracy', deltaE: 'ensemble models', deltaB: 'এনসেম্বল মডেল' },
];

const opsMetrics = [
  { v: '<1s', labelE: 'Median response', labelB: 'রেসপন্স সময়' },
  { v: '99.9%', labelE: 'Service uptime', labelB: 'পরিষেবা সক্রিয়তা' },
  { v: '6,200+', labelE: 'Advisory alerts sent', labelB: 'পরামর্শ পাঠানো' },
  { v: '24h', labelE: 'Data refresh', labelB: 'ডেটা হালনাগাদ' },
];

function Proof() {
  const { lang, t } = useLanguage();
  return (
    <section className="bg-canvas-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Tag>{t('প্রমাণ', 'Proof')}</Tag>
          <h2 className={`mt-4 text-[32px] leading-[1.1] text-charcoal md:text-[38px] ${head(lang)}`}>
            {lang === 'bn' ? (
              <>ফলাফলই <em className="not-italic text-electric-blue">সবচেয়ে বড় চিহ্ন।</em></>
            ) : (
              <>Results are <em className="not-italic text-electric-blue">the only measure.</em></>
            )}
          </h2>
          <p className={`mx-auto mt-4 max-w-xl text-[16px] leading-[1.55] text-fog ${body(lang)}`}>
            {t(
              '২০২৪ সাল থেকে আট বিভাগে মৌসুম চালানো হচ্ছে এই ডেটা দিয়ে — এখানে আমরা যা ট্র্যাক করি।',
              'Since 2024, seasons across eight divisions have run on this data — here is what we track.'
            )}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {proofItems.map((d, i) => (
            <Reveal key={d.labelE} delay={i * 0.06} className="h-full">
              <Card className="lb-card-lift flex h-full flex-col p-5">
                <div className="flex items-center justify-between">
                  <p className="font-inter text-[13px] text-fog">{lang === 'bn' ? d.labelB : d.labelE}</p>
                  <span className="font-mono-lb text-[10px] text-silver">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  {d.dec ? (
                    <span className={`font-satoshi text-[38px] font-medium leading-none tracking-[-0.02em] text-charcoal ${lang === 'bn' ? 'font-bn font-semibold' : ''}`}>
                      {d.n}{d.suffix}
                    </span>
                  ) : (
                    <SpringCountUp
                      to={d.n}
                      separator=","
                      duration={1.8}
                      className={`font-satoshi text-[38px] font-medium leading-none tracking-[-0.02em] text-charcoal ${lang === 'bn' ? 'font-bn font-semibold' : ''}`}
                    />
                  )}
                  {!d.dec && <span className="font-satoshi text-[22px] font-medium text-graphite">{d.suffix}</span>}
                </div>
                <div className="mt-auto pt-5">
                  <Badge tone={i === 3 ? 'blue' : i === 0 ? 'mint' : 'gray'}>
                    <TrendingUp {...iC} className="size-3" />
                    {lang === 'bn' ? d.deltaB : d.deltaE}
                  </Badge>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {opsMetrics.map((m, i) => (
              <div key={m.labelE} className="rounded-xl border border-ash bg-paper-mist p-4">
                <div className="flex items-center justify-between">
                  <span className={`font-satoshi text-[22px] font-medium leading-none tracking-[-0.02em] text-charcoal ${lang === 'bn' ? 'font-bn font-semibold' : ''}`}>
                    {m.v}
                  </span>
                  <span className="font-mono-lb text-[10px] text-silver">0{i + 1}</span>
                </div>
                <p className="mt-2.5 font-inter text-[12px] text-fog">{lang === 'bn' ? m.labelB : m.labelE}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Why() {
  const { lang, t } = useLanguage();
  return (
    <section id="why" className="bg-paper-mist py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-24 lg:self-start">
            <Tag>{t('সমস্যা', 'The problem')}</Tag>
            <h2 className={`mt-4 text-[30px] leading-[1.12] text-charcoal md:text-[38px] ${head(lang)}`}>
              {t('কৃষি এখনো', 'Farming still runs on')}
              <br />
              <em className="not-italic text-electric-blue">{t('অনুমান আর দেরিতে।', 'guesswork & delay.')}</em>
            </h2>
            <p className={`mt-4 max-w-md text-[16px] leading-[1.55] text-fog ${body(lang)}`}>
              {t(
                'আবহাওয়া, মাটি আর বাজার প্রতিদিন বদলায়, কিন্তু সিদ্ধান্ত নেওয়া হয় মৌসুমে একবার। এই ডেটা দিয়ে সেই একটাই সিদ্ধান্ত সঠিক হোক।',
                'Weather, soil and markets shift daily, yet the decision happens once a season. This data is how that one decision becomes the right one.'
              )}
            </p>
            <div className="mt-7">
              <LinkArrow onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('মডিউল দেখুন', 'Browse the modules')}
              </LinkArrow>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2">
            {problems.map((p, i) => (
              <Reveal key={p.title.en} delay={i * 0.06} className="h-full">
                <Card className="lb-card-lift group flex h-full flex-col bg-canvas-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono-lb text-[10px] text-silver">0{i + 1}</p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneCls[p.tone] || 'bg-paper-mist text-graphite'}`}>
                      <p.icon {...iC} className="size-4.5" />
                    </span>
                  </div>
                  <h3 className={`mt-4 font-inter text-[16px] font-semibold text-charcoal ${lang === 'bn' ? 'font-bn' : ''}`}>
                    {t(p.title.bn, p.title.en)}
                  </h3>
                  <p className={`mt-1.5 text-[14px] leading-[1.5] text-fog ${lang === 'bn' ? 'font-bn' : ''}`}>
                    {t(p.body.bn, p.body.en)}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <span className="font-inter text-[12px] font-medium text-electric-blue opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {t('আমরা এটা সমাধান করি', 'we solve this')}
                    </span>
                    <ArrowUpRight {...iC} className="size-4 text-silver transition-colors duration-300 group-hover:text-charcoal" />
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const priceRows = [
  ['Aman paddy', '42.5', '↑ 6%'],
  ['IRRI rice', '38.0', '↑ 2%'],
  ['Lentil', '92.0', '—'],
  ['Potato', '27.5', '↓ 3%'],
  ['Jute', '58.0', '↑ 9%'],
];

function MarketTable({ t }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="font-inter text-[13px] font-semibold text-charcoal">{t('বাজারদর', 'Market prices')}</p>
        <Badge tone="orange">{t('টাকা/কেজি', 'Tk/kg')}</Badge>
      </div>
      <div className="mt-3 divide-y divide-ash">
        {priceRows.map(([crop, price, delta]) => (
          <div key={crop} className="flex items-center justify-between py-2.5">
            <span className="font-inter text-[14px] text-charcoal">{crop}</span>
            <span className="flex items-center gap-3 font-mono-lb text-[13px]">
              <span className="text-graphite">{price}</span>
              <span className={`w-8 text-right text-[12px] ${delta.startsWith('↓') ? 'text-tangerine' : 'text-vivid-green'}`}>{delta}</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const detRows = [
  { issue: 'Leaf blight', risk: 'HIGH', riskB: 'উচ্চ', actionB: 'তামার স্প্রে করুন', actionE: 'Copper spray' },
  { issue: 'Aphid', risk: 'MED', riskB: 'মাঝারি', actionB: '৭ দিনে পরিদর্শন', actionE: 'Recheck in 7 days' },
  { issue: 'Downy mildew', risk: 'LOW', riskB: 'নিম্ন', actionB: 'বায়ু চলাচল বাড়ান', actionE: 'Improve airflow' },
];

function DiseaseScan({ lang, t }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="font-inter text-[13px] font-semibold text-charcoal">{t('রোগ স্ক্যান', 'Disease scan')}</p>
        <Badge tone="mint">•••</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {detRows.map((d) => (
          <div key={d.issue} className="rounded-lg border border-ash p-3">
            <div className="flex items-center justify-between">
              <span className="font-inter text-[14px] text-charcoal">{d.issue}</span>
              <Badge tone={d.risk === 'HIGH' ? 'orange' : d.risk === 'MED' ? 'blue' : 'gray'}>
                {lang === 'bn' ? d.riskB : d.risk}
              </Badge>
            </div>
            <p className="mt-1.5 font-mono-lb text-[11px] text-fog">{lang === 'bn' ? d.actionB : d.actionE}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FeatureRow({ tag, title, desc, benefits, to, artifact, reverse = false }) {
  const { lang, t } = useLanguage();
  return (
    <Reveal className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <Tag>{tag}</Tag>
        <h3 className={`mt-4 text-[26px] leading-[1.15] text-charcoal md:text-[32px] ${head(lang)}`}>
          {title}
        </h3>
        <p className={`mt-4 max-w-lg text-[16px] leading-[1.55] text-fog ${body(lang)}`}>
          {desc}
        </p>
        {benefits && (
          <ul className={`mt-5 space-y-2.5 ${body(lang)}`}>
            {benefits.map((b) => (
              <li key={b.en} className="flex items-center gap-2.5 text-[15px] text-graphite">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
                  <span className="size-1.5 rounded-full bg-electric-blue" />
                </span>
                {t(b.bn, b.en)}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-7">
          <LinkArrow to={to}>{t('ব্যবহার করে দেখুন', 'Explore the module')}</LinkArrow>
        </div>
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>{artifact}</div>
    </Reveal>
  );
}

function Modules() {
  const { lang, t } = useLanguage();
  const forecast = featureByKey('forecast');
  const market = featureByKey('market');
  const diseases = featureByKey('diseases');

  return (
    <section id="modules" className="bg-canvas-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Tag>{t('মডিউল', 'Modules')}</Tag>
          <h2 className={`mt-4 text-[32px] leading-[1.1] text-charcoal md:text-[38px] ${head(lang)}`}>
            {lang === 'bn' ? (
              <>পনেরোটি মডিউল, <em className="not-italic text-electric-blue">প্রতিটি একটি সিদ্ধান্ত।</em></>
            ) : (
              <>Fifteen modules, <em className="not-italic text-electric-blue">each one a decision.</em></>
            )}
          </h2>
          <p className={`mx-auto mt-4 max-w-xl text-[16px] leading-[1.55] text-fog ${body(lang)}`}>
            {t(
              'রেকর্ড, বিশ্লেষণ আর পূর্বাভাস — প্রতিটি মডিউল আসল ফসলের ডেটা আর মেশিন-লার্নিং দিয়ে চলে, বাংলা ও ইংরেজিতে।',
              'Record-keeping, analysis and forecasting — every module runs on real farm data and machine learning, in Bengali and English.'
            )}
          </p>
        </Reveal>

        <div className="mt-16 space-y-16 lg:mt-20 lg:space-y-20">
          <FeatureRow
            tag={t('ফলন পূর্বাভাস', 'Forecasting')}
            title={t('ফসল তোলার আগেই ফলন জানুন।', 'Know the yield before harvest.')}
            desc={t(forecast.description.bn, forecast.description.en)}
            benefits={[{ bn: 'এআই-ভিত্তিক অনুমান', en: 'AI-based estimates' }, { bn: 'ঝুঁকি আগে বোঝা', en: 'Early risk awareness' }, { bn: 'বাজার পরিকল্পনা', en: 'Better market planning' }]}
            to={forecast.to}
            artifact={
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-inter text-[13px] font-semibold text-charcoal">{t('দেশব্যাপী ফলন', 'National yield')}</p>
                  <Badge tone="blue">+12.4%</Badge>
                </div>
                <div className="mt-2"><YieldChart gid="lb-mod-yield" tall /></div>
                <div className="flex items-center justify-between border-t border-ash pt-3">
                  <span className="inline-flex items-center gap-1.5 font-mono-lb text-[10px] uppercase tracking-[0.14em] text-silver">
                    <span className="size-1.5 rounded-full bg-electric-blue" /> {t('পূর্বাভাস', 'forecast')}
                  </span>
                  <span className="font-mono-lb text-[12px] text-graphite">3,410 kg/ha</span>
                </div>
              </Card>
            }
          />

          <FeatureRow
            reverse
            tag={t('বাজার', 'Market hookup')}
            title={t('যেখানে লাভ বেশি, সেখানে বিক্রি।', 'Sell where the margin is.')}
            desc={t(market.description.bn, market.description.en)}
            benefits={[{ bn: 'ফসলভিত্তিক দর', en: 'Crop-wise prices' }, { bn: 'লাভের তুলনা', en: 'Profit comparison' }, { bn: 'স্মার্ট বিক্রয়', en: 'Smart selling' }]}
            to={market.to}
            artifact={<MarketTable t={t} />}
          />

          <FeatureRow
            tag={t('রোগ রক্ষা', 'Crop guard')}
            title={t('রোগ ছড়ানোর আগেই চিহ্নিত করুন।', 'Spot disease before it spreads.')}
            desc={t(diseases.description.bn, diseases.description.en)}
            benefits={[{ bn: 'ইমেজ শনাক্তকরণ', en: 'Image detection' }, { bn: 'দ্রুত সমাধান', en: 'Fast solutions' }, { bn: 'ফসল রক্ষা', en: 'Protect your harvest' }]}
            to={diseases.to}
            artifact={<DiseaseScan lang={lang} t={t} />}
          />
        </div>

        <Reveal className="mt-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={`font-inter text-[18px] font-semibold text-charcoal ${lang === 'bn' ? 'font-bn' : ''}`}>
              {t('সবগুলো মডিউল', 'Every module')}
            </h3>
            <LinkArrow to="/dashboard">{t('ড্যাশবোর্ডে যান', 'Go to dashboard')}</LinkArrow>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {features.map((f, i) => (
              <Reveal key={f.key} delay={(i % 5) * 0.04} y={14} className="h-full">
                <Link
                  to={f.to}
                  className="lb-card-lift group flex h-full flex-col rounded-xl border border-ash bg-canvas-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono-lb text-[9px] text-silver">{String(i + 1).padStart(2, '0')}</p>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneCls[f.tone] || 'bg-paper-mist text-graphite'}`}>
                      <f.icon {...iC} className="size-4" />
                    </span>
                  </div>
                  <p className={`mt-4 font-inter text-[14px] font-semibold leading-snug text-charcoal ${lang === 'bn' ? 'font-bn' : ''}`}>
                    {t(f.title.bn, f.title.en)}
                  </p>
                  <p className={`mt-1 line-clamp-2 text-[12px] leading-[1.45] text-fog ${lang === 'bn' ? 'font-bn' : ''}`}>
                    {t(f.tagline.bn, f.tagline.en)}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-ash pt-3">
                    <span className="font-mono-lb text-[9px] uppercase tracking-[0.12em] text-silver opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {t('খুলুন', 'open')}
                    </span>
                    <ArrowUpRight {...iC} className="size-3.5 text-electric-blue opacity-0 transition-all duration-300 group-hover:opacity-100" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Process() {
  const { lang, t } = useLanguage();
  const tags = {
    0: [{ bn: '৩০ সেকেন্ডে সাইনআপ', en: '30-sec signup' }, { bn: 'বিভাগ + বিঘা', en: 'division + bigha' }],
    1: [{ bn: 'এমএল এনসেম্বল', en: 'ML ensemble' }, { bn: '৭ দিনের আবহাওয়া', en: '7-day weather' }, { bn: 'মাটি NPK', en: 'soil NPK' }],
    2: [{ bn: 'বাজার সতর্কতা', en: 'market alerts' }, { bn: 'সময়মতো খবর', en: 'on-time updates' }],
  };
  return (
    <section id="how" className="bg-paper-mist py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Tag>{t('প্রক্রিয়া', 'Process')}</Tag>
          <h2 className={`mt-4 text-[32px] leading-[1.1] text-charcoal md:text-[38px] ${head(lang)}`}>
            {t('তিন ধাপে সঠিক সিদ্ধান্ত।', 'Three steps to a right call.')}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-3 md:grid-cols-3">
          {howItWorks.map((s, i) => (
            <Reveal key={s.title.en} delay={i * 0.08} className="h-full">
              <Card className="lb-card-lift flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-midnight-ink text-canvas-white">
                    <s.icon {...iC} className="size-4.5" />
                  </span>
                  <span className="font-mono-lb text-[10px] tracking-[0.16em] text-silver">STEP 0{i + 1}</span>
                </div>
                <h3 className={`mt-5 font-inter text-[17px] font-semibold leading-snug text-charcoal ${lang === 'bn' ? 'font-bn' : ''}`}>
                  {t(s.title.bn, s.title.en)}
                </h3>
                <p className={`mt-2 text-[14px] leading-[1.55] text-fog ${lang === 'bn' ? 'font-bn' : ''}`}>
                  {t(s.body.bn, s.body.en)}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {tags[i].map((tag) => (
                    <span key={tag.en} className="rounded-full border border-ash bg-canvas-white px-2.5 py-1 font-mono-lb text-[10px] uppercase tracking-[0.1em] text-fog">
                      {lang === 'bn' ? tag.bn : tag.en}
                    </span>
                  ))}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  const { lang, t } = useLanguage();
  return (
    <section className="bg-canvas-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <Card className="mx-auto max-w-4xl rounded-2xl p-8 lg:p-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone="blue">· {t('কৃষকের গল্প', 'farmer story')}</Badge>
              <Badge tone="mint">{t('২ মৌসুম প্ল্যাটফর্মে', '2 seasons on platform')}</Badge>
            </div>
            <blockquote className={`mt-7 text-[22px] font-medium leading-[1.35] text-charcoal md:text-[28px] ${head(lang)}`}>
              {t(
                'আগে মৌসুমের ফল জানতাম ফসল তোলার পরে। এখন বোনার আগেই পূর্বাভাস দেখি — আর জেনে বুঝে সঠিক জায়গায় বিক্রি করি।',
                'I used to learn the season\u2019s result only after harvest. Now I read the forecast before planting — and sell in the right market.'
              )}
            </blockquote>
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-ash pt-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-deep-sapphire text-[12px] font-medium text-canvas-white">
                  রি
                </span>
                <div>
                  <p className={`font-inter text-[14px] font-semibold ${lang === 'bn' ? 'font-bn' : ''}`}>
                    {t('রফিকুল ইসলাম', 'Rafiqul Islam')}
                  </p>
                  <p className="font-inter text-[12px] text-fog">{t('ধান চাষি · কুষ্টিয়া', 'rice farmer · Kushtia')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className={`font-satoshi text-[20px] font-medium leading-none text-charcoal ${lang === 'bn' ? 'font-bn font-semibold' : ''}`}>+18%</p>
                  <p className="mt-1 font-mono-lb text-[9px] uppercase tracking-[0.12em] text-silver">{t('গড় ফলন', 'avg yield')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-satoshi text-[20px] font-medium leading-none text-charcoal ${lang === 'bn' ? 'font-bn font-semibold' : ''}`}>8</p>
                  <p className="mt-1 font-mono-lb text-[9px] uppercase tracking-[0.12em] text-silver">{t('বিঘা জমি', 'bigha land')}</p>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

function Cta() {
  const { lang, t } = useLanguage();
  return (
    <section className="bg-paper-mist py-20 lg:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <Tag>{t('শুরু করুন', 'Get started')}</Tag>
          <h2 className={`mt-4 text-[32px] leading-[1.1] text-charcoal md:text-[38px] ${head(lang)}`}>
            {t('স্মার্ট কৃষির', 'Start the smart-')}
            <br />
            <em className="not-italic text-electric-blue">{t('নতুন মৌসুম শুরু করুন।', 'farming season.')}</em>
          </h2>
          <p className={`mx-auto mt-4 max-w-md text-[16px] leading-[1.55] text-fog ${body(lang)}`}>
            {t(
              'ডেমো অ্যাকাউন্ট দিয়েই সব মডিউল হাতে-হাতে দেখুন — বিনামূল্যে, কোনো কার্ড ছাড়াই।',
              'Try every module hands-on with a demo account — free, and no card required.'
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <BtnDark to="/register">
              {t('কৃষক নিবন্ধন', 'Register as Farmer')}
              <ArrowRight {...iC} className="size-4" />
            </BtnDark>
            <BtnOutline onClick={() => (window.location.href = '/login')}>{t('লগইন', 'Login')}</BtnOutline>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-inter text-[12px] text-fog">
            <span>{t('বিনামূল্যে ডেমো', 'free demo')}</span>
            <span>·</span>
            <span>{t('কার্ড লাগবে না', 'no card required')}</span>
            <span>·</span>
            <span>{t('বাংলা + English', 'Bengali + English')}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const { lang, t } = useLanguage();
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const platformCol = [
    { label: t('কেন', 'Why'), onClick: () => go('why') },
    { label: t('মডিউল', 'Modules'), onClick: () => go('modules') },
    { label: t('প্রক্রিয়া', 'Process'), onClick: () => go('how') },
    { label: t('ফলন পূর্বাভাস', 'Yield Forecast'), to: '/forecast' },
  ];
  const productCol = [
    { label: t('ড্যাশবোর্ড', 'Dashboard'), to: '/dashboard' },
    { label: t('রোগ শনাক্তকরণ', 'Disease detection'), to: '/diseases' },
    { label: t('বাজারদর', 'Market prices'), to: '/market' },
    { label: t('রেজিস্টার', 'Register'), to: '/register' },
  ];
  const serviceCol = [
    { label: t('আবহাওয়া', 'Weather'), to: '/weather' },
    { label: t('মৃত্তিকা পরীক্ষা', 'Soil testing'), to: '/soil' },
    { label: t('ফসল সুপারিশ', 'Crop recommendations'), to: '/recommendations' },
    { label: t('লগইন', 'Login'), to: '/login' },
  ];
  return (
    <footer className="border-t border-ash bg-canvas-white">
      <div className="mx-auto max-w-[1200px] px-6 pb-10 pt-14">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-midnight-ink text-canvas-white shadow-subtle">
                <Sprout {...iC} className="size-4" />
              </span>
              <span className={`font-inter text-[17px] font-semibold tracking-[-0.02em] text-charcoal ${lang === 'bn' ? 'font-bn' : ''}`}>
                CropYield<span className="text-electric-blue">.</span>
              </span>
            </div>
            <p className={`mt-5 max-w-sm text-[14px] leading-[1.55] text-fog ${body(lang)}`}>
              {t(
                'এআই ভিত্তিক কৃষি উৎপাদন, রোগ শনাক্তকরণ আর ফলন পূর্বাভাস — ৮টি বিভাগে, বাংলা ও ইংরেজিতে।',
                'AI-based crop production, disease detection and yield forecasting — across all 8 divisions, in Bengali & English.'
              )}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ash px-3 py-1.5 font-inter text-[12px] text-graphite">
              <span className="size-1.5 rounded-full bg-vivid-green" />
              {t('সব পরিষেবা চালু', 'all services online')}
            </div>
          </div>

          {[
            { heading: t('প্ল্যাটফর্ম', 'Platform'), items: platformCol },
            { heading: t('পণ্য', 'Product'), items: productCol },
            { heading: t('সেবা', 'Services'), items: serviceCol },
          ].map((col) => (
            <div key={col.heading}>
              <p className="font-mono-lb text-[10px] uppercase tracking-[0.14em] text-silver">{col.heading}</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {col.items.map((item) =>
                  item.to ? (
                    <Link key={item.label} to={item.to} className={`text-[14px] text-graphite transition-colors duration-200 hover:text-charcoal ${body(lang)}`}>
                      {item.label}
                    </Link>
                  ) : (
                    <button key={item.label} onClick={item.onClick} className={`text-left text-[14px] text-graphite transition-colors duration-200 hover:text-charcoal ${body(lang)}`}>
                      {item.label}
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ash pt-6 font-inter text-[12px] text-fog md:flex-row">
          <span>© {new Date().getFullYear()} CropYield AI · {t('কৃষি গোয়েন্দা', 'farm intelligence')}</span>
          <span>{t('৮ বিভাগ · বাংলা + English', '8 divisions · bilingual')}</span>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { lang } = useLanguage();
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#ffffff';
    return () => {
      document.body.style.background = prev;
    };
  }, []);
  return (
    <div className={`min-h-screen bg-canvas-white text-charcoal antialiased ${body(lang)}`} style={{ colorScheme: 'light' }}>
      <Nav />
      <main>
        <Hero />
        <LogoCloud />
        <Proof />
        <Why />
        <Modules />
        <Process />
        <Testimonial />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}