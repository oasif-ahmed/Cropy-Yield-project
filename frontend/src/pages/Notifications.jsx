import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { PageHeader, Card, Button, Badge, Spinner, EmptyState, ErrorAlert } from '../components/ui.jsx';
import { Bell, TriangleAlert, Wheat, Info } from 'lucide-react';
import { formatDate } from '../components/utils.js';
import { toast } from 'sonner';

const TYPE_META = {
  alert: { label: 'সতর্কতা', enLabel: 'Alert', tone: 'red' },
  harvest: { label: 'ফসল কাটা', enLabel: 'Harvest', tone: 'green' },
  info: { label: 'তথ্য', enLabel: 'Info', tone: 'blue' },
};

export default function Notifications() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/notifications');
      setItems(res.data.notifications);
    } catch (err) {
      setError(err.response?.data?.error || t('বিজ্ঞপ্তি লোড করা যায়নি', 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    setItems((list) => list.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    toast.success(t('বিজ্ঞপ্তি পড়া হয়েছে', 'Notification marked as read'));
  }

  async function readAll() {
    await api.post('/notifications/read-all');
    setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    toast.success(t('সব বিজ্ঞপ্তি পড়া হয়েছে', 'All notifications marked as read'));
  }

  return (
    <div>
      <PageHeader
        icon={Bell}
        tone="amber"
        title={t('বিজ্ঞপ্তি', 'Notifications')}
        subtitle={t('আসন্ন ফসল কাটা, রোগ-পোকা সতর্কতা ও খবর', 'Upcoming harvests, pest alerts & news')}
        actions={
          items.some((n) => !n.is_read) ? (
            <Button variant="outline" onClick={readAll}>{t('সব পড়া হয়েছে', 'Mark all read')}</Button>
          ) : null
        }
      />

      {error && <ErrorAlert message={error} onRetry={load} />}
      {loading ? (
        <Spinner label={t('বিজ্ঞপ্তি লোড হচ্ছে...', 'Loading notifications...')} />
      ) : items.length === 0 ? (
        <Card><EmptyState title={t('কোনো বিজ্ঞপ্তি নেই', 'No notifications yet')} /></Card>
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100">
            {items.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.info;
              return (
                <li key={n.id} className={`flex items-start gap-3 py-3 ${n.is_read ? 'opacity-70' : ''}`}>
                  <span className="mt-1 flex-shrink-0">{n.type === 'alert' ? <TriangleAlert className="h-4 w-4 text-red-500" /> : n.type === 'harvest' ? <Wheat className="h-4 w-4 text-emerald-500" /> : <Info className="h-4 w-4 text-sky-500" />}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{n.title}</p>
                      <Badge tone={meta.tone}>{t(meta.label, meta.enLabel)}</Badge>
                      {!n.is_read && <Badge tone="amber">{t('নতুন', 'New')}</Badge>}
                    </div>
                    {n.body && <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>}
                    <p className="mt-0.5 text-xs text-gray-400">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="text-xs text-emerald-600 hover:underline">
                      {t('পড়া হয়েছে', 'Read')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
