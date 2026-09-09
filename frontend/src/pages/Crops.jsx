import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Input, Select, Field, Modal, Badge, Spinner, EmptyState, ErrorAlert, EditDeleteButtons } from '../components/ui.jsx';
import { Sprout } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, CROP_STATUS_LABELS, CROP_STATUS_TONES } from '../components/utils.js';
import { CROP_OPTIONS, SEASONS } from '../i18n/locations.js';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const CROP_OPTIONS_EN = { 'ধান': 'Rice', 'গম': 'Wheat', 'ভুট্টা': 'Maize', 'আলু': 'Potato', 'পাট': 'Jute', 'সরিষা': 'Mustard', 'চা': 'Tea', 'টমেটো': 'Tomato', 'পেঁয়াজ': 'Onion', 'রসুন': 'Garlic', 'কাঁচা মরিচ': 'Green Chili', 'বেগুন': 'Eggplant', 'লাউ': 'Gourd', 'অন্যান্য': 'Other' };
const SEASONS_EN = { 'বোরো': 'Boro', 'আমন': 'Aman', 'আউশ': 'Aus', 'রবি': 'Rabi', 'খরিপ': 'Kharip', 'বারোমাসি': 'Baromasi' };

const emptyForm = { land_id: '', name: 'ধান', variety: '', season: '', planting_date: '', expected_harvest_date: '', status: 'GROWING', care_notes: '' };
const emptyHarvest = { total_quantity_kg: '', cost_taka: '', revenue_taka: '', harvested_at: '' };

