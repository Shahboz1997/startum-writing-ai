'use client';

import { motion } from 'framer-motion';

const appleEase = [0.16, 1, 0.3, 1];

export const landingFadeInUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-48px' },
  transition: { ease: appleEase, duration: 0.8 },
};

export const LANDING_SECTION =
  'py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-slate-200/50 dark:border-white/5';
export const LANDING_CONTAINER = 'max-w-6xl mx-auto px-4';

const ACCENT_PANEL = {
  amber: 'border-amber-200/80 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-950/25 shadow-amber-900/5',
  sky: 'border-sky-200/80 dark:border-sky-500/20 bg-sky-50/70 dark:bg-sky-950/25 shadow-sky-900/5',
  indigo: 'border-indigo-200/80 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/20 shadow-indigo-900/5',
};

const ACCENT_MENTION = {
  amber: 'text-amber-800/90 dark:text-amber-300/90',
  sky: 'text-sky-800/90 dark:text-sky-300/90',
  indigo: 'text-indigo-800/90 dark:text-indigo-300/90',
};

export function LandingSection({ id, ariaLabelledby, children, className = '' }) {
  return (
    <section id={id} aria-labelledby={ariaLabelledby} className={`${LANDING_SECTION} ${className}`}>
      <div className={LANDING_CONTAINER}>{children}</div>
    </section>
  );
}

export function LandingSectionHeader({ tagline, title, id, description, className = '' }) {
  return (
    <motion.div {...landingFadeInUp} className={`text-center mb-8 sm:mb-10 ${className}`}>
      {tagline ? (
        <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
          {tagline}
        </span>
      ) : null}
      {title ? (
        <h2
          id={id}
          className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white"
        >
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}

export function LandingCard({ children, className = '', as: Tag = motion.div, motionProps = landingFadeInUp }) {
  const MotionTag = Tag === motion.div ? motion.div : Tag;
  return (
    <MotionTag
      {...(Tag === motion.div ? motionProps : {})}
      className={`rounded-[1.75rem] border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-white/5 backdrop-blur-md p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/25 ${className}`}
    >
      {children}
    </MotionTag>
  );
}

export function LandingStepCard({ step, icon: Icon, title, description }) {
  return (
    <LandingCard className="relative overflow-hidden">
      <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/90 dark:text-indigo-400/90">
        {String(step).padStart(2, '0')}
      </div>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200/30 bg-indigo-100 dark:border-indigo-700/25 dark:bg-indigo-900/35">
        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="mb-2 pr-10 text-sm font-semibold tracking-wide text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </LandingCard>
  );
}

export function LandingIconCard({ icon: Icon, title, description, badge }) {
  return (
    <LandingCard className="group transition-all duration-300 hover:border-indigo-300/40 dark:hover:border-indigo-500/25">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200/30 bg-indigo-100 dark:border-indigo-700/25 dark:bg-indigo-900/35 transition-transform duration-300 group-hover:scale-[1.03]">
        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white sm:text-base">{title}</h3>
        {badge ? (
          <span className="rounded-md bg-teal-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </LandingCard>
  );
}

export function LandingInfoPanel({ accent = 'indigo', children, className = '' }) {
  return (
    <motion.div
      {...landingFadeInUp}
      className={`rounded-[1.75rem] border p-5 sm:p-6 shadow-xl dark:shadow-black/30 ${ACCENT_PANEL[accent]} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function LandingMentionLine({ accent = 'indigo', children, className = '' }) {
  return (
    <p className={`text-[11px] font-medium leading-relaxed ${ACCENT_MENTION[accent]} ${className}`}>{children}</p>
  );
}

export function LandingTextLink({ href, children, accent = 'indigo', onClick }) {
  const linkClass =
    accent === 'sky'
      ? 'font-semibold text-sky-700 underline decoration-sky-300/80 underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:decoration-sky-600/50 dark:hover:text-sky-200'
      : accent === 'amber'
        ? 'font-semibold text-amber-800 underline decoration-amber-300/80 underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:decoration-amber-600/50'
        : 'font-semibold text-indigo-700 underline decoration-indigo-300/80 underline-offset-2 hover:text-indigo-800 dark:text-indigo-300 dark:decoration-indigo-600/50';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass} onClick={onClick}>
      {children}
    </a>
  );
}
