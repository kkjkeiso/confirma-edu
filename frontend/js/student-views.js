"use strict";

function renderStudentView() {
  if (ui.view === "cardapio") return renderMenu(false);
  if (ui.view === "historico") return renderHistory();
  if (ui.view === "dados") return renderStudentData();
  return renderStudentHome();
}

function renderStudentHome() {
  const user = currentUser();
  const confirmation = todayConfirmation();
  const checkin = todayAttendance();
  const firstName = String(user.full_name || "Aluno").split(/\s+/)[0];
  const feedback = confirmation
    ? `<div class="feedback ${confirmation.will_eat ? "" : "orange"}">✓ ${confirmation.will_eat ? "A cantina recebeu sua confirmação." : "A cantina recebeu que você não irá almoçar."}</div>`
    : "";
  const body = `<section class="student-grid"><article class="card confirm-card"><span class="pill pill-blue">◷ Confirmação do dia</span><h2>Você vai almoçar na escola hoje?</h2><p>Sua resposta ajuda a cantina a preparar a quantidade certa.</p><div class="class-line">▦ Sua turma <strong>${escapeHTML(user.classroom || "Não informada")}</strong></div><div class="attendance-buttons"><button class="attendance-button yes ${confirmation?.will_eat === true ? "active" : ""}" data-action="attendance" data-value="yes"><span>✓</span><span><strong>Sim, vou almoçar</strong><small>Reserve minha refeição</small></span></button><button class="attendance-button no ${confirmation?.will_eat === false ? "active" : ""}" data-action="attendance" data-value="no"><span>×</span><span><strong>Não vou almoçar</strong><small>Não preparar para mim</small></span></button></div>${feedback}</article>${todayMenuCard()}</section><article class="card student-qr-card ${checkin ? "complete" : ""}"><span class="student-qr-icon">${checkin ? "✓" : "▦"}</span><div><span class="overline">Presença na cantina</span><h2>${checkin ? "Refeição registrada" : "Leia o QR Code da escola"}</h2><p>${checkin ? `Registro realizado às ${formatDateTime(checkin.checked_in_at)}.` : "Na hora do almoço, abra a câmera e aponte para o código da cantina."}</p></div>${checkin ? `<span class="badge badge-green">Presente</span>` : `<button class="button button-primary" data-action="open-qr-scanner">Abrir câmera</button>`}</article>`;
  return renderTemplate("tpl-student-home", {
    heading: heading("Área do aluno", `Olá, ${escapeHTML(firstName)}! 👋`, new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "full" }).format(new Date())),
  }, {}, { body });
}

function studentHistoryRows() {
  const ids = new Set([
    ...data.confirmations.filter(item => item.user_id === ui.profile.id).map(item => item.meal_date),
    ...data.attendance.filter(item => item.user_id === ui.profile.id).map(item => item.meal_date),
  ]);
  return [...ids].sort().reverse().map(day => {
    const confirmation = data.confirmations.find(item => item.user_id === ui.profile.id && item.meal_date === day);
    const attendance = data.attendance.find(item => item.user_id === ui.profile.id && item.meal_date === day);
    const justification = data.justifications.find(item => item.student_id === ui.profile.id && item.absence_date === day);
    let detail = "Sem confirmação";
    let status = "Não confirmou";
    let badge = "gray";
    if (attendance) { detail = `Refeição registrada às ${formatDateTime(attendance.checked_in_at)}`; status = "Presente"; badge = "green"; }
    else if (confirmation?.will_eat) { detail = day < dateKey() ? "Confirmou, mas não compareceu" : "Refeição confirmada"; status = justification ? justification.status : day < dateKey() ? "Ausente" : "Confirmado"; badge = justification?.status === "approved" ? "green" : day < dateKey() ? "orange" : "blue"; }
    else if (confirmation && !confirmation.will_eat) { detail = "Informou que não iria almoçar"; status = "Não iria"; badge = "gray"; }
    return { day, confirmation, attendance, justification, detail, status, badge };
  });
}

function renderHistory() {
  const rows = studentHistoryRows();
  const body = `<section class="card">${rows.length ? rows.map(row => `<div class="history-row"><span class="row-icon ${row.attendance ? "green" : row.confirmation?.will_eat ? "orange" : ""}">${row.attendance ? "✓" : row.confirmation?.will_eat ? "!" : "◷"}</span><div class="row-main"><strong>${formatDate(row.day)}</strong><small>${escapeHTML(row.detail)}</small></div><span class="badge badge-${row.badge}">${escapeHTML(statusLabel(row.status))}</span>${row.day < dateKey() && row.confirmation?.will_eat && !row.attendance && !row.justification ? `<button class="button button-primary button-small" data-action="justify" data-date="${row.day}">Justificar</button>` : ""}</div>`).join("") : emptyState("◷", "Nenhum histórico ainda", "Suas confirmações e refeições aparecerão aqui.")}</section>`;
  return renderTemplate("tpl-student-history", {
    heading: heading("Acompanhamento", "Histórico de refeições", "Consulte suas confirmações, presenças e justificativas."),
  }, {}, { body });
}

function renderStudentData() {
  const user = currentUser();
  const body = `<section class="two-columns"><article class="card"><div class="section-head"><div><h2>Dados do aluno</h2><p>Cadastro ativo</p></div><span class="avatar">${initialsFromName(user.full_name)}</span></div><div class="form-grid"><label>Nome completo<input value="${escapeHTML(user.full_name)}" disabled></label><label>Matrícula<input value="${escapeHTML(user.registration)}" disabled></label><label>Turma<input value="${escapeHTML(user.classroom || "Não informada")}" disabled></label></div></article><article class="card"><div class="section-head"><div><h2>Situação da conta</h2><p>Acesso ao ConfirmaEdu</p></div></div><div class="profile-status"><span>✓</span><div><strong>Cadastro ativo</strong><p>Você já pode confirmar e registrar sua refeição.</p></div></div><button class="button button-secondary button-full" style="margin-top:15px" data-action="logout">Sair da conta</button></article></section>`;
  return renderTemplate("tpl-student-data", {
    heading: heading("Perfil do aluno", "Meus dados", "Informações do seu cadastro."),
  }, {}, { body });
}
