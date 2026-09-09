import { Link } from 'react-router-dom';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  Aurora, BlurText, FadeContent, GradientText, ShinyText, SpotlightCard,
} from '../../lib/reactbits/index.js';
import {
  ArrowRight, ArrowUpRight, Languages, LogIn, Sprout, Menu, X, Sparkles, Globe, Cpu, Waves,
} from 'lucide-react';
import '@fontsource-variable/noto-sans-bengali';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { features, heroStats, problems, howItWorks } from './features.js';

const toneClasses = {
  emerald: 'from-emerald-400 to-emerald-700',
  sky: 'from-sky-400 to-sky-700',
  blue: 'from-blue-400 to-blue-700',
  teal: 'from-teal-400 to-teal-700',
  green: 'from-green-400 to-green-700',
  indigo: 'from-indigo-400 to-indigo-700',
  violet: 'from-violet-400 to-violet-700',
  amber: 'from-amber-300 to-amber-600',
  rose: 'from-rose-400 to-rose-700',
  cyan: 'from-cyan-400 to-cyan-700',
  yellow: 'from-yellow-300 to-amber-500',
  red: 'from-red-400 to-rose-700',
};

function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { ref, val };
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${vis ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="font-mono-lb flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300/80">
      <span className="h-px w-6 bg-emerald-400/50" />
      {children}
    </p>
  );
}

function Nav() {
  const { lang, toggle: toggleLang, t } = useLanguage();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    { id: 'why', label: t('কেন', 'Why') },
    { id: 'features', label: t('মডিউলসমূহ', 'Modules') },
    { id: 'how', label: t('প্রক্রিয়া', 'Process') },
  ];
  const go = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div
        className={`flex w-full max-w-5xl items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-all duration-300 ${
          scrolled ? 'border-white/10 bg-black/55 shadow-2xl shadow-black/40 backdrop-blur-xl' : 'border-white/5 bg-black/20 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
            <Sprout className="size-5" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold tracking-tight">CropYield <span className="text-emerald-300">AI</span></p>
            <p className="font-mono-lb mt-0.5 text-[9px] uppercase tracking-[0.2em] text-white/40">farm intelligence</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/5"
          >
            <Languages className="size-3.5" />
            {lang === 'bn' ? 'EN' : 'বাং'}
          </button>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-emerald-900 shadow-lg shadow-white/10 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <LogIn className="size-3.5" />
            {t('লঞ্চ অ্যাপ', 'Launch App')}
          </Link>
          <button className="rounded-lg border border-white/10 p-2 md:hidden" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute inset-x-4 top-[68px] rounded-2xl border border-white/10 bg-black/80 p-3 backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <button key={l.id} onClick={() => go(l.id)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/5">
              {l.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function HeroStat({ s, lang }) {
  return (
    <div className="flex flex-col gap-1 border-l border-emerald-400/20 pl-4">
      <span className="font-mono-lb text-xl font-bold tracking-tight text-white">{lang === 'bn' ? s.bn : s.value}</span>
      <span className="font-mono-lb text-[10px] uppercase tracking-[0.18em] text-white/40">{s.key}</span>
    </div>
  );
}

function LivePanel() {
  const bars = [78, 92, 64, 84];
  return (
    <div className="absolute bottom-10 right-8 z-10 hidden w-64 animate-float-slow rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl lg:block">
      <div className="flex items-center justify-between">
        <span className="font-mono-lb text-[9px] uppercase tracking-[0.2em] text-emerald-300/80">field index · live</span>
        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-emerald-400" />
      </div>
      <div className="mt-4 space-y-2.5">
        {bars.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${b}%` }} />
            </div>
            <span className="font-mono-lb text-[9px] text-white/40">{b}%</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="font-mono-lb text-[9px] uppercase tracking-widest text-white/40">avg yield</span>
        <span className="font-mono-lb text-sm font-bold text-emerald-300">+12.4%</span>
      </div>
    </div>
  );
}

