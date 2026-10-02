"use strict";

function renderSetup() {
  return renderTemplate("tpl-setup", {
    topbar: brand() + themeButton(),
    "school-badge": schoolBadge(),
  });
}

function roleTabs(selected, action) {
  return `<div class="role-tabs" role="tablist" aria-label="Tipo de acesso">${Object.entries(ROLE_CONFIG).map(([role, item]) => `<button type="button" role="tab" aria-selected="${selected === role}" class="${selected === role ? "active" : ""}" data-action="${action}" data-role="${role}">${item.label}</button>`).join("")}</div>`;
}

function renderLogin() {
  const role = ui.authMode === "register" ? ui.registerRole : ui.loginRole;
  const current = ROLE_CONFIG[role];
  const cardContent = ui.authMode === "register"
    ? `<div class="login-card__heading"><span>＋</span><div><h2>Criar cadastro</h2><p>Selecione o tipo de usuário</p></div></div>
      ${roleTabs(ui.registerRole, "select-register-role")}
      <form id="register-form" class="login-form">
        <label>Nome completo<input name="name" autocomplete="name" placeholder="Digite seu nome completo" minlength="3" required></label>
        <label>${current.identifier}<input name="identifier" autocomplete="username" placeholder="Digite ${role === "student" ? "sua matrícula" : "seu identificador"}" pattern="[A-Za-z0-9._-]{3,30}" maxlength="30" required></label>
        ${role === "student" ? `<label>Turma<select name="classroom" required><option value="">Selecione sua turma</option>${CLASS_NAMES.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("")}</select></label>` : `<div class="approval-note"><span>◷</span><div><strong>Acesso protegido</strong><p>O cadastro de ${current.label.toLowerCase()} será liberado pela direção.</p></div></div>`}
        <label>Senha<input name="password" type="password" autocomplete="new-password" placeholder="Crie uma senha com 6 ou mais caracteres" minlength="6" required></label>
        <label>Confirmar senha<input name="passwordConfirm" type="password" autocomplete="new-password" placeholder="Digite a senha novamente" minlength="6" required></label>
        <div id="register-error" class="login-error"></div>
        <button class="button button-primary button-full" type="submit">Criar cadastro</button>
      </form>
      <button class="auth-switch" type="button" data-action="show-login">Já tenho cadastro <strong>Voltar ao login</strong></button>`
    : `<div class="login-card__heading"><span>→</span><div><h2>Acesso ao sistema</h2><p>Selecione o seu perfil</p></div></div>
      ${roleTabs(ui.loginRole, "select-login-role")}
      <form id="login-form" class="login-form">
        <label>${current.identifier}<input id="login-user" name="identifier" autocomplete="username" placeholder="Digite ${role === "student" ? "sua matrícula" : "seu identificador"}" required></label>
        <label>Senha<div class="password-wrap"><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Digite sua senha" required><button type="button" data-action="toggle-password" aria-label="Mostrar ou ocultar senha">◉</button></div></label>
        <div id="login-error" class="login-error"></div>
        <button class="button button-primary button-full" type="submit">Entrar</button>
      </form>
      <button class="auth-switch" type="button" data-action="show-register">Primeiro acesso? <strong>Criar cadastro</strong></button>`;

  return renderTemplate("tpl-login", {
    topbar: brand() + themeButton(),
    "school-badge": schoolBadge(),
    card: cardContent,
  });
}

function renderPending() {
  const requested = ROLE_CONFIG[ui.profile.requested_role]?.label || "funcionário";
  return renderTemplate("tpl-pending", {
    topbar: brand() + themeButton(),
    "requested-role": escapeHTML(requested),
    "full-name": escapeHTML(ui.profile.full_name),
  });
}
