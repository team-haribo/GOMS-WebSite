"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type RoleKey = string;
type RoleStatus = Record<string, boolean>;

const ROLE_COLOR: Record<string, string> = {
  iOS: "#F5A623",
  Android: "#3B82F6",
  Backend: "#10B981",
  Flutter: "#06B6D4",
  DevOps: "#8B5CF6",
  Design: "#EC4899",
};

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "url" | "role" | "username" | "select";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  pattern?: string;
  patternError?: string;
  minLength?: number;
  maxLength?: number;
  builtin?: boolean;
  hidden?: boolean;
  options?: string[];
}

interface PrivacyPolicy {
  enabled: boolean;
  summary: string;
  details: string;
}

interface FormConfig {
  requireEmailAuth: boolean;
  privacyPolicy: PrivacyPolicy;
  fields: FormField[];
}

interface ApplicantSession {
  authenticated: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

// Google Identity Services
interface GoogleCredentialResponse {
  credential: string;
}
interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (r: GoogleCredentialResponse) => void;
      ux_mode?: "popup" | "redirect";
    }) => void;
    renderButton: (
      el: HTMLElement,
      opts: {
        type?: "standard" | "icon";
        theme?: "outline" | "filled_blue" | "filled_black";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        shape?: "rectangular" | "pill" | "circle" | "square";
        logo_alignment?: "left" | "center";
        width?: number;
      },
    ) => void;
    disableAutoSelect: () => void;
  };
}
declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const URL_REGEX = /^(https?:\/\/|www\.)[^\s]+$/i;

// localStorage key for draft autosave. Scoped per role so different
// roles don't stomp on each other's drafts.
const DRAFT_KEY_PREFIX = "goms-apply-draft";
const draftKey = (role: string | undefined) =>
  `${DRAFT_KEY_PREFIX}:${role ?? "default"}`;

/**
 * Parse a `s{YY}{NNN}@gsm.hs.kr` style school email into the structured
 * info we can derive from it:
 *
 *   - entryYear  : 4-digit calendar year of school entry (e.g. 2023)
 *   - generation : 기수 — equals entryYear - 2016 (2023 → 7기, 2024 → 8기...)
 *   - currentGrade : 1~3, computed from current calendar year (capped)
 *   - classNo    : 1~4, derived from the per-grade roll number assuming
 *                  4 classes of 18 students sequenced 1-72
 *   - rollNo     : 1~18 within the class
 *   - studentId  : 4-digit `{currentGrade}{classNo}{rollNo zero-padded}`
 *                  matching the existing form's student ID format
 *
 * Returns null if the email doesn't match the expected shape.
 */
function parseSchoolEmail(email: string | undefined): {
  entryYear: number;
  generation: string;
  currentGrade: number;
  classNo: number;
  rollNo: number;
  studentId: string;
} | null {
  if (!email) return null;
  const m = email.toLowerCase().match(/^s(\d{2})(\d{3})@gsm\.hs\.kr$/);
  if (!m) return null;
  const yy = parseInt(m[1], 10);
  const seq = parseInt(m[2], 10);
  if (!Number.isFinite(yy) || !Number.isFinite(seq)) return null;
  if (seq < 1 || seq > 72) return null;

  // Two-digit years are unambiguous in this context (school started long
  // after 2000 and we're nowhere near 2099).
  const entryYear = 2000 + yy;
  const generation = `${entryYear - 2016}기`;

  // Current grade — clamp into 1..3 so we never produce a grade higher
  // than the school actually has, even for graduated students.
  const now = new Date();
  // School year here pivots in March; close enough for our purposes to
  // just use calendar year delta + 1.
  const rawGrade = now.getFullYear() - entryYear + 1;
  const currentGrade = Math.max(1, Math.min(3, rawGrade));

  // 4 classes × 18 students = 72 sequential roll numbers per grade.
  // Class 1 = 1-18, Class 2 = 19-36, Class 3 = 37-54, Class 4 = 55-72.
  const classNo = Math.floor((seq - 1) / 18) + 1;
  const rollNo = ((seq - 1) % 18) + 1;
  const studentId = `${currentGrade}${classNo}${String(rollNo).padStart(2, "0")}`;

  return { entryYear, generation, currentGrade, classNo, rollNo, studentId };
}

