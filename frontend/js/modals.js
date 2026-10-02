"use strict";

function modalShell(title, content, wide = false) {
  return `<div class="modal-layer" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><button class="modal-backdrop" data-action="close-modal" aria-label="Fechar janela"></button><section class="modal ${wide ? "wide" : ""}"><header class="modal-head"><h2>${escapeHTML(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Fechar">×</button></header><div class="modal-body">${content}</div></section></div>`;
}

function justificationModal(day) {
  return modalShell("Justificar ausência", `<form id="justification-form" class="form-grid" data-date="${day}"><div class="local-box"><span>!</span><div><strong>${formatDate(day)}</strong><p>Você confirmou, mas não registrou a refeição.</p></div></div><label>Motivo da ausência<textarea name="reason" placeholder="Explique brevemente o motivo…" required></textarea></label><label class="file-box"><span>⇧</span><strong id="file-name">Anexar comprovante em PDF</strong><small>Arquivo PDF de até 5 MB</small><input id="pdf-file" name="pdf" type="file" accept="application/pdf" required></label><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancelar</button><button class="button button-primary" type="submit">Enviar justificativa</button></div></form>`);
}

function menuModal(day) {
  const item = menuForDate(day);
  return modalShell("Editar cardápio", `<form id="menu-form" class="form-grid" data-date="${day}"><div class="local-box"><span>☷</span><div><strong>${formatDate(day)}</strong><p>Informe a refeição planejada.</p></div></div><label>Prato principal<input name="main" value="${escapeHTML(item?.main_dish || "")}" required></label><label>Acompanhamentos<input name="sides" value="${escapeHTML(item?.sides || "")}"></label><label>Sobremesa ou fruta<input name="dessert" value="${escapeHTML(item?.dessert || "")}"></label><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Cancelar</button><button class="button button-primary" type="submit">Salvar cardápio</button></div></form>`);
}

function documentModal(id) {
  const item = data.justifications.find(document => String(document.id) === String(id));
  if (!item) return "";
  const student = profileById(item.student_id);
  return modalShell("Visualizar justificativa", `<div class="document-preview"><article class="paper"><strong>ConfirmaEdu — justificativa</strong><h3>JUSTIFICATIVA DE AUSÊNCIA</h3><p><strong>Aluno:</strong> ${escapeHTML(student.full_name || "Aluno")}</p><p><strong>Data:</strong> ${formatDate(item.absence_date)}</p><p><strong>Motivo:</strong> ${escapeHTML(item.reason)}</p></article><aside class="document-info"><span class="row-icon blue">▤</span><h3>${escapeHTML(item.file_name)}</h3><p>PDF enviado pelo aluno</p><dl><div><dt>Turma</dt><dd>${escapeHTML(student.classroom || "Não informada")}</dd></div><div><dt>Situação</dt><dd>${statusLabel(item.status)}</dd></div></dl><button class="button button-primary button-full" data-action="open-pdf" data-id="${item.id}">Abrir PDF</button></aside></div>`, true);
}

function qrScannerModal() {
  return modalShell("Ler QR Code da escola", `<div class="qr-scanner"><div class="camera-frame"><video id="qr-video" autoplay muted playsinline></video><canvas id="qr-canvas" hidden></canvas><span class="scan-guide" aria-hidden="true"></span></div><div id="qr-status" class="scanner-status"><span class="status-dot"></span>Preparando a câmera…</div><p>Aponte a câmera para o QR Code exibido na cantina.</p></div>`);
}

function qrSuccessModal() {
  const checkin = todayAttendance();
  return modalShell("Presença registrada", `<div class="qr-success"><span>✓</span><h2>Refeição confirmada!</h2><p>${escapeHTML(ui.profile.full_name)}, sua presença foi registrada${checkin ? ` às ${formatDateTime(checkin.checked_in_at)}` : ""}.</p><button class="button button-success button-full" data-action="close-modal">Concluir</button></div>`);
}
