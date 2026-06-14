import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { formatCOP, maskMoney, parseMoney } from "../lib/format";

// ----- Tarjeta -----

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl bg-white/[0.035] ring-1 ring-white/[0.05] p-5 ${
        onClick ? "active:scale-[0.99] transition cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Etiqueta de sección discreta (estilo Copilot)
export function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2.5 mt-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-white/40">{children}</span>
      {action}
    </div>
  );
}

// Botón flotante para la acción principal
export function Fab({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) {
  return (
    <div className="fixed bottom-24 inset-x-0 z-40 pointer-events-none">
      <div className="max-w-md mx-auto relative">
        <button
          onClick={onClick}
          className="pointer-events-auto absolute right-4 bottom-0 w-14 h-14 rounded-full bg-gradient-to-br from-money-400 to-money-600 shadow-glow grid place-items-center active:scale-90 transition"
          aria-label="Acciones rápidas"
        >
          {icon}
        </button>
      </div>
    </div>
  );
}

// ----- Encabezado de pantalla -----

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ----- Barra de progreso -----

export function ProgressBar({
  value,
  tone = "money",
  height = "h-3",
}: {
  value: number; // 0..1 (puede pasar de 1)
  tone?: "money" | "calm" | "warn" | "danger";
  height?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const colors: Record<string, string> = {
    money: "from-money-400 to-money-600",
    calm: "from-calm-400 to-calm-600",
    warn: "from-amber-300 to-warn",
    danger: "from-rose-400 to-danger",
  };
  return (
    <div className={`w-full ${height} rounded-full bg-white/10 overflow-hidden`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colors[tone]} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ----- Monto en COP con color -----

export function Money({
  value,
  className = "",
  tone,
}: {
  value: number;
  className?: string;
  tone?: "pos" | "neg" | "muted";
}) {
  const toneClass =
    tone === "pos"
      ? "text-money-400"
      : tone === "neg"
      ? "text-danger"
      : tone === "muted"
      ? "text-white/50"
      : "";
  return <span className={`tabular-nums ${toneClass} ${className}`}>{formatCOP(value)}</span>;
}

// ----- Botón -----

type BtnVariant = "primary" | "soft" | "ghost" | "danger";
export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
}) {
  const styles: Record<BtnVariant, string> = {
    primary:
      "bg-gradient-to-r from-money-500 to-money-600 text-white shadow-glow hover:brightness-110",
    soft: "bg-white/8 text-white hover:bg-white/12 border border-white/10",
    ghost: "bg-transparent text-white/70 hover:text-white",
    danger: "bg-danger/15 text-rose-300 hover:bg-danger/25 border border-danger/20",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${
        full ? "w-full" : ""
      } ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ----- Badge con emoji -----

export function IconBadge({ emoji, tone = "calm" }: { emoji: string; tone?: "calm" | "money" | "warn" | "danger" | "neutral" }) {
  const bg: Record<string, string> = {
    calm: "bg-calm-500/15",
    money: "bg-money-500/15",
    warn: "bg-warn/15",
    danger: "bg-danger/15",
    neutral: "bg-white/8",
  };
  return (
    <div className={`w-11 h-11 rounded-2xl grid place-items-center text-xl ${bg[tone]}`}>
      {emoji}
    </div>
  );
}

// ----- Alerta -----

export function Alert({
  level = "info",
  title,
  children,
}: {
  level?: "info" | "ok" | "warn" | "danger";
  title?: string;
  children?: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    info: "bg-calm-500/10 border-calm-500/30 text-calm-400",
    ok: "bg-money-500/10 border-money-500/30 text-money-400",
    warn: "bg-warn/10 border-warn/40 text-amber-300",
    danger: "bg-danger/10 border-danger/40 text-rose-300",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${styles[level]}`}>
      {title && <p className="font-semibold text-sm">{title}</p>}
      {children && <div className="text-sm text-white/80 mt-0.5">{children}</div>}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "money" | "calm" | "warn" | "danger" }) {
  const styles: Record<string, string> = {
    neutral: "bg-white/8 text-white/60",
    money: "bg-money-500/15 text-money-400",
    calm: "bg-calm-500/15 text-calm-400",
    warn: "bg-warn/15 text-amber-300",
    danger: "bg-danger/15 text-rose-300",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[tone]}`}>{children}</span>;
}

export function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="text-center py-10 px-6">
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="font-semibold text-white/80">{title}</p>
      {sub && <p className="text-sm text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

// ----- Bottom Sheet (modal para formularios) -----

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-ink-800 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto no-scrollbar animate-pop safe-bottom">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full bg-white/8 text-white/60">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ----- Campos de formulario -----

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-medium text-white/70">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-xs text-white/40 mt-1 block">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl bg-ink-900 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-calm-500 transition";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className || ""}`} />;
}

// Input de dinero con máscara de miles ($1.250.000)
export function MoneyInput({
  value,
  onChange,
  placeholder = "$0",
  autoFocus,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(value ? maskMoney(String(value)) : "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-semibold">$</span>
      <input
        ref={ref}
        inputMode="numeric"
        value={text}
        placeholder={placeholder.replace("$", "")}
        onChange={(e) => {
          const n = parseMoney(e.target.value);
          setText(maskMoney(String(n)));
          onChange(n);
        }}
        className={`${inputClass} pl-8 text-lg font-semibold tabular-nums`}
      />
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  suffix,
  step = 1,
}: {
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <div className="relative">
      <input
        inputMode="decimal"
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`${inputClass} ${suffix ? "pr-12" : ""}`}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">{suffix}</span>
      )}
    </div>
  );
}

// ----- Confeti de celebración -----

export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const colors = ["#34d399", "#10b981", "#38bdf8", "#0ea5e9", "#fbbf24", "#f43f5e"];
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 1.8 + Math.random() * 1.4;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-5vh",
              width: size,
              height: size * 1.4,
              background: color,
              borderRadius: 2,
              animation: `confetti-fall ${duration}s ${delay}s ease-in forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
