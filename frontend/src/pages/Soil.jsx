import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { PageHeader, Card, Button, Input, Select, Field, Modal, Badge, Spinner, EmptyState, ErrorAlert, EditDeleteButtons } from '../components/ui.jsx';
import { FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber, formatDate } from '../components/utils.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const emptyForm = { land_id: '', tested_at: '', ph: '', nitrogen: '', phosphorus: '', potassium: '', organic_matter: '', recommendation: '' };

export default function Soil() {
  const { t } = useLanguage();
  const [tests, setTests] = useState([]);
  const [lands, setLands] = useState([]);
  const [landFilter, setLandFilter] = useState('');
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
      const res = await api.get('/soil', { params: { land_id: landFilter || undefined } });
      setTests(res.data.tests);
      const lRes = await api.get('/lands');
      setLands(lRes.data.lands);
    } catch (err) {
      setError(err.response?.data?.error || t('মৃত্তিকা পরীক্ষা লোড করা যায়নি', 'Could not load soil tests'));
    } finally {
      setLoading(false);
    }
  }, [landFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, land_id: landFilter || lands[0]?.id || '' });
    setOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    setForm({
      land_id: t.land_id,
      tested_at: t.tested_at ? t.tested_at.slice(0, 10) : '',
      ph: t.ph ?? '',
      nitrogen: t.nitrogen ?? '',
      phosphorus: t.phosphorus ?? '',
      potassium: t.potassium ?? '',
      organic_matter: t.organic_matter ?? '',
      recommendation: t.recommendation || '',
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
        await api.patch(`/soil/${editing.id}`, form);
      } else {
        await api.post('/soil', form);
      }
      setOpen(false);
      load();
      toast.success(editing ? t('পরীক্ষা হালনাগাদ হয়েছে', 'Test updated') : t('নতুন পরীক্ষা সংরক্ষিত হয়েছে', 'New test saved'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('সংরক্ষণ ব্যর্থ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(t) {
    if (!window.confirm(t('মৃত্তিকা পরীক্ষা মুছে ফেলবেন?', 'Delete this soil test?'))) return;
    try {
      await api.delete(`/soil/${t.id}`);
      load();
      toast.success(t('পরীক্ষা মুছে ফেলা হয়েছে', 'Test deleted'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('মুছে ফেলা যায়নি', 'Could not delete'));
    }
  }

  function phTone(ph) {
    if (ph == null) return 'gray';
    const v = Number(ph);
    if (v >= 5.5 && v <= 7.0) return 'green';
    if (v < 5.0 || v > 7.5) return 'red';
    return 'amber';
  }

  return (
    <div>
      <PageHeader
        icon={FlaskConical}
        tone="indigo"
        title={t('মৃত্তিকা পরীক্ষা', 'Soil Test')}
        subtitle={t('মাটির pH ও পুষ্টি উপাদান বিশ্লেষণ', 'Soil pH & nutrient analysis')}
        actions={<Button onClick={openNew}>+ {t('নতুন পরীক্ষা', 'New Test')}</Button>}
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('জমি অনুযায়ী ফিল্টার', 'Filter by Land')}>
            <Select value={landFilter} onChange={(e) => setLandFilter(e.target.value)}>
              <option value="">{t('সব জমি', 'All Lands')}</option>
              {lands.map((l) => (
                <option key={l.id} value={l.id}>{l.label} ({l.farmer_name})</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={load} />}
      {loading ? (
        <Spinner label={t('মৃত্তিকা পরীক্ষা লোড হচ্ছে...', 'Loading soil tests...')} />
      ) : tests.length === 0 ? (
        <Card><EmptyState title={t('কোনো পরীক্ষা নেই', 'No tests yet')} /></Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('জমি', 'Land')}</th>
                <th className="px-4 py-3">{t('তারিখ', 'Date')}</th>
                <th className="px-4 py-3">pH</th>
                <th className="px-4 py-3">{t('নাইট্রোজেন', 'Nitrogen')}</th>
                <th className="px-4 py-3">{t('ফসফরাস', 'Phosphorus')}</th>
                <th className="px-4 py-3">{t('পটাশ', 'Potassium')}</th>
                <th className="px-4 py-3">{t('জৈব পদার্থ', 'Organic Matter')}</th>
                <th className="px-4 py-3">{t('সুপারিশ', 'Recommendation')}</th>
                <th className="px-4 py-3">{t('কাজ', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tests.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.land_label} <span className="text-xs text-gray-500">({t.farmer_name})</span></td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(t.tested_at)}</td>
                  <td className="px-4 py-3"><Badge tone={phTone(t.ph)}>{t.ph != null ? formatNumber(t.ph) : '—'}</Badge></td>
                  <td className="px-4 py-3">{formatNumber(t.nitrogen)}</td>
                  <td className="px-4 py-3">{formatNumber(t.phosphorus)}</td>
                  <td className="px-4 py-3">{formatNumber(t.potassium)}</td>
                  <td className="px-4 py-3">{formatNumber(t.organic_matter)}%</td>
                  <td className="max-w-xs px-4 py-3 text-gray-600">{t.recommendation || '—'}</td>
                  <td className="px-4 py-3">
                    <EditDeleteButtons onEdit={() => openEdit(t)} onDelete={() => remove(t)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('পরীক্ষা সম্পাদনা', 'Edit Test') : t('নতুন মৃত্তিকা পরীক্ষা', 'New Soil Test')} wide>
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('জমি', 'Land')} className="sm:col-span-2">
            <Select value={form.land_id} onChange={set('land_id')} required>
              <option value="">— {t('জমি নির্বাচন করুন', 'Select land')} —</option>
              {lands.map((l) => (
                <option key={l.id} value={l.id}>{l.label} ({l.farmer_name})</option>
              ))}
            </Select>
          </Field>
          <Field label={t('পরীক্ষার তারিখ', 'Test Date')}>
            <Input type="date" value={form.tested_at} onChange={set('tested_at')} />
          </Field>
          <Field label="pH">
            <Input type="number" step="0.01" value={form.ph} onChange={set('ph')} />
          </Field>
          <Field label={t('নাইট্রোজেন', 'Nitrogen')}>
            <Input type="number" step="0.01" value={form.nitrogen} onChange={set('nitrogen')} />
          </Field>
          <Field label={t('ফসফরাস', 'Phosphorus')}>
            <Input type="number" step="0.01" value={form.phosphorus} onChange={set('phosphorus')} />
          </Field>
          <Field label={t('পটাশিয়াম', 'Potassium')}>
            <Input type="number" step="0.01" value={form.potassium} onChange={set('potassium')} />
          </Field>
          <Field label={t('জৈব পদার্থ (%)', 'Organic Matter (%)')}>
            <Input type="number" step="0.01" value={form.organic_matter} onChange={set('organic_matter')} />
          </Field>
          <Field label={t('সুপারিশ', 'Recommendation')} className="sm:col-span-2">
            <Input value={form.recommendation} onChange={set('recommendation')} placeholder={t('যেমন: ইউরিয়া সার প্রয়োগ করুন', 'e.g. Apply urea fertilizer')} />
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
