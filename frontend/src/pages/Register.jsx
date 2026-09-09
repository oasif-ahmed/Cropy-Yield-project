import { useState, useEffect, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { Field, Input, Select, Button, ErrorAlert } from '../components/ui.jsx';
import { Aurora, FadeContent } from '../lib/reactbits/index.js';
import { DIVISIONS, DISTRICTS } from '../i18n/locations.js';
import { Sprout } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', division: 'ঢাকা', district: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem('cy_on_login_page', '1');
    return () => localStorage.removeItem('cy_on_login_page');
  }, []);

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('নিবন্ধন ব্যর্থ হয়েছে', 'Registration failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#04100b] px-4 py-8">
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Aurora colorStops={['#0f172a', '#10b981', '#059669']} amplitude={1.1} blend={0.6} />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,transparent_30%,rgba(4,16,11,0.6)_100%)]" />
      <div className="relative z-10 w-full max-w-lg">
        <FadeContent delay={120} duration={700} blur>
          <div className="mb-6 text-center text-white">
            <p className="text-white"><Sprout className="mx-auto h-10 w-10" /></p>
            <h1 className="mt-2 text-2xl font-bold">{t('কৃষি ফলন ব্যবস্থাপনা সিস্টেম', 'Crop Yield Management System')}</h1>
          </div>
        </FadeContent>
        <FadeContent delay={260} duration={800} blur>
          <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('কৃষক নিবন্ধন', 'Farmer Registration')}</h2>
          {error && <ErrorAlert message={error} />}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('নাম', 'Name')}>
              <Input value={form.name} onChange={set('name')} required />
            </Field>
            <Field label={t('ইমেইল', 'Email')}>
              <Input type="email" value={form.email} onChange={set('email')} required />
            </Field>
            <Field label={t('পাসওয়ার্ড', 'Password')} className="sm:col-span-2">
              <Input type="password" value={form.password} onChange={set('password')} minLength={6} required placeholder={t('কমপক্ষে ৬ অক্ষর', 'Minimum 6 characters')} />
            </Field>
            <Field label={t('মোবাইল', 'Mobile')}>
              <Input value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label={t('ঠিকানা', 'Address')}>
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
          </div>
          <Button type="submit" disabled={busy} className="mt-4 w-full">
            {busy ? t('নিবন্ধন হচ্ছে...', 'Registering...') : t('নিবন্ধন করুন', 'Register')}
          </Button>
          <p className="mt-4 text-center text-sm text-gray-600">
            {t('ইতোমধ্যে অ্যাকাউন্ট আছে?', 'Already have an account?')}{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
              {t('লগইন করুন', 'Log In')}
            </Link>
          </p>
        </form>
        </FadeContent>
      </div>
    </div>
  );
}
