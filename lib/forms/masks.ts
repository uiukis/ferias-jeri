import { z } from "zod";

export const onlyDigits = (s: string) => s.replace(/\D+/g, "");

export const phoneRegex = /^(\(\d{2}\)\s?\d{4,5}-\d{4})$/;
export function maskPhone(input: string): string {
  const digits = onlyDigits(input).slice(0, 11);
  const d2 = digits.padEnd(11, "");
  const dd = d2.slice(0, 2);
  const pre = d2.length > 10 ? d2.slice(2, 7) : d2.slice(2, 6);
  const suf = d2.length > 10 ? d2.slice(7, 11) : d2.slice(6, 10);
  return dd ? `(${dd}) ${pre}${pre && suf ? "-" : ""}${suf}`.trim() : "";
}

export function currencyToNumber(s: string): number {
  const cleaned = s.replace(/[^\d,.-]/g, "");
  const digits = cleaned.replace(/\./g, "").replace(/,/g, ".");
  const n = Number(digits);
  return Number.isNaN(n) ? 0 : n;
}
export function maskCurrency(input: string): string {
  const cleaned = input.replace(/[^\d,]/g, "");
  const hasComma = cleaned.includes(",");
  const [intPartRaw, decPartRaw] = cleaned.split(",");
  const intDigits = onlyDigits(intPartRaw || "");
  const intFormatted = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  let decFormatted = "";
  if (hasComma) {
    const decDigits = onlyDigits(decPartRaw || "").slice(0, 2);
    decFormatted = "," + decDigits.padEnd(2, "0");
  } else {
    decFormatted = ",00";
  }
  const result = `${intFormatted || "0"}${decFormatted}`;
  return `R$ ${result}`;
}

export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
export function maskTime(input: string): string {
  const raw = onlyDigits(input).slice(0, 4);
  const hh = raw.slice(0, 2);
  const mm = raw.slice(2, 4);
  return mm ? `${hh}:${mm}` : hh;
}

export const requiredString = z.string().min(1, "Campo obrigatório");
