"use strict";

function recentAbsences(days = 30) {
  const start = dateKey(new Date(Date.now() - days * 86400000));
  const attended = new Set(data.attendance.map(item => `${item.user_id}|${item.meal_date}`));
  return data.confirmations
    .filter(item => item.will_eat && item.meal_date >= start && item.meal_date <= dateKey() && !attended.has(`${item.user_id}|${item.meal_date}`))
    .map(item => ({ ...profileById(item.user_id), confirmation: item }))
    .sort((a, b) => b.confirmation.meal_date.localeCompare(a.confirmation.meal_date));
}

function renderDirectionView() {
  if (ui.view === "ausencias") return renderAbsences();
  if (ui.view === "justificativas") return renderJustifications();
  if (ui.view === "turmas") return renderClassManagement();
  if (ui.view === "cardapio") return renderMenu(true);
  if (ui.view === "acessos") return renderAccessRequests();
  if (ui.view === "relatorios") return renderReports();
  return renderDirectionHome();
}

function renderDirectionHome() {
  const absences = recentAbsences();
  const pendingDocs = data.justifications.filter(item => item.status === "pending");
  const pendingStaff = data.profiles.filter(item => item.role === "pending");
  const totals = staffTotals();
  return `<div class="page-stack">${heading("Painel da direção", "Visão geral", "Ausências, justificativas e acessos do sistema.", `<button class="button button-secondary" data-action="export-csv">⇩ Exportar</button>`)}<section class="stats-grid">${statCard("!", "orange", "Confirmaram e não chegaram", absences.length, "últimos 30 dias")}${statCard("▤", "blue", "Justificativas pendentes", pendingDocs.length, "documentos para análise")}${statCard("♟", "purple", "Acessos pendentes", pendingStaff.length, "funcionários aguardando")}${statCard("♨", "green", "Refeições servidas", totals.served, "hoje")}</section><section class="two-columns"><article class="card"><div class="section-head"><div><h2>Ausências recentes</h2><p>Confirmaram e não compareceram nos últimos 30 dias</p></div><span class="pill pill-orange">${absences.length} registros</span></div>${absences.length ? absences.slice(0, 6).map(personRow).join("") : emptyState("✓", "Nenhuma ausência até agora", "Os registros serão atualizados automaticamente.")}<button class="button button-secondary button-small" style="margin-top:11px" data-action="navigate" data-view="ausencias">Ver lista completa →</button></article><article class="card"><div class="section-head"><div><h2>Solicitações de acesso</h2><p>Funcionários aguardando aprovação</p></div></div>${pendingStaff.length ? pendingStaff.slice(0, 5).map(staffRequestRow).join("") : emptyState("♟", "Nenhuma solicitação", "Novos cadastros da cantina e direção aparecerão aqui.")}<button class="button button-secondary button-small" style="margin-top:11px" data-action="navigate" data-view="acessos">Gerenciar acessos →</button></article></section></div>`;
}

function personRow(person) {
  return `<div class="person-row"><span class="avatar">${initialsFromName(person.full_name)}</span><div class="row-main"><strong>${escapeHTML(person.full_name || "Aluno")}</strong><small>${escapeHTML(person.classroom || "Sem turma")} • ${escapeHTML(person.registration || "")}</small></div><span class="badge badge-orange">${formatDate(person.confirmation.meal_date, { day: "2-digit", month: "2-digit" })}</span></div>`;
}

function renderAbsences() {
  const query = ui.search.toLowerCase();
  const items = recentAbsences().filter(person => `${person.full_name} ${person.registration} ${person.classroom}`.toLowerCase().includes(query));
  return `<div class="page-stack">${heading("Gestão de ausências", "Confirmaram e não compareceram", "Últimos 30 dias, atualizados pelo sistema.", `<button class="button button-primary" data-action="export-csv">⇩ CSV</button>`)}<section class="card"><form id="search-form" class="search-row"><input name="search" value="${escapeHTML(ui.search)}" placeholder="Pesquisar aluno ou turma"><button class="button button-secondary">Pesquisar</button></form>${items.length ? items.map(personRow).join("") : emptyState("✓", "Nenhum aluno encontrado", "Não há ausências com esse filtro.")}</section></div>`;
}

