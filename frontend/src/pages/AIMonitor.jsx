import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { PageHeader, Card, Badge, Spinner, ErrorAlert, EmptyState } from '../components/ui.jsx';
import { BrainCircuit, TrendingUp, ScanSearch, Sprout, GraduationCap } from 'lucide-react';

function formatTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('bn-BD');
}

export default function AIMonitor() {
  const { t } = useLanguage();
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [hRes, sRes, pRes] = await Promise.all([
        api.get('/ai/health'),
        api.get('/ai/summary'),
        api.get('/ai/predictions'),
      ]);
      setHealth(hRes.data);
      setSummary(sRes.data.summary);
      setPredictions(pRes.data.predictions);
    } catch (err) {
      setError(err.response?.data?.error || t('AI মনিটরিং লোড করা যায়নি', 'Could not load AI monitoring'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader icon={BrainCircuit} tone="violet" title={t('AI মনিটরিং', 'AI Monitoring')} subtitle={t('মেশিন লার্নিং সার্ভিস ও পূর্বাভাসের লগ', 'Machine learning service and prediction logs')} />

      {error && <ErrorAlert message={error} onRetry={load} />}
      {loading ? (
        <Spinner label={t('AI তথ্য লোড হচ্ছে...', 'Loading AI data...')} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title={t('ML সার্ভিস', 'ML Service')}>
              {health ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${health.reachable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="font-medium">{health.reachable ? t('সক্রিয়', 'Reachable') : t('অসংলগ্ন', 'Unreachable')}</span>
                  </div>
                  {health.status && <p className="text-sm text-gray-600">Status: {health.status}</p>}
                  {health.service && <p className="text-sm text-gray-600">Service: {health.service}</p>}
                  {health.reason && <p className="text-sm text-amber-600">{health.reason}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('তথ্য নেই', 'No data')}</p>
              )}
            </Card>

            <Card title={t('মডেল ব্যবহার', 'Model Usage')}>
              {summary.length === 0 ? (
                <EmptyState title={t('কোনো পূর্বাভাস নেই', 'No predictions yet')} description={t('সিস্টেম ব্যবহার করলে এখানে লগ দেখা যাবে', 'Logs will appear here once the system is used')} />
              ) : (
                <ul className="space-y-2">
                  {summary.map((s) => (
                    <li key={s.model_type} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                      <span className="font-medium">{s.model_type}</span>
                      <div className="text-right text-xs text-gray-500">
                        <p>{s.count}{t('টি পূর্বাভাস', ' predictions')}</p>
                        <p>{t('গড় আস্থা:', 'Avg confidence:')} {s.avg_confidence != null ? `${s.avg_confidence}%` : '—'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title={t('AI ক্ষমতাসমূহ', 'AI Capabilities')}>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2.5 rounded-md bg-emerald-50 px-3 py-2.5">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold">{t('ফলন পূর্বাভাস', 'Yield Prediction')}</p>
                    <p className="text-xs text-gray-600">{t('মেশিন লার্নিং মডেল দিয়ে ফলন অনুমান', 'Yield estimation via machine learning models')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-md bg-sky-50 px-3 py-2.5">
                  <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <div>
                    <p className="font-semibold">{t('রোগ শনাক্তকরণ', 'Disease Detection')}</p>
                    <p className="text-xs text-gray-600">{t('ছবি বিশ্লেষণের মাধ্যমে রোগ চেনা', 'Identify diseases through image analysis')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-md bg-amber-50 px-3 py-2.5">
                  <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">{t('ফসল সুপারিশ', 'Crop Recommendation')}</p>
                    <p className="text-xs text-gray-600">{t('নলেজ বেস ও ML দিয়ে সেরা ফসল বাছাই', 'Best crop selection via knowledge base and ML')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-md bg-indigo-50 px-3 py-2.5">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <div>
                    <p className="font-semibold">{t('মডেল প্রশিক্ষণ', 'Model Training')}</p>
                    <p className="text-xs text-gray-600">{t('নতুন তথ্যে মডেল হালনাগাদ করা হয়', 'Models are retrained as new data accumulates')}</p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>

          <Card title={t('সাম্প্রতিক AI পূর্বাভাস', 'Recent AI Predictions')}>
            {predictions.length === 0 ? (
              <EmptyState title={t('কোনো লগ নেই', 'No logs yet')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                      <th className="py-2 pr-2">{t('সময়', 'Time')}</th>
                      <th className="py-2 pr-2">{t('মডেল', 'Model')}</th>
                      <th className="py-2 pr-2">{t('ধরন', 'Type')}</th>
                      <th className="py-2 pr-2">{t('পূর্বাভাস', 'Prediction')}</th>
                      <th className="py-2">{t('আস্থা', 'Confidence')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-2 whitespace-nowrap text-xs text-gray-500">{formatTime(p.created_at)}</td>
                        <td className="py-2 pr-2"><Badge tone="indigo">{p.model_type}</Badge></td>
                        <td className="py-2 pr-2 text-xs">{p.entity_type}</td>
                        <td className="py-2 pr-2 text-xs">
                          {(() => {
                            try {
                              const pred = typeof p.prediction === 'string' ? JSON.parse(p.prediction) : p.prediction;
                              if (p.model_type === 'yield') return `${pred.per_bigha_kg} ${t('কেজি/বিঘা', 'kg/bigha')}`;
                              if (p.model_type === 'disease') return pred.disease_name;
                              if (p.model_type === 'recommendation') return pred.recommendations?.[0]?.crop_name;
                              return JSON.stringify(pred).slice(0, 60);
                            } catch { return '—'; }
                          })()}
                        </td>
                        <td className="py-2 text-xs">{p.confidence_pct != null ? `${p.confidence_pct}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
