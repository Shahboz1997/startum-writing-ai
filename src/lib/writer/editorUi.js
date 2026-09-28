export function syncEditorHeights(editorRef, highlightRef, minHeight = 320) {
  if (!editorRef?.current) return;
  editorRef.current.style.height = 'auto';
  const newHeight = Math.max(minHeight, editorRef.current.scrollHeight);
  editorRef.current.style.height = `${newHeight}px`;
  if (highlightRef?.current) {
    highlightRef.current.style.height = `${newHeight}px`;
  }
}

export function handleEditorScroll(e, highlightRef) {
  const { scrollTop, scrollLeft } = e.target;
  requestAnimationFrame(() => {
    if (highlightRef?.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  });
}

export function scrollToFeedbackForm() {
  document.getElementById('stratum-feedback-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => {
    document.querySelector('#stratum-feedback-section input[name="name"]')?.focus();
  }, 400);
}

export function scrollToEditor({ focus = true } = {}) {
  const element =
    document.getElementById('essay-editor') ||
    document.querySelector('[data-stratum-essay-input]');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (focus && typeof element.focus === 'function') {
      window.setTimeout(() => {
        element.focus({ preventScroll: true });
      }, 350);
    }
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function playClickSound() {
  const audioCtx = new (window.AudioContext || window.AudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.1);
}

export function playAlertSound() {
  const context = new (window.AudioContext || window.AudioContext)();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, context.currentTime);
  oscillator.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.1);
}

export function getEssayWordCount(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length || 0;
}