function renderJustifications() {
  return `<div class="page-stack">${heading("Documentos", "Justificativas", "Analise os PDFs enviados pelos alunos.")}<section class="card"><div class="section-head"><div><h2>Documentos recebidos</h2><p>Comprovantes encaminhados para análise</p></div><span class="pill pill-blue">${data.justifications.length} documentos</span></div>${data.justifications.length ? data.justifications.map(item => { const student = profileById(item.student_id); return `<div class="document-row"><span class="row-icon blue">▤</span><div class="row-main"><strong>${escapeHTML(student.full_name || "Aluno")}</strong><small>${escapeHTML(student.classroom || "Sem turma")} • ${formatDate(item.absence_date)} • ${escapeHTML(item.file_name)}</small></div><span class="badge badge-${item.status === "approved" ? "green" : item.status === "rejected" ? "gray" : "orange"}">${statusLabel(item.status)}</span><button class="button button-secondary button-small" data-action="view-document" data-id="${item.id}">Visualizar</button>${item.status === "pending" ? `<button class="button button-success button-small" data-action="review-document" data-id="${item.id}" data-status="approved">Aprovar</button><button class="button button-danger button-small" data-action="review-document" data-id="${item.id}" data-status="rejected">Recusar</button>` : ""}</div>`; }).join("") : emptyState("▤", "Nenhum documento", "As justificativas enviadas aparecerão aqui.")}</section></div>`;
}

function staffRequestRow(profile) {
  return `<div class="document-row"><span class="avatar">${initialsFromName(profile.full_name)}</span><div class="row-main"><strong>${escapeHTML(profile.full_name)}</strong><small>${escapeHTML(profile.registration)} • Solicitou ${escapeHTML(ROLE_CONFIG[profile.requested_role]?.label || profile.requested_role)}</small></div><button class="button button-success button-small" data-action="approve-staff" data-id="${profile.id}" data-role="${profile.requested_role === "direction" ? "direction" : "canteen"}">Aprovar</button></div>`;
}

function renderClassManagement() {
  const query = ui.search.toLowerCase();
  const students = staffStudents().filter(student => `${student.full_name} ${student.registration} ${student.classroom}`.toLowerCase().includes(query));
  const rows = students.length
    ? students.map(student => `<div class="person-row"><span class="avatar">${initialsFromName(student.full_name)}</span><div class="row-main"><strong>${escapeHTML(student.full_name)}</strong><small>${escapeHTML(student.classroom || "Sem turma")} • Matrícula ${escapeHTML(student.registration)}</small></div><button class="button button-danger button-small" data-action="remove-student" data-id="${student.id}">Remover</button></div>`).join("")
    : emptyState("♟", "Nenhum aluno encontrado", "Os alunos criam o próprio cadastro na tela inicial.");
  return `<div class="page-stack">${heading("Gestão de turmas", "Alunos cadastrados", "Remova alunos que não fazem mais parte da escola.")}<section class="card"><form id="search-form" class="search-row"><input name="search" value="${escapeHTML(ui.search)}" placeholder="Pesquisar nome, matrícula ou turma"><button class="button button-secondary">Pesquisar</button></form>${rows}</section></div>`;
}

function renderAccessRequests() {
  const pending = data.profiles.filter(profile => profile.role === "pending");
  const staff = data.profiles.filter(profile => ["canteen", "direction"].includes(profile.role));
  return `<div class="page-stack">${heading("Controle de acesso", "Usuários da equipe", "Aprove os cadastros da cantina e da direção.")}<section class="card"><div class="section-head"><div><h2>Aguardando aprovação</h2><p>Somente a direção pode liberar funcionários</p></div><span class="pill pill-orange">${pending.length} pendentes</span></div>${pending.length ? pending.map(staffRequestRow).join("") : emptyState("✓", "Nenhuma solicitação pendente", "Todos os pedidos já foram analisados.")}</section><section class="card"><div class="section-head"><div><h2>Equipe com acesso</h2><p>Contas atualmente liberadas</p></div></div>${staff.length ? staff.map(profile => `<div class="person-row"><span class="avatar">${initialsFromName(profile.full_name)}</span><div class="row-main"><strong>${escapeHTML(profile.full_name)}</strong><small>${escapeHTML(profile.registration)}</small></div><span class="badge badge-${profile.role === "direction" ? "blue" : "green"}">${roleLabel(profile.role)}</span></div>`).join("") : emptyState("♟", "Nenhum funcionário cadastrado", "Os usuários aprovados aparecerão aqui.")}</section></div>`;
}

