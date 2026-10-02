"use strict";

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initialsFromName(name = "") {
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "CE";
}

function dateKey(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function parseDate(value) {
  return new Date(`${value}T12:00:00-03:00`);
}

function formatDate(value, options = {}) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options,
  }).format(parseDate(value));
}

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Fortaleza",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function weekDates(reference = new Date()) {
  const base = new Date(reference);
  const day = base.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + distance);
  return Array.from({ length: 5 }, (_, index) => {
    const current = new Date(base);
    current.setDate(base.getDate() + index);
    return dateKey(current);
  });
}

function firstDayRange(days = 45) {
  const current = new Date();
  current.setDate(current.getDate() - days);
  return dateKey(current);
}

function normalizeIdentifier(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.-]+|[.-]+$/g, "");
}

function accountEmail(identifier) {
  const projectHost = new URL(appConfig.SUPABASE_URL).hostname;
  return `${normalizeIdentifier(identifier)}@${projectHost}`;
}

function roleLabel(role) {
  if (role === "pending") return "Aguardando aprovação";
  return ROLE_CONFIG[role]?.label || role;
}
