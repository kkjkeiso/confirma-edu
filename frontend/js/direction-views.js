"use strict";

function todayAbsences() {
  const attended = new Set(data.attendance.filter(item => item.meal_date === dateKey()).map(item => item.user_id));
  return data.confirmations.filter(item => item.meal_date === dateKey() && item.will_eat && !attended.has(item.user_id)).map(item => ({ ...profileById(item.user_id), confirmation: item }));
}

function renderDirectionView() {
  if (ui.view === "ausencias") return renderAbsences();
  if (ui.view === "justificativas") return renderJustifications();
  if (ui.view === "cardapio") return renderMenu(true);
  if (ui.view === "acessos") return renderAccessRequests();
  if (ui.view === "relatorios") return renderReports();
  return renderDirectionHome();
}

function renderDirectionHome() {
  const absences = todayAbsences();
  const pendingDocs = data.justifications.filter(item => item.status === "pending");
  const pendingStaff = data.profiles.filter(item => item.role === "pending");
  const totals = staffTotals();
  const body = `<section class="stats-grid">${statCard("!", "orange", "Confirmaram e não chegaram", absences.length, "registros de hoje")}${statCard("▤", "blue", "Justificativas pendentes", pendingDocs.length, "documentos para análise")}${statCard("♟", "purple", "Acessos pendentes", pendingStaff.length, "funcionários aguardando")}${statCard("♨", "green", "Refeições servidas", totals.served, "hoje")}</section><section class="two-columns"><article class="card"><div class="section-head"><div><h2>Ausências de hoje</h2><p>Confirmaram e ainda não compareceram</p></div><span class="pill pill-orange">${absences.length} alunos</span></div>${absences.length ? absences.slice(0, 6).map(personRow).join("") : emptyState("✓", "Nenhuma ausência até agora", "Os registros serão atualizados automaticamente.")}<button class="button button-secondary button-small" style="margin-top:11px" data-action="navigate" data-view="ausencias">Ver lista completa →</button></article><article class="card"><div class="section-head"><div><h2>Solicitações de acesso</h2><p>Funcionários aguardando aprovação</p></div></div>${pendingStaff.length ? pendingStaff.slice(0, 5).map(staffRequestRow).join("") : emptyState("♟", "Nenhuma solicitação", "Novos cadastros da cantina e direção aparecerão aqui.")}<button class="button button-secondary button-small" style="margin-top:11px" data-action="navigate" data-view="acessos">Gerenciar acessos →</button></article></section>`;
  return renderTemplate("tpl-direction-home", {
    heading: heading("Painel da direção", "Visão geral", "Ausências, justificativas e acessos do sistema.", `<button class="button button-secondary" data-action="export-csv">⇩ Exportar</button>`),
  }, {}, { body });
}

function personRow(person) {
  return `<div class="person-row"><span class="avatar">${initialsFromName(person.full_name)}</span><div class="row-main"><strong>${escapeHTML(person.full_name || "Aluno")}</strong><small>${escapeHTML(person.classroom || "Sem turma")} • ${escapeHTML(person.registration || "")}</small></div><span class="badge badge-orange">Aguardando</span></div>`;
}

function renderAbsences() {
  const query = ui.search.toLowerCase();
  const items = todayAbsences().filter(person => `${person.full_name} ${person.registration} ${person.classroom}`.toLowerCase().includes(query));
  const body = `<section class="card"><form id="search-form" class="search-row"><input name="search" value="${escapeHTML(ui.search)}" placeholder="Pesquisar aluno ou turma"><button class="button button-secondary">Pesquisar</button></form>${items.length ? items.map(personRow).join("") : emptyState("✓", "Nenhum aluno encontrado", "Não há ausências com esse filtro.")}</section>`;
  return renderTemplate("tpl-direction-absences", {
    heading: heading("Gestão de ausências", "Confirmaram e ainda não almoçaram", "Dados de hoje atualizados pelo sistema.", `<button class="button button-primary" data-action="export-csv">⇩ CSV</button>`),
  }, {}, { body });
}

