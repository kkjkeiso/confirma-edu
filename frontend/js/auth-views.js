"use strict";

function renderSetup() {
  return `<main class="login-page">
    <header class="login-topbar">${brand()}${themeButton()}</header>
    <section class="login-stage"><div class="login-panel"><div class="school-heading">${schoolBadge()}<p>Configuração inicial</p><h1>Conecte o banco de dados</h1><span>Abra o arquivo README.md e siga os passos indicados.</span></div>
    <article class="login-card setup-card"><span class="stat-icon orange">!</span><h2>Falta conectar o Supabase</h2><p>Preencha o arquivo <strong>frontend/js/config.js</strong> com a URL e a chave pública do projeto.</p><div class="local-box"><span>1</span><div><strong>Você só fará isso uma vez</strong><p>Depois de configurado, esta tela desaparece.</p></div></div></article></div></section>
  </main>`;
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

  return `<main class="login-page"><header class="login-topbar">${brand()}${themeButton()}</header><section class="login-stage"><div class="login-panel"><div class="school-heading">${schoolBadge()}<p>Escola Estadual</p><h1>Professor Antônio Dantas</h1><span>Controle de refeições escolares</span></div><div class="login-card">${cardContent}</div></div></section></main>`;
}

function renderPending() {
  const requested = ROLE_CONFIG[ui.profile.requested_role]?.label || "funcionário";
  return `<main class="login-page"><header class="login-topbar">${brand()}${themeButton()}</header><section class="login-stage"><div class="login-panel pending-panel"><div class="school-heading"><span class="school-symbol">◷</span><p>Cadastro recebido</p><h1>Aguardando aprovação</h1><span>A direção precisa liberar o acesso de ${escapeHTML(requested)}.</span></div><article class="login-card pending-card"><span class="pending-icon">✓</span><h2>${escapeHTML(ui.profile.full_name)}</h2><p>Seu cadastro foi salvo corretamente. Entre novamente depois que a direção aprovar.</p><div class="profile-status"><span>◷</span><div><strong>Situação</strong><p>Aguardando aprovação da direção</p></div></div><button class="button button-secondary button-full" data-action="refresh-account">Verificar novamente</button><button class="auth-switch" data-action="logout">Sair da conta</button></article></div></section></main>`;
}
