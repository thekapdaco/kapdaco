import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Filter,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  Star,
  UserPlus,
  X,
  Users,
  ShoppingBag,
  Shirt,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { KCButton } from '../ui';

const shimmerNoise =
  "url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 400 400\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'n\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'1.4\\' numOctaves=\\'2\\' stitchTiles=\\'stitch\\'/%3E%3CfeColorMatrix type=\\'saturate\\' values=\\'0\\'/%3E%3C/filter%3E%3Crect width=\\'400\\' height=\\'400\\' filter=\\'url(%23n)\\' opacity=\\'0.04\\'/%3E%3C/svg%3E')";

export const GoldButton = React.forwardRef(({ className, children, icon, iconPosition = 'left', ...props }, ref) => (
  <KCButton
    ref={ref}
    className={cn(
      'relative overflow-hidden rounded-[20px] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em]',
      'shadow-[0_25px_55px_rgba(211,167,95,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_35px_80px_rgba(211,167,95,0.4)]',
      className,
    )}
    style={{
      background: 'var(--kc-grad-gold)',
      color: 'var(--kc-navy-900)'
    }}
    icon={icon}
    iconPosition={iconPosition}
    {...props}
  >
    <span className="relative z-10">{children}</span>
  </KCButton>
));

GoldButton.displayName = 'GoldButton';

export const FollowButton = ({ initialFollowed = false, onToggle, className }) => {
  const [isFollowed, setIsFollowed] = useState(initialFollowed);

  const handleClick = () => {
    const next = !isFollowed;
    setIsFollowed(next);
    if (onToggle) {
      onToggle(next);
    }
  };

  return (
    <KCButton
      variant="ghost"
      onClick={handleClick}
      className={cn(
        'rounded-[20px] px-5 py-2 text-sm font-semibold transition-all duration-300',
        isFollowed
          ? 'border border-transparent'
          : 'border border-white/15 bg-[var(--kc-glass-01)] text-[var(--kc-cream-100)] hover:border-[var(--kc-gold-200)] hover:text-[var(--kc-cream-100)]',
        className,
      )}
      style={isFollowed ? {
        background: 'var(--kc-grad-gold)',
        color: 'var(--kc-navy-900)'
      } : undefined}
      icon={isFollowed ? <CheckCircle2 size={16} /> : <UserPlus size={16} />}
    >
      {isFollowed ? 'Following' : 'Follow'}
    </KCButton>
  );
};

export const StatPill = ({ icon: Icon, label, value }) => (
  <div className="relative overflow-hidden rounded-[var(--kc-radius-lg)] border border-white/12 bg-white/6 px-6 py-5 text-center text-white shadow-[0_32px_70px_rgba(0,0,0,0.32)]">
    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: shimmerNoise }} aria-hidden="true" />
    <div className="relative flex flex-col items-center gap-2">
      {Icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-[var(--kc-radius)] bg-white/12 text-white">
          <Icon size={20} strokeWidth={1.5} />
        </span>
      ) : null}
      <p className="text-2xl font-semibold text-white drop-shadow-[0_16px_45px_rgba(0,0,0,0.55)]">{value}</p>
      <p className="text-xs uppercase tracking-[0.3em] text-white/65">{label}</p>
    </div>
  </div>
);

export const TagChip = ({ children, active = false, onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full border px-[14px] py-[6px] text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-all duration-200',
      active
        ? 'border border-[var(--kc-gold-200)] bg-[linear-gradient(135deg,rgba(211,167,95,0.3),rgba(159,120,96,0.35))] text-[var(--kc-cream-100)] shadow-[0_14px_35px_rgba(211,167,95,0.25)]'
        : 'border border-white/25 bg-white/12 text-[var(--kc-cream-100)] hover:border-[var(--kc-gold-200)]/50 hover:bg-white/20',
      className,
    )}
  >
    {children}
  </button>
);

export const Badge = ({ icon: Icon, tone = 'neutral', children, className }) => {
  const toneClasses = {
    neutral: 'border-white/30 bg-white/15 text-[var(--kc-cream-100)]',
    gold: 'border-[var(--kc-gold-1)]/70 bg-[var(--kc-gold-1)]/18 text-[var(--kc-gold-1)]',
    danger: 'border-[var(--kc-danger)]/50 bg-[var(--kc-danger)]/16 text-[rgba(255,179,191,1)]',
    success: 'border-[var(--kc-success)]/45 bg-[var(--kc-success)]/16 text-[rgba(132,255,212,1)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-[var(--kc-radius-full)] border px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.24em]',
        toneClasses[tone] ?? toneClasses.neutral,
        className,
      )}
    >
      {Icon ? <Icon size={14} strokeWidth={1.5} /> : null}
      {children}
    </span>
  );
};

