import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Input, Select, Field, Modal, Badge, Spinner, EmptyState, ErrorAlert, EditDeleteButtons } from '../components/ui.jsx';
import { CloudSun, CloudRain, Cloudy, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber, formatDate } from '../components/utils.js';
import { DIVISIONS, DISTRICTS } from '../i18n/locations.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

function ConditionIcon({ condition, size = 'md' }) {
  const s = condition || '';
  const sizeClass = size === 'lg' ? 'h-12 w-12' : 'h-6 w-6 text-2xl';
  const Icon = s.includes('বৃষ্টি') ? CloudRain : s.includes('মেঘ') ? Cloudy : s.includes('রোদ') ? Sun : CloudSun;
  return <Icon className={sizeClass} />;
}

export default function Weather() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const canManage = user.role === 'OFFICER' || user.role === 'ADMIN';
  const [division, setDivision] = useState(user.division || 'ঢাকা');
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ division, district: '', record_date: '', condition: '', temperature_c: '', humidity: '', wind_kph: '', rainfall_mm: '' });

  const emptyForm = () => ({ division, district: '', record_date: '', condition: '', temperature_c: '', humidity: '', wind_kph: '', rainfall_mm: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nowRes, fcRes, recRes] = await Promise.all([
        api.get('/weather/now', { params: { division } }),
        api.get('/weather/forecast', { params: { division, days: 7 } }),
        api.get('/weather', { params: { division } }),
      ]);
      setCurrent(nowRes.data.current);
      setForecast(fcRes.data.forecast);
      setRecords(recRes.data.records);
    } catch (err) {
      setError(err.response?.data?.error || t('আবহাওয়া লোড করা যায়নি', 'Could not load weather'));
    } finally {
      setLoading(false);
    }
  }, [division, t]);

  useEffect(() => {
    load();
  }, [load]);

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/weather/${editing}`, form);
      } else {
        await api.post('/weather', form);
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm());
      load();
      toast.success(editing ? t('রেকর্ড হালনাগাদ হয়েছে', 'Record updated') : t('রেকর্ড সংরক্ষিত হয়েছে', 'Record saved'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('সংরক্ষণ ব্যর্থ', 'Save failed'));
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(r) {
    setEditing(r.id);
    setForm({
      division: r.division,
      district: r.district || '',
      record_date: r.record_date?.slice(0, 10) || '',
      condition: r.condition || '',
      temperature_c: r.temperature_c,
      humidity: r.humidity,
      wind_kph: r.wind_kph,
      rainfall_mm: r.rainfall_mm,
    });
    setOpen(true);
  }

  async function remove(id) {
    if (!window.confirm(t('রেকর্ড মুছে ফেলবেন?', 'Delete record?'))) return;
    try {
      await api.delete(`/weather/${id}`);
      load();
      toast.success(t('রেকর্ড মুছে ফেলা হয়েছে', 'Record deleted'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('মুছে ফেলা যায়নি', 'Could not delete'));
    }
  }

  return (
    <div>
      <PageHeader
        icon={CloudSun}
        tone="blue"
        title={t('আবহাওয়া তথ্য', 'Weather Info')}
        subtitle={t('বিভাগ অনুযায়ী বর্তমান আবহাওয়া ও ৭ দিনের পূর্বাভাস', 'Current weather and 7-day forecast by division')}
        actions={canManage ? <Button onClick={openAdd}>+ {t('ম্যানুয়াল রেকর্ড', 'Manual Record')}</Button> : null}
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('বিভাগ', 'Division')}>
            <Select value={division} onChange={(e) => setDivision(e.target.value)}>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          {division && (
            <Field label={t('জেলা', 'District')}>
              <Select value={form.district} onChange={set('district')}>
                <option value="">{t('সব জেলা', 'All districts')}</option>
                {(DISTRICTS[division] || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={load} />}
      {loading ? (
        <Spinner label={t('আবহাওয়া লোড হচ্ছে...', 'Loading weather...')} />
      ) : (
        <div className="space-y-4">
          {current && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card title={`${t('বর্তমান আবহাওয়া', 'Current Weather')} — ${division}`} className="lg:col-span-1">
                <div className="flex items-center gap-4">
                  <span className="flex-shrink-0"><ConditionIcon condition={current.condition} size="lg" /></span>
                  <div>
                    <p className="text-3xl font-bold">{formatNumber(current.temperature_c)}°C</p>
                    <p className="text-gray-600">{current.condition}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded bg-sky-50 p-2">
                    <p className="text-xs text-gray-500">{t('আর্দ্রতা', 'Humidity')}</p>
                    <p className="font-semibold">{current.humidity}%</p>
                  </div>
                  <div className="rounded bg-sky-50 p-2">
                    <p className="text-xs text-gray-500">{t('বায়ু', 'Wind')}</p>
                    <p className="font-semibold">{formatNumber(current.wind_kph)} km/h</p>
                  </div>
                  <div className="rounded bg-sky-50 p-2">
                    <p className="text-xs text-gray-500">{t('বৃষ্টি', 'Rain')}</p>
                    <p className="font-semibold">{formatNumber(current.rainfall_mm)} mm</p>
                  </div>
                </div>
              </Card>

              <Card title={t('৭ দিনের পূর্বাভাস', '7-Day Forecast')} className="lg:col-span-2">
                {forecast.length === 0 ? (
                  <EmptyState title={t('পূর্বাভাস নেই', 'No forecast')} />
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                    {forecast.map((f) => (
                      <div key={f.date} className="rounded-md border border-gray-100 bg-gray-50 p-2 text-center">
                        <p className="text-xs font-medium text-gray-500">{formatDate(f.date)}</p>
                        <p className="my-1 flex justify-center"><ConditionIcon condition={f.condition} /></p>
                        <p className="text-sm font-bold">{formatNumber(f.temperature_c)}°C</p>
                        <p className="text-[10px] text-gray-500">{t('বৃষ্টি', 'Rain')} {formatNumber(f.rainfall_mm, 0)}mm</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          <Card title={t('সংরক্ষিত আবহাওয়া রেকর্ড', 'Saved Weather Records')} actions={<Badge tone="blue">{records.length}{t('টি', '')}</Badge>}>
            {records.length === 0 ? (
              <EmptyState title={t('কোনো রেকর্ড নেই', 'No records')} description={canManage ? t('ম্যানুয়াল রেকর্ড যোগ করুন', 'Add a manual record') : t('কর্মকর্তারা ম্যানুয়াল রেকর্ড যোগ করতে পারবেন', 'Officers can add manual records')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs text-gray-500">
                    <tr>
                      <th className="py-2 pr-3">{t('তারিখ', 'Date')}</th>
                      <th className="py-2 pr-3">{t('বিভাগ/জেলা', 'Division/District')}</th>
                      <th className="py-2 pr-3">{t('অবস্থা', 'Condition')}</th>
                      <th className="py-2 pr-3">{t('তাপ (°C)', 'Temp (°C)')}</th>
                      <th className="py-2 pr-3">{t('আর্দ্রতা', 'Humidity')}</th>
                      <th className="py-2 pr-3">{t('বৃষ্টি (mm)', 'Rain (mm)')}</th>
                      <th className="py-2">{t('উৎস', 'Source')}</th>
                      {canManage && <th className="py-2">{t('কাজ', 'Action')}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-3 text-gray-600">{formatDate(r.record_date)}</td>
                        <td className="py-2 pr-3">{r.division}{r.district ? ` / ${r.district}` : ''}</td>
                        <td className="py-2 pr-3">{r.condition || '—'}</td>
                        <td className="py-2 pr-3">{formatNumber(r.temperature_c)}</td>
                        <td className="py-2 pr-3">{r.humidity != null ? `${r.humidity}%` : '—'}</td>
                        <td className="py-2 pr-3">{formatNumber(r.rainfall_mm)}</td>
                        <td className="py-2 pr-3"><Badge tone={r.source === 'manual' ? 'amber' : 'blue'}>{r.source === 'manual' ? t('ম্যানুয়াল', 'Manual') : r.source}</Badge></td>
                        {canManage && (
                          <td className="py-2">
                            <EditDeleteButtons onEdit={() => openEdit(r)} onDelete={() => remove(r.id)} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? t('আবহাওয়া রেকর্ড সম্পাদনা', 'Edit Weather Record') : t('আবহাওয়া রেকর্ড যোগ করুন', 'Add Weather Record')}>
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('বিভাগ', 'Division')}>
            <Select value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('জেলা', 'District')}>
            <Select value={form.district} onChange={set('district')}>
              <option value="">{t('— নির্বাচন করুন —', '— Select —')}</option>
              {(DISTRICTS[form.division] || []).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('তারিখ', 'Date')}>
            <Input type="date" value={form.record_date} onChange={set('record_date')} />
          </Field>
          <Field label={t('অবস্থা', 'Condition')}>
            <Select value={form.condition} onChange={set('condition')}>
              <option value="">{t('— নির্বাচন করুন —', '— Select —')}</option>
              <option value="রোদেলা">{t('রোদেলা', 'Sunny')}</option>
              <option value="আংশিক মেঘলা">{t('আংশিক মেঘলা', 'Partly Cloudy')}</option>
              <option value="মেঘলা">{t('মেঘলা', 'Cloudy')}</option>
              <option value="বৃষ্টি">{t('বৃষ্টি', 'Rain')}</option>
              <option value="মুষলধারে বৃষ্টি">{t('মুষলধারে বৃষ্টি', 'Heavy Rain')}</option>
            </Select>
          </Field>
          <Field label={t('তাপমাত্রা (°C)', 'Temperature (°C)')}>
            <Input type="number" step="0.1" value={form.temperature_c} onChange={set('temperature_c')} />
          </Field>
          <Field label={t('আর্দ্রতা (%)', 'Humidity (%)')}>
            <Input type="number" min="0" max="100" value={form.humidity} onChange={set('humidity')} />
          </Field>
          <Field label={t('বায়ু (km/h)', 'Wind (km/h)')}>
            <Input type="number" step="0.1" value={form.wind_kph} onChange={set('wind_kph')} />
          </Field>
          <Field label={t('বৃষ্টি (mm)', 'Rain (mm)')}>
            <Input type="number" step="0.1" value={form.rainfall_mm} onChange={set('rainfall_mm')} />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
            <Button type="submit">{t('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
