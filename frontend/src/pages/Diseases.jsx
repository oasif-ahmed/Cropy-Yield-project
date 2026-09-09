import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { PageHeader, Card, Button, Input, Select, Field, Modal, Badge, Spinner, EmptyState, ErrorAlert, Textarea, EditDeleteButtons } from '../components/ui.jsx';
import { Bug } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, SEVERITY_LABELS, DISEASE_STATUS_LABELS, DISEASE_STATUS_TONES } from '../components/utils.js';
import { SEVERITIES, DISEASE_STATUSES } from '../i18n/locations.js';

const emptyForm = { crop_id: '', disease_name: '', pest_name: '', severity: 'LOW', symptoms: '', treatment: '', status: 'OPEN' };

export default function Diseases() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [diseases, setDiseases] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/diseases', { params: { status: statusFilter || undefined } });
      setDiseases(res.data.diseases);
      const cRes = await api.get('/crops');
      setCrops(cRes.data.crops);
    } catch (err) {
      setError(err.response?.data?.error || t('রোগ-পোকা লোড করা যায়নি', 'Failed to load diseases'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, crop_id: crops[0]?.id || '' });
    setImage(null);
    setImagePreview(null);
    setAiResult(null);
    setOpen(true);
  }

  function openEdit(d) {
    setEditing(d);
    setForm({
      crop_id: d.crop_id || '',
      disease_name: d.disease_name || '',
      pest_name: d.pest_name || '',
      severity: d.severity || 'LOW',
      symptoms: d.symptoms || '',
      treatment: d.treatment || '',
      status: d.status || 'OPEN',
    });
    setImage(null);
    setImagePreview(null);
    setAiResult(null);
    setOpen(true);
  }

  function handleImage(e) {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setAiResult(null);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  async function detectWithAI() {
    if (!image) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const crop = crops.find((c) => c.id === form.crop_id);
      const fd = new FormData();
      fd.append('file', image);
      if (crop) fd.append('crop_name', crop.name);
      const res = await api.post('/ai/detect-upload', fd);
      const result = res.data;
      setAiResult(result);
      if (result.disease_name) {
        setForm((f) => ({
          ...f,
          disease_name: result.disease_name || f.disease_name,
          symptoms: result.symptoms || f.symptoms,
          treatment: result.treatment || f.treatment,
          severity: result.severity || f.severity,
        }));
      }
    } catch (err) {
      toast.error(`${t('AI শনাক্তকরণ ব্যর্থ হয়েছে:', 'AI detection failed:')} ${err.response?.data?.error || t('সার্ভার ত্রুটি', 'Server error')}`);
    } finally {
      setAiLoading(false);
    }
  }

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/diseases/${editing.id}`, form);
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => v != null && fd.append(k, v));
        if (image) fd.append('image', image);
        await api.post('/diseases', fd);
      }
      setOpen(false);
      load();
      toast.success(editing ? t('রিপোর্ট হালনাগাদ হয়েছে', 'Report updated') : t('নতুন রিপোর্ট যুক্ত হয়েছে', 'New report added'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('সংরক্ষণ ব্যর্থ', 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(d) {
    if (!window.confirm(t('রিপোর্ট মুছে ফেলবেন?', 'Delete this report?'))) return;
    try {
      await api.delete(`/diseases/${d.id}`);
      load();
      toast.success(t('রিপোর্ট মুছে ফেলা হয়েছে', 'Report deleted'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('মুছে ফেলা যায়নি', 'Could not delete'));
    }
  }

  const severityTone = { LOW: 'blue', MEDIUM: 'amber', HIGH: 'red' };

  return (
    <div>
      <PageHeader
        icon={Bug}
        tone="red"
        title={t('রোগ ও পোকা ব্যবস্থাপনা', 'Disease & Pest Management')}
        subtitle={t('ফসলের রোগ-পোকা শনাক্তকরণ ও চিকিৎসা নিবন্ধন', 'Crop disease detection & treatment registry')}
        actions={
          <>
            <Button variant="outline" onClick={() => setStatusFilter(statusFilter ? '' : 'OPEN')}>
              {statusFilter ? t('সব দেখুন', 'Show All') : t('অমীমাংসিত', 'Unresolved')}
            </Button>
            <Button onClick={openNew}>{t('+ নতুন রিপোর্ট', '+ New Report')}</Button>
          </>
        }
      />

      {error && <ErrorAlert message={error} onRetry={load} />}
      {loading ? (
        <Spinner label={t('রোগ-পোকা লোড হচ্ছে...', 'Loading diseases...')} />
      ) : diseases.length === 0 ? (
        <Card><EmptyState title={t('কোনো রিপোর্ট নেই', 'No reports yet')} /></Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('রোগ/পোকা', 'Disease/Pest')}</th>
                <th className="px-4 py-3">{t('ফসল', 'Crop')}</th>
                <th className="px-4 py-3">{t('কৃষক', 'Farmer')}</th>
                <th className="px-4 py-3">{t('তীব্রতা', 'Severity')}</th>
                <th className="px-4 py-3">{t('স্থিতি', 'Status')}</th>
                <th className="px-4 py-3">{t('লক্ষণ', 'Symptoms')}</th>
                <th className="px-4 py-3">{t('চিকিৎসা', 'Treatment')}</th>
                <th className="px-4 py-3">{t('নিবন্ধিত', 'Registered')}</th>
                <th className="px-4 py-3">{t('কাজ', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {diseases.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {d.disease_name}
                    {d.pest_name && <span className="text-gray-500"> · {d.pest_name}</span>}
                  </td>
                  <td className="px-4 py-3">{d.crop_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.farmer_name || '—'}</td>
                  <td className="px-4 py-3"><Badge tone={severityTone[d.severity]}>{SEVERITY_LABELS(d.severity) || d.severity}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={DISEASE_STATUS_TONES[d.status]}>{DISEASE_STATUS_LABELS(d.status) || d.status}</Badge></td>
                  <td className="max-w-[200px] px-4 py-3 text-gray-600">{d.symptoms || '—'}</td>
                  <td className="max-w-[200px] px-4 py-3 text-gray-600">{d.treatment || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(d.reported_at)}</td>
                  <td className="px-4 py-3">
                    <EditDeleteButtons onEdit={() => openEdit(d)} onDelete={() => remove(d)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('রিপোর্ট সম্পাদনা', 'Edit Report') : t('নতুন রোগ-পোকা রিপোর্ট', 'New Disease & Pest Report')} wide>
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('ফসল', 'Crop')}>
            <Select value={form.crop_id} onChange={set('crop_id')} required={!editing}>
              <option value="">{t('— ফসল নির্বাচন করুন —', '— Select crop —')}</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.variety && `(${c.variety})`} — {c.land_label}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('রোগের নাম', 'Disease Name')}>
            <Input value={form.disease_name} onChange={set('disease_name')} required placeholder={t('যেমন: ধানের ব্লাস্ট', 'e.g., Rice Blast')} />
          </Field>
          <Field label={t('পোকার নাম (ঐচ্ছিক)', 'Pest Name (Optional)')}>
            <Input value={form.pest_name} onChange={set('pest_name')} />
          </Field>
          <Field label={t('তীব্রতা', 'Severity')}>
            <Select value={form.severity} onChange={set('severity')}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{SEVERITY_LABELS(s)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('স্থিতি', 'Status')}>
            <Select value={form.status} onChange={set('status')}>
              {DISEASE_STATUSES.map((s) => (
                <option key={s} value={s}>{DISEASE_STATUS_LABELS(s)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('লক্ষণ', 'Symptoms')} className="sm:col-span-2">
            <Textarea rows={2} value={form.symptoms} onChange={set('symptoms')} placeholder={t('যেমন: পাতায় ধূসর দাগ', 'e.g., Gray spots on leaves')} />
          </Field>
          <Field label={t('চিকিৎসা/সুপারিশ', 'Treatment/Recommendation')} className="sm:col-span-2">
            <Textarea rows={2} value={form.treatment} onChange={set('treatment')} placeholder={t('যেমন: প্রোপিকোনাজল স্প্রে করুন', 'e.g., Spray propiconazole')} />
          </Field>
          {!editing && (
            <div className="sm:col-span-2 space-y-2">
              <Field label={t('ছবি আপলোড (AI শনাক্তকরণের জন্য)', 'Upload Image (for AI Detection)')}>
                <Input type="file" accept="image/*" onChange={handleImage} />
              </Field>
              {imagePreview && (
                <div className="flex items-start gap-3">
                  <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-md border object-cover" />
                  <div className="flex-1">
                    <Button type="button" variant="secondary" onClick={detectWithAI} disabled={aiLoading}>
                      {aiLoading ? t('বিশ্লেষণ হচ্ছে...', 'Analyzing...') : t('🤖 AI দিয়ে শনাক্ত করুন', '🤖 Detect with AI')}
                    </Button>
                    {aiResult && (
                      <div className="mt-2 rounded-md border border-indigo-200 bg-indigo-50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-indigo-800">{aiResult.disease_name}</p>
                          <Badge tone="indigo">{t('আস্থা', 'Confidence')} {aiResult.confidence}%</Badge>
                        </div>
                        <p className="mt-1 text-xs text-indigo-700">{aiResult.symptoms}</p>
                        <p className="mt-1 text-xs text-indigo-700">{aiResult.treatment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
