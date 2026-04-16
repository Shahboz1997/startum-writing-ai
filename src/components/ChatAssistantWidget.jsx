"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function readWorkspace(workspaceKey) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(workspaceKey);
    if (!raw) return null;
    const w = JSON.parse(raw);
    if (!w || typeof w !== "object") return null;
    return w;
  } catch {
    return null;
  }
}

function inferTaskTypeFromWorkspace(w) {
  const activeTab = typeof w?.activeTab === "string" ? w.activeTab : "";
  if (activeTab === "Task 1") return "Task 1";
  if (activeTab === "Task 2") return "Task 2";
  // Best-effort: if one draft is non-empty and the other is empty, prefer that.
  const t1 = typeof w?.t1 === "string" ? w.t1.trim() : "";
  const t2 = typeof w?.t2 === "string" ? w.t2.trim() : "";
  if (t1 && !t2) return "Task 1";
  if (t2 && !t1) return "Task 2";
  return null;
}

export default function ChatAssistantWidget() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const userStorageId = useMemo(() => {
    const id = session?.user?.id || session?.user?.email;
    return typeof id === "string" && id.trim().length > 0 ? id.trim() : "anon";
  }, [session?.user?.id, session?.user?.email]);
  const workspaceKey = useMemo(
    () => `ielts_stratum_workspace_v1:${userStorageId}`,
    [userStorageId]
  );

  const [open, setOpen] = useState(false);
  const [taskType, setTaskType] = useState("Task 2");
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [chartImage, setChartImage] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content:
        "Hi. Paste your Task prompt and draft, then ask me what to improve (coherence, grammar, vocabulary, intro/conclusion, etc.).",
    },
  ]);

  // Auto-sync context from the main editor workspace (localStorage).
  // Only auto-fills when fields are empty or when the panel is opened.
  useEffect(() => {
    if (!isAuthed) return;
    if (typeof window === "undefined") return;

    const applyWorkspace = (w) => {
      if (!w) return;
      const inferred = inferTaskTypeFromWorkspace(w);
      // If the editor knows the active tab, prefer it over heuristic inference.
      setTaskType((prev) => inferred || prev);
      setPrompt((prev) => {
        if (prev && prev.trim().length > 0) return prev;
        const p =
          inferred === "Task 1"
            ? w?.promptT1
            : inferred === "Task 2"
              ? w?.promptT2
              : w?.activeTab === "Task 1"
                ? w?.promptT1
                : w?.activeTab === "Task 2"
                  ? w?.promptT2
                  : w?.promptT2 || w?.promptT1;
        return typeof p === "string" ? p : prev;
      });
      setDraft((prev) => {
        if (prev && prev.trim().length > 0) return prev;
        const d =
          inferred === "Task 1"
            ? w?.t1
            : inferred === "Task 2"
              ? w?.t2
              : w?.activeTab === "Task 1"
                ? w?.t1
                : w?.activeTab === "Task 2"
                  ? w?.t2
                  : w?.t2 || w?.t1;
        return typeof d === "string" ? d : prev;
      });
      setChartImage((prev) => {
        if (prev && prev.trim().length > 0) return prev;
        const img = w?.image;
        return typeof img === "string" ? img : prev;
      });
    };

    // Apply immediately on mount.
    applyWorkspace(readWorkspace(workspaceKey));

    // Re-apply when the widget is opened (in case user typed since mount).
    if (open) applyWorkspace(readWorkspace(workspaceKey));

    // Listen to storage events (cross-tab). Same-tab writes won't trigger this,
    // so we also poll lightly while the widget is open.
    const onStorage = (e) => {
      if (e?.key === workspaceKey) applyWorkspace(readWorkspace(workspaceKey));
    };
    window.addEventListener("storage", onStorage);

    let poll = null;
    if (open) {
      poll = window.setInterval(() => applyWorkspace(readWorkspace(workspaceKey)), 1500);
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      if (poll) window.clearInterval(poll);
    };
  }, [open, isAuthed, workspaceKey]);

  const bottomRef = useRef(null);
  useEffect(() => {
    if (!isAuthed) return;
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages.length, busy, isAuthed]);

  const canSend = useMemo(() => {
    return !busy && input.trim().length > 0;
  }, [busy, input]);

  async function sendText(textRaw) {
    if (busy) return;
    setError("");
    const text = String(textRaw || "").trim();
    if (!text) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskType,
          prompt,
          draft,
          image: chartImage,
          messages: next,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setMessages((m) => [...m, { role: "assistant", content: data?.reply || "" }]);
    } catch (e) {
      setError(e?.message || "Assistant request failed");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!canSend) return;
    return sendText(input);
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content:
          "Cleared. Paste your Task prompt and draft, then ask me what to improve.",
      },
    ]);
    setError("");
  }

  // Only show after registration/login (authenticated session).
  if (!isAuthed) return null;

  return (
    <div
      className="fixed z-[200]"
      style={{
        right: "calc(1rem + env(safe-area-inset-right))",
        bottom: "calc(1rem + env(safe-area-inset-bottom))",
      }}
    >
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-x-0 bottom-0 sm:static sm:mb-3 sm:w-[92vw] sm:max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur shadow-2xl overflow-hidden h-[85dvh] sm:h-[560px] sm:max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                AI Writing Assistant
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Task 1 / Task 2 coach
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={clearChat}
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500"
                aria-label="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-3 space-y-2 border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTaskType("Task 1")}
                className={cx(
                  "px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-colors",
                  taskType === "Task 1"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
              >
                Task 1
              </button>
              <button
                type="button"
                onClick={() => setTaskType("Task 2")}
                className={cx(
                  "px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-colors",
                  taskType === "Task 2"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
              >
                Task 2
              </button>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
                Context (optional)
              </summary>
              <div className="mt-2 space-y-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Task prompt (question)"
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400"
                />
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Your draft (paste essay)"
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400"
                />
              </div>
            </details>
          </div>

          <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={cx(
                  "rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-indigo-600 text-white ml-8"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 mr-8"
                )}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="rounded-2xl px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 mr-8">
                Thinking…
              </div>
            )}
            {error && (
              <div className="rounded-2xl px-3 py-2 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60">
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  sendText(
                    taskType === "Task 1"
                      ? "Write the full Task 1 essay (160–190 words) from the chart/diagram. Include intro, overview, and 2 detail paragraphs with key comparisons and numbers."
                      : "Give me a Task 2 band-7+ structure: thesis + 2 body topic sentences + example ideas for each paragraph."
                  )
                }
                className={cx(
                  "px-3 py-1.5 rounded-2xl text-[11px] font-semibold border transition-colors",
                  busy
                    ? "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
              >
                {taskType === "Task 1" ? "Write full essay" : "Make structure"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  sendText(
                    "Improve my draft without changing meaning. Fix coherence, grammar, and vocabulary. Return an improved full version and a short list of changes."
                  )
                }
                className={cx(
                  "px-3 py-1.5 rounded-2xl text-[11px] font-semibold border transition-colors",
                  busy
                    ? "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
              >
                Improve draft
              </button>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for improvements…"
                rows={2}
                className="flex-1 px-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendText(e.currentTarget.value);
                  }
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={!canSend}
                className={cx(
                  "h-10 w-10 rounded-2xl flex items-center justify-center border transition-all active:scale-95",
                  canSend
                    ? "bg-slate-900 text-white border-slate-900 hover:bg-indigo-600 hover:border-indigo-600"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                )}
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-500">
              Enter = send • Shift+Enter = new line
            </div>
          </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "w-14 h-14 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-transform",
          open ? "sm:translate-y-0" : ""
        )}
        aria-label="Open AI assistant"
      >
        <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </button>
    </div>
  );
}

