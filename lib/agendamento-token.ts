import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Leva os dados do lead do formulário até a página de agendamento sem banco:
// vão criptografados (AES-256-GCM) no ?t= da URL. GCM autentica, então o token
// não pode ser lido nem alterado por quem abre o link. Só roda no servidor.

export type LeadAgendamento = {
  // Id do lead no banco quando o INSERT funcionou; senão um UUID gerado. Vai no
  // evento do Google para detectar "esse lead já agendou".
  leadKey: string;
  // Id do lead no CRM da Matriz, devolvido pelo intake no envio do form. null se
  // o CRM não devolveu (o envio da reunião tenta de novo). Tokens antigos não têm.
  crmLeadId: string | null;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  segmento: string;
  faturamento: string;
  cnpj: string | null;
  investiria: string | null;
  variante: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
};

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function key() {
  // AUTH_SECRET já existe em produção (NextAuth do /dashboard).
  const secret = process.env.AGENDAMENTO_TOKEN_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("AGENDAMENTO_TOKEN_SECRET / AUTH_SECRET não definida");
  return createHash("sha256").update(`agendamento:${secret}`).digest();
}

export function createAgendamentoToken(lead: LeadAgendamento): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify({ ...lead, iat: Date.now() }), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function readAgendamentoToken(token: string): LeadAgendamento | null {
  try {
    const raw = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const { iat, ...lead } = JSON.parse(json) as LeadAgendamento & { iat: number };
    if (Date.now() - iat > MAX_AGE_MS) return null;
    return lead;
  } catch {
    return null;
  }
}
