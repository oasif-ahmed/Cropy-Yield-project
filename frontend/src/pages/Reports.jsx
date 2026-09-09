import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { PageHeader, Card, StatCard, Spinner, EmptyState, ErrorAlert, Select } from '../components/ui.jsx';
import { BarChart3 } from 'lucide-react';
import { formatNumber, formatTaka } from '../components/utils.js';
import { DIVISIONS } from '../i18n/locations.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function Reports() {
  const { t } = useLanguage();
  const [overview, setOverview] = useState(null);
  const [production, setProduction] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [o, p, f, d] = await Promise.all([
        api.get('/reports/overview'),
        api.get('/reports/production'),
        api.get('/reports/farmers', { params: { division: division || undefined } }),
        api.get('/reports/diseases'),
      ]);
      setOverview(o.data.report);
      setProduction(p.data);
      setFarmers(f.data.farmers);
      setDiseases(d.data.diseases);
    } catch (err) {
      setError(err.response?.data?.error || t('রিপোর্ট লোড করা যায়নি', 'Could not load reports'));
    } finally {
      setLoading(false);
    }
  }, [division, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label={t('রিপোর্ট লোড হচ্ছে...', 'Loading reports...')} />;
  if (error) return <ErrorAlert message={error} onRetry={load} />;
  if (!overview) return null;

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        tone="indigo"
        title={t('রিপোর্ট ও বিশ্লেষণ', 'Reports & Analytics')}
        subtitle={t('উৎপাদন, কৃষক ও রোগ-পোকার সামগ্রিক পরিসংখ্যান', 'Overview of production, farmers and pest/disease statistics')}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t('কৃষক', 'Farmers')} value={formatNumber(overview.farmers)} accent="green" />
        <StatCard label={t('মোট জমি', 'Total Land')} value={formatNumber(overview.lands)} accent="blue" />
        <StatCard label={t('সক্রিয় ফসল', 'Active Crops')} value={formatNumber(overview.active_crops)} accent="green" />
        <StatCard label={t('মোট উৎপাদন (কেজি)', 'Total Production (kg)')} value={formatNumber(overview.total_production_kg)} accent="indigo" />
        <StatCard label={t('গড় ফলন (কেজি/বিঘা)', 'Avg Yield (kg/bigha)')} value={formatNumber(overview.avg_yield)} accent="amber" />
        <StatCard label={t('মোট আয়', 'Total Revenue')} value={formatTaka(overview.total_revenue)} accent="amber" />
        <StatCard label={t('মোট খরচ', 'Total Cost')} value={formatTaka(overview.total_cost)} accent="red" />
        <StatCard label={t('খোলা রোগ-পোকা', 'Open Pest & Disease')} value={formatNumber(overview.open_diseases)} accent={overview.open_diseases > 0 ? 'red' : 'gray'} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('মাসিক উৎপাদন', 'Monthly Production')}>
          {production.monthly.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={production.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_kg" name={t('কেজি', 'kg')} fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title={t('কোনো তথ্য নেই', 'No data')} />
          )}
        </Card>

        <Card title={t('ফসল অনুযায়ী উৎপাদন', 'Production by Crop')}>
          {production.byCrop.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={production.byCrop}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="crop_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_kg" name={t('কেজি', 'kg')} fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title={t('কোনো তথ্য নেই', 'No data')} />
          )}
        </Card>

        <Card title={t('বিভাগ অনুযায়ী কৃষক', 'Farmers by Division')} actions={
          <div className="w-36">
            <Select value={division} onChange={(e) => setDivision(e.target.value)}>
              <option value="">{t('সব বিভাগ', 'All divisions')}</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
        }>
          {farmers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs text-gray-500">
                  <tr>
                    <th className="py-2 pr-3">{t('বিভাগ', 'Division')}</th>
                    <th className="py-2 pr-3">{t('জেলা', 'District')}</th>
                    <th className="py-2 pr-3">{t('কৃষক', 'Farmers')}</th>
                    <th className="py-2">{t('জমি (বিঘা)', 'Land (bigha)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {farmers.map((f) => (
                    <tr key={f.division + f.district}>
                      <td className="py-2 pr-3 font-medium">{f.division}</td>
                      <td className="py-2 pr-3 text-gray-600">{f.district || '—'}</td>
                      <td className="py-2 pr-3">{f.farmers} {t('জন', 'people')}</td>
                      <td className="py-2">{formatNumber(f.land_bigha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title={t('কোনো তথ্য নেই', 'No data')} />
          )}
        </Card>

        <Card title={t('রোগ-পোকার সারসংক্ষেপ', 'Disease & Pest Summary')}>
          {diseases.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs text-gray-500">
                  <tr>
                    <th className="py-2 pr-3">{t('রোগ', 'Disease')}</th>
                    <th className="py-2 pr-3">{t('মোট রিপোর্ট', 'Total Reports')}</th>
                    <th className="py-2 pr-3">{t('খোলা', 'Open')}</th>
                    <th className="py-2">{t('সমাধান', 'Resolved')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {diseases.map((d) => (
                    <tr key={d.disease_name}>
                      <td className="py-2 pr-3 font-medium">{d.disease_name}</td>
                      <td className="py-2 pr-3">{d.reports}</td>
                      <td className="py-2 pr-3 text-rose-600">{d.open}</td>
                      <td className="py-2 text-emerald-600">{d.resolved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title={t('কোনো রিপোর্ট নেই', 'No reports')} />
          )}
        </Card>
      </div>
    </div>
  );
}