export const RatingStars = ({ rating = 0, max = 5 }) => {
  const stars = useMemo(() => Array.from({ length: max }), [max]);
  return (
    <div className="flex items-center gap-1 text-[var(--kc-gold-1)]">
      {stars.map((_, index) => {
        const filled = rating >= index + 1;
        const half = !filled && rating > index && rating < index + 1;
        return (
          <Star
            key={index}
            size={16}
            strokeWidth={1.5}
            className={cn(
              'transition-all duration-200',
              filled
                ? 'fill-[var(--kc-gold-1)] drop-shadow-[0_6px_18px_rgba(211,167,95,0.45)]'
                : half
                ? 'fill-[var(--kc-gold-1)]/70'
                : 'text-white/30',
            )}
          />
        );
      })}
      <span className="ml-2 text-xs font-medium text-white/70">{rating.toFixed(1)}</span>
    </div>
  );
};

export const StudioCard = ({ className, children, tone = 'dark', ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className={cn(
      'relative overflow-hidden rounded-[var(--kc-radius-lg)] border backdrop-blur-lg shadow-[0_32px_90px_rgba(0,0,0,0.45)]',
      tone === 'dark' ? 'border-white/10 bg-[#131314]/92 text-white' : 'border-[var(--kc-border)] bg-[var(--kc-surface)] text-[var(--kc-ink)]',
      className,
    )}
    {...props}
  >
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: shimmerNoise }} aria-hidden="true" />
    <div className="relative p-6 md:p-8">{children}</div>
  </motion.div>
);

export const EmptyState = ({ icon: Icon, title, description, action, tone = 'dark' }) => (
  <StudioCard
    tone={tone}
    className={cn('flex flex-col items-center gap-4 text-center', tone === 'dark' ? 'text-white/75' : 'text-[var(--kc-ink-2)]')}
  >
    {Icon ? (
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white">
        <Icon size={24} strokeWidth={1.5} />
      </span>
    ) : null}
    <h3 className="text-xl font-semibold text-white drop-shadow-[0_14px_40px_rgba(0,0,0,0.45)]">{title}</h3>
    <p className="text-sm max-w-md">{description}</p>
    {action}
  </StudioCard>
);

export const TableLite = ({ columns, data, renderActions }) => (
  <div className="overflow-hidden rounded-[var(--kc-radius-lg)] border border-white/8 bg-white/4">
    <table className="min-w-full divide-y divide-white/8 text-left text-sm text-white/70">
      <thead className="bg-white/6 text-xs uppercase tracking-[0.32em] text-white/50">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="px-4 py-3 font-medium">
              {column.label}
            </th>
          ))}
          {renderActions ? <th className="px-4 py-3" /> : null}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {data.map((row, rowIndex) => (
          <tr key={row.id ?? rowIndex} className="transition-colors hover:bg-white/6">
            {columns.map((column) => (
              <td key={column.key} className="px-4 py-4 text-sm">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </td>
            ))}
            {renderActions ? <td className="px-4 py-4 text-right">{renderActions(row)}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const PillTabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    {tabs.map((tab) => (
      <TagChip
        key={tab.value}
        active={activeTab === tab.value}
        onClick={() => onChange?.(tab.value)}
      >
        {tab.label}
      </TagChip>
    ))}
  </div>
);

export const Stepper = ({ steps, currentStep }) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center gap-4">
      {steps.map((step, index) => {
        const isActive = currentStep === index;
        const isCompleted = currentStep > index;
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300',
                isCompleted
                  ? 'border-[var(--kc-gold-1)] bg-[var(--kc-gold-1)]/15 text-[var(--kc-gold-1)]'
                  : isActive
                  ? 'border-white/80 bg-white/20 text-white'
                  : 'border-white/20 text-white/50',
              )}
            >
              {isCompleted ? <CheckCircle2 size={18} /> : index + 1}
            </div>
            <div className="flex flex-col text-xs uppercase tracking-[0.3em] text-white/60">
              <span>{step}</span>
              {isActive ? <span className="mt-1 h-0.5 w-full bg-[var(--kc-gold-1)]" /> : null}
            </div>
          </div>
        );
      })}
    </div>
    <div className="h-1 w-full rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[var(--kc-grad-gold)] transition-all duration-500"
        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
      />
    </div>
  </div>
);

