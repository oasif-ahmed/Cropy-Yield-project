import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { PageHeader, Card, Badge, Spinner, EmptyState, ErrorAlert } from '../components/ui.jsx';
import { TrendingUp } from 'lucide-react';
import { formatNumber, formatTaka, CROP_STATUS_TONES, CROP_STATUS_LABELS } from '../components/utils.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

function ForecastDetail({ forecast, crop }) {
  const isAI = forecast.method === 'ai';
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className={`rounded-md border p-4 ${isAI ? 'border-indigo-200 bg-indigo-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isAI ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
            {isAI ? '🤖 AI' : t('📝 সূত্রভিত্তিক', '📝 Formula-based')}
          </span>
          <span className="text-xs font-semibold text-gray-700">{forecast.model}</span>
        </div>
        <p className="mt-2 text-xs font-semibold text-emerald-700">{t('ফলন পূর্বাভাসের আস্থা:', 'Yield forecast confidence:')} {forecast.confidence}</p>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">{t('প্রতি বিঘা ফলন', 'Yield per bigha')}</p>
            <p className="text-lg font-bold">{formatNumber(forecast.perBighaKg)} {t('কেজি', 'kg')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('মোট ফলন', 'Total yield')}</p>
            <p className="text-lg font-bold">{formatNumber(forecast.totalKg)} {t('কেজি', 'kg')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('জমি', 'Land')}</p>
            <p className="text-lg font-bold">{formatNumber(forecast.areaBigha)} {t('বিঘা', 'bigha')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('বাজারদর', 'Market price')}</p>
            <p className="text-lg font-bold">{forecast.unitPrice ? `${formatTaka(forecast.unitPrice)}/kg` : '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t('আনুমানিক খরচ', 'Estimated cost')}</p>
          <p className="font-semibold text-rose-600">{formatTaka(forecast.estimatedCostTaka)}</p>
        </div>
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t('আনুমানিক আয়', 'Estimated revenue')}</p>
          <p className="font-semibold text-sky-600">{forecast.estimatedRevenueTaka != null ? formatTaka(forecast.estimatedRevenueTaka) : '—'}</p>
        </div>
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t('আনুমানিক লাভ', 'Estimated profit')}</p>
          <p className="font-semibold text-emerald-600">{forecast.estimatedProfitTaka != null ? formatTaka(forecast.estimatedProfitTaka) : '—'}</p>
        </div>
      </div>

      <div className="rounded-md border border-gray-100 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('গণনা উপাদান', 'Calculation Factors')}</p>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-gray-500">{t('বেস ফলন', 'Base yield')}</p>
            <p className="font-medium">{formatNumber(forecast.baseYieldPerBigha)} {t('কেজি/বিঘা', 'kg/bigha')}</p>
          </div>
          <div>
            <p className="text-gray-500">{t('মৌসুম ফ্যাক্টর', 'Season factor')}</p>
            <p className="font-medium">{forecast.seasonFactor}</p>
          </div>
          <div>
            <p className="text-gray-500">{t('মাটি ফ্যাক্টর', 'Soil factor')}</p>
            <p className="font-medium">{forecast.soilFactor}</p>
          </div>
          <div>
            <p className="text-gray-500">{t('আবহাওয়া ফ্যাক্টর', 'Weather factor')}</p>
            <p className="font-medium">{forecast.weatherFactor}</p>
          </div>
        </div>
        {forecast.notes?.map((n) => (
          <p key={n} className="mt-1 text-xs text-gray-500">• {n}</p>
        ))}
      </div>
    </div>
  );
}

export default function Forecast() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const cropId = params.get('crop') || '';
  const [forecasts, setForecasts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/forecast/all');
      setForecasts(res.data.forecasts);
      if (cropId) {
        const found = res.data.forecasts.find((f) => f.crop.id === cropId);
        if (found) setSelected(found);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('পূর্বাভাস লোড করা যায়নি', 'Could not load forecast'));
    } finally {
      setLoading(false);
    }
  }, [cropId, t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function select(id) {
    const found = forecasts.find((f) => f.crop.id === id);
    setSelected(found);
    setParams({ crop: id });
  }

  return (
    <div>
      <PageHeader
        icon={TrendingUp}
        tone="green"
        title={t('ফলন পূর্বাভাস', 'Yield Forecast')}
        subtitle={t('প্রতি ফসলের প্রত্যাশিত ফলন, খরচ ও আয়ের অনুমান', 'Expected yield, cost and revenue estimate for each crop')}
      />

      {error && <ErrorAlert message={error} onRetry={loadAll} />}
      {loading ? (
        <Spinner label={t('পূর্বাভাস লোড হচ্ছে...', 'Loading forecast...')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title={t('ফসল নির্বাচন করুন', 'Select Crop')} className="lg:col-span-1">
            {forecasts.length === 0 ? (
              <EmptyState title={t('কোনো ফসল নেই', 'No crops')} description={t('ফসল মডিউল থেকে ফসল যোগ করুন', 'Add crops from the crop module')} />
            ) : (
              <ul className="space-y-2">
                {forecasts.map(({ crop, forecast }) => (
                  <li key={crop.id}>
                    <button
                      onClick={() => select(crop.id)}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${
                        selected?.crop.id === crop.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{crop.name} {crop.variety && `(${crop.variety})`}</span>
                        <Badge tone={CROP_STATUS_TONES[crop.status]}>{CROP_STATUS_LABELS(crop.status)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {crop.land_label} · {formatNumber(forecast.perBighaKg)} {t('কেজি/বিঘা', 'kg/bigha')} · {t('মোট', 'Total')} {formatNumber(forecast.totalKg)} {t('কেজি', 'kg')}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="lg:col-span-2">
            {selected ? (
              <Card title={`${t('পূর্বাভাস', 'Forecast')} — ${selected.crop.name} ${selected.crop.variety ? `(${selected.crop.variety})` : ''}`}>
                <ForecastDetail forecast={selected.forecast} crop={selected.crop} />
              </Card>
            ) : (
              <Card title={t('পূর্বাভাসের বিবরণ', 'Forecast Details')}>
                <EmptyState title={t('বাম দিক থেকে একটি ফসল নির্বাচন করুন', 'Select a crop from the left')} />
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
