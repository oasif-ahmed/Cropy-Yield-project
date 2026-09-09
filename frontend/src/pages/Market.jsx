import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { PageHeader, Card, Button, Input, Select, Field, Modal, Badge, Spinner, EmptyState, ErrorAlert, EditDeleteButtons } from '../components/ui.jsx';
import { Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { formatTaka, formatDate } from '../components/utils.js';
import { CROP_OPTIONS, DISTRICTS } from '../i18n/locations.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const emptyForm = { crop_name: 'ধান', district: '', unit: 'kg', price: '', price_date: '' };

export default function Market() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const canManage = user.role === 'OFFICER' || user.role === 'ADMIN';
  const [prices, setPrices] = useState([]);
  const [history, setHistory] = useState([]);
  const [chartCrop, setChartCrop] = useState('ধান');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allRes, histRes] = await Promise.all([
        api.get('/market'),
        api.get('/market/history', { params: { crop_name: chartCrop } }),
      ]);
      setPrices(allRes.data.prices);
      setHistory(histRes.data.history);
    } catch (err) {
      setError(err.response?.data?.error || t('বাজারদর লোড করা যায়নি', 'Failed to load market prices'));
    } finally {
      setLoading(false);
    }
  }, [chartCrop, t]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      crop_name: p.crop_name || 'ধান',
      district: p.district || '',
      unit: p.unit || 'kg',
      price: p.price ?? '',
      price_date: p.price_date ? p.price_date.slice(0, 10) : '',
    });
    setOpen(true);
  }

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/market/${editing.id}`, form);
      } else {
        await api.post('/market', form);
      }
      setOpen(false);
      load();
      toast.success(editing ? t('দর হালনাগাদ হয়েছে', 'Price updated') : t('নতুন দর সংরক্ষিত হয়েছে', 'New price saved'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('সংরক্ষণ ব্যর্থ', 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(t('দর মুছে ফেলবেন?', 'Delete this price?'))) return;
    try {
      await api.delete(`/market/${p.id}`);
      load();
      toast.success(t('দর মুছে ফেলা হয়েছে', 'Price deleted'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('মুছে ফেলা যায়নি', 'Could not delete'));
    }
  }

  const chartData = history.map((h) => ({ name: h.price_date.slice(5), price: Number(h.price), district: h.district }));

  return (
    <div>
      <PageHeader
        icon={Banknote}
        tone="amber"
        title={t('বাজারদর', 'Market Prices')}
        subtitle={t('ফসলের বর্তমান ও ঐতিহাসিক বাজারদর', 'Current and historical crop market prices')}
        actions={canManage ? <Button onClick={openNew}>{t('+ নতুন দর', '+ New Price')}</Button> : null}
      />

      {error && <ErrorAlert message={error} onRetry={load} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title={t('সর্বশেষ দর', 'Latest Prices')} className="lg:col-span-1" actions={canManage ? <Badge tone="green">{`${prices.length}${t('টি', '')}`}</Badge> : null}>
          {loading ? (
            <Spinner />
          ) : prices.length === 0 ? (
            <EmptyState title={t('কোনো দর নেই', 'No prices yet')} />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs text-gray-500">
                  <tr>
                    <th className="py-2 pr-2">{t('ফসল', 'Crop')}</th>
                    <th className="py-2 pr-2">{t('জেলা', 'District')}</th>
                    <th className="py-2 pr-2">{t('দর', 'Price')}</th>
                    <th className="py-2 pr-2">{t('তারিখ', 'Date')}</th>
                    {canManage && <th className="py-2">{t('কাজ', 'Actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prices.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-2 font-medium">{p.crop_name}</td>
                      <td className="py-2 pr-2 text-gray-600">{p.district || '—'}</td>
                      <td className="py-2 pr-2 font-semibold text-emerald-700">{formatTaka(p.price)}/{p.unit}</td>
                      <td className="py-2 pr-2 text-gray-500">{formatDate(p.price_date)}</td>
                      {canManage && (
                        <td className="py-2">
                          <EditDeleteButtons onEdit={() => openEdit(p)} onDelete={() => remove(p)} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={t('দর প্রবণতা (ইতিহাস)', 'Price Trend (History)')} className="lg:col-span-2">
          <div className="mb-3 max-w-xs">
            <Field label={t('ফসল', 'Crop')}>
              <Select value={chartCrop} onChange={(e) => setChartCrop(e.target.value)}>
                {CROP_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="price" name={t('দর (টাকা)', 'Price (Tk)')} stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title={t(`${chartCrop}-এর জন্য কোনো দর ইতিহাস নেই`, `No price history for ${chartCrop}`)} />
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('দর সম্পাদনা', 'Edit Price') : t('নতুন বাজারদর', 'New Market Price')}>
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('ফসল', 'Crop')}>
            <Select value={form.crop_name} onChange={set('crop_name')}>
              {CROP_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('জেলা', 'District')}>
            <Select value={form.district} onChange={set('district')}>
              <option value="">{t('— নির্বাচন করুন —', '— Select —')}</option>
              {Object.values(DISTRICTS).flat().map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('দর (টাকা)', 'Price (Tk)')}>
            <Input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
          </Field>
          <Field label={t('একক', 'Unit')}>
            <Select value={form.unit} onChange={set('unit')}>
              <option value="kg">{t('কেজি', 'kg')}</option>
              <option value="মন">{t('মন', 'Mon')}</option>
              <option value="কুইন্টাল">{t('কুইন্টাল', 'Quintal')}</option>
            </Select>
          </Field>
          <Field label={t('তারিখ', 'Date')} className="sm:col-span-2">
            <Input type="date" value={form.price_date} onChange={set('price_date')} />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