export const ModalSheet = ({ open, onClose, title, description, children, actions }) => (
  <AnimatePresence>
    {open ? (
      <motion.div
        className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/50 backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl overflow-hidden rounded-t-[var(--kc-radius-lg)] border border-white/18 bg-white/12 px-6 py-8 text-white shadow-[0_-30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'var(--kc-noise)' }} />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white/80 transition hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="relative space-y-3 pr-12">
            <h3 className="text-2xl font-semibold">{title}</h3>
            {description ? <p className="text-sm text-white/75">{description}</p> : null}
          </div>
          <div className="relative mt-6 space-y-6">{children}</div>
          {actions ? <div className="relative mt-8 flex flex-wrap justify-end gap-3">{actions}</div> : null}
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export const FilterDrawer = ({ open, onClose, children, title = 'Filters' }) => (
  <AnimatePresence>
    {open ? (
      <motion.aside
        className="fixed inset-y-0 right-0 z-[1150] w-full max-w-md border-l border-white/15 bg-[rgba(7,12,20,0.95)] text-white shadow-[0_0_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/60">{title}</p>
            <h3 className="text-xl font-semibold text-white">Refine your search</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/75 hover:text-white"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex h-[calc(100%-5rem)] flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">{children}</div>
          <div className="border-t border-white/10 px-6 py-4">
            <KCButton className="w-full" icon={<Filter size={16} />} iconPosition="right">
              Apply Filters
            </KCButton>
          </div>
        </div>
      </motion.aside>
    ) : null}
  </AnimatePresence>
);

export const GalleryGrid = ({ items, renderItem }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {items.map((item, index) => (
      <motion.div
        key={item.id ?? index}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="group relative overflow-hidden rounded-[var(--kc-radius)] border border-white/10 bg-white/4 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
      >
        {renderItem(item, index)}
      </motion.div>
    ))}
  </div>
);

export const ReviewList = ({ reviews }) => {
  if (!reviews?.length) {
    return (
      <EmptyState
        tone="dark"
        title="No reviews yet"
        description="Once commissions are complete, client impressions will appear here."
        icon={MessageCircle}
      />
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <StudioCard key={review.id} tone="dark" className="bg-white/4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="text-lg font-semibold text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]">{review.client}</h4>
                <RatingStars rating={review.rating} />
              </div>
              <p className="text-sm text-white/70">{review.comment}</p>
              {review.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {review.tags.map((tag) => (
                    <TagChip key={tag}>{tag}</TagChip>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.32em] text-white/50">
              <span>{review.date}</span>
              {review.project ? <span>{review.project}</span> : null}
            </div>
          </div>
          {review.images?.length ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {review.images.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt="Client submitted"
                  className="h-24 w-24 rounded-[var(--kc-radius)] object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}
        </StudioCard>
      ))}
    </div>
  );
};

export const Pagination = ({ page, pageCount, onPageChange, isLoading }) => (
  <div className="flex items-center justify-center gap-3">
    <KCButton
      variant="ghost"
      onClick={() => onPageChange?.(Math.max(page - 1, 1))}
      disabled={page === 1 || isLoading}
      className="border border-white/12 bg-white/4 text-white/70 hover:text-white"
      icon={<Minus size={16} />}
    >
      Prev
    </KCButton>
    <span className="rounded-[var(--kc-radius)] border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/80">
      Page {page} / {pageCount}
    </span>
    <KCButton
      variant="ghost"
      onClick={() => onPageChange?.(Math.min(page + 1, pageCount))}
      disabled={page === pageCount || isLoading}
      className="border border-white/12 bg-white/4 text-white/70 hover:text-white"
      iconPosition="right"
      icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
    >
      Next
    </KCButton>
  </div>
);

export const DesignerCard = ({
  avatar,
  name,
  handle,
  location,
  bio,
  styles = [],
  products = [],
  metrics = {},
  badges = [],
  onViewProfile,
  onCommission,
  onFollow,
  verified = false,
  openForCommissions = false,
}) => (
  <motion.article
    className="designer-card-shell group relative flex h-full flex-col gap-3 sm:gap-4 lg:gap-5 overflow-hidden rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 lg:p-6 text-[var(--kc-cream-100)] shadow-lg transition-all duration-150 hover:shadow-xl hover:-translate-y-1"
    style={{
      background: "linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      border: "1px solid rgba(255,255,255,0.1)",
      backdropFilter: "blur(16px) saturate(140%)",
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div
      className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      style={{ 
        background: "linear-gradient(135deg, rgba(211,167,95,0.1) 0%, rgba(159,120,96,0.05) 100%)",
        border: "1px solid rgba(211,167,95,0.3)"
      }}
    />
    <div className="designer-card-header relative flex flex-col items-center gap-2 sm:gap-3 lg:gap-4 text-center flex-shrink-0">
      <div className="relative h-16 w-16 sm:h-18 sm:w-18 lg:h-20 lg:w-20 flex-shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--kc-gold-200)]/60 bg-white/10" />
        {avatar ? (
          <img
            src={avatar}
            alt={`${name} avatar`}
            className="relative z-10 h-full w-full rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-[#111826] text-xl sm:text-2xl lg:text-2xl font-semibold">
            {name?.charAt(0) ?? "K"}
          </div>
        )}
        {verified ? (
          <span className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[var(--kc-gold-200)] bg-[var(--kc-gold-200)]/20 px-1.5 sm:px-2 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--kc-gold-200)] whitespace-nowrap">
            Verified
          </span>
        ) : null}
      </div>

      <div className="designer-card-header-text space-y-0.5 sm:space-y-1 w-full min-w-0 flex-shrink-0">
        <div className="flex items-center justify-center gap-1.5 min-w-0 px-2">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold tracking-[-0.02em] text-[var(--kc-cream-100)] truncate max-w-full">{name}</h3>
          {verified && (
            <Badge tone="gold" className="border-[var(--kc-gold-200)]/30 bg-[var(--kc-gold-200)]/15 text-[var(--kc-gold-200)] text-[0.55rem] sm:text-[0.6rem] px-1 sm:px-1.5 py-0.5 shrink-0">
              ✓
            </Badge>
          )}
        </div>
        {handle ? (
          <p className="text-[11px] sm:text-xs font-medium text-[var(--kc-gold-200)] truncate px-2" style={{ minHeight: '16px' }}>
            @{handle}
          </p>
        ) : (
          <div style={{ minHeight: '16px' }} />
        )}
        {location ? (
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[var(--kc-beige-300)]/90 flex items-center justify-center gap-1 truncate px-2" style={{ minHeight: '14px' }}>
            <MapPin size={9} className="sm:w-2.5 sm:h-2.5 text-[var(--kc-gold-200)]/70 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        ) : (
          <div style={{ minHeight: '14px' }} />
        )}
      </div>

      {badges.length || openForCommissions ? (
        <div className="flex flex-wrap justify-center gap-2">
          {badges.map((badge) => (
            <Badge
              key={badge.id ?? badge.label}
              tone={badge.tone ?? "neutral"}
              icon={badge.icon}
              className="border-white/30 bg-white/15 text-[var(--kc-cream-100)] font-medium"
            >
              {badge.label}
            </Badge>
          ))}
          {openForCommissions ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--kc-gold-200)]/50 bg-[var(--kc-gold-200)]/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--kc-gold-200)]">
              <CalendarClock size={14} />
              Commissions Open
            </span>
          ) : null}
        </div>
      ) : null}

      {bio ? (
        <div className="designer-card-bio-wrapper flex-shrink-0" style={{ minHeight: '48px', maxHeight: '48px' }}>
          <p 
            className="designer-card-bio text-[11px] sm:text-xs leading-relaxed text-[var(--kc-cream-100)]/90 px-2 text-center" 
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.5',
            }}
          >
            {bio}
          </p>
        </div>
      ) : (
        <div className="flex-shrink-0" style={{ minHeight: '48px', maxHeight: '48px' }}>
          <p className="text-[10px] sm:text-[11px] italic text-[var(--kc-beige-300)]/80 px-2 text-center line-clamp-2">Crafting unique pieces with passion and precision.</p>
        </div>
      )}

      {styles.length ? (
        <div className="designer-card-styles flex flex-wrap justify-center gap-1 sm:gap-1.5 px-2 flex-shrink-0" style={{ height: '56px', overflow: 'hidden' }}>
          {styles.slice(0, 3).map((style) => (
            <TagChip key={style} className="border-white/25 bg-white/12 text-[var(--kc-cream-100)] font-medium text-[0.6rem] sm:text-[0.65rem] px-2 sm:px-2.5 py-0.5 sm:py-1">
              <span className="truncate max-w-[60px] sm:max-w-[80px]">{style}</span>
            </TagChip>
          ))}
        </div>
      ) : (
        <div className="flex-shrink-0" style={{ height: '56px' }} />
      )}

      {products.length ? (
        <div className="designer-card-products flex flex-wrap justify-center gap-1 sm:gap-1.5 px-2 flex-shrink-0" style={{ height: '56px', overflow: 'hidden' }}>
          {products.slice(0, 3).map((product) => (
            <span
              key={product}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/25 bg-white/12 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-medium text-[var(--kc-cream-100)]"
            >
              <Shirt size={10} className="sm:w-3 sm:h-3 text-[var(--kc-gold-200)] shrink-0" />
              <span className="truncate max-w-[60px] sm:max-w-[80px]">{product}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="flex-shrink-0" style={{ height: '56px' }} />
      )}
    </div>

    <div
      className="designer-card-stats grid grid-cols-3 gap-2 sm:gap-3 rounded-[12px] sm:rounded-[16px] border border-white/20 bg-white/10 p-2.5 sm:p-3 backdrop-blur-sm flex-shrink-0"
      style={{ 
        backdropFilter: "blur(12px)",
        minHeight: '56px',
        maxHeight: '56px',
      }}
    >
      <div className="designer-card-stat flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
        <span className="designer-card-stat-icon flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white/15 border border-white/20 text-[var(--kc-gold-200)]">
          <UserPlus size={12} className="sm:w-3.5 sm:h-3.5" />
        </span>
        <p className="designer-card-stat-value text-xs sm:text-sm font-semibold text-[var(--kc-cream-100)] truncate">
          {typeof metrics.followers === 'number' ? metrics.followers.toLocaleString() : metrics.followers ?? 0}
        </p>
      </div>
      <div className="designer-card-stat flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
        <span className="designer-card-stat-icon flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white/15 border border-white/20 text-[var(--kc-gold-200)]">
          <ShoppingBag size={12} className="sm:w-3.5 sm:h-3.5" />
        </span>
        <p className="designer-card-stat-value text-xs sm:text-sm font-semibold text-[var(--kc-cream-100)] truncate">
          {typeof metrics.pieces === 'number' ? metrics.pieces.toLocaleString() : metrics.pieces ?? 0}
        </p>
      </div>
      <div className="designer-card-stat flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
        <span className="designer-card-stat-icon flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white/15 border border-white/20 text-[var(--kc-gold-200)]">
          <Star size={12} className="sm:w-3.5 sm:h-3.5" />
        </span>
        <p className="designer-card-stat-value text-xs sm:text-sm font-semibold text-[var(--kc-cream-100)] truncate">
          {typeof metrics.rating === 'number' ? metrics.rating.toFixed(1) : metrics.rating ?? "—"}
        </p>
      </div>
    </div>

    <div className="designer-card-actions relative z-10 flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-2.5 flex-shrink-0 mt-auto">
      <GoldButton 
        className="w-full sm:flex-1 sm:min-w-[120px] bg-gradient-to-r from-[var(--kc-gold-200)] to-[#9F7860] shadow-lg shadow-[var(--kc-gold-200)]/20 transition-all duration-150 hover:scale-[1.02] hover:shadow-xl hover:shadow-[var(--kc-gold-200)]/30 text-[11px] sm:text-xs px-3 sm:px-4 py-2" 
        icon={<ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />} 
        iconPosition="right" 
        onClick={onViewProfile}
      >
        View Profile
      </GoldButton>
      <FollowButton onToggle={onFollow} className="w-full sm:flex-1 sm:min-w-[100px] text-[11px] sm:text-xs px-3 sm:px-4 py-2" />
      {openForCommissions ? (
        <KCButton
          onClick={onCommission}
          className="w-full sm:flex-1 sm:min-w-[110px] rounded-[12px] sm:rounded-[14px] border border-white/15 bg-white/5 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold text-[var(--kc-cream-100)] transition-all duration-150 hover:bg-white/10 hover:border-white/20"
          icon={<MessageCircle size={12} className="sm:w-3.5 sm:h-3.5" />}
        >
          Commission
        </KCButton>
      ) : null}
    </div>
  </motion.article>
);

export default {
  GoldButton,
  FollowButton,
  StatPill,
  TagChip,
  Badge,
  RatingStars,
  StudioCard,
  EmptyState,
  TableLite,
  PillTabs,
  Stepper,
  ModalSheet,
  FilterDrawer,
  GalleryGrid,
  ReviewList,
  Pagination,
  DesignerCard,
};
