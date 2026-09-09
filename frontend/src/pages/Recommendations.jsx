import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { PageHeader, Card, Badge, Spinner, EmptyState, ErrorAlert, Select, Field } from '../components/ui.jsx';
import { Sparkles } from 'lucide-react';
import { formatNumber } from '../components/utils.js';

function ScoreBar({ score }) {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
    </div>
  );
}

export default function Recommendations() {
  const { t } = useLanguage();
  const [lands, setLands] = useState([]);
  const [landId, setLandId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRec, setLoadingRec] = useState(false);
  const [error, setError] = useState('');

  const loadLands = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/lands');
      setLands(res.data.lands);
    } catch (err) {
      setError(err.response?.data?.error || t('জমি লোড করা যায়নি', 'Could not load lands'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadLands();
  }, [loadLands]);

  async function fetchRecommendations(id) {
    setLandId(id);
    setLoadingRec(true);
    setData(null);
    setError('');
    try {
      const res = await api.get(`/recommendations?land_id=${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('সুপারিশ লোড করা যায়নি', 'Could not load recommendations'));
    } finally {
      setLoadingRec(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={Sparkles}
        tone="violet"
        title={t('AI ফসল সুপারিশ', 'AI Crop Recommendations')}
        subtitle={t('মাটির অবস্থা ও আবহাওয়ার ভিত্তিতে কোন ফসল চাষ করবেন', 'Which crops to grow based on soil and weather conditions')}
      />

      {error && <ErrorAlert message={error} onRetry={() => landId ? fetchRecommendations(landId) : loadLands()} />}

      <div className="mb-4 max-w-md">
        <Field label={t('জমি নির্বাচন করুন', 'Select a land')}>
          <Select value={landId} onChange={(e) => fetchRecommendations(e.target.value)}>
            <option value="">— {t('জমি নির্বাচন করুন', 'Select a land')} —</option>
            {lands.map((l) => (
              <option key={l.id} value={l.id}>{l.label} ({formatNumber(l.area_bigha)} {t('বিঘা', 'bigha')})</option>
            ))}
          </Select>
        </Field>
      </div>

      {loading ? (
        <Spinner label={t('জমি লোড হচ্ছে...', 'Loading lands...')} />
      ) : lands.length === 0 ? (
        <EmptyState title={t('কোনো জমি নেই', 'No lands found')} description={t('জমি মডিউল থেকে জমি যোগ করুন', 'Add a land from the Land module')} />
      ) : loadingRec ? (
        <Spinner label={t('AI ফসল সুপারিশ বিশ্লেষণ হচ্ছে...', 'AI crop recommendation analysis in progress...')} />
      ) : data ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge tone={data.method === 'knowledge_base' ? 'indigo' : 'blue'}>
              {data.method === 'ml' ? `🤖 ${t('ML মডেল', 'ML Model')}` : data.method === 'knowledge_base' ? `📚 ${t('নলেজ বেস', 'Knowledge Base')}` : `📝 ${t('সূত্রভিত্তিক', 'Rule-based')}`}
            </Badge>
            <p className="text-xs text-gray-500">
              {t('মাটি:', 'Soil:')} {data.soil ? `pH ${data.soil.ph ?? '—'}, N ${data.soil.nitrogen ?? '—'}, P ${data.soil.phosphorus ?? '—'}, K ${data.soil.potassium ?? '—'}` : t('মৃত্তিকা পরীক্ষা নেই', 'No soil test data')}
            </p>
            {data.weather && (
              <p className="text-xs text-gray-500">· {t('আবহাওয়া:', 'Weather:')} {data.weather.condition} {data.weather.temperature_c}°C</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.recommendations.slice(0, 3).map((rec, idx) => (
              <Card key={rec.crop_name} className={idx === 0 ? 'ring-2 ring-emerald-400' : ''}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{idx === 0 ? t('🏆 সেরা সুপারিশ', '🏆 Best Recommendation') : `${t('সুপারিশ', 'Recommendation')} ${idx + 1}`}</p>
                    <p className="mt-1 text-xl font-bold text-emerald-800">{rec.crop_name}</p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{rec.score}%</span>
                </div>
                <div className="mt-3">
                  <ScoreBar score={rec.score} />
                </div>
                {rec.reason && <p className="mt-2 text-sm text-gray-600">{rec.reason}</p>}
                {rec.scores && Object.keys(rec.scores).length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(rec.scores).map(([k, v]) => (
                      <div key={k} className="rounded bg-gray-50 px-2 py-1">
                        <span className="text-gray-500">{k}:</span> <span className="font-medium">{v}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title={t('সুপারিশের জন্য একটি জমি নির্বাচন করুন', 'Select a land to see recommendations')} />
      )}
    </div>
  );
}
