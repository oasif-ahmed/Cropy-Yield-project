import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Badge, IconChip, Spinner, ErrorAlert, CountUp } from '../components/ui.jsx';
import { ROLE_LABELS, formatDate, formatNumber } from '../components/utils.js';
import { Leaf, Map, Sprout, Warehouse, Plus, TrendingUp, Banknote, UserRound } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const ROLE_TONES = { FARMER: 'green', OFFICER: 'blue', ADMIN: 'indigo' };

export default function Profile() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get('/dashboard')
      .then((res) => alive && setData(res.data))
      .catch((err) => setError(err.response?.data?.error || t('তথ্য লোড করা যায়নি', 'Could not load data')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [t]);

  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const locale = lang === 'en' ? 'en-US' : 'bn-BD';
  const bd = (n, f) => new Intl.NumberFormat(locale, { maximumFractionDigits: f ?? 0 }).format(n || 0);
  const stats =
    user?.role === 'FARMER'
      ? [
          { label: t('জমি', 'Land'), value: data?.stats?.land_count ?? 0, Icon: Map, tone: 'green' },
          { label: t('মোট জমি (বিঘা)', 'Total Land (bigha)'), value: data?.stats?.total_land_bigha ?? 0, Icon: Warehouse, tone: 'blue' },
          { label: t('সক্রিয় ফসল', 'Active Crops'), value: data?.stats?.active_crops ?? 0, Icon: Sprout, tone: 'amber' },
          { label: t('খোলা রোগ-পোকা', 'Open Pest & Disease'), value: data?.openDiseases ?? 0, Icon: Plus, tone: 'red' },
        ]
      : [
          { label: t('কৃষক', 'Farmers'), value: data?.stats?.farmer_count ?? 0, Icon: UserRound, tone: 'green' },
          { label: t('মোট জমি (বিঘা)', 'Total Land (bigha)'), value: data?.stats?.total_land_bigha ?? 0, Icon: Warehouse, tone: 'blue' },
          { label: t('সক্রিয় ফসল', 'Active Crops'), value: data?.stats?.active_crops ?? 0, Icon: Sprout, tone: 'amber' },
          { label: t('মোট উৎপাদন (কেজি)', 'Total Production (kg)'), value: data?.stats?.total_production_kg ?? 0, Icon: TrendingUp, tone: 'indigo' },
          { label: t('গড় ফলন (বিঘা/কেজি)', 'Avg Yield (bigha/kg)'), value: data?.stats?.avg_yield_per_bigha ?? 0, Icon: Leaf, tone: 'green' },
          { label: t('মোট আয় (টাকা)', 'Total Revenue (Taka)'), value: data?.stats?.total_revenue ?? 0, Icon: Banknote, tone: 'amber' },
        ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('প্রোফাইল', 'Profile')} subtitle={t('আপনার অ্যাকাউন্ট ও পরিসংখ্যান', 'Your account and statistics')} icon={UserRound} tone="green" />

      {error && <ErrorAlert message={error} />}
      {loading ? (
        <Spinner label={t('প্রোফাইল লোড হচ্ছে...', 'Loading profile...')} />
      ) : (
        <>
          <div className="card-hover overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10">
            <div className="relative h-32 bg-emerald-600 md:h-40">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 40%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 35%)' }} />
              <IconChip Icon={Sprout} tone="green" className="absolute top-4 left-4 opacity-25" iconClass="size-10" />
              <IconChip Icon={Leaf} tone="green" className="absolute right-8 bottom-3 opacity-20 animate-float" iconClass="size-8" />
              <IconChip Icon={Map} tone="blue" className="absolute right-32 bottom-4 opacity-15 animate-float" iconClass="size-6" />
            </div>
            <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
              <div className="-mt-10 sm:-mt-12">
                <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white shadow-lg ring-4 ring-background sm:size-24">
                  {initials}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-bold">{user?.name}</h2>
                  <Badge tone={ROLE_TONES[user?.role]}>{ROLE_LABELS(user?.role)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-sm text-muted-foreground">
                  {[user?.address, user?.district, user?.division].filter(Boolean).join(' · ') || t('বাংলাদেশ', 'Bangladesh')}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:pb-1">
                <Badge tone="green"><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" />{t('সক্রিয়', 'Active')}</span></Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {stats.map(({ label, value, Icon, tone }) => (
              <div key={label} className="card-hover rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
                <IconChip Icon={Icon} tone={tone} className="p-2" iconClass="size-4" />
                <CountUp value={value} formatter={(n) => bd(n)} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title={t('অ্যাকাউন্ট তথ্য', 'Account Info')} subtitle={t('লগইন ও প্রোফাইল বিস্তারিত', 'Login & profile details')} className="lg:col-span-1">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t('নাম', 'Name')}</dt>
                  <dd className="font-medium">{user?.name}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t('ইমেইল', 'Email')}</dt>
                  <dd className="font-medium truncate">{user?.email}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t('ভূমিকা', 'Role')}</dt>
                  <dd>{ROLE_LABELS(user?.role)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t('অঞ্চল', 'Region')}</dt>
                  <dd>{[user?.division, user?.district].filter(Boolean).join(', ') || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t('নিবন্ধিত', 'Registered')}</dt>
                  <dd>{formatDate(user?.created_at)}</dd>
                </div>
              </dl>
            </Card>

            <Card title={t('দ্রুত তথ্য', 'Quick Info')} subtitle={t('ড্যাশবোর্ড থেকে সংগৃহীত', 'Collected from dashboard')} className="lg:col-span-2">
              {user?.role === 'FARMER' ? (
                <div className="space-y-3">
                  <Row label={t('সাম্প্রতিক ফসল', 'Recent Crops')} value={(data?.crops || []).slice(0, 3).map((c) => c.name).join(', ') || t('কোনো সক্রিয় ফসল নেই', 'No active crops')} />
                  <Row label={t('আসন্ন ফসল কাটা', 'Upcoming Harvests')} value={(data?.upcoming || []).slice(0, 3).map((c) => `${c.name} (${formatDate(c.expected_harvest_date)})`).join(', ') || t('আসন্ন নেই', 'None upcoming')} />
                  <Row label={t('অমীমাংসিত রোগ-পোকা', 'Unresolved Pest & Disease')} value={`${data?.openDiseases ?? 0} ${t('টি', '')}`} />
                  <Row label={t('অপঠিত বিজ্ঞপ্তি', 'Unread Notifications')} value={`${data?.unreadNotifications ?? 0} ${t('টি', '')}`} />
                </div>
              ) : (
                <div className="space-y-3">
                  <Row label={t('খোলা রোগ-পোকা রিপোর্ট', 'Open Pest & Disease Reports')} value={`${data?.openDiseases ?? 0} ${t('টি', '')}`} />
                  <Row label={t('অপঠিত বিজ্ঞপ্তি', 'Unread Notifications')} value={`${data?.unreadNotifications ?? 0} ${t('টি', '')}`} />
                  <Row label={t('আবহাওয়া (বর্তমান)', 'Weather (Current)')} value={data?.weather ? `${formatNumber(data.weather.temperature_c)}°C ${data.weather.condition || ''}` : '—'} />
                  <Row label={t('শীর্ষ ফসল', 'Top Crops')} value={(data?.topCrops || []).slice(0, 5).map((c) => c.name).join(', ') || '—'} />
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
