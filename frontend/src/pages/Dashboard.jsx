import { useEffect, useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Panel,
  CountUp,
  LinearProgress,
  Badge,
  Spinner,
  ErrorAlert,
  EmptyState,
  IconChip,
  PulseDot,
} from '../components/ui.jsx';
import {
  LayoutDashboard,
  Users,
  Map,
  Tractor,
  Banknote,
  LandPlot,
  Sprout,
  TriangleAlert,
  CloudRain,
  Cloudy,
  Sun,
  Globe,
} from 'lucide-react';
import { ROLE_LABELS, cn, formatDate, getActiveLang } from '../components/utils.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const bnNum = (n, d = 1, locale) => new Intl.NumberFormat(locale || (getActiveLang() === 'en' ? 'en-US' : 'bn-BD'), { maximumFractionDigits: d }).format(n);

function todayBn(locale) {
  const loc = locale || (getActiveLang() === 'en' ? 'en-US' : 'bn-BD');
  return new Date().toLocaleDateString(loc, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ---------------------------------------------------------------- helpers
function trendOf(series) {
  const vals = (series || []).map(Number).filter(Number.isFinite);
  if (vals.length < 2 || !vals[0]) return null;
  return ((vals[vals.length - 1] - vals[0]) / vals[0]) * 100;
}

function TrendPill({ value }) {
  if (value == null) return null;
  const up = Number(value) >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur',
        !up && 'bg-black/20'
      )}
    >
      {up ? '↑' : '↓'} {Math.abs(Number(value)).toFixed(0)}%
    </span>
  );
}

function Sparkline({ data, color = '#10b981', height = 40 }) {
  const gid = useId();
  const values = (data || []).map(Number).filter(Number.isFinite);
  if (!values.length) return <div style={{ height }} />;
  const chartData = values.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            animationDuration={900}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, tone = 'green', spark, trend, delay = 0 }) {
  const tones = {
    green: 'from-emerald-500 to-emerald-700',
    blue: 'from-sky-500 to-sky-700',
    indigo: 'from-indigo-500 to-indigo-700',
    amber: 'from-amber-400 to-amber-600',
    rose: 'from-rose-500 to-rose-700',
    violet: 'from-violet-500 to-violet-700',
  };
  return (
    <div
      className="animate-fade-up group relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/15"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        aria-hidden
        className={cn(
          'animate-gradient pointer-events-none absolute inset-0 bg-gradient-to-br',
          tones[tone] || tones.green
        )}
      />
      <div aria-hidden className="pointer-events-none absolute -top-12 -right-10 h-36 w-36 rounded-full bg-white/15" />
      <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-black/10" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl backdrop-blur transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
          <TrendPill value={trend} />
        </div>
        <div className="pr-8">
          <p className="text-xs font-medium text-white/80">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-white/70">{sub}</p>}
        </div>
        {spark && <Sparkline data={spark} color="#ffffff" height={38} />}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label, unit = '' }) {
  const { lang } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'bn-BD';
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-gray-700">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-gray-500">
          {p.name}: <span className="font-semibold text-gray-800">{bnNum(p.value, 1, locale)}</span>
          {unit}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- weather
function WeatherCard({ weather, source }) {
  const { lang, t } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'bn-BD';
  if (!weather) return null;
  const cond = weather.condition || '';
  const Icon = ['বৃষ্টি', 'মুষলধারে বৃষ্টি'].some((c) => cond.includes(c))
    ? CloudRain
    : cond.includes('মেঘলা')
      ? Cloudy
      : Sun;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-sky-600 p-5 text-white shadow-lg shadow-sky-600/30">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/5" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-100">{t('বর্তমান আবহাওয়া', 'Current Weather')}</p>
          <div className="mt-1 flex items-end gap-1">
            <p className="text-4xl font-bold leading-none">{bnNum(weather.temperature_c, 1, locale)}°</p>
            <p className="pb-1 text-sm text-sky-100">C</p>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-sky-100">
            <span className="text-base"><Icon className="h-4 w-4" /></span> {cond}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/10 px-2 py-2 backdrop-blur">
          <p className="text-sm font-bold">{weather.humidity}%</p>
          <p className="text-[11px] text-sky-100">{t('আর্দ্রতা', 'Humidity')}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-2 py-2 backdrop-blur">
          <p className="text-sm font-bold">{bnNum(weather.wind_kph, 1, locale)}</p>
          <p className="text-[11px] text-sky-100">{t('বায়ু (km/h)', 'Wind (km/h)')}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-2 py-2 backdrop-blur">
          <p className="text-sm font-bold">{bnNum(weather.rainfall_mm, 1, locale)}</p>
          <p className="text-[11px] text-sky-100">{t('বৃষ্টি (mm)', 'Rain (mm)')}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-sky-200">
        {source === 'live' ? t('লাইভ আবহাওয়া API', 'Live Weather API') : t('সিমুলেটেড / সংরক্ষিত তথ্য', 'Simulated / Stored data')}
      </p>
    </div>
  );
}

