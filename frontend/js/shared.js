"use strict";

function applyTheme() {
  document.documentElement.dataset.theme = ui.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", ui.theme === "dark" ? "#0d1512" : "#147a50");
}

function brand() {
  return `<div class="brand"><img class="brand-logo" src="frontend/assets/logo.webp" alt="ConfirmaEdu"></div>`;
}

function schoolBadge() {
  return `<span class="school-symbol school-logo"><img src="frontend/assets/brasao-escola.webp" alt="Brasão da Escola Estadual Professor Antônio Dantas"></span>`;
}

function themeButton() {
  const label = ui.theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";
  return `<button class="icon-button" data-action="toggle-theme" title="${label}" aria-label="${label}">${ui.theme === "dark" ? "☀" : "☾"}</button>`;
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = `${type === "error" ? "⚠" : "✓"} ${message}`;
  toast.style.color = type === "error" ? "var(--red)" : "var(--green-dark)";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4200);
}

function setButtonBusy(button, busy, text = "Aguarde…") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

async function loadTemplates(paths) {
  for (const path of paths) {
    const html = await fetch(path).then(response => response.text());
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("template").forEach(template => document.body.appendChild(template));
  }
}

function renderTemplate(id, slots = {}, classes = {}, raw = {}) {
  const template = document.getElementById(id);
  const node = template.content.cloneNode(true);
  for (const [name, html] of Object.entries(slots)) {
    const target = node.querySelector(`[data-slot="${name}"]`);
    if (!target) continue;
    target.innerHTML = html;
    target.removeAttribute("data-slot");
  }
  for (const [name, className] of Object.entries(classes)) {
    const target = node.querySelector(`[data-slot-class="${name}"]`);
    if (!target) continue;
    if (className) target.classList.add(className);
    target.removeAttribute("data-slot-class");
  }
  const wrapper = document.createElement("div");
  wrapper.appendChild(node);
  let html = wrapper.innerHTML;
  for (const [name, value] of Object.entries(raw)) {
    html = html.split(`<!--slot:${name}-->`).join(value);
  }
  return html;
}

function render() {
  applyTheme();
  const app = document.getElementById("app");
  if (ui.booting) app.innerHTML = renderLoading();
  else if (!isConfigured) app.innerHTML = renderSetup();
  else if (!ui.session || !ui.profile) app.innerHTML = renderLogin();
  else if (ui.profile.role === "pending") app.innerHTML = renderPending();
  else app.innerHTML = renderApp();
  renderSchoolQr();
}

function renderLoading() {
  return `<main class="loading-screen"><div class="brand brand-loading"><img class="brand-logo" src="frontend/assets/logo.webp" alt="ConfirmaEdu"></div><strong>Carregando o ConfirmaEdu…</strong></main>`;
}

function currentUser() {
  return ui.profile || {};
}

function profileById(id) {
  if (id === ui.profile?.id) return ui.profile;
  return data.profiles.find(profile => profile.id === id) || {};
}

function renderApp() {
  const user = currentUser();
  const nav = NAVIGATION[user.role] || [];
  const profile = `<span class="avatar">${initialsFromName(user.full_name)}</span><div><strong>${escapeHTML(user.full_name)}</strong><small>${escapeHTML(user.classroom || roleLabel(user.role))}</small></div>`;
  const overlay = ui.mobileMenu ? `<button class="sidebar-overlay" data-action="close-mobile-menu" aria-label="Fechar menu"></button>` : "";
  return renderTemplate(
    "tpl-app-shell",
    {
      brand: brand(),
      profile,
      nav: nav.map(item => navButton(item)).join(""),
      theme: themeButton(),
      content: renderCurrentView(),
      "mobile-nav": nav.map(item => navButton(item, true)).join(""),
    },
    { "sidebar-open": ui.mobileMenu ? "open" : "" },
    { overlay, modal: renderModal() }
  );
}

function navButton(item, mobile = false) {
  return `<button class="${ui.view === item.id ? "active" : ""}" data-action="navigate" data-view="${item.id}"><span class="${mobile ? "" : "nav-icon"}">${item.icon}</span><span>${item.label}</span></button>`;
}

function heading(overline, title, description, action = "") {
  return `<header class="page-heading"><div><span class="overline">${overline}</span><h1>${title}</h1><p>${description}</p></div>${action}</header>`;
}

function statCard(icon, tone, label, value, detail) {
  return `<article class="stat-card"><span class="stat-icon ${tone}">${icon}</span><div><span>${label}</span><strong>${value}</strong><small>${detail}</small></div></article>`;
}

