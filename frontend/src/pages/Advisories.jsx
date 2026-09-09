import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { PageHeader, Card, Select, Spinner, EmptyState, ErrorAlert } from '../components/ui.jsx';
import { Droplets, FlaskConical } from 'lucide-react';
import { formatNumber } from '../components/utils.js';

export default function Advisories() {
  const { t } = useLanguage();
  const [lands, setLands] = useState([]);
  const [landId, setLandId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get('/lands')
      .then((res) => {
        if (!alive) return;
        setLands(res.data.lands);
        if (res.data.lands.length) setLandId((prev) => prev || res.data.lands[0].id);
      })
      .catch((err) => alive && setError(err.response?.data?.error || t('জমি লোড করা যায়নি', 'Could not load lands')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [t]);

  const loadAdvice = useCallback(async () => {
    if (!landId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/advisories', { params: { land_id: landId } });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('পরামর্শ লোড করা যায়নি', 'Could not load advisories'));
    } finally {
      setLoading(false);
    }
  }, [landId, t]);

  useEffect(() => {
    loadAdvice();
  }, [loadAdvice]);

  return (
    <div>
      <PageHeader
        icon={Droplets}
        tone="blue"
        title={t('সার ও সেচ পরামর্শ', 'Fertilizer & Irrigation Advisories')}
        subtitle={t('মৃত্তিকা পরীক্ষা ও আবহাওয়ার ভিত্তিতে স্বয়ংক্রিয় কৃষি পরামর্শ', 'Automated agricultural advice based on soil tests and weather')}
      />

      <Card className="mb-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('জমি নির্বাচন করুন', 'Select a land')}</span>
          <Select value={landId} onChange={(e) => setLandId(e.target.value)}>
            <option value="">— {t('জমি নির্বাচন করুন', 'Select a land')} —</option>
            {lands.map((l) => (
              <option key={l.id} value={l.id}>{l.label} ({l.farmer_name})</option>
            ))}
          </Select>
        </label>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadAdvice} />}
      {loading ? (
        <Spinner label={t('পরামর্শ তৈরি হচ্ছে...', 'Generating advisories...')} />
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title={t('সার প্রয়োগ পরামর্শ', 'Fertilizer Application Advisories')}>
            <ul className="space-y-2">
              {data.fertilizer.map((item, i) => (
                <li key={i} className="flex items-start gap-2 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
                  <span className="mt-0.5 flex-shrink-0"><FlaskConical className="h-4 w-4 text-emerald-500" /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {data.soil && (
              <div className="mt-3 rounded-md border border-gray-100 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-gray-500">{t('সর্বশেষ মৃত্তিকা পরীক্ষা', 'Latest Soil Test')}</p>
                <p className="text-gray-700">
                  pH: <strong>{formatNumber(data.soil.ph)}</strong> · {t('নাইট্রোজেন', 'Nitrogen')}: <strong>{formatNumber(data.soil.nitrogen)}</strong> · 
                  {t('ফসফরাস', 'Phosphorus')}: <strong>{formatNumber(data.soil.phosphorus)}</strong> · {t('পটাশ', 'Potassium')}: <strong>{formatNumber(data.soil.potassium)}</strong>
                </p>
              </div>
            )}
          </Card>

          <Card title={t('সেচ পরামর্শ', 'Irrigation Advisories')}>
            <ul className="space-y-2">
              {data.irrigation.map((item, i) => (
                <li key={i} className="flex items-start gap-2 rounded-md border border-gray-100 bg-sky-50 p-3 text-sm">
                  <span className="mt-0.5 flex-shrink-0"><Droplets className="h-4 w-4 text-sky-500" /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {data.weather && (
              <div className="mt-3 rounded-md border border-gray-100 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-gray-500">{t('বর্তমান আবহাওয়া', 'Current Weather')}</p>
                <p className="text-gray-700">
                  {data.weather.condition} · {formatNumber(data.weather.temperature_c)}°C · 
                  {t('আর্দ্রতা', 'Humidity')} {data.weather.humidity}% · {t('বৃষ্টি', 'Rainfall')} {formatNumber(data.weather.rainfall_mm)} mm
                </p>
              </div>
            )}
          </Card>

          {data.crop && (
            <Card title={t('বর্তমান ফসল', 'Current Crop')} className="lg:col-span-2">
              <p className="text-sm text-gray-700">
                <strong>{data.crop.name}</strong> {data.crop.variety && `(${data.crop.variety})`} · {t('মৌসুম:', 'Season:')} {data.crop.season || '—'} · 
                {t('রোপণ:', 'Planting:')} {data.crop.planting_date || '—'}
                {data.crop.care_notes && <> · {t('যত্ন:', 'Care:')} {data.crop.care_notes}</>}
              </p>
            </Card>
          )}

          {!data.crop && (
            <Card title={t('বর্তমান ফসল', 'Current Crop')} className="lg:col-span-2">
              <EmptyState title={t('এই জমিতে চলমান ফসল নেই', 'No ongoing crop on this land')} description={t('ফসল মডিউল থেকে ফসল যোগ করলে সেচ ও সার পরামর্শ আরও নির্ভুল হবে', 'Adding a crop from the Crop module will improve irrigation and fertilizer accuracy')} />
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
