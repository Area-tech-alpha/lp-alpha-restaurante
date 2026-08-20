"use client";

import { useState, useRef, useEffect } from "react";
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";
import type { Value as PhoneValue, Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { leadSchema } from "@/lib/validation";
import { submitLead } from "@/app/actions/submit-lead";
import { content } from "@/lib/content";

type CountryOption = { value?: Country; label: string; divider?: boolean };

// Emoji em vez do ícone padrão do react-phone-number-input, que busca SVGs de
// bandeira em um CDN externo (purecatamphetamine.github.io) — isso gerava um
// preload de imagem de terceiros concorrendo com a logo (LCP) por banda.
function flagEmoji(country?: Country) {
  if (!country) return "🌐";
  return country
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function CountrySelect({
  value,
  onChange,
  options,
}: {
  value?: Country;
  onChange: (v?: Country) => void;
  options: CountryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = options.filter(
    (o) => !o.divider && o.label.toLowerCase().includes(search.toLowerCase())
  );

  const dialCode = value ? `+${getCountryCallingCode(value)}` : "";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-full px-3 py-2.5 bg-lp-panel border border-lp-border rounded-[10px] focus:outline-none focus:border-lp-gold-2 transition-colors cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span aria-hidden="true">{flagEmoji(value)}</span>
        <span className="text-lp-text text-[13.5px] font-medium">{dialCode}</span>
        <span className="text-lp-text-dim text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-lp-white border border-lp-border rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-lp-border">
            <input
              type="text"
              placeholder="Buscar país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-lp-panel text-lp-text text-sm px-3 py-1.5 rounded-lg focus:outline-none border border-lp-border focus:border-lp-gold-2 transition-colors placeholder:text-lp-text-dim"
            />
          </div>
          <ul role="listbox" className="max-h-52 overflow-y-auto">
            {filtered.map((opt) => (
              <li key={opt.value ?? "intl"} role="option" aria-selected={opt.value === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-lp-panel ${
                    opt.value === value ? "bg-lp-gold-2/10 text-lp-gold-2" : "text-lp-text"
                  }`}
                >
                  <span aria-hidden="true">{flagEmoji(opt.value)}</span>
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.value && (
                    <span className="text-lp-text-dim text-xs shrink-0">
                      +{getCountryCallingCode(opt.value)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const { form: c } = content;

const FATURAMENTO_CNPJ_REQUIRED = "Até 30 mil";

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

type Status = "idle" | "sending" | "error";

type FormValues = {
  nome: string;
  email: string;
  telefone: PhoneValue | undefined;
  empresa: string;
  segmento: string;
  faturamento: string;
  cnpj: string;
  investiria: string;
};

const initial: FormValues = {
  nome: "",
  email: "",
  telefone: undefined,
  empresa: "",
  segmento: "",
  faturamento: "",
  cnpj: "",
  investiria: "",
};

const inputClass =
  "w-full bg-lp-panel border border-lp-border rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-lp-text placeholder:text-lp-text-dim focus:outline-none focus:border-lp-gold-2 focus:bg-lp-white focus:shadow-[0_0_0_4px_rgba(245,166,35,0.12)] transition-colors";

const selectClass =
  "w-full bg-lp-panel border border-lp-border rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-lp-text focus:outline-none focus:border-lp-gold-2 focus:bg-lp-white focus:shadow-[0_0_0_4px_rgba(245,166,35,0.12)] transition-colors appearance-none cursor-pointer";

const errorClass = "text-[#d33] text-[11.5px] mt-1.5";

export default function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [globalError, setGlobalError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [values, setValues] = useState<FormValues>(initial);

  const needsExtraFields = values.faturamento === FATURAMENTO_CNPJ_REQUIRED;

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function setPhone(value: PhoneValue) {
    setValues((prev) => ({ ...prev, telefone: value }));
    if (errors.telefone) setErrors((prev) => ({ ...prev, telefone: undefined }));
  }

  function handleFaturamentoChange(value: string) {
    setValues((prev) => ({
      ...prev,
      faturamento: value,
      // limpa os campos extras ao trocar para faturamento que não os exige
      cnpj: value === FATURAMENTO_CNPJ_REQUIRED ? prev.cnpj : "",
      investiria: value === FATURAMENTO_CNPJ_REQUIRED ? prev.investiria : "",
    }));
    if (errors.faturamento) setErrors((prev) => ({ ...prev, faturamento: undefined }));
    setErrors((prev) => ({ ...prev, cnpj: undefined, investiria: undefined }));
  }

  const tracker = () => (typeof window !== "undefined" ? window.__tracker : null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const honeypot = (
      e.currentTarget.elements.namedItem("website") as HTMLInputElement | null
    )?.value;
    if (honeypot) return;

    const payload = {
      nome: values.nome.trim(),
      email: values.email.trim(),
      telefone: values.telefone ?? "",
      empresa: values.empresa.trim(),
      segmento: values.segmento,
      faturamento: values.faturamento,
      ...(needsExtraFields && {
        cnpj: values.cnpj,
        investiria: values.investiria as "Sim" | "Não",
      }),
    };

    tracker()?.trackSubmitAttempt();

    const result = leadSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      tracker()?.trackValidationError(Object.keys(fieldErrors));
      return;
    }

    setStatus("sending");
    setGlobalError("");

    try {
      const sessionId = tracker()?.sessionId() ?? undefined;
      const res = await submitLead(result.data, sessionId);
      if (res.success) {
        tracker()?.trackSubmitSuccess("", result.data.investiria === "Sim");
        // Pequeno atraso antes do redirect: o fbq('track', 'Lead', ...) dispara um
        // beacon de rede que pode ser cancelado se a navegação começar no mesmo tick.
        setTimeout(() => {
          window.location.href = res.redirectTo;
        }, 150);
      } else {
        setStatus("error");
        setGlobalError(res.error);
        tracker()?.trackSubmitError("server", res.error);
      }
    } catch {
      setStatus("error");
      setGlobalError("Erro ao enviar. Tente novamente.");
      tracker()?.trackSubmitError("network", "server action unreachable");
    }
  }

  const isSending = status === "sending";

  const labelClass = "block text-[11.5px] font-semibold text-lp-text-muted mb-1.5";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
      />

      {/* Nome */}
      <div>
        <label htmlFor="nome" className={labelClass}>
          {c.fields.nome.label}
        </label>
        <input
          id="nome"
          type="text"
          placeholder={c.fields.nome.placeholder}
          autoComplete="name"
          required
          aria-invalid={!!errors.nome}
          aria-describedby={errors.nome ? "erro-nome" : undefined}
          value={values.nome}
          onChange={(e) => set("nome", e.target.value)}
          onFocus={() => tracker()?.trackFieldFocus("nome")}
          onBlur={(e) => tracker()?.trackFieldBlur("nome", e.target.value.trim().length > 0)}
          className={inputClass}
        />
        {errors.nome && (
          <p id="erro-nome" className={errorClass} role="alert">
            {errors.nome}
          </p>
        )}
      </div>

      {/* E-mail */}
      <div>
        <label htmlFor="email" className={labelClass}>
          {c.fields.email.label}
        </label>
        <input
          id="email"
          type="email"
          placeholder={c.fields.email.placeholder}
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "erro-email" : undefined}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          onFocus={() => tracker()?.trackFieldFocus("email")}
          onBlur={(e) => tracker()?.trackFieldBlur("email", e.target.value.trim().length > 0)}
          className={inputClass}
        />
        {errors.email && (
          <p id="erro-email" className={errorClass} role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Telefone com seletor de país */}
      <div
        onFocus={() => tracker()?.trackFieldFocus("telefone")}
        onBlur={() => tracker()?.trackFieldBlur("telefone", !!values.telefone)}
      >
        <label htmlFor="telefone" className={labelClass}>
          {c.fields.telefone.label}
        </label>
        <PhoneInput
          id="telefone"
          defaultCountry="BR"
          value={values.telefone}
          onChange={setPhone}
          placeholder={c.fields.telefone.placeholder}
          aria-invalid={!!errors.telefone}
          aria-describedby={errors.telefone ? "erro-telefone" : undefined}
          className="phone-input-wrapper"
          countrySelectComponent={CountrySelect as never}
        />
        {errors.telefone && (
          <p id="erro-telefone" className={errorClass} role="alert">
            {errors.telefone}
          </p>
        )}
      </div>

      {/* Empresa */}
      <div>
        <label htmlFor="empresa" className={labelClass}>
          {c.fields.empresa.label}
        </label>
        <input
          id="empresa"
          type="text"
          placeholder={c.fields.empresa.placeholder}
          autoComplete="organization"
          required
          aria-invalid={!!errors.empresa}
          aria-describedby={errors.empresa ? "erro-empresa" : undefined}
          value={values.empresa}
          onChange={(e) => set("empresa", e.target.value)}
          onFocus={() => tracker()?.trackFieldFocus("empresa")}
          onBlur={(e) => tracker()?.trackFieldBlur("empresa", e.target.value.trim().length > 0)}
          className={inputClass}
        />
        {errors.empresa && (
          <p id="erro-empresa" className={errorClass} role="alert">
            {errors.empresa}
          </p>
        )}
      </div>

      {/* Segmento */}
      <div>
        <label htmlFor="segmento" className={labelClass}>
          {c.fields.segmento.label}
        </label>
        <div className="relative">
          <select
            id="segmento"
            required
            aria-invalid={!!errors.segmento}
            aria-describedby={errors.segmento ? "erro-segmento" : undefined}
            value={values.segmento}
            onChange={(e) => set("segmento", e.target.value)}
            onFocus={() => tracker()?.trackFieldFocus("segmento")}
            onBlur={(e) => tracker()?.trackFieldBlur("segmento", e.target.value.length > 0)}
            className={`${selectClass} ${!values.segmento ? "text-lp-text-dim" : ""}`}
          >
            <option value="" disabled hidden>
              {c.fields.segmento.placeholder}
            </option>
            {c.fields.segmento.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-lp-text-muted text-xs">
            ▾
          </span>
        </div>
        {errors.segmento && (
          <p id="erro-segmento" className={errorClass} role="alert">
            {errors.segmento}
          </p>
        )}
      </div>

      {/* Faturamento */}
      <div>
        <label htmlFor="faturamento" className={labelClass}>
          {c.fields.faturamento.label}
        </label>
        <div className="relative">
          <select
            id="faturamento"
            required
            aria-invalid={!!errors.faturamento}
            aria-describedby={errors.faturamento ? "erro-faturamento" : undefined}
            value={values.faturamento}
            onChange={(e) => handleFaturamentoChange(e.target.value)}
            onFocus={() => tracker()?.trackFieldFocus("faturamento")}
            onBlur={(e) => tracker()?.trackFieldBlur("faturamento", e.target.value.length > 0)}
            className={`${selectClass} ${!values.faturamento ? "text-lp-text-dim" : ""}`}
          >
            <option value="" disabled hidden>
              {c.fields.faturamento.placeholder}
            </option>
            {c.fields.faturamento.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-lp-text-muted text-xs">
            ▾
          </span>
        </div>
        {errors.faturamento && (
          <p id="erro-faturamento" className={errorClass} role="alert">
            {errors.faturamento}
          </p>
        )}
      </div>

      {/* CNPJ e Investiria — só aparecem para faturamento "Até 30 mil" */}
      {needsExtraFields && (
        <div className="overflow-hidden">
          {/* CNPJ */}
          <div>
            <label htmlFor="cnpj" className={labelClass}>
              {c.fields.cnpj.label}
            </label>
            <input
              id="cnpj"
              type="text"
              placeholder={c.fields.cnpj.placeholder}
              inputMode="numeric"
              required
              aria-invalid={!!errors.cnpj}
              aria-describedby={errors.cnpj ? "erro-cnpj" : undefined}
              value={values.cnpj}
              onChange={(e) => set("cnpj", maskCNPJ(e.target.value))}
              onFocus={() => tracker()?.trackFieldFocus("cnpj")}
              onBlur={(e) => tracker()?.trackFieldBlur("cnpj", e.target.value.trim().length > 0)}
              className={inputClass}
            />
            {errors.cnpj && (
              <p id="erro-cnpj" className={errorClass} role="alert">
                {errors.cnpj}
              </p>
            )}
          </div>

          {/* Investiria */}
          <div className="mt-2.5">
            <p id="label-investiria" className={labelClass}>
              {c.fields.investiria.label}
            </p>
            <div role="radiogroup" aria-labelledby="label-investiria" className="flex gap-2.5">
              {c.fields.investiria.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] border cursor-pointer transition-colors ${
                    values.investiria === opt
                      ? "border-lp-gold-2 bg-lp-gold-2/10 text-lp-ink"
                      : "border-lp-border text-lp-text-muted hover:border-lp-border-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="investiria"
                    value={opt}
                    required
                    aria-invalid={!!errors.investiria}
                    aria-describedby={errors.investiria ? "erro-investiria" : undefined}
                    className="sr-only"
                    checked={values.investiria === opt}
                    onChange={() => {
                      set("investiria", opt);
                      tracker()?.trackFieldFocus("investiria");
                      tracker()?.trackFieldBlur("investiria", true);
                    }}
                  />
                  <span className="font-semibold text-[13.5px]">{opt}</span>
                </label>
              ))}
            </div>
            {errors.investiria && (
              <p id="erro-investiria" className={errorClass} role="alert">
                {errors.investiria}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Erro global */}
      {status === "error" && globalError && (
        <p className="text-[#d33] text-sm text-center" role="alert">
          {globalError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSending}
        className="mt-1 w-full rounded-full bg-lp-gold-2 bg-gradient-to-r from-lp-gold-1 to-lp-gold-2 px-[26px] py-[13px] font-lp-heading text-[15.5px] font-bold text-lp-ink shadow-[0_10px_30px_rgba(245,166,35,0.3)] transition-transform hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(245,166,35,0.42)] disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
      >
        {isSending ? "Enviando..." : c.submitLabel}
      </button>
    </form>
  );
}
