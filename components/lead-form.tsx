"use client";

import { useState } from "react";
import { leadSchema } from "@/lib/validation";
import { submitLead } from "@/app/actions/submit-lead";
import CtaButton from "@/components/ui/cta-button";
import { content } from "@/lib/content";

const { form: c } = content;

const COUNTRY_CODES = [
  { code: "+55", flag: "🇧🇷", label: "Brasil" },
  { code: "+351", flag: "🇵🇹", label: "Portugal" },
  { code: "+1", flag: "🇺🇸", label: "EUA" },
  { code: "+54", flag: "🇦🇷", label: "Argentina" },
  { code: "+56", flag: "🇨🇱", label: "Chile" },
  { code: "+57", flag: "🇨🇴", label: "Colômbia" },
];

function maskPhone(value: string, countryCode: string): string {
  if (countryCode !== "+55") return value.replace(/[^\d\s\-+()]/g, "");
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

type Status = "idle" | "sending" | "success" | "error";

type FormValues = {
  nome: string;
  email: string;
  telefoneCountry: string;
  telefone: string;
  empresa: string;
  segmento: string;
  faturamento: string;
  cnpj: string;
  investiria: string;
};

const initial: FormValues = {
  nome: "",
  email: "",
  telefoneCountry: "+55",
  telefone: "",
  empresa: "",
  segmento: "",
  faturamento: "",
  cnpj: "",
  investiria: "",
};

const inputClass =
  "w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors";

const selectClass =
  "w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors appearance-none";

const errorClass = "text-red-400 text-xs mt-1";

export default function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [globalError, setGlobalError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [values, setValues] = useState<FormValues>(initial);

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // honeypot — bots preenchem este campo oculto
    const honeypot = (
      e.currentTarget.elements.namedItem("website") as HTMLInputElement | null
    )?.value;
    if (honeypot) return;

    const payload = {
      nome: values.nome.trim(),
      email: values.email.trim(),
      telefone: `${values.telefoneCountry} ${values.telefone}`,
      empresa: values.empresa.trim(),
      segmento: values.segmento,
      faturamento: values.faturamento,
      cnpj: values.cnpj,
      investiria: values.investiria as "Sim" | "Não",
    };

    const result = leadSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setStatus("sending");
    setGlobalError("");

    try {
      const res = await submitLead(result.data);
      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setGlobalError(res.error);
      }
    } catch {
      setStatus("error");
      setGlobalError("Erro ao enviar. Tente novamente.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      >
        <div className="text-5xl">✅</div>
        <p className="text-xl font-bold text-white">{c.successMessage}</p>
        <p className="text-text-muted text-sm">
          Fique de olho no seu telefone — nosso time já está vendo sua solicitação.
        </p>
      </div>
    );
  }

  const isSending = status === "sending";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* honeypot — oculto de usuários, armadilha para bots */}
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
        <label htmlFor="nome" className="sr-only">
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
        <label htmlFor="email" className="sr-only">
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
          className={inputClass}
        />
        {errors.email && (
          <p id="erro-email" className={errorClass} role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Telefone com seletor de país */}
      <div>
        <label htmlFor="telefone" className="sr-only">
          {c.fields.telefone.label}
        </label>
        <div className="flex gap-2">
          <select
            aria-label="Código do país"
            value={values.telefoneCountry}
            onChange={(e) => {
              set("telefoneCountry", e.target.value);
              set("telefone", "");
            }}
            className="bg-[#111] border border-white/10 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-accent transition-colors shrink-0 w-[5.5rem]"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
          <input
            id="telefone"
            type="tel"
            placeholder={c.fields.telefone.placeholder}
            autoComplete="tel"
            required
            aria-invalid={!!errors.telefone}
            aria-describedby={errors.telefone ? "erro-telefone" : undefined}
            value={values.telefone}
            onChange={(e) =>
              set("telefone", maskPhone(e.target.value, values.telefoneCountry))
            }
            className={`${inputClass} flex-1`}
          />
        </div>
        {errors.telefone && (
          <p id="erro-telefone" className={errorClass} role="alert">
            {errors.telefone}
          </p>
        )}
      </div>

      {/* Empresa */}
      <div>
        <label htmlFor="empresa" className="sr-only">
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
        <label htmlFor="segmento" className="sr-only">
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
            className={`${selectClass} ${!values.segmento ? "text-text-muted" : ""}`}
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
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
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
        <label htmlFor="faturamento" className="sr-only">
          {c.fields.faturamento.label}
        </label>
        <div className="relative">
          <select
            id="faturamento"
            required
            aria-invalid={!!errors.faturamento}
            aria-describedby={errors.faturamento ? "erro-faturamento" : undefined}
            value={values.faturamento}
            onChange={(e) => set("faturamento", e.target.value)}
            className={`${selectClass} ${!values.faturamento ? "text-text-muted" : ""}`}
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
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
            ▾
          </span>
        </div>
        {errors.faturamento && (
          <p id="erro-faturamento" className={errorClass} role="alert">
            {errors.faturamento}
          </p>
        )}
      </div>

      {/* CNPJ */}
      <div>
        <label htmlFor="cnpj" className="sr-only">
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
          className={inputClass}
        />
        {errors.cnpj && (
          <p id="erro-cnpj" className={errorClass} role="alert">
            {errors.cnpj}
          </p>
        )}
      </div>

      {/* Investiria */}
      <div>
        <p
          id="label-investiria"
          className="text-white text-sm font-medium mb-2"
        >
          {c.fields.investiria.label}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="label-investiria"
          className="flex gap-3"
        >
          {c.fields.investiria.options.map((opt) => (
            <label
              key={opt}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-colors ${
                values.investiria === opt
                  ? "border-accent bg-accent/10 text-white"
                  : "border-white/10 text-text-muted hover:border-white/30"
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
                onChange={() => set("investiria", opt)}
              />
              <span className="font-semibold">{opt}</span>
            </label>
          ))}
        </div>
        {errors.investiria && (
          <p id="erro-investiria" className={errorClass} role="alert">
            {errors.investiria}
          </p>
        )}
      </div>

      {/* Erro global */}
      {status === "error" && globalError && (
        <p className="text-red-400 text-sm text-center" role="alert">
          {globalError}
        </p>
      )}

      {/* Submit */}
      <CtaButton type="submit" disabled={isSending} className="w-full justify-center mt-2">
        {isSending ? "Enviando..." : c.submitLabel}
      </CtaButton>
    </form>
  );
}
