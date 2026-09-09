import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IconChip } from '../components/ui.jsx';
import { Home, LayoutDashboard, Sprout, Leaf, Wheat } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="animate-float flex gap-3">
          <IconChip Icon={Leaf} tone="green" className="rotate-[-8deg] animate-pulse-soft" />
          <span className="font-heading text-7xl font-black tracking-tight md:text-8xl">
            <span className="text-emerald-600 dark:text-emerald-400">404</span>
          </span>
          <IconChip Icon={Wheat} tone="amber" className="rotate-[8deg] animate-pulse-soft" />
        </div>
      </div>

      <h1 className="font-heading text-2xl font-bold md:text-3xl">{t('পাতাটি খুঁজে পাওয়া যায়নি', 'Page Not Found')}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t('আপনি যে পৃষ্ঠাটি খুঁজছেন তা সরানো হয়েছে, মুছে ফেলা হয়েছে বা কখনোই ছিল না। এখানে ক্লিক করে মূল পৃষ্ঠায় ফিরে যান।', 'The page you are looking for has been moved, deleted, or never existed. Click here to return to the home page.')}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/dashboard">
          <Button>
            <Home />
            {t('হোমে ফিরুন', 'Back to Home')}
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline">
            <LayoutDashboard />
            {t('ড্যাশবোর্ড', 'Dashboard')}
          </Button>
        </Link>
      </div>

      <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <Sprout className="size-4 text-emerald-500" />
        {t('কৃষি ফলন সিস্টেম · AI-Based Crop Management', 'কৃষি ফলন সিস্টেম · AI-Based Crop Management')}
      </div>
    </div>
  );
}
