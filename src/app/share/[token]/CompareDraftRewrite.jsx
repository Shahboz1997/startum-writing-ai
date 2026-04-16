"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function stripMarkTags(text) {
  const s = String(text ?? "");
  // Only remove <mark> wrappers coming from the model output.
  return s.replace(/<\/?mark\b[^>]*>/gi, "");
}

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function getScrollRatio(el) {
  if (!el) return 0;
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return 0;
  return clamp01(el.scrollTop / max);
}

function setScrollRatio(el, ratio) {
  if (!el) return;
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return;
  el.scrollTop = Math.round(max * clamp01(ratio));
}

export default function CompareDraftRewrite({ draft, rewrite }) {
  const [syncScroll, setSyncScroll] = useState(true);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const lockRef = useRef(false);

  const draftText = useMemo(() => stripMarkTags(draft).trim(), [draft]);
  const rewriteText = useMemo(() => stripMarkTags(rewrite).trim(), [rewrite]);
  const hasDraft = Boolean(draftText);
  const hasRewrite = Boolean(rewriteText);

  useEffect(() => {
    if (!syncScroll) return;
    // After hydration/layout, align both panes to top.
    setScrollRatio(leftRef.current, 0);
    setScrollRatio(rightRef.current, 0);
  }, [syncScroll, draft, rewrite]);

  function sync(from, to) {
    if (!syncScroll) return;
    if (lockRef.current) return;
    lockRef.current = true;
    try {
      const ratio = getScrollRatio(from);
      setScrollRatio(to, ratio);
    } finally {
      // next frame unlock to avoid feedback loop
      requestAnimationFrame(() => {
        lockRef.current = false;
      });
    }
  }

  if (!hasDraft && !hasRewrite) return null;

  return (
    <div className="mt-6 rounded-[2.25rem] border border-white/10 bg-black/20 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Compare</p>
          <p className="mt-1 text-[12px] font-semibold text-white/70">
            Side-by-side view of your draft vs the academic rewrite
          </p>
        </div>

        <label className="inline-flex select-none items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white/80">
          <input
            type="checkbox"
            className="h-4 w-4 accent-white"
            checked={syncScroll}
            onChange={(e) => setSyncScroll(e.target.checked)}
          />
          Sync scroll
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">DRAFT ORIGINAL</p>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">VS</p>
          </div>
          <div
            ref={leftRef}
            onScroll={() => sync(leftRef.current, rightRef.current)}
            className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-semibold leading-relaxed text-white/80"
          >
            {hasDraft ? draftText : "—"}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">ACADEMIC SUGGESTED REWRITE</p>
          <div
            ref={rightRef}
            onScroll={() => sync(rightRef.current, leftRef.current)}
            className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-semibold leading-relaxed text-white/80"
          >
            {hasRewrite ? rewriteText : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

