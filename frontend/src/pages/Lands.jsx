import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Input, Select, Field, Modal, Badge, Spinner, EmptyState, ErrorAlert, EditDeleteButtons } from '../components/ui.jsx';
import { Map } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber } from '../components/utils.js';
import { SOIL_TYPES, IRRIGATION_SOURCES } from '../i18n/locations.js';
import MapPicker from '../components/MapPicker.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const SOIL_EN = { 'পলি দোআঁশ': 'Silt Loam', 'কাদা মাটি': 'Clay', 'এঁটেল দোআঁশ': 'Clay Loam', 'বেলে দোআঁশ': 'Sandy Loam', 'পলি মাটি': 'Silt Clay', 'কৃষ্ণ মাটি': 'Black Soil' };
const IRRIGATION_EN = { 'গভীর নলকূপ': 'Deep Tubewell', 'নলকূপ': 'Tubewell', 'খাল / নদী': 'Canal / River', 'পুকুর': 'Pond', 'বৃষ্টি নির্ভর': 'Rainfed' };
const emptyForm = { farmer_id: '', label: '', area_bigha: '', soil_type: '', irrigation_source: '', lat: null, lng: null, address: '' };

export default function Lands() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isFarmer = user.role === 'FARMER';
  const [lands, setLands] = useState([]);
  const [farmers, setFarmers] = useState([]);
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
      const res = await api.get('/lands');
      setLands(res.data.lands);
      if (!isFarmer) {
        const fRes = await api.get('/farmers');
        setFarmers(fRes.data.farmers);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('জমি লোড করা যায়নি', 'Could not load lands'));
    } finally {
      setLoading(false);
    }
  }, [isFarmer]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, farmer_id: isFarmer ? '' : (farmers[0]?.id || '') });
    setOpen(true);
  }

  function openEdit(l) {
    setEditing(l);
    setForm({
      farmer_id: l.farmer_id || '',
      label: l.label || '',
      area_bigha: l.area_bigha ?? '',
      soil_type: l.soil_type || '',
      irrigation_source: l.irrigation_source || '',
      lat: l.lat,
      lng: l.lng,
      address: l.address || '',
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
      const payload = { ...form };
      if (isFarmer) delete payload.farmer_id;
      if (editing) {
        await api.patch(`/lands/${editing.id}`, payload);
      } else {
        await api.post('/lands', payload);
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('সংরক্ষণ ব্যর্থ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(l) {
    if (!window.confirm(t(`${l.label} জমি মুছে ফেলবেন?`, `Delete ${l.label} land?`))) return;
    try {
      await api.delete(`/lands/${l.id}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('মুছে ফেলা যায়নি', 'Could not delete'));
    }
  }

  return (
    <div>
      <PageHeader
        icon={Map}
        tone="green"
        title={t('জমি ব্যবস্থাপনা', 'Land Management')}
        subtitle={t('জমির আয়তন, মাটির ধরন ও অবস্থান সংরক্ষণ করুন', 'Record land area, soil type and location')}
        actions={<Button onClick={openNew}>+ {t('নতুন জমি', 'New Land')}</Button>}
      />

      {error && <ErrorAlert message={error} onRetry={load} />}

      {loading ? (
        <Spinner label={t('জমি লোড হচ্ছে...', 'Loading lands...')} />
      ) : lands.length === 0 ? (
        <Card><EmptyState title={t('কোনো জমি নেই', 'No lands yet')} description={t('+ নতুন জমি বাটনে ক্লিক করে জমি যোগ করুন', 'Click + New Land button to add land')} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lands.map((l) => (
            <Card key={l.id} title={l.label}>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">{t('মালিক:', 'Owner:')} <span className="font-medium text-gray-900">{l.farmer_name}</span></p>
                <p className="text-gray-600">{t('আয়তন:', 'Area:')} <span className="font-semibold">{formatNumber(l.area_bigha)} {t('বিঘা', 'bigha')}</span></p>
                <p className="text-gray-600">{t('মাটি:', 'Soil:')} {l.soil_type || '—'} · {t('সেচ:', 'Irrigation:')} {l.irrigation_source || '—'}</p>
                {l.address && <p className="text-gray-600">{t('ঠিকানা:', 'Address:')} {l.address}</p>}
                <p className="text-gray-600">{t('সক্রিয় ফসল:', 'Active Crops:')} <Badge tone="green">{l.active_crops} {t('টি', 'pcs')}</Badge></p>
                <div className="flex gap-3 pt-1">
                  <EditDeleteButtons onEdit={() => openEdit(l)} onDelete={() => remove(l)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('জমি সম্পাদনা', 'Edit Land') : t('নতুন জমি', 'New Land')} wide>
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!isFarmer && (
            <Field label={t('কৃষক', 'Farmer')} className="sm:col-span-2">
              <Select value={form.farmer_id} onChange={set('farmer_id')} required>
                <option value="">— {t('কৃষক নির্বাচন করুন', 'Select farmer')} —</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label={t('জমির নাম', 'Land Name')}>
            <Input value={form.label} onChange={set('label')} required placeholder={t('যেমন: উত্তর প্লট', 'e.g. North Plot')} />
          </Field>
          <Field label={t('আয়তন (বিঘা)', 'Area (bigha)')}>
            <Input type="number" step="0.01" min="0" value={form.area_bigha} onChange={set('area_bigha')} required />
          </Field>
          <Field label={t('মাটির ধরন', 'Soil Type')}>
            <Select value={form.soil_type} onChange={set('soil_type')}>
              <option value="">— {t('নির্বাচন করুন', 'Select')} —</option>
              {SOIL_TYPES.map((s) => (
                <option key={s} value={s}>{t(s, SOIL_EN[s] || s)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('সেচের উৎস', 'Irrigation Source')}>
            <Select value={form.irrigation_source} onChange={set('irrigation_source')}>
              <option value="">— {t('নির্বাচন করুন', 'Select')} —</option>
              {IRRIGATION_SOURCES.map((s) => (
                <option key={s} value={s}>{t(s, IRRIGATION_EN[s] || s)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('ঠিকানা', 'Address')} className="sm:col-span-2">
            <Input value={form.address} onChange={set('address')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('জমির অবস্থান', 'Land Location')}>
              <MapPicker lat={form.lat} lng={form.lng} onChange={(p) => setForm((f) => ({ ...f, lat: p.lat, lng: p.lng }))} />
              {form.lat != null && (
                <p className="mt-1 text-xs text-gray-500">
                  {t('স্থানাঙ্ক:', 'Coordinates:')} {form.lat}, {form.lng}
                </p>
              )}
            </Field>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