function Hero({ heroTextRef }) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  return (
    <section className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#04100b]">
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Aurora colorStops={['#0f172a', '#10b981', '#059669']} amplitude={1.2} blend={0.6} />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_10%,transparent_35%,rgba(4,16,11,0.6)_100%)]" />

      <div ref={heroTextRef} className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 pb-16 pt-28">
        <FadeContent delay={240} duration={600}>
          <Eyebrow>
            {t('এআই ভিত্তিক কৃষি উৎপাদন ও ফলন পূর্বাভাস', 'AI-Based Crop Production & Yield Forecasting')}
          </Eyebrow>
        </FadeContent>

        <h1
          className={`mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-7xl ${
            lang === 'bn' ? 'font-bn' : ''
          }`}
        >
          <BlurText
            text={t('জানুন এই মৌসুমে', 'Know exactly what this')}
            animateBy="words"
            delay={120}
            direction="bottom"
          />
          <GradientText
            colors={['#6ee7b7', '#34d399', '#a7f3d0', '#34d399']}
            animationSpeed={10}
            showBorder={false}
            className="ml-0! block! w-fit! font-extrabold!"
          >
            {t('কী ফলন পাবেন।', 'season will yield.')}
          </GradientText>
        </h1>

        <FadeContent delay={520} duration={700}>
          <p className={`mt-7 max-w-xl text-base leading-relaxed text-white/60 md:text-lg ${lang === 'bn' ? 'font-bn' : ''}`}>
            {t(
              'আবহাওয়া, মাটি ও ফসলের ডেটা দিয়ে ফলন পূর্বাভাস, রোগ শনাক্তকরণ, ফসল সুপারিশ ও বাজারদর — কৃষক, কর্মকর্তা ও অ্যাডমিনদের জন্য এক প্ল্যাটফর্মে।',
              'Yield forecasts, disease detection, crop recommendations and market prices — driven by weather, soil and crop data. One platform for farmers, officers and admins.'
            )}
          </p>
        </FadeContent>

        <FadeContent delay={680} duration={700}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-emerald-950 shadow-2xl shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:shadow-emerald-400/30"
            >
              {t('ড্যাশবোর্ড চালু করুন', 'Launch the Dashboard')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              {t('কেন এটি গুরুত্বপূর্ণ', 'Why it matters')}
            </button>
          </div>
        </FadeContent>

        <FadeContent delay={820} duration={800}>
          <div className="mt-14 grid max-w-xl grid-cols-2 gap-6 sm:grid-cols-4">
            {heroStats.map((s) => (
              <HeroStat key={s.key} s={s} lang={lang} />
            ))}
          </div>
        </FadeContent>
      </div>

      <LivePanel />

      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <div className="flex h-9 w-6 items-start justify-center rounded-full border border-white/20 p-1.5">
          <div className="h-2 w-1 animate-pulse rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const { t } = useLanguage();
  const words = [
    t('AI ফলন পূর্বাভাস', 'AI Yield Forecast'),
    t('রোগ শনাক্তকরণ', 'Disease Detection'),
    t('ফসল সুপারিশ', 'Crop Recommendation'),
    t('বাজারদর', 'Market Prices'),
    t('সেচ পরামর্শ', 'Irrigation Advice'),
    t('মৃত্তিকা বিশ্লেষণ', 'Soil Analysis'),
    t('লাইভ ড্যাশবোর্ড', 'Live Dashboard'),
  ];
  const row = [...words, ...words];
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-[#04100b] py-5">
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8">
            <ShinyText text={w} className="font-mono-lb text-xs uppercase tracking-[0.18em]" speed={3} shineColor="#34d399" />
            <Sparkles className="size-3.5 text-emerald-400/60" />
          </span>
        ))}
      </div>
    </section>
  );
}

