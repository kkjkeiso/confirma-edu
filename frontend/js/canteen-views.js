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
  if (ui.view === "turmas") return renderClasses();
  if (ui.view === "registrar") return renderCheckin();
  if (ui.view === "cardapio") return renderMenu(true);
  return renderCanteenHome();
}

function renderCanteenHome() {
  const totals = staffTotals();
  return `<div class="page-stack">${heading("Painel da cantina", "Planejamento de hoje", formatDate(dateKey()), `<button class="button button-primary" data-action="navigate" data-view="registrar">▦ Ver QR Code</button>`)}<section class="stats-grid">${statCard("♟", "blue", "Previstos para almoçar", totals.confirmed, "alunos confirmados")}${statCard("♨", "green", "Refeições servidas", totals.served, `${totals.rate}% dos confirmados`)}${statCard("◷", "orange", "Ainda não compareceram", totals.waiting, "até o momento")}${statCard("▦", "purple", "Alunos cadastrados", staffStudents().length, "contas ativas")}</section><section class="two-columns"><article class="card"><div class="section-head"><div><h2>Progresso do almoço</h2><p>Atualizado para todos os usuários</p></div><span class="pill pill-green">● Ao vivo</span></div><div class="metric-large">${totals.rate}%</div><p class="metric-caption">das confirmações registradas</p><div class="progress"><span style="width:${totals.rate}%"></span></div></article>${todayMenuCard()}</section><section class="card"><div class="section-head"><div><h2>Confirmações por turma</h2><p>Dados cadastrados no sistema</p></div><button class="button button-secondary button-small" data-action="navigate" data-view="turmas">Ver todas →</button></div><div class="class-grid">${classStats().length ? classStats().slice(0, 6).map(classCard).join("") : emptyState("▦", "Nenhuma turma com registros", "Cadastre os alunos para começar o acompanhamento.")}</div></section></div>`;
}

function classCard(item) {
  const percent = item.confirmed ? Math.round(item.served / item.confirmed * 100) : 0;
  return `<article class="class-card"><header><strong>${escapeHTML(item.name)}</strong><span>${percent}%</span></header><p>Alunos <strong>${item.students}</strong></p><p>Confirmaram <strong>${item.confirmed}</strong></p><p>Almoçaram <strong>${item.served}</strong></p><div class="progress"><span style="width:${percent}%"></span></div></article>`;
}

function renderClasses() {
  const students = staffStudents().filter(student => `${student.full_name} ${student.registration} ${student.classroom}`.toLowerCase().includes(ui.search.toLowerCase()));
  return `<div class="page-stack">${heading("Acompanhamento", "Alunos e turmas", "Cadastros, confirmações e refeições de hoje.")}<section class="card"><div class="section-head"><div><h2>Resumo por turma</h2><p>Somente dados registrados</p></div></div><div class="class-grid">${classStats().length ? classStats().map(classCard).join("") : emptyState("▦", "Sem dados por turma", "As turmas aparecerão após o primeiro cadastro de aluno.")}</div></section><section class="card"><form id="search-form" class="search-row"><input name="search" value="${escapeHTML(ui.search)}" placeholder="Pesquisar nome, matrícula ou turma"><button class="button button-secondary">Pesquisar</button></form>${students.length ? students.map(student => {
    const confirmation = todayConfirmation(student.id);
    const attendance = todayAttendance(student.id);
    return `<div class="person-row"><span class="avatar">${initialsFromName(student.full_name)}</span><div class="row-main"><strong>${escapeHTML(student.full_name)}</strong><small>${escapeHTML(student.classroom || "Sem turma")} • Matrícula ${escapeHTML(student.registration)}</small></div><span class="badge badge-${attendance ? "green" : confirmation?.will_eat ? "blue" : "gray"}">${attendance ? "Presente" : confirmation?.will_eat ? "Confirmou" : "Sem confirmação"}</span></div>`;
  }).join("") : emptyState("♟", "Nenhum aluno encontrado", "Os alunos criam o próprio cadastro na tela inicial.")}</section></div>`;
}

function recentAttendance() {
  return data.attendance.filter(item => item.meal_date === dateKey()).sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));
}

function renderCheckin() {
  const records = recentAttendance();
  return `<div class="page-stack">${heading("Controle da cantina", "QR Code da refeição", "Gere o código do dia e exiba na entrada da cantina.")}<section class="qr-control-grid"><article class="card qr-print-card"><div class="section-head"><div><h2>QR Code de hoje</h2><p>ConfirmaEdu • ${formatDate(dateKey())}</p></div><span class="pill ${data.qrSession ? "pill-green" : "pill-orange"}">${data.qrSession ? "Ativo" : "Não gerado"}</span></div>${data.qrSession ? `<div id="school-qr" class="school-qr" aria-label="QR Code para registrar a refeição"></div><div class="qr-print-actions"><button class="button button-primary button-full" data-action="print-qr">Imprimir QR Code</button></div>` : `<div class="qr-empty">${emptyState("▦", "Gere o QR Code do dia", "O mesmo código funcionará durante o dia de hoje.")}<button class="button button-primary button-full" data-action="generate-qr">Gerar QR Code</button></div>`}</article><article class="card qr-instructions"><span class="stat-icon blue">▦</span><h2>Como registrar</h2><ol><li>O aluno entra no próprio perfil.</li><li>Toca em <strong>Abrir câmera</strong>.</li><li>Aponta para o QR Code do dia.</li><li>A presença aparece para a cantina e a direção.</li></ol></article></section><section class="two-columns"><article class="card"><div class="section-head"><div><h2>Entrada manual</h2><p>Alternativa para registrar pela matrícula</p></div><span class="stat-icon blue">✓</span></div><form id="checkin-form" class="form-grid"><label>Matrícula do aluno<input name="registration" placeholder="Digite a matrícula" required></label><button class="button button-primary" type="submit">Registrar refeição</button></form></article><article class="card"><div class="section-head"><div><h2>Registros de hoje</h2><p>QR Code e entradas manuais</p></div><span class="pill pill-green">${records.length} registros</span></div>${records.length ? records.slice(0, 10).map(item => { const student = profileById(item.user_id); return `<div class="checkin-row"><span class="row-icon green">✓</span><div class="row-main"><strong>${escapeHTML(student.full_name || "Aluno")}</strong><small>${escapeHTML(student.classroom || "Sem turma")} • ${escapeHTML(item.method === "manual" ? "Manual" : "QR Code")}</small></div><span class="badge badge-green">${formatDateTime(item.checked_in_at)}</span></div>`; }).join("") : emptyState("✓", "Nenhuma refeição registrada", "Os novos registros aparecerão aqui.")}</article></section></div>`;
}
