import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { PageHeader, Card, Button, Input, Select, Field, Modal, Badge, Spinner, EmptyState, ErrorAlert, EditDeleteButtons } from '../components/ui.jsx';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber, formatDate } from '../components/utils.js';
import { DIVISIONS, DISTRICTS } from '../i18n/locations.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const emptyForm = { name: '', phone: '', address: '', division: 'ঢাকা', district: '', upazila: '', union_name: '', total_land_bigha: '' };

export default function Farmers() {
  const { t } = useLanguage();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/farmers');
      setFarmers(res.data.farmers);
    } catch (err) {
      setError(err.response?.data?.error || t('তালিকা লোড করা যায়নি', 'Could not load list'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(f) {
    setEditing(f);
    setForm({
      name: f.name || '',
      phone: f.phone || '',
      address: f.address || '',
      division: f.division || 'ঢাকা',
      district: f.district || '',
      upazila: f.upazila || '',
      union_name: f.union_name || '',
      total_land_bigha: f.total_land_bigha ?? '',
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
        await api.patch(`/farmers/${editing.id}`, form);
      } else {
        await api.post('/farmers', form);
      }
      setOpen(false);
      load();
      toast.success(editing ? t('কৃষকের তথ্য হালনাগাদ হয়েছে', 'Farmer info updated') : t('নতুন কৃষক যুক্ত হয়েছে', 'New farmer added'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('সংরক্ষণ ব্যর্থ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(f) {
    if (!window.confirm(t(`${f.name}-কে মুছে ফেলবেন?`, `Delete ${f.name}?`))) return;
    try {
      await api.delete(`/farmers/${f.id}`);
      load();
      toast.success(t('কৃষক মুছে ফেলা হয়েছে', 'Farmer deleted'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('মুছে ফেলা যায়নি', 'Could not delete'));
    }
  }

  const filtered = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(q.toLowerCase()) ||
      (f.phone || '').includes(q) ||
      (f.district || '').includes(q)
  );

  return (
    <div>
      <PageHeader
        icon={Users}
        tone="blue"
        title={t('কৃষক ব্যবস্থাপনা', 'Farmer Management')}
        subtitle={t('কৃষকদের তথ্য নিবন্ধন ও ব্যবস্থাপনা', 'Register and manage farmer information')}
        actions={<Button onClick={openNew}>+ {t('নতুন কৃষক', 'New Farmer')}</Button>}
      />

      {error && <ErrorAlert message={error} onRetry={load} />}

      <Card className="mb-4" title={t('কৃষক তালিকা', 'Farmer List')} actions={<Badge tone="green">{farmers.length} {t('জন', 'pcs')}</Badge>}>
        <Input className="mb-3" placeholder={t('নাম, মোবাইল বা জেলা দিয়ে খুঁজুন...', 'Search by name, mobile or district...')} value={q} onChange={(e) => setQ(e.target.value)} />
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState title={t('কোনো কৃষক পাওয়া যায়নি', 'No farmers found')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500">
                <tr>
                  <th className="py-2 pr-3">{t('নাম', 'Name')}</th>
                  <th className="py-2 pr-3">{t('মোবাইল', 'Mobile')}</th>
                  <th className="py-2 pr-3">{t('অবস্থান', 'Location')}</th>
                  <th className="py-2 pr-3">{t('মোট জমি (বিঘা)', 'Total Land (bigha)')}</th>
                  <th className="py-2 pr-3">{t('জমির খণ্ড', 'Land Parcels')}</th>
                  <th className="py-2 pr-3">{t('নিবন্ধিত', 'Registered')}</th>
                  <th className="py-2">{t('কাজ', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="py-2 pr-3 font-medium">{f.name}</td>
                    <td className="py-2 pr-3 text-gray-600">{f.phone || '—'}</td>
                    <td className="py-2 pr-3 text-gray-600">{[f.district, f.upazila].filter(Boolean).join(', ') || '—'}</td>
                    <td className="py-2 pr-3">{formatNumber(f.total_land_bigha)}</td>
                    <td className="py-2 pr-3"><Badge tone="blue">{f.land_count} {t('টি', 'pcs')}</Badge></td>
                    <td className="py-2 pr-3 text-gray-500">{formatDate(f.created_at)}</td>
                    <td className="py-2">
                      <EditDeleteButtons onEdit={() => openEdit(f)} onDelete={() => remove(f)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('কৃষক সম্পাদনা', 'Edit Farmer') : t('নতুন কৃষক', 'New Farmer')}>
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('নাম', 'Name')}>
            <Input value={form.name} onChange={set('name')} required />
          </Field>
          <Field label={t('মোবাইল', 'Mobile')}>
            <Input value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label={t('ঠিকানা', 'Address')} className="sm:col-span-2">
            <Input value={form.address} onChange={set('address')} />
          </Field>
          <Field label={t('বিভাগ', 'Division')}>
            <Select value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value, district: '' }))}>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('জেলা', 'District')}>
            <Select value={form.district} onChange={set('district')} required>
              <option value="">— {t('নির্বাচন করুন', 'Select')} —</option>
              {(DISTRICTS[form.division] || []).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('উপজেলা', 'Upazila')}>
            <Input value={form.upazila} onChange={set('upazila')} />
          </Field>
          <Field label={t('ইউনিয়ন', 'Union')}>
            <Input value={form.union_name} onChange={set('union_name')} />
          </Field>
          <Field label={t('মোট জমি (বিঘা)', 'Total Land (bigha)')} className="sm:col-span-2">
            <Input type="number" step="0.01" min="0" value={form.total_land_bigha} onChange={set('total_land_bigha')} />
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
