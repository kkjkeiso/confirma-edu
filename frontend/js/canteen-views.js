"use strict";

function classStats() {
  return CLASS_NAMES.map(name => {
    const students = staffStudents().filter(profile => profile.classroom === name);
    const ids = new Set(students.map(profile => profile.id));
    const confirmed = data.confirmations.filter(item => item.meal_date === dateKey() && item.will_eat && ids.has(item.user_id)).length;
    const served = data.attendance.filter(item => item.meal_date === dateKey() && ids.has(item.user_id)).length;
    return { name, students: students.length, confirmed, served };
  }).filter(item => item.students || item.confirmed || item.served);
}

function renderCanteenView() {
  if (ui.view === "relatorios") return renderReports();
  if (ui.view === "registrar") return renderCheckin();
  if (ui.view === "cardapio") return renderMenu(true);
  return renderCanteenHome();
}

function renderCanteenHome() {
  const totals = staffTotals();
  return `<div class="page-stack">${heading("Painel da cantina", "Planejamento de hoje", formatDate(dateKey()), `<button class="button button-primary" data-action="navigate" data-view="registrar">▦ Ver QR Code</button>`)}<section class="stats-grid">${statCard("♟", "blue", "Previstos para almoçar", totals.confirmed, "alunos confirmados")}${statCard("♨", "green", "Refeições servidas", totals.served, `${totals.rate}% dos confirmados`)}${statCard("◷", "orange", "Ainda não compareceram", totals.waiting, "até o momento")}${statCard("▦", "purple", "Alunos cadastrados", staffStudents().length, "contas ativas")}</section><section class="two-columns"><article class="card"><div class="section-head"><div><h2>Progresso do almoço</h2><p>Atualizado para todos os usuários</p></div><span class="pill pill-green">● Ao vivo</span></div><div class="metric-large">${totals.rate}%</div><p class="metric-caption">das confirmações registradas</p><div class="progress"><span style="width:${totals.rate}%"></span></div></article>${todayMenuCard()}</section><section class="card"><div class="section-head"><div><h2>Confirmações por turma</h2><p>Dados cadastrados no sistema</p></div></div><div class="class-grid">${classStats().length ? classStats().slice(0, 6).map(classCard).join("") : emptyState("▦", "Nenhuma turma com registros", "Cadastre os alunos para começar o acompanhamento.")}</div></section></div>`;
}

function classCard(item) {
  const percent = item.confirmed ? Math.round(item.served / item.confirmed * 100) : 0;
  return `<article class="class-card"><header><strong>${escapeHTML(item.name)}</strong><span>${percent}%</span></header><p>Alunos <strong>${item.students}</strong></p><p>Confirmaram <strong>${item.confirmed}</strong></p><p>Almoçaram <strong>${item.served}</strong></p><div class="progress"><span style="width:${percent}%"></span></div></article>`;
}

function recentAttendance() {
  return data.attendance.filter(item => item.meal_date === dateKey()).sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));
}

function renderCheckin() {
  const records = recentAttendance();
  return `<div class="page-stack">${heading("Controle da cantina", "QR Code da refeição", "Gere o código do dia e exiba na entrada da cantina.")}<section class="qr-control-grid"><article class="card qr-print-card"><div class="section-head"><div><h2>QR Code de hoje</h2><p>ConfirmaEdu • ${formatDate(dateKey())}</p></div><span class="pill ${data.qrSession ? "pill-green" : "pill-orange"}">${data.qrSession ? "Ativo" : "Não gerado"}</span></div>${data.qrSession ? `<div id="school-qr" class="school-qr" aria-label="QR Code para registrar a refeição"></div><div class="qr-print-actions"><button class="button button-primary button-full" data-action="print-qr">Imprimir QR Code</button></div>` : `<div class="qr-empty">${emptyState("▦", "Gere o QR Code do dia", "O mesmo código funcionará durante o dia de hoje.")}<button class="button button-primary button-full" data-action="generate-qr">Gerar QR Code</button></div>`}</article><article class="card qr-instructions"><span class="stat-icon blue">▦</span><h2>Como registrar</h2><ol><li>O aluno entra no próprio perfil.</li><li>Toca em <strong>Abrir câmera</strong>.</li><li>Aponta para o QR Code do dia.</li><li>A presença aparece para a cantina e a direção.</li></ol></article></section><section class="two-columns"><article class="card"><div class="section-head"><div><h2>Entrada manual</h2><p>Alternativa para registrar pela matrícula</p></div><span class="stat-icon blue">✓</span></div><form id="checkin-form" class="form-grid"><label>Matrícula do aluno<input name="registration" placeholder="Digite a matrícula" required></label><button class="button button-primary" type="submit">Registrar refeição</button></form></article><article class="card"><div class="section-head"><div><h2>Registros de hoje</h2><p>QR Code e entradas manuais</p></div><span class="pill pill-green">${records.length} registros</span></div>${records.length ? records.slice(0, 10).map(item => { const student = profileById(item.user_id); return `<div class="checkin-row"><span class="row-icon green">✓</span><div class="row-main"><strong>${escapeHTML(student.full_name || "Aluno")}</strong><small>${escapeHTML(student.classroom || "Sem turma")} • ${escapeHTML(item.method === "manual" ? "Manual" : "QR Code")}</small></div><span class="badge badge-green">${formatDateTime(item.checked_in_at)}</span></div>`; }).join("") : emptyState("✓", "Nenhuma refeição registrada", "Os novos registros aparecerão aqui.")}</article></section></div>`;
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
  const rate = yes ? Math.round(served / yes * 100) : 0;
  return `<div class="page-stack">${heading("Indicadores", "Relatórios", "Resumo criado a partir dos registros do sistema.", `<button class="button button-secondary" data-action="print">Imprimir</button>`)}${reportPeriodTabs()}<section class="stats-grid">${statCard("♟", "blue", "Confirmações", yes, "no período selecionado")}${statCard("♨", "green", "Refeições registradas", served, `${rate}% das confirmações`)}${statCard("◷", "purple", "Não compareceram", Math.max(0, yes - served), "confirmaram e não vieram")}${statCard("▦", "orange", "Alunos cadastrados", staffStudents().length, "contas ativas")}</section><section class="card"><div class="section-head"><div><h2>Presença no período</h2><p>Percentual das confirmações que compareceram</p></div></div><div class="bar-chart">${daily.map(item => `<div class="bar-item"><div class="bar"><span style="height:${item.rate}%" data-value="${item.rate}%"></span></div><strong>${item.label}</strong></div>`).join("")}</div></section></div>`;
}