function emptyState(icon, title, text) {
  return `<div class="empty-state"><span>${icon}</span><strong>${title}</strong><p>${text}</p></div>`;
}

function renderCurrentView() {
  if (ui.profile.role === "student") return renderStudentView();
  if (ui.profile.role === "canteen") return renderCanteenView();
  return renderDirectionView();
}

function todayConfirmation(userId = ui.profile.id) {
  return data.confirmations.find(item => item.user_id === userId && item.meal_date === dateKey());
}

function todayAttendance(userId = ui.profile.id) {
  return data.attendance.find(item => item.user_id === userId && item.meal_date === dateKey());
}

function menuForDate(value) {
  return data.menu.find(item => item.menu_date === value);
}

function todayMenuCard() {
  const item = menuForDate(dateKey());
  if (!item) return `<article class="card today-menu"><span class="pill pill-green">☷ Cardápio de hoje</span>${emptyState("☷", "Cardápio ainda não informado", "A cantina poderá adicionar a refeição do dia.")}</article>`;
  return `<article class="card today-menu"><span class="pill pill-green">☷ Cardápio de hoje</span><h3>${escapeHTML(item.main_dish)}</h3><p>${escapeHTML(item.sides || "Sem acompanhamento informado")}</p><footer>♧ Sobremesa: ${escapeHTML(item.dessert || "Não informada")}</footer></article>`;
}

function renderMenu(editable) {
  const days = weekDates();
  const dayShort = ["SEG", "TER", "QUA", "QUI", "SEX"];
  const rows = days.map((day, index) => {
    const item = menuForDate(day);
    return `<article class="menu-row ${day === dateKey() ? "today" : ""}"><div class="menu-date"><strong>${dayShort[index]}</strong><small>${formatDate(day, { day: "2-digit", month: "2-digit" })}</small></div><div class="menu-content"><span>${new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "America/Fortaleza" }).format(parseDate(day))}${day === dateKey() ? " • Hoje" : ""}</span>${item ? `<h3>${escapeHTML(item.main_dish)}</h3><p>${escapeHTML(item.sides || "Sem acompanhamento informado")}</p><div class="menu-meta">♧ ${escapeHTML(item.dessert || "Sobremesa não informada")}</div>` : `<h3>Refeição ainda não informada</h3><p>Aguardando o planejamento da escola.</p>`}</div>${editable ? `<button class="icon-button edit-button" data-action="edit-menu" data-date="${day}" aria-label="Editar cardápio">✎</button>` : ""}</article>`;
  }).join("");
  return renderTemplate("tpl-menu", {
    heading: heading(editable ? "Planejamento" : "Área do aluno", "Cardápio semanal", `Semana de ${formatDate(days[0], { day: "2-digit", month: "2-digit" })} a ${formatDate(days[4], { day: "2-digit", month: "2-digit" })}.`),
    rows,
  });
}

function statusLabel(value) {
  const map = { pending: "Pendente", approved: "Aprovada", rejected: "Rejeitada" };
  return map[value] || value;
}

function staffStudents() {
  return data.profiles.filter(profile => profile.role === "student");
}

function staffTotals() {
  const confirmed = data.confirmations.filter(item => item.meal_date === dateKey() && item.will_eat).length;
  const served = data.attendance.filter(item => item.meal_date === dateKey()).length;
  return { confirmed, served, waiting: Math.max(confirmed - served, 0), rate: confirmed ? Math.round(served / confirmed * 100) : 0 };
}

function renderModal() {
  if (!ui.modal) return "";
  if (ui.modal.type === "justify") return justificationModal(ui.modal.date);
  if (ui.modal.type === "edit-menu") return menuModal(ui.modal.date);
  if (ui.modal.type === "document") return documentModal(ui.modal.id);
  if (ui.modal.type === "qr-scanner") return qrScannerModal();
  if (ui.modal.type === "qr-success") return qrSuccessModal();
  return "";
}

function renderSchoolQr() {
  const container = document.getElementById("school-qr");
  if (!container || !data.qrSession?.token) return;
  if (typeof window.qrcode !== "function") {
    container.innerHTML = "<strong>Não foi possível gerar o QR Code.</strong>";
    return;
  }
  const code = window.qrcode(0, "M");
  code.addData(`${QR_PREFIX}${data.qrSession.token}`, "Byte");
  code.make();
  container.innerHTML = code.createSvgTag({ cellSize: 7, margin: 4, scalable: true });
}