function PriceTiles({ prices }) {
  const { lang, t } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'bn-BD';
  if (!prices?.length)
    return <EmptyState title={t('কোনো বাজারদর তথ্য নেই', 'No market price data')} />;
  const colors = ['bg-emerald-600', 'bg-sky-600', 'bg-amber-500', 'bg-violet-600', 'bg-rose-600'];
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {prices.map((p, i) => (
        <div
          key={p.crop_name + p.district}
          className="group overflow-hidden rounded-xl border border-gray-100 bg-white text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className={cn('px-2 py-1.5 text-sm font-bold text-white', colors[i % colors.length])}>
            {p.crop_name}
          </div>
          <div className="px-2 py-2">
            <p className="text-sm font-bold text-gray-900">{bnNum(p.price, 1, locale)}/{p.unit}</p>
            <p className="text-[11px] text-gray-500">{p.district || '—'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityList({ items, avatarColor = 'bg-emerald-100 text-emerald-700' }) {
  const { lang, t } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'bn-BD';
  if (!items?.length) return <EmptyState title={t('কোনো তথ্য নেই', 'No data')} />;
  return (
    <ul className="slim-scroll max-h-80 divide-y divide-gray-100 overflow-y-auto">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold', avatarColor)}>
            {(item.crop_name || item.name || 'ফ')[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800">{item.crop_name || item.name}</p>
            <p className="truncate text-xs text-gray-500">
              {item.farmer_name ? `${item.farmer_name} · ` : ''}
              {item.harvested_at ? formatDate(item.harvested_at) : item.land_label || ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-gray-900">{bnNum(item.total_quantity_kg, 0, locale)}<span className="text-xs font-medium text-gray-400"> {t('কেজি', 'kg')}</span></p>
            <p className="text-xs font-semibold text-emerald-600">{bnNum(item.revenue_taka, 0, locale)} {t('টাকা', 'Taka')}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- dashboard
export default function Dashboard() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const areaId = useId();
  const barId = useId();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/dashboard')
      .then((res) => alive && setData(res.data))
      .catch((err) => alive && setError(err.response?.data?.error || t('ড্যাশবোর্ড লোড করা যায়নি', 'Dashboard could not be loaded')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Spinner label={t('ড্যাশবোর্ড লোড হচ্ছে...', 'Loading dashboard...')} />;
  if (error) return <ErrorAlert message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  const isFarmer = data.role === 'FARMER';
  const locale = lang === 'en' ? 'en-US' : 'bn-BD';

  // ---- KPI data ----
  let kpis;
  if (isFarmer) {
    const prodSpark = (data.productions || []).map((p) => Number(p.total_quantity_kg));
    kpis = [
      {
        icon: <LandPlot className="h-5 w-5" />, label: t('জমি (খণ্ড)', 'Land (plots)'), tone: 'blue', delay: 0,
        value: <CountUp value={data.stats.land_count} formatter={(n) => bnNum(n, 0, locale)} />,
        sub: t(`${bnNum(data.stats.total_land_bigha, 1, locale)} বিঘা মোট`, `${bnNum(data.stats.total_land_bigha, 1, locale)} bigha total`),
      },
      {
        icon: <Sprout className="h-5 w-5" />, label: t('সক্রিয় ফসল', 'Active Crops'), tone: 'green', delay: 70,
        value: <CountUp value={data.stats.active_crops} formatter={(n) => bnNum(n, 0, locale)} />,
        sub: t('চলমান চাষ', 'Ongoing cultivation'),
      },
      {
        icon: <Tractor className="h-5 w-5" />, label: t('উৎপাদন', 'Production'), tone: 'amber', delay: 140,
        value: <CountUp value={(data.productions || []).reduce((s, p) => s + Number(p.total_quantity_kg || 0), 0)} formatter={(n) => bnNum(n, 0, locale)} />,
        sub: t('কেজি · সব রেকর্ড', 'kg · all records'),
        spark: prodSpark,
        trend: trendOf(prodSpark),
      },
      {
        icon: <TriangleAlert className="h-5 w-5" />, label: t('খোলা রোগ-পোকা', 'Open Pest & Disease'), tone: data.openDiseases > 0 ? 'rose' : 'green', delay: 210,
        value: <CountUp value={data.openDiseases} formatter={(n) => bnNum(n, 0, locale)} />,
        sub: data.openDiseases > 0 ? t('অবিলম্বে ব্যবস্থা নিন', 'Take immediate action') : t('কোনো রিপোর্ট নেই', 'No reports'),
      },
    ];
  } else {
    const fSpark = (data.divisionStats || []).map((d) => Number(d.farmer_count));
    const lSpark = (data.divisionStats || []).map((d) => Number(d.land_bigha));
    const pSpark = (data.productionTrend || []).map((d) => Number(d.total_kg));
    const rSpark = (data.productionTrend || []).map((d) => Number(d.revenue));
    kpis = [
      {
        icon: <Users className="h-5 w-5" />, label: t('মোট কৃষক', 'Total Farmers'), tone: 'green', delay: 0,
        value: <CountUp value={data.stats.farmer_count} formatter={(n) => bnNum(n, 0, locale)} />,
        sub: t('নিবন্ধিত কৃষক', 'Registered farmers'),
        spark: fSpark, trend: trendOf(fSpark),
      },
      {
        icon: <Map className="h-5 w-5" />, label: t('মোট জমি', 'Total Land'), tone: 'blue', delay: 70,
        value: <CountUp value={data.stats.total_land_bigha} formatter={(n) => bnNum(n, 1, locale)} />,
        sub: t('বিঘা জমি', 'Bigha of land'),
        spark: lSpark, trend: trendOf(lSpark),
      },
      {
        icon: <Tractor className="h-5 w-5" />, label: t('মোট উৎপাদন', 'Total Production'), tone: 'indigo', delay: 140,
        value: <CountUp value={data.stats.total_production_kg} formatter={(n) => bnNum(n, 0, locale)} />,
        sub: t('কেজি', 'kg'),
        spark: pSpark, trend: trendOf(pSpark),
      },
      {
        icon: <Banknote className="h-5 w-5" />, label: t('মোট আয়', 'Total Revenue'), tone: 'amber', delay: 210,
        value: <CountUp value={data.stats.total_revenue} formatter={(n) => `${bnNum(n, 0, locale)}`} />,
        sub: t(`${bnNum(data.stats.total_revenue, 0, locale)} টাকা · গড় ফলন ${bnNum(data.stats.avg_yield_per_bigha, 0, locale)} কেজি/বিঘা`, `${bnNum(data.stats.total_revenue, 0, locale)} Taka · Avg yield ${bnNum(data.stats.avg_yield_per_bigha, 0, locale)} kg/bigha`),
        spark: rSpark, trend: trendOf(rSpark),
      },
    ];
  }

  // ---- admin side data ----
  const productionTrend = (data.productionTrend || []).map((r) => ({
    month: r.month,
    total_kg: Number(r.total_kg) || 0,
    revenue: Number(r.revenue) || 0,
  }));
  const farmerTrend = (data.productions || [])
    .slice()
    .sort((a, b) => new Date(a.harvested_at) - new Date(b.harvested_at))
    .map((p) => ({ month: formatDate(p.harvested_at), total_kg: Number(p.total_quantity_kg) || 0 }));

  const divColor = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6', '#84cc16'];
  const divisionItems = (data.divisionStats || []).map((d, i) => ({
    label: d.division,
    value: Number(d.farmer_count),
    display: `${bnNum(d.farmer_count, 0, locale)} ${t('জন', 'people')} · ${bnNum(d.land_bigha, 0, locale)} ${t('বিঘা', 'bigha')}`,
    color: divColor[i % divColor.length],
  }));

  const topCrops = (data.topCrops || []).map((c) => ({ name: c.name, total_area: Number(c.total_area) || 0 }));
  const barColors = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="space-y-5">
      {/* ------------------------------ header ------------------------------ */}
      <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconChip Icon={LayoutDashboard} tone="green" className="size-12 rounded-2xl" iconClass="size-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('ড্যাশবোর্ড', 'Dashboard')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('স্বাগতম,', 'Welcome,')} <span className="font-semibold text-foreground">{user.name}</span> ·{' '}
              {ROLE_LABELS(user.role) || user.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
          >
            <Globe className="size-4" />
            {t('ল্যান্ডিং পেজ', 'Landing Page')}
          </Link>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
            <PulseDot className="text-emerald-500" />
            {todayBn(locale)}
          </div>
        </div>
      </div>

      {/* ------------------------------ KPIs ------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* --------------- packed masonry: mixed card sizes, no gaps --------------- */}
      <div className="mt-5 columns-1 gap-5 lg:columns-2 xl:columns-3">
        {/* production trend (tall) */}
        <div className="animate-fade-up mb-5 break-inside-avoid" style={{ animationDelay: '120ms' }}>
          <Panel
            title={isFarmer ? t('আমার উৎপাদনের প্রবণতা', 'My Production Trend') : t('উৎপাদন প্রবণতা (মাসিক, কেজি)', 'Production Trend (monthly, kg)')}
            subtitle={isFarmer ? t('হারভেস্ট রেকর্ড অনুযায়ী', 'According to harvest records') : t('সর্বশেষ ৬ মাস', 'Last 6 months')}
            actions={<Badge tone="green">{isFarmer ? farmerTrend.length : productionTrend.length}{t('টি পয়েন্ট', ' points')}</Badge>}
          >
            {isFarmer ? (
              farmerTrend.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={farmerTrend} margin={{ top: 10, right: 8, bottom: 0, left: -14 }}>
                    <defs>
                      <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTip unit={t(' কেজি', ' kg')} />} />
                    <Area type="monotone" dataKey="total_kg" name={t('উৎপাদন', 'Production')} stroke="#10b981" strokeWidth={2.5} fill={`url(#${areaId})`} animationDuration={1000} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title={t('কোনো উৎপাদন রেকর্ড নেই', 'No production records')} />
              )
            ) : productionTrend.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={productionTrend} margin={{ top: 10, right: 8, bottom: 0, left: -14 }}>
                  <defs>
                    <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip unit={t(' কেজি', ' kg')} />} />
                  <Area type="monotone" dataKey="total_kg" name={t('উৎপাদন', 'Production')} stroke="#10b981" strokeWidth={2.5} fill={`url(#${areaId})`} animationDuration={1000} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title={t('কোনো উৎপাদন তথ্য নেই', 'No production data')} />
            )}
          </Panel>
        </div>

        {/* weather (short) */}
        <div className="animate-fade-up mb-5 break-inside-avoid" style={{ animationDelay: '200ms' }}>
          <WeatherCard weather={data.weather} source={data.weatherSource} />
        </div>

        {/* top crops (medium) */}
        <div className="animate-fade-up mb-5 break-inside-avoid" style={{ animationDelay: '150ms' }}>
          <Panel
            title={t('শীর্ষ ফসল (জমির ভিত্তিতে)', 'Top Crops (by land area)')}
            subtitle={t('কৃষি জমির বণ্টন', 'Distribution of farmland')}
            actions={<Badge tone="indigo">{data.openDiseases} {t('খোলা রোগ', 'open diseases')}</Badge>}
          >
            {topCrops.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topCrops} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id={barId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#065f46" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip unit={t(' বিঘা', ' bigha')} />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="total_area" name={t('জমি', 'Land')} radius={[6, 6, 0, 0]} animationDuration={900}>
                    {topCrops.map((c, i) => (
                      <Cell key={c.name} fill={i === 0 ? `url(#${barId})` : barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title={t('কোনো ফসলের তথ্য নেই', 'No crop data')} />
            )}
          </Panel>
        </div>

        {/* division / upcoming (medium) */}
        {isFarmer ? (
          <div className="animate-fade-up mb-5 break-inside-avoid" style={{ animationDelay: '280ms' }}>
            <Panel title={t('আসন্ন ফসল কাটা', 'Upcoming Harvests')} subtitle={t('পরবর্তী ১৪ দিন', 'Next 14 days')} pad={false}>
              <div className="px-5 py-2">
                {data.upcoming?.length ? (
                  <ul className="divide-y divide-gray-100">
                    {data.upcoming.map((c) => (
                      <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="font-medium text-gray-800">
                          {c.name}{c.variety && <span className="text-gray-400"> ({c.variety})</span>}
                        </span>
                        <Badge tone="amber">{formatDate(c.expected_harvest_date)}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title={t('আসন্ন ফসল কাটা নেই', 'No upcoming harvests')} />
                )}
              </div>
            </Panel>
          </div>
        ) : (
          <div className="animate-fade-up mb-5 break-inside-avoid" style={{ animationDelay: '280ms' }}>
            <Panel
              title={t('বিভাগ অনুযায়ী কৃষক', 'Farmers by Division')}
              subtitle={t('সবচেয়ে বেশি প্রথমে', 'Highest first')}
              actions={<Badge tone="blue">{data.divisionStats?.length}{t('টি', '')}</Badge>}
            >
              {divisionItems.length ? (
                <LinearProgress items={divisionItems.slice(0, 6)} />
              ) : (
                <EmptyState title={t('কোনো তথ্য নেই', 'No data')} />
              )}
            </Panel>
          </div>
        )}

        {/* market prices (short) */}
        <div className="animate-fade-up mb-5 break-inside-avoid" style={{ animationDelay: '220ms' }}>
          <Panel title={t('সর্বশেষ বাজারদর', 'Latest Market Prices')} subtitle={t('প্রতি কেজি (টাকা)', 'Per kg (Taka)')}>
            <PriceTiles prices={data.latestPrices} />
          </Panel>
        </div>

        {/* recent productions (tall list) */}
        <div className="animate-fade-up mb-5 break-inside-avoid" style={{ animationDelay: '290ms' }}>
          <Panel
            title={t('সাম্প্রতিক উৎপাদন', 'Recent Production')}
            subtitle={t('সর্বশেষ রেকর্ড', 'Latest records')}
            pad={false}
          >
            <div className="px-5 pt-2">
              <ActivityList items={isFarmer ? data.productions : data.recentProductions} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}