function weekBuckets() {
  const days = weekDates();
  const labels = ["SEG", "TER", "QUA", "QUI", "SEX"];
  return days.map((day, index) => ({ label: labels[index], start: day, end: day }));
}

function monthBuckets() {
  const buckets = [];
  for (let i = 3; i >= 0; i--) {
    const end = new Date(Date.now() - i * 7 * 86400000);
    const start = new Date(end.getTime() - 6 * 86400000);
    buckets.push({ label: `Sem ${4 - i}`, start: dateKey(start), end: dateKey(end) });
  }
  return buckets;
}

function yearBuckets() {
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  const buckets = [];
  for (let i = 11; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    buckets.push({ label: labels[ref.getMonth()], start: dateKey(start), end: dateKey(end) });
  }
  return buckets;
}

function reportBuckets(period) {
  if (period === "month") return monthBuckets();
  if (period === "year") return yearBuckets();
  return weekBuckets();
}

function reportPeriodTabs() {
  const options = [["week", "Semanal"], ["month", "Mensal"], ["year", "Anual"]];
  return `<div class="role-tabs" role="tablist" aria-label="Período do relatório">${options.map(([value, label]) => `<button type="button" role="tab" aria-selected="${ui.reportPeriod === value}" class="${ui.reportPeriod === value ? "active" : ""}" data-action="select-report-period" data-period="${value}">${label}</button>`).join("")}</div>`;
}

function renderReports() {
  const period = ui.reportPeriod;
  const cached = reportsCache[period];
  if (cached !== "loading" && !cached) {
    reportsCache[period] = "loading";
    loadReportPeriod(period);
  }
  if (!cached || cached === "loading") {
    return `<div class="page-stack">${heading("Indicadores", "Relatórios", "Resumo criado a partir dos registros do sistema.")}${reportPeriodTabs()}<section class="card">${emptyState("◷", "Carregando relatório…", "Buscando os dados do período selecionado.")}</section></div>`;
  }
  const buckets = reportBuckets(period);
  const daily = buckets.map(bucket => {
    const confirmed = cached.confirmations.filter(item => item.will_eat && item.meal_date >= bucket.start && item.meal_date <= bucket.end).length;
    const attended = cached.attendance.filter(item => item.meal_date >= bucket.start && item.meal_date <= bucket.end).length;
    return { label: bucket.label, confirmed, attended, rate: confirmed ? Math.min(100, Math.round(attended / confirmed * 100)) : 0 };
  });
  const yes = cached.confirmations.filter(item => item.will_eat).length;
  const served = cached.attendance.length;
  const justified = data.justifications.filter(item => item.status === "approved").length;
  const rate = yes ? Math.round(served / yes * 100) : 0;
  return `<div class="page-stack">${heading("Indicadores", "Relatórios", "Resumo criado a partir dos registros do sistema.", `<button class="button button-secondary" data-action="print">Imprimir</button>`)}${reportPeriodTabs()}<section class="stats-grid">${statCard("♟", "blue", "Confirmações", yes, "no período selecionado")}${statCard("♨", "green", "Refeições registradas", served, `${rate}% das confirmações`)}${statCard("▤", "purple", "Justificativas aprovadas", justified, "no total")}${statCard("▦", "orange", "Alunos cadastrados", staffStudents().length, "contas ativas")}</section><section class="card"><div class="section-head"><div><h2>Presença no período</h2><p>Percentual das confirmações que compareceram</p></div></div><div class="bar-chart">${daily.map(item => `<div class="bar-item"><div class="bar"><span style="height:${item.rate}%" data-value="${item.rate}%"></span></div><strong>${item.label}</strong></div>`).join("")}</div></section></div>`;
}
