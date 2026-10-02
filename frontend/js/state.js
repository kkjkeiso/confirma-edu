"use strict";

const MAX_PDF_SIZE = 5 * 1024 * 1024;

const QR_PREFIX = "CONFIRMAEDU:";

const THEME_KEY = "confirmaedu_theme";

const CLOSE_MINUTE = 8 * 60 + 20;

const OPEN_MINUTE = 15 * 60;

const ROLE_CONFIG = {
  student: { label: "Aluno", identifier: "Matrícula", detail: "Aluno" },
  canteen: { label: "Cantina", identifier: "Usuário ou matrícula funcional", detail: "Equipe da cantina" },
  direction: { label: "Direção", identifier: "Usuário ou matrícula funcional", detail: "Direção escolar" },
};

const CLASS_NAMES = [
  "1º A", "1º B", "1º C", "2º A", "2º B", "2º C", "3º A", "3º B", "3º C",
  "1º Edificações", "2º Edificações", "3º Edificações",
  "1º Informática", "2º Informática", "3º Informática",
];

const NAVIGATION = {
  student: [
    { id: "inicio", icon: "⌂", label: "Início" },
    { id: "cardapio", icon: "▦", label: "Cardápio" },
    { id: "historico", icon: "◷", label: "Histórico" },
    { id: "dados", icon: "◉", label: "Meus dados" },
  ],
  canteen: [
    { id: "inicio", icon: "⌂", label: "Visão geral" },
    { id: "turmas", icon: "▦", label: "Alunos e turmas" },
    { id: "registrar", icon: "▦", label: "QR Code" },
    { id: "cardapio", icon: "☷", label: "Cardápio" },
  ],
  direction: [
    { id: "inicio", icon: "⌂", label: "Visão geral" },
    { id: "ausencias", icon: "!", label: "Ausências" },
    { id: "justificativas", icon: "▤", label: "Justificativas" },
    { id: "turmas", icon: "▦", label: "Turmas" },
    { id: "cardapio", icon: "☷", label: "Cardápio" },
    { id: "acessos", icon: "♟", label: "Acessos" },
    { id: "relatorios", icon: "▥", label: "Relatórios" },
  ],
};

const appConfig = window.CONFIRMAEDU_CONFIG || {};

const isConfigured =
  /^https:\/\/.+\.supabase\.co$/i.test(String(appConfig.SUPABASE_URL || "")) &&
  !String(appConfig.SUPABASE_KEY || "").startsWith("COLE_") &&
  String(appConfig.SUPABASE_KEY || "").length > 20 &&
  typeof window.supabase?.createClient === "function";

const backend = isConfigured
  ? window.supabase.createClient(appConfig.SUPABASE_URL, appConfig.SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

const ui = {
  booting: true,
  busy: false,
  session: null,
  profile: null,
  loginRole: "student",
  registerRole: "student",
  authMode: "login",
  view: "inicio",
  modal: null,
  mobileMenu: false,
  search: "",
  reportPeriod: "week",
  theme: localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light",
};

const data = {
  profiles: [],
  confirmations: [],
  attendance: [],
  menu: [],
  justifications: [],
  qrSession: null,
};

let toastTimer = null;

let realtimeChannel = null;

let realtimeTimer = null;

let qrStream = null;

let qrFrameId = null;

let qrScanning = false;

let qrLastScan = 0;

const reportsCache = { week: null, month: null, year: null };
