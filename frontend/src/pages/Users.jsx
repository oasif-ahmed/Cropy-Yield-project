import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { PageHeader, Card, Button, Input, Select, Field, Modal, Badge, Spinner, EmptyState, ErrorAlert, EditDeleteButtons } from '../components/ui.jsx';
import { UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABELS, formatDate } from '../components/utils.js';
import { DIVISIONS } from '../i18n/locations.js';

const emptyForm = { name: '', email: '', password: '', role: 'FARMER', phone: '', division: 'ঢাকা', district: '' };

const ROLE_TONES = { FARMER: 'green', OFFICER: 'blue', ADMIN: 'indigo' };

export default function Users() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
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
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.error || t('ব্যবহারকারী লোড করা যায়নি', 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'FARMER',
      phone: u.phone || '',
      division: u.division || 'ঢাকা',
      district: u.district || '',
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
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${editing.id}`, payload);
      } else {
        await api.post('/users', form);
      }
      setOpen(false);
      load();
      toast.success(editing ? t('ব্যবহারকারী হালনাগাদ হয়েছে', 'User updated') : t('নতুন ব্যবহারকারী যুক্ত হয়েছে', 'New user added'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('সংরক্ষণ ব্যর্থ', 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    try {
      await api.patch(`/users/${u.id}`, { is_active: !u.is_active });
      load();
      toast.success(u.is_active ? t('অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে', 'Account deactivated') : t('অ্যাকাউন্ট সক্রিয় করা হয়েছে', 'Account activated'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('আপডেট ব্যর্থ', 'Update failed'));
    }
  }

  async function remove(u) {
    if (!window.confirm(t(`${u.name}-কে মুছে ফেলবেন?`, `Delete ${u.name}?`))) return;
    try {
      await api.delete(`/users/${u.id}`);
      load();
      toast.success(t('ব্যবহারকারী মুছে ফেলা হয়েছে', 'User deleted'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('মুছে ফেলা যায়নি', 'Could not delete'));
    }
  }

  return (
    <div>
      <PageHeader
        icon={UserCog}
        tone="indigo"
        title={t('ব্যবহারকারী ব্যবস্থাপনা', 'User Management')}
        subtitle={t('কৃষক, কর্মকর্তা ও প্রশাসকের অ্যাকাউন্ট', 'Farmer, officer, and admin accounts')}
        actions={<Button onClick={openNew}>{t('+ নতুন ব্যবহারকারী', '+ New User')}</Button>}
      />

      {error && <ErrorAlert message={error} onRetry={load} />}

      <Card>
        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState title={t('কোনো ব্যবহারকারী নেই', 'No users yet')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500">
                <tr>
                  <th className="py-2 pr-3">{t('নাম', 'Name')}</th>
                  <th className="py-2 pr-3">{t('ইমেইল', 'Email')}</th>
                  <th className="py-2 pr-3">{t('ভূমিকা', 'Role')}</th>
                  <th className="py-2 pr-3">{t('অবস্থান', 'Location')}</th>
                  <th className="py-2 pr-3">{t('স্থিতি', 'Status')}</th>
                  <th className="py-2 pr-3">{t('নিবন্ধিত', 'Registered')}</th>
                  <th className="py-2">{t('কাজ', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-2 pr-3 font-medium">{u.name}</td>
                    <td className="py-2 pr-3 text-gray-600">{u.email}</td>
                    <td className="py-2 pr-3"><Badge tone={ROLE_TONES[u.role]}>{ROLE_LABELS(u.role)}</Badge></td>
                    <td className="py-2 pr-3 text-gray-600">{[u.district, u.division].filter(Boolean).join(', ') || '—'}</td>
                    <td className="py-2 pr-3"><Badge tone={u.is_active ? 'green' : 'red'}>{u.is_active ? t('সক্রিয়', 'Active') : t('নিষ্ক্রিয়', 'Inactive')}</Badge></td>
                    <td className="py-2 pr-3 text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <EditDeleteButtons onEdit={() => openEdit(u)} onDelete={() => remove(u)} />
                        <button onClick={() => toggleActive(u)} className="text-sky-600 hover:underline">
                          {u.is_active ? t('নিষ্ক্রিয়', 'Deactivate') : t('সক্রিয়', 'Activate')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('ব্যবহারকারী সম্পাদনা', 'Edit User') : t('নতুন ব্যবহারকারী', 'New User')}>
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('নাম', 'Name')}>
            <Input value={form.name} onChange={set('name')} required />
          </Field>
          <Field label={t('ইমেইল', 'Email')}>
            <Input type="email" value={form.email} onChange={set('email')} required disabled={!!editing} />
          </Field>
          <Field label={t('পাসওয়ার্ড', 'Password')}>
            <Input type="password" value={form.password} onChange={set('password')} required={!editing} placeholder={editing ? t('ফাঁকা থাকলে অপরিবর্তিত', 'Leave blank to keep unchanged') : t('কমপক্ষে ৬ অক্ষর', 'Minimum 6 characters')} minLength={6} />
          </Field>
          <Field label={t('ভূমিকা', 'Role')}>
            <Select value={form.role} onChange={set('role')}>
              <option value="FARMER">{t('কৃষক', 'Farmer')}</option>
              <option value="OFFICER">{t('কৃষি কর্মকর্তা', 'Agriculture Officer')}</option>
              <option value="ADMIN">{t('অ্যাডমিন', 'Admin')}</option>
            </Select>
          </Field>
          <Field label={t('মোবাইল', 'Mobile')}>
            <Input value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label={t('বিভাগ', 'Division')}>
            <Select value={form.division} onChange={set('division')}>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('জেলা', 'District')}>
            <Input value={form.district} onChange={set('district')} />
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