export default function ApplyForm({
  status,
  lockedRole,
}: {
  status: RoleStatus;
  lockedRole?: RoleKey;
}) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [draftRestored, setDraftRestored] = useState<Date | null>(null);
  // If the applicant already has an active application (new / reviewing /
  // passed) for the role they're trying to apply to, we block the form
  // and show a friendly notice instead. rejected + hired don't block.
  const [activeBlock, setActiveBlock] = useState<{
    status: "new" | "reviewing" | "passed";
    role: string;
    createdAt: string;
  } | null>(null);

  // Auth
  const [session, setSession] = useState<ApplicantSession | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Fetch form config on mount + restore any saved draft for this role.
  useEffect(() => {
    fetch("/api/form-config")
      .then((r) => r.json())
      .then((d: { config: FormConfig }) => {
        setConfig(d.config);
        // Initialize default values
        const init: Record<string, string> = {};
        for (const f of d.config.fields) {
          if (f.id === "role") {
            init[f.id] =
              lockedRole ?? Object.keys(status).find((r) => status[r]) ?? "";
          } else {
            init[f.id] = "";
          }
        }

        // Restore draft if present (client-side only, no PII ever leaves
        // the device — it lives entirely in localStorage).
        if (typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem(draftKey(lockedRole));
            if (raw) {
              const parsed = JSON.parse(raw) as {
                values?: Record<string, string>;
                privacyAgreed?: boolean;
                savedAt?: string;
              };
              if (parsed.values) {
                for (const [k, v] of Object.entries(parsed.values)) {
                  if (typeof v === "string" && k in init) init[k] = v;
                }
              }
              if (parsed.privacyAgreed === true) setPrivacyAgreed(true);
              if (parsed.savedAt) setDraftRestored(new Date(parsed.savedAt));
            }
          } catch {
            /* corrupted draft — ignore */
          }
        }

        setValues(init);
      })
      .catch(() => setError("폼 설정을 불러올 수 없어요."));
  }, [lockedRole, status]);

  // Fetch auth session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ authenticated: false }));
  }, []);

  // Google login is always required. `requireEmailAuth` only controls whether
  // the account must be @gsm.hs.kr.
  //
  // Cross-flow safety: an applicant might have signed in on the status
  // page with a non-school Google account (which is allowed there), and
  // the resulting cookie carries over to this page. If the form requires
  // a school account, treat that session as unauthenticated for apply
  // purposes — show the Google login overlay so they can switch accounts.
  const restrictDomain = config?.requireEmailAuth === true;
  const ALLOWED_APPLICANT_DOMAIN = "gsm.hs.kr";
  const sessionEmail = session?.email?.toLowerCase() ?? "";
  const sessionMeetsDomain =
    !restrictDomain ||
    sessionEmail.endsWith(`@${ALLOWED_APPLICANT_DOMAIN}`);
  const isAuthed =
    session?.authenticated === true && sessionMeetsDomain;
  const blurred = !isAuthed || activeBlock !== null;
  const showOverlay =
    activeBlock === null && session !== null && !isAuthed;

  // Auto-fill 기수 from a @gsm.hs.kr school email and lock that field.
  // 학번 stays user-editable — only the generation (기수) is inferred
  // from the email, since 학번 can change between school years and
  // we don't want to override what the student is currently using.
  const schoolEmailInfo = useMemo(
    () =>
      sessionMeetsDomain &&
      sessionEmail.endsWith(`@${ALLOWED_APPLICANT_DOMAIN}`)
        ? parseSchoolEmail(sessionEmail)
        : null,
    [sessionEmail, sessionMeetsDomain],
  );
  const lockedFieldIds = useMemo(
    () =>
      schoolEmailInfo
        ? new Set<string>(["generation"])
        : new Set<string>(),
    [schoolEmailInfo],
  );
  // Once we know the inferred generation, write it into the form state
  // and keep it in sync if the email ever changes (e.g. user re-logs in).
  //
  // `config` is in the deps too — the form-config fetch effect calls
  // setValues(init) every time it runs, which would wipe out the
  // auto-filled generation. By re-running when config changes, we
  // re-apply the value right after any reset.
  useEffect(() => {
    if (!schoolEmailInfo) return;
    if (!config) return;
    setValues((prev) => {
      if (prev.generation === schoolEmailInfo.generation) return prev;
      return { ...prev, generation: schoolEmailInfo.generation };
    });
    setFieldErrors((prev) => {
      if (!prev.generation) return prev;
      const next = { ...prev };
      delete next.generation;
      return next;
    });
  }, [schoolEmailInfo, config]);

  // Detect if the applicant already has an active application for the role
  // they're looking at. If so, we blur the form and show a friendly
  // "already applied" overlay with links to their status page / other roles.
  //
  // Active = new / reviewing / passed. rejected (탈락) and hired (최종합격)
  // are allowed to re-apply and are skipped here.
  //
  // The comparison uses the role *label* ("iOS", "Backend", ...) because
  // that's what's stored on the Application record and what `lockedRole`
  // already contains on role-scoped pages. On the generic /apply page
  // (no lockedRole) we watch the currently selected value in the form.
  const currentRoleLabel = lockedRole ?? values.role ?? "";
  useEffect(() => {
    if (!isAuthed) {
      setActiveBlock(null);
      return;
    }
    if (!currentRoleLabel) {
      setActiveBlock(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/applications/me", {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setActiveBlock(null);
          return;
        }
        const data = (await res.json()) as {
          applications?: Array<{
            role?: string;
            status: "new" | "reviewing" | "passed" | "rejected" | "hired";
            createdAt: string;
            source: "live" | "archive";
          }>;
        };
        const ACTIVE = new Set(["new", "reviewing", "passed"]);
        const hit = data.applications?.find(
          (a) =>
            a.source === "live" &&
            a.role === currentRoleLabel &&
            ACTIVE.has(a.status),
        );
        if (cancelled) return;
        if (hit) {
          setActiveBlock({
            status: hit.status as "new" | "reviewing" | "passed",
            role: hit.role ?? currentRoleLabel,
            createdAt: hit.createdAt,
          });
        } else {
          setActiveBlock(null);
        }
      } catch {
        if (!cancelled) setActiveBlock(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthed, currentRoleLabel]);

  // Autosave the current form values to localStorage whenever they change.
  // Debounced lightly so we're not hammering storage on every keystroke.
  //
  // Trigger condition: at least one *user-input text field* (text /
  // textarea / username / url) has 2+ characters of real content. Role
  // selection, locked auto-fills (기수), and the privacy checkbox alone
  // do NOT count — otherwise clicking "새로 시작" would immediately
  // re-save the empty form (because the locked 기수 is still set).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!config) return;
    if (done) return; // already submitted, don't save

    const meaningfulInput = config.fields.some((f) => {
      // Only count fields the user actually types into
      if (
        f.type !== "text" &&
        f.type !== "textarea" &&
        f.type !== "username" &&
        f.type !== "url"
      ) {
        return false;
      }
      // Skip locked / auto-filled fields — they're not user input
      if (lockedFieldIds.has(f.id)) return false;
      const v = (values[f.id] ?? "").trim();
      return v.length >= 2;
    });

    if (!meaningfulInput) {
      // No meaningful content → make sure we don't keep a stale draft
      // around from before the user cleared everything.
      try {
        window.localStorage.removeItem(draftKey(lockedRole));
      } catch {
        /* ignore */
      }
      return;
    }

    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey(lockedRole),
          JSON.stringify({
            values,
            privacyAgreed,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        /* quota exceeded or disabled — ignore */
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [values, privacyAgreed, config, done, lockedRole, lockedFieldIds]);

  // Google credential handler
  async function handleCredential(response: GoogleCredentialResponse) {
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Google 로그인 실패");
        return;
      }
      setSession({
        authenticated: true,
        email: data.email,
        name: data.name,
        picture: data.picture,
      });
    } catch {
      setAuthError("네트워크 오류가 발생했어요.");
    }
  }

  // Render Google button when overlay shown
  useEffect(() => {
    if (!gsiReady || !clientId || !showOverlay) return;
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      ux_mode: "popup",
    });
    if (btnRef.current) {
      btnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(btnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        logo_alignment: "left",
        width: 280,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gsiReady, clientId, showOverlay]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false });
    window.google?.accounts?.id?.disableAutoSelect();
  }

  function setField(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    // Live-clear the field's error as soon as the user starts editing.
    // Re-validation happens on blur and on submit so we don't pester
    // them mid-typing with red text.
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function validateAndSetFieldError(field: FormField, value: string) {
    const err = validateField(field, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[field.id] = err;
      else delete next[field.id];
      return next;
    });
  }

  // Client-side validation per field
  function validateField(field: FormField, value: string): string | null {
    if (!value || value.trim() === "") {
      if (field.required) return `${field.label}을(를) 입력해주세요.`;
      return null;
    }
    if (field.type === "role") {
      if (!status[value]) return `${field.label}이(가) 잘못됐어요.`;
      return null;
    }
    // select-type OR any field with explicit options behaves the same way:
    // value must match one of the listed options
    if (
      field.type === "select" ||
      (field.options && field.options.length > 0)
    ) {
      if (!field.options || !field.options.includes(value)) {
        return `${field.label}을(를) 선택해주세요.`;
      }
      return null;
    }
    if (field.type === "url") {
      // Require an explicit http(s):// scheme — bare strings like "github
      // 어쩌고" shouldn't pass the URL constructor + "https://" trick.
      if (!/^https?:\/\//i.test(value)) {
        return `${field.label}은(는) http:// 또는 https:// 로 시작하는 링크여야 해요.`;
      }
      try {
        new URL(value);
      } catch {
        return `${field.label}은(는) 올바른 URL이어야 해요.`;
      }
      return null;
    }
    if (field.type === "username") {
      if (URL_REGEX.test(value) || value.includes("/")) {
        return `${field.label}에는 URL이 아닌 아이디만 입력해주세요.`;
      }
      // Fall through to the generic pattern / minLength / maxLength
      // checks below so admin-defined regexes still apply.
    }
    if (field.pattern) {
      try {
        const re = new RegExp(field.pattern);
        if (!re.test(value))
          return field.patternError ?? `${field.label} 형식이 올바르지 않아요.`;
      } catch {
        /* ignore */
      }
    }
    if (field.minLength !== undefined && value.length < field.minLength) {
      return `${field.label}은(는) 최소 ${field.minLength}자 이상이어야 해요. (현재 ${value.length}자)`;
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      return `${field.label}은(는) 최대 ${field.maxLength}자까지 입력할 수 있어요. (현재 ${value.length}자)`;
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!config) return;

    // Validate every field and collect per-field errors so they all
    // surface inline at once, instead of hiding behind a single top
    // banner and stopping at the first failure.
    const allErrors: Record<string, string> = {};
    for (const field of config.fields) {
      if (field.hidden) continue;
      const err = validateField(field, values[field.id] ?? "");
      if (err) allErrors[field.id] = err;
    }
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      // Pick the first field's error as the top banner so the user sees
      // a summary even if they're scrolled past the input
      const firstField = config.fields.find((f) => allErrors[f.id]);
      if (firstField) setError(allErrors[firstField.id]);
      return;
    }
    setFieldErrors({});

    if (config.privacyPolicy.enabled && !privacyAgreed) {
      setError("개인정보 수집 및 이용에 동의해야 지원할 수 있어요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: values, privacyAgreed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "제출 실패");
        return;
      }
      // Clear the autosaved draft on successful submit so the user gets
      // a clean slate if they come back to apply for another role.
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(draftKey(lockedRole));
        } catch {
          /* ignore */
        }
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[32px] bg-white border border-[#F5A623]/20 shadow-[0_20px_60px_-20px_rgba(245,166,35,0.25)] p-10 sm:p-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#F5A623] to-[#FF8C00] shadow-lg shadow-[#F5A623]/30 mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="text-3xl font-black text-[#1E1E1E] tracking-tight">
          지원이 완료됐어요!
        </h3>
        <p className="mt-3 text-gray-500 leading-relaxed">
          Team HARIBO가 검토 후 연락드릴게요. <br />
          감사합니다.
        </p>
        <a
          href="/apply/status"
          className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#F5A623]/10 text-[#F5A623] text-sm font-bold hover:bg-[#F5A623]/15 transition-colors"
        >
          내 지원 현황 확인하기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="rounded-[32px] bg-white border border-gray-100 p-10 text-center text-sm text-gray-400">
        폼을 불러오는 중...
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
        onReady={() => setGsiReady(true)}
      />
      <div className="relative">
        <form
          onSubmit={onSubmit}
          aria-hidden={blurred}
          className={`rounded-[32px] bg-white border border-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.12)] p-8 sm:p-12 space-y-6 transition-all duration-300 ${
            blurred ? "blur-[6px] pointer-events-none select-none opacity-70" : ""
          }`}
        >
          {/* Verified badge */}
          {isAuthed && session && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#F5A623]/5 to-[#FF8C00]/5 border border-[#F5A623]/15">
              <div className="flex items-center gap-3 min-w-0">
                {session.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.picture}
                    alt={session.name || session.email || ""}
                    className="w-9 h-9 rounded-full shrink-0"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-[#F5A623]/20 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-xs font-bold text-emerald-600">
                    ✓ 학생 확인됨
                  </span>
                  <p className="text-xs text-[#1E1E1E] font-semibold truncate">
                    {session.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="text-xs font-bold text-gray-500 hover:text-[#F5A623] px-3 py-1.5 rounded-lg hover:bg-white transition-colors shrink-0"
              >
                로그아웃
              </button>
            </div>
          )}

          {/* Draft-restored banner */}
          {draftRestored && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M21 12a9 9 0 11-3-6.7L21 9" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
                <div className="min-w-0">
                  <p className="font-bold text-blue-700">
                    이전에 작성하던 내용을 불러왔어요
                  </p>
                  <p className="mt-0.5 text-[11px] text-blue-500/80 tabular-nums">
                    마지막 저장 {draftRestored.toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem(draftKey(lockedRole));
                  }
                  // Reset to empty values, but PRESERVE the role selection
                  // and any locked auto-filled fields (e.g. 기수 from the
                  // school email) so they don't disappear on reset.
                  setValues((prev) => {
                    const next: Record<string, string> = {};
                    for (const k of Object.keys(prev)) {
                      if (k === "role" || lockedFieldIds.has(k)) {
                        next[k] = prev[k];
                      } else {
                        next[k] = "";
                      }
                    }
                    return next;
                  });
                  setFieldErrors({});
                  setPrivacyAgreed(false);
                  setDraftRestored(null);
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
              >
                새로 시작
              </button>
            </div>
          )}

          {/* Dynamic fields */}
          <DynamicFields
            config={config}
            values={values}
            setField={setField}
            status={status}
            fieldErrors={fieldErrors}
            onValidateField={validateAndSetFieldError}
            lockedFieldIds={lockedFieldIds}
          />

          {/* Privacy consent */}
          {config.privacyPolicy.enabled && (
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-[#F5A623] cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1E1E1E]">
                    개인정보 수집 및 이용에 동의합니다.{" "}
                    <span className="text-red-500">*</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {config.privacyPolicy.summary}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPrivacyOpen(true);
                    }}
                    className="mt-2 text-xs font-bold text-[#F5A623] hover:underline inline-flex items-center gap-1"
                  >
                    자세히 보기
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </label>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-4 rounded-2xl bg-[#F5A623] text-white font-bold text-base hover:bg-[#E8961A] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-[#F5A623]/25"
          >
            {submitting ? "제출 중..." : "지원서 제출하기"}
          </button>

          <style jsx>{`
            :global(.input) {
              width: 100%;
              padding: 0.85rem 1rem;
              border-radius: 0.85rem;
              background: #f9fafb;
              border: 1.5px solid #e5e7eb;
              font-size: 0.9rem;
              transition: all 0.2s;
              font-family: inherit;
            }
            :global(.input:focus) {
              outline: none;
              border-color: #f5a623;
              background: white;
              box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.15);
            }
          `}</style>
        </form>

        {/* Auth overlay */}
        {showOverlay && (
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 animate-fade-in-up">
            <div className="relative w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl border border-[#F5A623]/20 shadow-[0_25px_80px_-20px_rgba(245,166,35,0.3)] p-8 sm:p-10 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F5A623]/10 mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1E1E1E] tracking-tight">
                {restrictDomain
                  ? session?.authenticated
                    ? "다른 계정으로 로그인해주세요."
                    : "학생 인증이 필요해요."
                  : "Google 로그인이 필요해요."}
              </h3>
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                {restrictDomain ? (
                  session?.authenticated && session.email ? (
                    <>
                      현재{" "}
                      <span className="font-semibold text-[#1E1E1E]">
                        {session.email}
                      </span>{" "}
                      계정으로 로그인되어 있어요.
                      <br />
                      지원하려면{" "}
                      <span className="font-semibold text-[#1E1E1E]">
                        @gsm.hs.kr
                      </span>{" "}
                      Google 계정으로 다시 로그인해주세요.
                    </>
                  ) : (
                    <>
                      광주소프트웨어마이스터고등학교 학생만 지원할 수 있어요.
                      <br />
                      <span className="font-semibold text-[#1E1E1E]">
                        @gsm.hs.kr
                      </span>{" "}
                      Google 계정으로 로그인해주세요.
                    </>
                  )
                ) : (
                  <>
                    지원서를 작성하려면 먼저
                    <br />
                    Google 계정으로 로그인해주세요.
                  </>
                )}
              </p>

              {!clientId && (
                <p className="mt-5 text-xs text-red-500 font-semibold">
                  관리자에게 문의하세요: GOOGLE_CLIENT_ID가 설정되지 않았어요.
                </p>
              )}

              {clientId && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div ref={btnRef} className="flex justify-center" />
                  {!gsiReady && (
                    <p className="text-xs text-gray-400">
                      Google 로그인 버튼 불러오는 중...
                    </p>
                  )}
                </div>
              )}

              {authError && (
                <p className="mt-4 text-xs text-red-500 font-semibold">
                  {authError}
                </p>
              )}

              {/* Wrong-domain session — give a clear path to clear it */}
              {restrictDomain && session?.authenticated && (
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-4 text-xs font-bold text-gray-400 hover:text-[#F5A623] transition-colors"
                >
                  현재 계정 로그아웃
                </button>
              )}
            </div>
          </div>
        )}

        {/* Already-applied overlay — shown when an active application
            already exists for this applicant + role. Takes priority over
            the auth overlay (which is suppressed while activeBlock is set). */}
        {activeBlock && (() => {
          const statusLabel =
            activeBlock.status === "new"
              ? "검토 대기"
              : activeBlock.status === "reviewing"
                ? "검토 중"
                : "서류 통과";
          const statusTint =
            activeBlock.status === "passed"
              ? "from-emerald-500 to-teal-500"
              : activeBlock.status === "reviewing"
                ? "from-sky-500 to-indigo-500"
                : "from-[#F5A623] to-[#FF8C00]";
          const submittedAt = new Date(activeBlock.createdAt).toLocaleDateString(
            "ko-KR",
            { year: "numeric", month: "long", day: "numeric" },
          );
          return (
            <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-10 animate-fade-in-up">
              <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_-20px_rgba(245,166,35,0.35)] ring-1 ring-black/5">
                {/* Decorative gradient halo at the top */}
                <div
                  className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-[140%] -translate-x-1/2 rounded-full bg-gradient-to-br ${statusTint} opacity-20 blur-3xl`}
                />
                <div
                  className={`pointer-events-none absolute -top-px left-0 right-0 h-1 bg-gradient-to-r ${statusTint}`}
                />

                <div className="relative px-7 sm:px-9 pt-9 pb-7 text-center">
                  {/* Icon */}
                  <div className="relative inline-flex items-center justify-center mb-5">
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${statusTint} opacity-20 blur-xl`}
                    />
                    <div
                      className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${statusTint} shadow-lg shadow-[#F5A623]/25`}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-[#1E1E1E] tracking-tight">
                    이미 지원하신 공고예요
                  </h3>
                  <p className="mt-2.5 text-[13px] text-gray-500 leading-relaxed">
                    지원서가 안전하게 접수되어 있으니
                    <br />
                    결과 안내까지 조금만 기다려주세요.
                  </p>

                  {/* Info card */}
                  <div className="mt-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/60 border border-gray-200/70 px-5 py-4 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                        지원 직군
                      </span>
                      <span className="text-sm font-black text-[#1E1E1E]">
                        {activeBlock.role}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                        현재 상태
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black text-white bg-gradient-to-r ${statusTint} shadow-sm`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                        지원일
                      </span>
                      <span className="text-xs font-bold text-gray-600 tabular-nums">
                        {submittedAt}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col gap-2">
                    <Link
                      href="/apply/status"
                      className="group relative inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#1E1E1E] text-white text-sm font-black hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-black/10"
                    >
                      지원 현황 보러가기
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link
                      href="/apply"
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-transparent text-gray-500 text-xs font-bold hover:text-[#F5A623] hover:bg-[#F5A623]/5 transition-colors"
                    >
                      다른 직군 지원하기
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Privacy modal — portal'd to body so it escapes transform containing blocks */}
      {privacyOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-6 sm:px-8 py-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#1E1E1E]">
                개인정보 수집 및 이용
              </h3>
              <button
                onClick={() => setPrivacyOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 sm:px-8 py-6">
              <MarkdownView text={config.privacyPolicy.details} />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 sm:px-8 py-4 flex justify-end">
              <button
                onClick={() => {
                  setPrivacyAgreed(true);
                  setPrivacyOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#F5A623] text-white text-sm font-bold hover:bg-[#E8961A] transition-colors"
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function DynamicFields({
  config,
  values,
  setField,
  status,
  fieldErrors,
  onValidateField,
  lockedFieldIds,
}: {
  config: FormConfig;
  values: Record<string, string>;
  setField: (id: string, value: string) => void;
  status: RoleStatus;
  fieldErrors: Record<string, string>;
  onValidateField: (field: FormField, value: string) => void;
  lockedFieldIds: Set<string>;
}) {
  const visibleFields = useMemo(
    () => config.fields.filter((f) => !f.hidden),
    [config.fields],
  );
  // Group fields that show side-by-side: short text inputs + select pickers.
  // A field with `options` is always treated like a select picker, even if
  // its underlying type is still "text" (builtin fields can't change type
  // in storage but they can opt into a button-group UI via options).
  const inlineFields = useMemo(
    () =>
      visibleFields.filter(
        (f) =>
          f.type === "text" ||
          f.type === "username" ||
          f.type === "url" ||
          f.type === "select",
      ),
    [visibleFields],
  );
  const isSelectField = (f: FormField) =>
    f.type === "select" || (f.options !== undefined && f.options.length > 0);
  const textAreaFields = useMemo(
    () => visibleFields.filter((f) => f.type === "textarea"),
    [visibleFields],
  );
  const roleField = useMemo(
    () => visibleFields.find((f) => f.type === "role"),
    [visibleFields],
  );

  return (
    <>
      {/* Inline inputs in 2-column grid (text / username / url / select) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {inlineFields.map((field) => {
          const error = fieldErrors[field.id];
          const errorBorder = error
            ? "border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50"
            : "";
          const locked = lockedFieldIds.has(field.id);
          if (isSelectField(field) && field.options && field.options.length > 0) {
            const selected = values[field.id] ?? "";
            return (
              <div key={field.id}>
                <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wider">
                  {field.label}{" "}
                  {field.required && <span className="text-red-500">*</span>}
                  {locked && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#F5A623]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      자동
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {field.options.map((opt) => {
                    const active = selected === opt;
                    // When locked, lift the active button into the spotlight:
                    // gradient bg, white text, soft glow — and dim the others
                    // hard so it's unmistakable which one is selected.
                    const lockedActive = locked && active;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={locked && !active}
                        onClick={() => {
                          if (locked) return;
                          setField(field.id, opt);
                          onValidateField(field, opt);
                        }}
                        className={`relative px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          lockedActive
                            ? "border-transparent bg-gradient-to-br from-[#F5A623] to-[#FF8C00] text-white shadow-md shadow-[#F5A623]/30"
                            : active
                              ? "border-[#F5A623] bg-[#F5A623]/5 text-[#F5A623]"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                        } ${error && !active ? "border-red-300" : ""} ${locked ? "cursor-not-allowed" : ""} ${locked && !active ? "opacity-25" : ""}`}
                      >
                        {opt}
                        {lockedActive && (
                          <svg
                            className="absolute top-1 right-1"
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
                {locked ? (
                  <p className="mt-2 text-[11px] font-semibold text-[#F5A623]">
                    {selected ? (
                      <>
                        ✓{" "}
                        <span className="font-black">{selected}</span>로
                        자동 선택됐어요. @gsm.hs.kr 계정 정보 기준이에요.
                      </>
                    ) : (
                      "@gsm.hs.kr 계정 정보로 자동 입력돼요."
                    )}
                  </p>
                ) : error ? (
                  <p className="mt-1.5 text-[11px] font-semibold text-red-500">
                    {error}
                  </p>
                ) : (
                  field.helpText && (
                    <p className="mt-1 text-[11px] text-gray-400">
                      {field.helpText}
                    </p>
                  )
                )}
              </div>
            );
          }
          return (
            <div key={field.id}>
              <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wider">
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={field.type === "url" ? "url" : "text"}
                value={values[field.id] ?? ""}
                onChange={(e) => setField(field.id, e.target.value)}
                onBlur={(e) => onValidateField(field, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                className={`input ${errorBorder}`}
              />
              {error ? (
                <p className="mt-1.5 text-[11px] font-semibold text-red-500">
                  {error}
                </p>
              ) : (
                field.helpText && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    {field.helpText}
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Role picker */}
      {roleField && (
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wider">
            {roleField.label}{" "}
            {roleField.required && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.keys(status).map((role) => {
              const open = status[role];
              const selected = values[roleField.id] === role;
              return (
                <button
                  key={role}
                  type="button"
                  disabled={!open}
                  onClick={() => setField(roleField.id, role)}
                  className={`relative px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    selected && open
                      ? "border-[#F5A623] bg-[#F5A623]/5"
                      : "border-gray-200 hover:border-gray-300"
                  } ${!open ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                  style={selected && open ? { color: ROLE_COLOR[role] || "#F5A623" } : {}}
                >
                  {role}
                  {!open && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">
                      마감
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Textarea fields */}
      {textAreaFields.map((field) => {
        const value = values[field.id] ?? "";
        const error = fieldErrors[field.id];
        const showCounter =
          field.minLength !== undefined || field.maxLength !== undefined;
        const errorBorder = error
          ? "border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50"
          : "";
        return (
          <div key={field.id}>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wider">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => setField(field.id, e.target.value)}
              onBlur={(e) => onValidateField(field, e.target.value)}
              required={field.required}
              rows={6}
              placeholder={field.placeholder}
              className={`input resize-none ${errorBorder}`}
              minLength={field.minLength}
              maxLength={field.maxLength}
            />
            {error && (
              <p className="mt-1.5 text-[11px] font-semibold text-red-500">
                {error}
              </p>
            )}
            <div className="flex justify-between items-center mt-1.5">
              {field.helpText ? (
                <p className="text-[11px] text-gray-400">{field.helpText}</p>
              ) : (
                <span />
              )}
              {showCounter && (
                <p
                  className={`text-[11px] font-semibold ${
                    field.minLength !== undefined && value.length < field.minLength
                      ? "text-red-500"
                      : field.maxLength !== undefined && value.length > field.maxLength
                        ? "text-red-500"
                        : "text-gray-400"
                  }`}
                >
                  {value.length}
                  {field.maxLength !== undefined && ` / ${field.maxLength}`}
                  {field.minLength !== undefined && ` (최소 ${field.minLength}자)`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function renderInline(text: string): React.ReactNode[] {
  // Split by **bold** segments and render the matches as <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-bold text-[#1E1E1E]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownView({ text }: { text: string }) {
  // Minimal markdown-ish renderer: headers + bold + paragraphs + lists
  const lines = text.split("\n");
  return (
    <div className="text-sm text-gray-700 leading-relaxed space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h4 key={i} className="text-base font-black text-[#1E1E1E] mt-4">
              {renderInline(line.slice(3))}
            </h4>
          );
        }
        if (/^\*\*[^*]+\*\*$/.test(line)) {
          return (
            <p key={i} className="font-bold text-[#1E1E1E] mt-3">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="pl-4 text-gray-600 before:content-['•'] before:mr-2 before:text-[#F5A623]">
              {renderInline(line.slice(2))}
            </p>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-gray-600">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}