function renderJustifications() {
  const body = `<section class="card"><div class="section-head"><div><h2>Documentos recebidos</h2><p>Comprovantes encaminhados para análise</p></div><span class="pill pill-blue">${data.justifications.length} documentos</span></div>${data.justifications.length ? data.justifications.map(item => { const student = profileById(item.student_id); return `<div class="document-row"><span class="row-icon blue">▤</span><div class="row-main"><strong>${escapeHTML(student.full_name || "Aluno")}</strong><small>${escapeHTML(student.classroom || "Sem turma")} • ${formatDate(item.absence_date)} • ${escapeHTML(item.file_name)}</small></div><span class="badge badge-${item.status === "approved" ? "green" : item.status === "rejected" ? "gray" : "orange"}">${statusLabel(item.status)}</span><button class="button button-secondary button-small" data-action="view-document" data-id="${item.id}">Visualizar</button>${item.status === "pending" ? `<button class="button button-success button-small" data-action="review-document" data-id="${item.id}" data-status="approved">Aprovar</button><button class="button button-danger button-small" data-action="review-document" data-id="${item.id}" data-status="rejected">Recusar</button>` : ""}</div>`; }).join("") : emptyState("▤", "Nenhum documento", "As justificativas enviadas aparecerão aqui.")}</section>`;
  return renderTemplate("tpl-direction-justifications", {
    heading: heading("Documentos", "Justificativas", "Analise os PDFs enviados pelos alunos."),
  }, {}, { body });
}

function staffRequestRow(profile) {
  return `<div class="document-row"><span class="avatar">${initialsFromName(profile.full_name)}</span><div class="row-main"><strong>${escapeHTML(profile.full_name)}</strong><small>${escapeHTML(profile.registration)} • Solicitou ${escapeHTML(ROLE_CONFIG[profile.requested_role]?.label || profile.requested_role)}</small></div><button class="button button-success button-small" data-action="approve-staff" data-id="${profile.id}" data-role="${profile.requested_role === "direction" ? "direction" : "canteen"}">Aprovar</button></div>`;
}

function renderAccessRequests() {
  const pending = data.profiles.filter(profile => profile.role === "pending");
  const staff = data.profiles.filter(profile => ["canteen", "direction"].includes(profile.role));
  const body = `<section class="card"><div class="section-head"><div><h2>Aguardando aprovação</h2><p>Somente a direção pode liberar funcionários</p></div><span class="pill pill-orange">${pending.length} pendentes</span></div>${pending.length ? pending.map(staffRequestRow).join("") : emptyState("✓", "Nenhuma solicitação pendente", "Todos os pedidos já foram analisados.")}</section><section class="card"><div class="section-head"><div><h2>Equipe com acesso</h2><p>Contas atualmente liberadas</p></div></div>${staff.length ? staff.map(profile => `<div class="person-row"><span class="avatar">${initialsFromName(profile.full_name)}</span><div class="row-main"><strong>${escapeHTML(profile.full_name)}</strong><small>${escapeHTML(profile.registration)}</small></div><span class="badge badge-${profile.role === "direction" ? "blue" : "green"}">${roleLabel(profile.role)}</span></div>`).join("") : emptyState("♟", "Nenhum funcionário cadastrado", "Os usuários aprovados aparecerão aqui.")}</section>`;
  return renderTemplate("tpl-direction-access", {
    heading: heading("Controle de acesso", "Usuários da equipe", "Aprove os cadastros da cantina e da direção."),
  }, {}, { body });
}

function renderReports() {
  const yes = data.confirmations.filter(item => item.will_eat).length;
  const served = data.attendance.length;
  const justified = data.justifications.filter(item => item.status === "approved").length;
  const rate = yes ? Math.round(served / yes * 100) : 0;
  const days = weekDates();
  const daily = days.map(day => {
    const confirmed = data.confirmations.filter(item => item.meal_date === day && item.will_eat).length;
    const attended = data.attendance.filter(item => item.meal_date === day).length;
    return { day, confirmed, attended, rate: confirmed ? Math.min(100, Math.round(attended / confirmed * 100)) : 0 };
  });
  const body = `<section class="stats-grid">${statCard("♟", "blue", "Confirmações", yes, "no período carregado")}${statCard("♨", "green", "Refeições registradas", served, `${rate}% das confirmações`)}${statCard("▤", "purple", "Justificativas aprovadas", justified, "documentos analisados")}${statCard("▦", "orange", "Alunos cadastrados", staffStudents().length, "contas ativas")}</section><section class="card"><div class="section-head"><div><h2>Presença na semana</h2><p>Percentual das confirmações que compareceram</p></div></div><div class="bar-chart">${daily.map(item => `<div class="bar-item"><div class="bar"><span style="height:${item.rate}%" data-value="${item.rate}%"></span></div><strong>${new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "America/Fortaleza" }).format(parseDate(item.day)).replace(".", "").toUpperCase()}</strong></div>`).join("")}</div></section>`;
  return renderTemplate("tpl-direction-reports", {
    heading: heading("Indicadores", "Relatórios", "Resumo criado a partir dos registros do sistema.", `<button class="button button-secondary" data-action="print">Imprimir</button>`),
  }, {}, { body });
}
