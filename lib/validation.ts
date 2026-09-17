import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

function cnpjDigit(digits: string, length: number): number {
  let sum = 0;
  let pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(digits[length - i]) * pos--;
    if (pos < 2) pos = 9;
  }
  const rem = sum % 11;
  return rem < 2 ? 0 : 11 - rem;
}

function isValidCNPJ(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return (
    cnpjDigit(digits, 12) === parseInt(digits[12]) &&
    cnpjDigit(digits, 13) === parseInt(digits[13])
  );
}

export const leadSchema = z
  .object({
    nome: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("E-mail inválido"),
    telefone: z
      .string()
      .min(1, "Telefone obrigatório")
      .refine((v) => isValidPhoneNumber(v), "Telefone inválido"),
    empresa: z.string().min(2, "Nome da empresa obrigatório"),
    segmento: z.string().min(1, "Selecione um segmento"),
    faturamento: z.string().min(1, "Selecione uma faixa de faturamento"),
    cnpj: z.string().optional(),
    investiria: z.enum(["Sim", "Não"], { message: "Selecione uma opção" }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.faturamento === "Até 30 mil") {
      if (!data.cnpj || !isValidCNPJ(data.cnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CNPJ inválido",
          path: ["cnpj"],
        });
      }
      if (!data.investiria) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione uma opção",
          path: ["investiria"],
        });
      }
    }
  });

export type LeadFormData = z.infer<typeof leadSchema>;

// Validação individual (não combinada) de e-mail/telefone para a captura
// parcial (onBlur, antes do submit final). Cada campo é validado sozinho de
// propósito: se o telefone ainda está incompleto quando o e-mail já é válido,
// queremos salvar o e-mail mesmo assim — um schema único com .optional() por
// campo reprovaria o objeto inteiro e descartaria os dois. Ver
// app/actions/submit-partial-lead.ts.
export const partialEmailSchema = z.string().trim().email();
export const partialTelefoneSchema = z.string().refine((v) => isValidPhoneNumber(v));
