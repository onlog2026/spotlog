import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function initials(name?: string | null) {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10)
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function truncate(text: string, n: number) {
  if (text.length <= n) return text;
  return text.slice(0, n) + "…";
}
