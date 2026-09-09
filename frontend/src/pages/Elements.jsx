import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Card, Button, Badge, IconChip, PulseDot, Modal, Spinner, EmptyState, ErrorAlert } from '../components/ui.jsx';
import { Button as SButton } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Play,
  Loader2,
  Heart,
  Bell,
  Trash2,
  Pencil,
  LayoutTemplate,
  Rocket,
  Sparkles,
  AlertCircle,
  Info,
  CheckCircle2,
  TriangleAlert,
  X,
  Check,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function Elements() {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  const ALERT_ITEMS = [
    { tone: 'success', Icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300', title: t('সফল', 'Success'), body: t('ফসলের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।', 'Crop data saved successfully.') },
    { tone: 'info', Icon: Info, cls: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300', title: t('তথ্য', 'Info'), body: t('নতুন রেকর্ড যোগ করা হয়েছে — ৭ দিনের পূর্বাভাস দেখুন।', 'New record added — check the 7-day forecast.') },
    { tone: 'warning', Icon: TriangleAlert, cls: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300', title: t('সতর্কতা', 'Warning'), body: t('মাটিতে ফসফরাসের মাত্রা কম। সার প্রয়োগ করুন।', 'Phosphorus level in soil is low. Apply fertilizer.') },
    { tone: 'danger', Icon: AlertCircle, cls: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300', title: t('ত্রুটি', 'Error'), body: t('এআই সার্ভার সংযুক্ত নেই — সূত্র-ভিত্তিক ফলাফল দেখানো হচ্ছে।', 'AI server not connected — showing formula-based results.') },
  ];

  const TOASTS = [
    { label: t('সাফল্য', 'Success'), variant: 'success', Icon: CheckCircle2, fn: () => toast.success(t('রেকর্ড সফলভাবে সংরক্ষিত হয়েছে', 'Record saved successfully')) },
    { label: t('ত্রুটি', 'Error'), variant: 'destructive', Icon: AlertCircle, fn: () => toast.error(t('সংরক্ষণ ব্যর্থ, আবার চেষ্টা করুন', 'Save failed, try again')) },
    { label: t('সতর্কতা', 'Warning'), variant: 'warning', Icon: TriangleAlert, fn: () => toast.warning(t('মৃত্তিকা পরীক্ষার সময় হয়েছে', 'Soil test time has arrived')) },
    { label: t('তথ্য', 'Info'), variant: 'info', Icon: Info, fn: () => toast.info(t('আবহাওয়া সতর্কবার্তা জারি হয়েছে', 'Weather alert issued')) },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={t('UI এলিমেন্টস', 'UI Elements')}
        subtitle={t('অ্যানিমেটেড আইকন, বাটন, অ্যালার্ট, ব্যাজ ও আরও অনেক কিছু', 'Animated icons, buttons, alerts, badges and more')}
        icon={LayoutTemplate}
        tone="indigo"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('অ্যানিমেটেড আইকন', 'Animated Icons')} subtitle={t('হোভার করলে আইকন লাফিয়ে ওঠে', 'Icons bounce on hover')}>
          <div className="flex flex-wrap items-center gap-3">
            <IconChip Icon={Sparkles} tone="green" className="animate-float" />
            <IconChip Icon={Rocket} tone="indigo" />
            <IconChip Icon={Bell} tone="amber" />
            <IconChip Icon={Heart} tone="red" />
            <IconChip Icon={Play} tone="blue" />
            <IconChip Icon={Check} tone="violet" />
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-600">
              <PulseDot className="text-emerald-500" /> {t('লাইভ', 'Live')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-2.5 py-2 text-xs text-rose-600">
              <PulseDot className="text-rose-500" /> {t('রেকর্ডিং', 'Recording')}
            </span>
          </div>
        </Card>

        <Card title={t('বাটন', 'Buttons')} subtitle={t('ভেরিয়েন্ট, সাইজ, আইকন ও লোডিং স্টেট', 'Variants, sizes, icons and loading state')}>
          <div className="flex flex-wrap items-center gap-2">
            <Button>{t('প্রাইমারি', 'Primary')}</Button>
            <Button variant="secondary">{t('সেকেন্ডারি', 'Secondary')}</Button>
            <Button variant="outline">{t('আউটলাইন', 'Outline')}</Button>
            <Button variant="ghost">{t('ঘোস্ট', 'Ghost')}</Button>
            <Button variant="danger">{t('ডেসট্রাকটিভ', 'Destructive')}</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SButton size="sm"><Pencil /> {t('ছোট', 'Small')}</SButton>
            <SButton size="sm" variant="outline"><Heart /> {t('আইকন', 'Icon')}</SButton>
            <Button disabled>
              <Loader2 className="animate-spin" /> {t('লোড হচ্ছে...', 'Loading...')}
            </Button>
            <SButton variant="outline"><Sparkles /> {t('AI পূর্বাভাস', 'AI Forecast')}</SButton>
          </div>
        </Card>
      </div>

      <Card title={t('অ্যালার্ট', 'Alerts')} subtitle={t('চারটি রঙিন ভেরিয়েন্ট', 'Four color variants')}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {ALERT_ITEMS.map(({ tone, Icon, cls, title, body }) => (
            <div key={tone} className={`flex items-start gap-3 rounded-xl border p-3.5 ${cls}`}>
              <Icon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm opacity-80">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('ব্যাজ', 'Badges')} subtitle={t('টোন ভিত্তিক সফট পিল', 'Tone-based soft pills')}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gray">{t('ধূসর', 'Gray')}</Badge>
            <Badge tone="green">{t('সবুজ', 'Green')}</Badge>
            <Badge tone="blue">{t('নীল', 'Blue')}</Badge>
            <Badge tone="amber">{t('হলুদ', 'Amber')}</Badge>
            <Badge tone="red">{t('লাল', 'Red')}</Badge>
            <Badge tone="indigo">{t('বেগুনি', 'Indigo')}</Badge>
            <Badge tone="green"><span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-current" />{t('অনলাইন', 'Online')}</span></Badge>
          </div>
        </Card>

        <Card title={t('অ্যাভাটার', 'Avatars')} subtitle={t('গ্রুপ ও ব্যাজ সহ', 'With groups and badges')}>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-emerald-500/10 font-semibold text-emerald-600">কৃষ</AvatarFallback>
            </Avatar>
            <Avatar size="default">
              <AvatarFallback className="bg-sky-500/10 font-semibold text-sky-600">কঅ</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarFallback className="bg-amber-500/10 font-semibold text-amber-600">অ্যা</AvatarFallback>
            </Avatar>
            <AvatarGroup>
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>রহ</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>কা</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>মি</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+12</AvatarGroupCount>
            </AvatarGroup>
          </div>
        </Card>
      </div>

      <Card title={t('ট্যাব', 'Tabs')} subtitle={t('শর্ট-কনটেন্ট নেভিগেশন', 'Short-content navigation')}>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t('সারসংক্ষেপ', 'Overview')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('বিশ্লেষণ', 'Analytics')}</TabsTrigger>
            <TabsTrigger value="reports">{t('রিপোর্ট', 'Reports')}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3">
            <div className="rounded-lg bg-muted/50 p-4 text-sm">{t('সারসংক্ষেপ — দেশের মোট উৎপাদনের চিত্র এখানে দেখা যাবে।', 'Overview — the country\'s total production picture can be seen here.')}</div>
          </TabsContent>
          <TabsContent value="analytics" className="pt-3">
            <div className="rounded-lg bg-muted/50 p-4 text-sm">{t('বিশ্লেষণ — ৭ দিনের আবহাওয়া ও ফলনের ট্রেন্ড এখানে।', 'Analytics — 7-day weather and yield trends are here.')}</div>
          </TabsContent>
          <TabsContent value="reports" className="pt-3">
            <div className="rounded-lg bg-muted/50 p-4 text-sm">{t('রিপোর্ট — মাসিক ও বিভাগীয় রিপোর্ট এখানে।', 'Reports — monthly and divisional reports are here.')}</div>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('প্রগ্রেস', 'Progress')} subtitle={t('লোডিং ও অগ্রগতি নির্দেশক', 'Loading and progress indicators')}>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>{t('ফসল পরিপক্কতা', 'Crop Maturity')}</span><span className="font-medium">৭৫%</span></div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>{t('সেচ সম্পন্ন', 'Irrigation Complete')}</span><span className="font-medium">৪০%</span></div>
              <Progress value={40} className="h-2 [&>div]:bg-sky-500" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>{t('ফসল কাটা', 'Harvesting')}</span><span className="font-medium">৯০%</span></div>
              <Progress value={90} className="h-2 [&>div]:bg-amber-500" />
            </div>
          </div>
        </Card>

        <Card title={t('টোস্ট ও মোডাল', 'Toasts & Modal')} subtitle={t('অ্যাকশনের তাৎক্ষণিক প্রতিক্রিয়া', 'Instant action feedback')}>
          <div className="flex flex-wrap items-center gap-2">
            {TOASTS.map(({ label, Icon, fn }) => (
              <SButton key={label} variant="outline" onClick={fn}>
                <Icon /> {label}
              </SButton>
            ))}
          </div>
          <div className="mt-3">
            <Button onClick={() => setModalOpen(true)}>
              <Play /> {t('মোডাল খুলুন', 'Open Modal')}
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('লোডিং, খালি অবস্থা ও ত্রুটি', 'Loading, Empty & Error States')} subtitle={t('স্টেট সম্পর্কিত উপাদান', 'State-related components')}>
          <Spinner label={t('লোড হচ্ছে...', 'Loading...')} />
        </Card>
        <Card title={t('স্কেলেটন', 'Skeleton')} subtitle={t('কন্টেন্ট-লোড সিফোটা', 'Content-load placeholders')}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('নমুনা মোডাল', 'Sample Modal')}>
        <div className="space-y-3 text-sm">
          <p>{t('এটি একটি র্যাডিক্স-ভিত্তিক মোডাল। ট্যাব, বাটন, অ্যালার্ট — সবকিছুই এই স্টাইল সিস্টেমে তৈরি।', 'This is a Radix-based modal. Tabs, buttons, alerts — everything is built in this style system.')}</p>
          <ErrorAlert message={t('দৃষ্টান্ত-ভিত্তিক ত্রুটি বার্তা', 'Example error message')} onRetry={() => toast.info(t('আবার চেষ্টা করা হচ্ছে...', 'Retrying...'))} />
          <EmptyState title={t('কোনো রেকর্ড নেই', 'No records')} description={t('নতুন রেকর্ড যোগ করতে + বাটনে ক্লিক করুন', 'Click the + button to add a new record')} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setModalOpen(false); toast.success(t('মোডাল বন্ধ হয়েছে', 'Modal closed')); }}>
              <Check /> {t('ঠিক আছে', 'OK')}
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              <X /> {t('বাতিল', 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <Trash2 className="size-3.5" /> {t('TailAdmin অনুপ্রাণিত UI উপাদানের লাইভ প্রদর্শনী', 'Live showcase of TailAdmin-inspired UI components')}
      </div>
    </div>
  );
}
