import { useState, useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring, useMotionValueEvent } from 'motion/react';
import { cn } from 'cn';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { FadeContent, AnimatedContent } from '../lib/reactbits/index.js';
import {
  BarChart3,
  Banknote,
  ChevronRight,
  CloudRain,
  CircleAlert,
  Home,
  Inbox,
  Pencil,
  Sprout,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button as SButton } from '@/components/ui/button';
import { Badge as SBadge } from '@/components/ui/badge';
import { Input as SInput } from '@/components/ui/input';
import { Textarea as STextarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription, AlertAction } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ Panel */
export function Panel({ title, subtitle, actions, className, children, pad = true, revealDelay = 0 }) {
  return (
    <FadeContent
      className={cn('rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-foreground/10', className)}
      blur
      duration={700}
      delay={revealDelay}
      threshold={0.06}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
          <div>
            {title && <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn(pad && 'p-5')}>{children}</div>
    </FadeContent>
  );
}

/* ------------------------------------------------------------------ PulseDot */
export function PulseDot({ className }) {
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0', className)}>
      <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-current opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

/* ------------------------------------------------------------------ IconChip */
const CHIP_TONES = {
  green: 'bg-emerald-600 shadow-emerald-600/25',
  blue: 'bg-sky-600 shadow-sky-600/25',
  amber: 'bg-amber-500 shadow-amber-500/25',
  red: 'bg-rose-600 shadow-rose-600/25',
  indigo: 'bg-indigo-600 shadow-indigo-600/25',
  violet: 'bg-violet-600 shadow-violet-600/25',
};

export function IconChip({ Icon, tone = 'green', className, iconClass }) {
  return (
    <span
      className={cn(
        'group/chip inline-flex items-center justify-center rounded-xl p-2.5 text-white shadow-lg transition-transform duration-300 ease-out hover:scale-105',
        CHIP_TONES[tone] || CHIP_TONES.green,
        className
      )}
    >
      <Icon className={cn('size-5 transition-transform duration-300 ease-out group-hover/chip:scale-110 group-hover/chip:-rotate-6', iconClass)} />
    </span>
  );
}

/* ------------------------------------------------------------------ Breadcrumbs */
export function Breadcrumbs({ items }) {
  const { t } = useLanguage();
  return (
    <nav aria-label={t('ব্রেডক্রাম্ব', 'Breadcrumb')} className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="size-3.5" />
        <span className="hidden sm:inline">{t('হোম', 'Home')}</span>
      </Link>
      {items.filter(Boolean).map((item, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1.5">
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-medium text-foreground">{item}</span>
        </span>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ CountUp */
export function CountUp({ value, duration = 900, formatter = (n) => Math.round(n).toLocaleString('bn-BD') }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const seconds = Math.max((duration || 900) / 1000, 0.2);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 100 / seconds, damping: 20 + 40 / seconds });
  const fmt = formatter;
  useEffect(() => {
    if (inView) mv.set(Number(value) || 0);
  }, [inView, value, mv]);
  useMotionValueEvent(spring, 'change', (latest) => {
    if (ref.current) ref.current.textContent = fmt(latest);
  });
  return <span ref={ref}>{fmt(0)}</span>;
}

/* ------------------------------------------------------------------ LinearProgress */
export function LinearProgress({ items }) {
  const max = Math.max(...items.map((i) => Number(i.value) || 0), 1);
  return (
    <div className="space-y-4">
      {items.map((it, idx) => (
        <div key={idx}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{it.label}</span>
            <span className="text-xs text-muted-foreground">{it.display ?? it.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(((Number(it.value) || 0) / max) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${it.color || '#10b981'}, ${it.colorSoft || it.color || '#10b981'})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ PageHeader */
export function PageHeader({ title, subtitle, actions, icon, tone = 'green' }) {
  return (
    <FadeContent className="mb-6" blur duration={600}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && <IconChip Icon={icon} tone={tone} className="animate-scale-in" />}
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </FadeContent>
  );
}

/* ------------------------------------------------------------------ Card */
export function Card({ title, subtitle, actions, children, className, revealDelay = 0 }) {
  return (
    <FadeContent
      className={cn('rounded-xl bg-card text-card-foreground shadow-sm ring-1 ring-foreground/10', className)}
      duration={650}
      delay={revealDelay}
      threshold={0.05}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            {title && <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </FadeContent>
  );
}

/* ------------------------------------------------------------------ StatCard */
const ACCENTS = {
  green: { cls: 'bg-emerald-500/10 text-emerald-600', Icon: Sprout },
  blue: { cls: 'bg-sky-500/10 text-sky-600', Icon: CloudRain },
  amber: { cls: 'bg-amber-500/10 text-amber-600', Icon: Banknote },
  red: { cls: 'bg-rose-500/10 text-rose-600', Icon: TriangleAlert },
  indigo: { cls: 'bg-indigo-500/10 text-indigo-600', Icon: BarChart3 },
};

export function StatCard({ label, value, sub, accent = 'green', revealDelay = 0 }) {
  const a = ACCENTS[accent] || ACCENTS.green;
  const Icon = a.Icon;
  return (
    <AnimatedContent distance={26} scale={0.96} duration={0.6} delay={revealDelay} threshold={0.05}>
      <div className="group relative overflow-hidden rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110', a.cls)}>
          <Icon className="size-4" />
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground/80">{sub}</p>}
        <span className={cn('pointer-events-none absolute -bottom-4 -right-4 size-16 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30', a.cls.split(' ')[0])} />
      </div>
    </AnimatedContent>
  );
}

/* ------------------------------------------------------------------ Button */
const VARIANT_MAP = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  outline: 'outline',
};

export function Button({ variant = 'primary', size = 'lg', className, ...props }) {
  return (
    <SButton
      variant={VARIANT_MAP[variant] || 'default'}
      size={size}
      className={className}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ Input */
export function Input({ className, ...props }) {
  return <SInput className={cn('h-9', className)} {...props} />;
}

/* ------------------------------------------------------------------ Select */
export function Select({ children, className, ...props }) {
  return (
    <select
      {...props}
      className={cn(
        'h-9 w-full cursor-pointer appearance-none rounded-lg border border-input bg-background py-1 pr-8 pl-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
        className
      )}
      style={{
        backgroundImage:
          'linear-gradient(45deg, transparent 50%, #94a3b8 50%), linear-gradient(135deg, #94a3b8 50%, transparent 50%)',
        backgroundPosition: 'calc(100% - 14px) 50%, calc(100% - 10px) 50%',
        backgroundSize: '5px 5px, 5px 5px',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ Textarea */
export function Textarea(props) {
  return <STextarea {...props} />;
}

/* ------------------------------------------------------------------ Field */
export function Field({ label, children, className }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ EditDeleteButtons */
export function EditDeleteButtons({ onEdit, onDelete }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {onEdit && (
        <SButton type="button" size="sm" variant="outline" onClick={onEdit}>
          <Pencil />
          {t('সম্পাদনা', 'Edit')}
        </SButton>
      )}
      {onDelete && (
        <SButton type="button" size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 />
          {t('মুছুন', 'Delete')}
        </SButton>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Badge */
const TONE_CLASSES = {
  gray: 'border-muted bg-muted text-muted-foreground',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300',
  blue: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
  red: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300',
};

export function Badge({ tone = 'gray', children }) {
  return <SBadge variant="outline" className={TONE_CLASSES[tone] || TONE_CLASSES.gray}>{children}</SBadge>;
}

/* ------------------------------------------------------------------ Modal */
export function Modal({ open, onClose, title, children, wide }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className={cn('max-h-[88vh] overflow-y-auto sm:max-w-lg', wide && 'sm:max-w-3xl')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ Spinner (skeleton loader) */
export function Spinner({ label }) {
  return (
    <div className="animate-fade-up space-y-4 py-3">
      <div className="flex animate-pulse items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-44 max-w-[60vw]" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      {label && <p className="animate-pulse text-center text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ EmptyState */
export function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
      <Inbox className="mx-auto size-8 text-muted-foreground/60" />
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ ErrorAlert */
export function ErrorAlert({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <Alert variant="destructive" className="pr-18">
      <CircleAlert />
      <AlertTitle>{t('একটি সমস্যা হয়েছে', 'Something went wrong')}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {onRetry && (
        <AlertAction>
          <Button size="sm" variant="outline" onClick={onRetry}>
            {t('আবার চেষ্টা করুন', 'Try again')}
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}