export default function Crops() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isFarmer = user.role === 'FARMER';
  const [crops, setCrops] = useState([]);
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [harvesting, setHarvesting] = useState(null);
  const [harvestForm, setHarvestForm] = useState(emptyHarvest);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/crops', { params: { status: statusFilter || undefined } });
      setCrops(res.data.crops);
      const lRes = await api.get('/lands');
      setLands(lRes.data.lands);
    } catch (err) {
      setError(err.response?.data?.error || t('ফসল লোড করা যায়নি', 'Could not load crops'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, land_id: lands[0]?.id || '' });
    setOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      land_id: c.land_id || '',
      name: c.name || 'ধান',
      variety: c.variety || '',
      season: c.season || '',
      planting_date: c.planting_date ? c.planting_date.slice(0, 10) : '',
      expected_harvest_date: c.expected_harvest_date ? c.expected_harvest_date.slice(0, 10) : '',
      status: c.status || 'GROWING',
      care_notes: c.care_notes || '',
    });
    setOpen(true);
  }

  function openHarvest(c) {
    setHarvesting(c);
    setHarvestForm(emptyHarvest);
  }

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function setH(k) {
    return (e) => setHarvestForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/crops/${editing.id}`, form);
      } else {
        await api.post('/crops', form);
      }
      setOpen(false);
      load();
      toast.success(editing ? t('ফসল হালনাগাদ হয়েছে', 'Crop updated') : t('নতুন ফসল যুক্ত হয়েছে', 'New crop added'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('সংরক্ষণ ব্যর্থ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  async function saveHarvest(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/production', {
        crop_id: harvesting.id,
        land_id: harvesting.land_id,
        ...harvestForm,
      });
      setHarvesting(null);
      load();
      toast.success(t('ফসল কাটা রেকর্ড করা হয়েছে', 'Harvest recorded'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('ফলন রেকর্ড ব্যর্থ', 'Yield record failed'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(t(`${c.name} ফসল মুছে ফেলবেন?`, `Delete ${c.name} crop?`))) return;
    try {
      await api.delete(`/crops/${c.id}`);
      load();
      toast.success(t('ফসল মুছে ফেলা হয়েছে', 'Crop deleted'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('মুছে ফেলা যায়নি', 'Could not delete'));
    }
  }

  return (
    <div>
      <PageHeader
        icon={Sprout}
        tone="green"
        title={t('ফসল ব্যবস্থাপনা', 'Crop Management')}
        subtitle={t('ফসলের চাষাবাদ, সময়সূচি ও ফসল কাটার হিসাব', 'Crop cultivation, schedule & harvest tracking')}
        actions={
          <>
            <Button variant="outline" onClick={() => setStatusFilter(statusFilter ? '' : 'GROWING')}>
              {statusFilter ? t('সব দেখুন', 'Show All') : t('চলমান ফসল', 'Active Crops')}
            </Button>
            <Button onClick={openNew}>+ {t('নতুন ফসল', 'New Crop')}</Button>
          </>
        }
      />

      {error && <ErrorAlert message={error} onRetry={load} />}

      {loading ? (
        <Spinner label={t('ফসল লোড হচ্ছে...', 'Loading crops...')} />
      ) : crops.length === 0 ? (
        <Card><EmptyState title={t('কোনো ফসল পাওয়া যায়নি', 'No crops found')} /></Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('ফসল', 'Crop')}</th>
                <th className="px-4 py-3">{t('জমি', 'Land')}</th>
                <th className="px-4 py-3">{t('কৃষক', 'Farmer')}</th>
                <th className="px-4 py-3">{t('মৌসুম', 'Season')}</th>
                <th className="px-4 py-3">{t('রোপণের তারিখ', 'Planting Date')}</th>
                <th className="px-4 py-3">{t('কাটার তারিখ', 'Harvest Date')}</th>
                <th className="px-4 py-3">{t('স্থিতি', 'Status')}</th>
                <th className="px-4 py-3">{t('কাজ', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {crops.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {c.name} {c.variety && <span className="text-gray-500">({c.variety})</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.land_label || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.farmer_name || '—'}</td>
                  <td className="px-4 py-3">{c.season || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(c.planting_date)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(c.expected_harvest_date)}</td>
                  <td className="px-4 py-3"><Badge tone={CROP_STATUS_TONES[c.status]}>{CROP_STATUS_LABELS(c.status) || c.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {c.status !== 'HARVESTED' && (
                        <button onClick={() => openHarvest(c)} className="font-semibold text-amber-600 hover:underline">{t('ফসল কাটা', 'Harvest')}</button>
                      )}
                      <Link to={`/forecast?crop=${c.id}`} className="font-semibold text-sky-600 hover:underline">{t('পূর্বাভাস', 'Forecast')}</Link>
                      <EditDeleteButtons onEdit={() => openEdit(c)} onDelete={() => remove(c)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('ফসল সম্পাদনা', 'Edit Crop') : t('নতুন ফসল', 'New Crop')} wide>
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('জমি', 'Land')}>
            <Select value={form.land_id} onChange={set('land_id')} required>
              <option value="">— {t('জমি নির্বাচন করুন', 'Select land')} —</option>
              {lands.map((l) => (
                <option key={l.id} value={l.id}>{l.label} ({l.farmer_name})</option>
              ))}
            </Select>
          </Field>
          <Field label={t('ফসলের নাম', 'Crop Name')}>
            <Select value={form.name} onChange={set('name')}>
              {CROP_OPTIONS.map((o) => (
                <option key={o} value={o}>{t(o, CROP_OPTIONS_EN[o] || o)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('জাত (ভ্যারাইটি)', 'Variety')}>
            <Input value={form.variety} onChange={set('variety')} placeholder={t('যেমন: ব্রি ধান-২৯', 'e.g. BRI Rice-29')} />
          </Field>
          <Field label={t('মৌসুম', 'Season')}>
            <Select value={form.season} onChange={set('season')}>
              <option value="">— {t('নির্বাচন করুন', 'Select')} —</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{t(s, SEASONS_EN[s] || s)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('রোপণের তারিখ', 'Planting Date')}>
            <Input type="date" value={form.planting_date} onChange={set('planting_date')} />
          </Field>
          <Field label={t('প্রত্যাশিত কাটার তারিখ', 'Expected Harvest Date')}>
            <Input type="date" value={form.expected_harvest_date} onChange={set('expected_harvest_date')} />
          </Field>
          <Field label={t('যত্নের নোট', 'Care Notes')} className="sm:col-span-2">
            <Input value={form.care_notes} onChange={set('care_notes')} placeholder={t('সার, কীটনাশক ইত্যাদি', 'Fertilizer, pesticide, etc.')} />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!harvesting} onClose={() => setHarvesting(null)} title={t(`ফসল কাটা — ${harvesting?.name}`, `Harvest — ${harvesting?.name}`)}>
        <form onSubmit={saveHarvest} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('মোট পরিমাণ (কেজি)', 'Total Quantity (kg)')} className="sm:col-span-2">
            <Input type="number" step="0.01" min="0" value={harvestForm.total_quantity_kg} onChange={setH('total_quantity_kg')} required placeholder={t('যেমন: 4200', 'e.g. 4200')} />
          </Field>
          <Field label={t('মোট খরচ (টাকা)', 'Total Cost (taka)')}>
            <Input type="number" step="0.01" min="0" value={harvestForm.cost_taka} onChange={setH('cost_taka')} placeholder={t('যেমন: 45000', 'e.g. 45000')} />
          </Field>
          <Field label={t('মোট আয় (টাকা)', 'Total Revenue (taka)')}>
            <Input type="number" step="0.01" min="0" value={harvestForm.revenue_taka} onChange={setH('revenue_taka')} placeholder={t('যেমন: 105000', 'e.g. 105000')} />
          </Field>
          <Field label={t('কাটার তারিখ', 'Harvest Date')} className="sm:col-span-2">
            <Input type="date" value={harvestForm.harvested_at} onChange={setH('harvested_at')} />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setHarvesting(null)}>{t('বাতিল', 'Cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('ফলন রেকর্ড করুন', 'Record Yield')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
