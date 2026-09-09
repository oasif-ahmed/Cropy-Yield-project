import { useState, useEffect, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { Field, Input, Button, ErrorAlert } from '../components/ui.jsx';
import { Aurora, FadeContent } from '../lib/reactbits/index.js';
import { ShieldCheck, BriefcaseBusiness, Sprout } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem('cy_on_login_page', '1');
    return () => localStorage.removeItem('cy_on_login_page');
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('লগইন ব্যর্থ হয়েছে', 'Login failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#04100b] px-4">
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Aurora colorStops={['#0f172a', '#10b981', '#059669']} amplitude={1.1} blend={0.6} />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,transparent_30%,rgba(4,16,11,0.6)_100%)]" />
      <div className="relative z-10 w-full max-w-md">
        <FadeContent delay={120} duration={700} blur>
          <div className="mb-6 text-center text-white">
            <p className="text-white"><Sprout className="mx-auto h-10 w-10" /></p>
            <h1 className="mt-2 text-2xl font-bold">{t('কৃষি ফলন ব্যবস্থাপনা সিস্টেম', 'Crop Yield Management System')}</h1>
            <p className="text-emerald-200">AI-Based Crop Production &amp; Yield Forecasting</p>
          </div>
        </FadeContent>
        <FadeContent delay={260} duration={800} blur>
          <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('লগইন করুন', 'Log In')}</h2>
          {error && <ErrorAlert message={error} />}
          <div className="space-y-3">
            <Field label={t('ইমেইল', 'Email')}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label={t('পাসওয়ার্ড', 'Password')}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? t('লগইন হচ্ছে...', 'Logging in...') : t('লগইন', 'Log In')}
            </Button>
          </div>
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-center text-xs font-medium text-gray-500">{t('দ্রুত লগইন (ডেমো অ্যাকাউন্ট)', 'Quick Login (Demo Accounts)')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t('অ্যাডমিন', 'Admin'), email: 'admin@cropyield.com', password: 'admin123', icon: <ShieldCheck className="mx-auto h-5 w-5" />, tone: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
                { label: t('কর্মকর্তা', 'Officer'), email: 'officer@cropyield.com', password: 'officer123', icon: <BriefcaseBusiness className="mx-auto h-5 w-5" />, tone: 'bg-sky-50 text-sky-700 hover:bg-sky-100' },
                { label: t('কৃষক', 'Farmer'), email: 'farmer@cropyield.com', password: 'farmer123', icon: <Sprout className="mx-auto h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setError('');
                    setBusy(true);
                    try {
                      await login(acc.email, acc.password);
                      navigate('/');
                    } catch (err) {
                      setError(err.response?.data?.error || t('লগইন ব্যর্থ হয়েছে', 'Login failed'));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className={`rounded-lg border border-transparent px-2 py-2 text-center transition disabled:opacity-60 ${acc.tone}`}
                >
                  <span className="block text-lg leading-none">{acc.icon}</span>
                  <span className="mt-1 block text-xs font-semibold">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            {t('অ্যাকাউন্ট নেই?', 'No account?')}{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:underline">
              {t('নিবন্ধন করুন', 'Register')}
            </Link>
          </p>
        </form>
        </FadeContent>
      </div>
    </div>
  );
}