function Why({ heroInner }) {
  const { lang, t } = useLanguage();
  return (
    <section id="why" className="relative bg-[#04100b] px-6 py-28 md:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 lb-hero-glow" />
      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <Eyebrow>{t('০১ · সমস্যা', '01 · The problem')}</Eyebrow>
          <h2
            className={`mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl ${
              lang === 'bn' ? 'font-bn' : ''
            }`}
          >
            {t('কৃষি সিদ্ধান্ত এখনো', 'Farming still runs on')}
            <br />
            <span className="accent-text">{t('অনুমান আর দেরিতে জানার ওপর।', 'guesswork and late signals.')}</span>
          </h2>
          <p className={`mt-6 max-w-md text-base leading-relaxed text-white/55 ${lang === 'bn' ? 'font-bn' : ''}`}>
            {t(
              'প্রতিদিনের আবহাওয়া, মাটি ও বাজারের পরিবর্তন বুঝে, সময়মতো সিদ্ধান্ত নিতেই এ প্ল্যাটফর্ম তৈরি — যেন কোনো ফসল, কোনো লাভ হাতছাড়া না হয়।',
              'Weather, soil and markets shift daily. This platform turns that data into timely decisions — so no harvest, no profit is left to chance.'
            )}
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {problems.map((p, i) => (
            <Reveal key={p.title.en} delay={i * 90}>
              <div className="lb-card-hover group relative h-full overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur">
                <span className={`font-mono-lb absolute right-5 top-5 text-4xl font-bold text-white/5 transition group-hover:text-white/10`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${toneClasses[p.tone]}`}>
                  <p.icon className="size-5" />
                </div>
                <h3 className={`mt-5 text-lg font-bold text-white ${lang === 'bn' ? 'font-bn' : ''}`}>{t(p.title.bn, p.title.en)}</h3>
                <p className={`mt-2 text-sm leading-relaxed text-white/50 ${lang === 'bn' ? 'font-bn' : ''}`}>{t(p.body.bn, p.body.en)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ f, index, lang }) {
  const { t } = useLanguage();
  return (
    <SpotlightCard
      spotlightColor="rgba(52, 211, 153, 0.18)"
      className="lb-card-hover h-full rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur"
    >
      <Link to="/login" className="flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${toneClasses[f.tone]}`}>
            <f.icon className="size-5" />
          </div>
          <span className="font-mono-lb text-[11px] text-white/25">
            {String(index + 1).padStart(2, '0')}<span className="text-white/10"> / 15</span>
          </span>
        </div>
        <p className="font-mono-lb mt-5 text-[10px] uppercase tracking-[0.18em] text-white/35">{t(f.tagline.bn, f.tagline.en)}</p>
        <h3 className={`mt-1.5 text-lg font-bold text-white ${lang === 'bn' ? 'font-bn' : ''}`}>{t(f.title.bn, f.title.en)}</h3>
        <p className={`mt-2 flex-1 text-sm leading-relaxed text-white/50 ${lang === 'bn' ? 'font-bn' : ''}`}>{t(f.description.bn, f.description.en)}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {f.benefits.map((b) => (
            <span key={b.en} className={`rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60 ${lang === 'bn' ? 'font-bn' : ''}`}>
              {t(b.bn, b.en)}
            </span>
          ))}
        </div>
        <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
          {t('মডিউল খুলুন', 'Open module')}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </Link>
    </SpotlightCard>
  );
}

function Features() {
  const { lang, t } = useLanguage();
  return (
    <section id="features" className="relative bg-[#04100b] px-6 py-28 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>{t('০২ · মডিউলসমূহ', '02 · Modules')}</Eyebrow>
              <h2 className={`mt-6 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl ${lang === 'bn' ? 'font-bn' : ''}`}>
                {t('পনেরোটি মডিউল,', 'Fifteen modules,')}
                <br />
                <span className="accent-text">{t('প্রতিটি একটি সিদ্ধান্ত।', 'each one a decision.')}</span>
              </h2>
            </div>
            <p className={`max-w-sm text-sm leading-relaxed text-white/50 md:text-right ${lang === 'bn' ? 'font-bn' : ''}`}>
              {t(
                'রেকর্ড, বিশ্লেষণ ও পূর্বাভাস — প্রতিটি মডিউল আসল ফসলের ডেটা ও মেশিন-লার্নিং দিয়ে কাজ করে।',
                'From record-keeping to forecasting — every module works on real farm data and machine learning.'
              )}
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.key} delay={(i % 3) * 80}>
              <FeatureCard f={f} index={i} lang={lang} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps() {
  const { lang, t } = useLanguage();
  return (
    <section id="how" className="relative border-t border-white/5 bg-[#04100b] px-6 py-28 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="text-center">
            <Eyebrow>{t('০৩ · প্রক্রিয়া', '03 · How it works')}</Eyebrow>
            <h2 className={`mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl ${lang === 'bn' ? 'font-bn' : ''}`}>
              {t('তিন ধাপে কাজ করে', 'Three steps to insight')}
            </h2>
          </div>
        </Reveal>

        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute inset-x-16 top-10 hidden border-t border-dashed border-emerald-400/20 md:block" />
          {howItWorks.map((s, i) => (
            <Reveal key={s.title.en} delay={i * 120}>
              <div className="relative h-full rounded-2xl border border-white/8 bg-white/[0.03] p-7 backdrop-blur">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-xl ${toneClasses[['emerald', 'sky', 'amber'][i]]}`}>
                  {t(s.step.bn, s.step.en)}
                </div>
                <s.icon className="mt-6 size-6 text-emerald-300/80" />
                <h3 className={`mt-3 text-lg font-bold text-white ${lang === 'bn' ? 'font-bn' : ''}`}>{t(s.title.bn, s.title.en)}</h3>
                <p className={`mt-2 text-sm leading-relaxed text-white/50 ${lang === 'bn' ? 'font-bn' : ''}`}>{t(s.body.bn, s.body.en)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { lang, t } = useLanguage();
  const data = [
    { n: 5000, suffix: '+', label: { bn: 'নিবন্ধিত কৃষক', en: 'Registered farmers' } },
    { n: 8, suffix: '', label: { bn: 'বিভাগ কভারেজ', en: 'Division coverage' } },
    { n: 120, suffix: 'k+', label: { bn: 'ফলন পূর্বাভাস / মৌসুম', en: 'Forecasts per season' } },
    { n: 15, suffix: '', label: { bn: 'সম্পূর্ণ মডিউল', en: 'Integrated modules' } },
  ];
  return (
    <section className="relative bg-[#04100b] px-6 pb-28">
      <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((d, i) => {
          const { ref, val } = useCountUp(d.n);
          return (
            <Reveal key={d.label.en} delay={i * 80}>
              <div ref={ref} className="bg-[#04100b] p-8">
                <p className="font-mono-lb text-4xl font-bold tracking-tight text-white md:text-5xl">
                  {val.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                  <span className="accent-text">{d.suffix}</span>
                </p>
                <p className={`mt-2 text-sm text-white/45 ${lang === 'bn' ? 'font-bn' : ''}`}>{t(d.label.bn, d.label.en)}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function CTA() {
  const { lang, t } = useLanguage();
  return (
    <section id="start" className="relative px-6 pb-28">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#062014] px-8 py-20 text-center md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(52,211,153,0.22),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-[100%] bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <Globe className="mx-auto size-8 text-emerald-300/80" />
          <h2 className={`mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl ${lang === 'bn' ? 'font-bn' : ''}`}>
            {t('আজই শুরু করুন', 'Start today')}
            <br />
            <span className="accent-text">{t('স্মার্ট কৃষির যাত্রা।', 'the smart-farming journey.')}</span>
          </h2>
          <p className={`mx-auto mt-5 max-w-lg text-base text-white/55 ${lang === 'bn' ? 'font-bn' : ''}`}>
            {t(
              'ডেমো অ্যাকাউন্ট দিয়েই সব মডিউল হাতে হাতে দেখুন — বিনামূল্যে, কোনো কার্ড ছাড়াই।',
              'Try every module hands-on with a demo account — free, no card required.'
            )}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-emerald-950 shadow-2xl transition hover:-translate-y-0.5"
            >
              {t('কৃষক নিবন্ধন', 'Register as Farmer')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              <LogIn className="size-4" />
              {t('লগইন করুন', 'Login')}
            </Link>
          </div>
          <p className="font-mono-lb mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
            <Cpu className="size-3.5" /> 4.0 <Waves className="size-3.5" /> {t('জিপিইউ-বান্ধব এআই ইঞ্জিন', 'GPU-ready AI engine')}
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { lang, t } = useLanguage();
  return (
    <footer className="border-t border-white/5 bg-[#04100b] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 text-white">
            <Sprout className="size-4" />
          </div>
          <p className="text-sm font-bold text-white">CropYield <span className="text-emerald-300">AI</span></p>
        </div>
        <p className={`text-xs text-white/40 ${lang === 'bn' ? 'font-bn' : ''}`}>
          {t('এআই ভিত্তিক কৃষি উৎপাদন ও ফলন পূর্বাভাস', 'AI-Based Crop Production & Yield Forecasting')}
        </p>
        <p className="font-mono-lb text-xs text-white/25">© {new Date().getFullYear()} CropYield AI</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { lang } = useLanguage();
  const sceneScroll = useRef({ progress: 0 });
  const heroTextRef = useRef(null);
  useEffect(() => {
    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        sceneScroll.current.progress = Math.min(y / vh, 1.4);
        if (heroTextRef.current) {
          const t = Math.min(y / vh, 1);
          heroTextRef.current.style.transform = `translateY(${t * 70}px)`;
          heroTextRef.current.style.opacity = String(1 - t * 0.65);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`landing-grain relative min-h-screen bg-[#04100b] text-white antialiased ${lang === 'bn' ? 'font-bn' : ''}`}>
      <Nav />
      <main>
        <Hero heroTextRef={heroTextRef} />
        <Marquee />
        <Why />
        <Features />
        <Steps />
        <Stats />
        <CTA />
        <Footer className="border-t border-white/5" />
      </main>
    </div>
  );
}