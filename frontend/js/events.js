"use strict";

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "toggle-theme") {
    ui.theme = ui.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, ui.theme);
    render();
    return;
  }
  if (action === "select-login-role") { ui.loginRole = button.dataset.role; render(); return; }
  if (action === "select-register-role") { ui.registerRole = button.dataset.role; render(); return; }
  if (action === "show-register") { ui.authMode = "register"; ui.registerRole = ui.loginRole; render(); return; }
  if (action === "show-login") { ui.authMode = "login"; render(); return; }
  if (action === "toggle-password") { const input = document.getElementById("login-password"); if (input) input.type = input.type === "password" ? "text" : "password"; return; }
  if (action === "open-mobile-menu") { ui.mobileMenu = true; render(); return; }
  if (action === "close-mobile-menu") { ui.mobileMenu = false; render(); return; }
  if (action === "navigate") { stopQrScanner(); ui.view = button.dataset.view; ui.mobileMenu = false; ui.search = ""; render(); return; }
  if (action === "close-modal") { stopQrScanner(); ui.modal = null; render(); return; }
  if (action === "print" || action === "print-qr") { window.print(); return; }

  try {
    if (action === "logout") {
      stopQrScanner();
      if (realtimeChannel) await backend.removeChannel(realtimeChannel);
      await backend.auth.signOut();
      ui.session = null; ui.profile = null; ui.view = "inicio"; ui.authMode = "login"; ui.mobileMenu = false;
      Object.keys(data).forEach(key => { data[key] = key === "qrSession" ? null : []; });
      render();
      return;
    }
    if (action === "refresh-account") {
      setButtonBusy(button, true);
      const sessionResult = await backend.auth.getSession();
      ui.session = sessionResult.data.session;
      await loadCurrentAccount();
      render();
      if (ui.profile?.role === "pending") showToast("O acesso ainda aguarda aprovação.", "error");
      return;
    }
    if (action === "refresh-data") { setButtonBusy(button, true); await refreshData(); return; }
    if (action === "attendance") {
      setButtonBusy(button, true);
      const { error } = await backend.from("meal_confirmations").upsert({ user_id: ui.profile.id, meal_date: dateKey(), will_eat: button.dataset.value === "yes", updated_at: new Date().toISOString() }, { onConflict: "user_id,meal_date" });
      if (error) throw error;
      await refreshData(false);
      showToast(button.dataset.value === "yes" ? "Almoço confirmado." : "A cantina recebeu que você não irá almoçar.");
      return;
    }
    if (action === "open-qr-scanner") { ui.modal = { type: "qr-scanner" }; render(); setTimeout(startQrScanner, 0); return; }
    if (action === "generate-qr") {
      setButtonBusy(button, true, "Gerando…");
      const { error } = await backend.rpc("generate_daily_qr");
      if (error) throw error;
      await refreshData(false);
      showToast("QR Code do dia gerado.");
      return;
    }
    if (action === "justify") { ui.modal = { type: "justify", date: button.dataset.date }; render(); return; }
    if (action === "edit-menu") { ui.modal = { type: "edit-menu", date: button.dataset.date }; render(); return; }
    if (action === "view-document") { ui.modal = { type: "document", id: button.dataset.id }; render(); return; }
    if (action === "open-pdf") {
      const item = data.justifications.find(entry => entry.id === button.dataset.id);
      if (!item) return;
      const popup = window.open("about:blank", "_blank");
      const { data: signed, error } = await backend.storage.from("justifications").createSignedUrl(item.file_path, 60);
      if (error) { popup?.close(); throw error; }
      if (popup) popup.location = signed.signedUrl; else window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "review-document") {
      setButtonBusy(button, true);
      const { error } = await backend.rpc("review_justification", { p_justification_id: button.dataset.id, p_status: button.dataset.status });
      if (error) throw error;
      await refreshData(false);
      showToast(button.dataset.status === "approved" ? "Justificativa aprovada." : "Justificativa recusada.");
      return;
    }
    if (action === "approve-staff") {
      const confirmed = window.confirm(`Liberar este usuário como ${ROLE_CONFIG[button.dataset.role]?.label}?`);
      if (!confirmed) return;
      setButtonBusy(button, true);
      const { error } = await backend.rpc("approve_staff", { p_user_id: button.dataset.id, p_role: button.dataset.role });
      if (error) throw error;
      await refreshData(false);
      showToast("Acesso liberado com sucesso.");
      return;
    }
    if (action === "export-csv") { exportCSV(); return; }
  } catch (error) {
    console.error(error);
    showToast(error.message || "Não foi possível concluir a ação.", "error");
    setButtonBusy(button, false);
  }
});

document.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.target;
  const submit = form.querySelector('button[type="submit"]');
  try {
    if (form.id === "login-form") {
      const values = new FormData(form);
      const identifier = normalizeIdentifier(values.get("identifier"));
      const password = String(values.get("password") || "");
      const errorBox = document.getElementById("login-error");
      if (!identifier) { errorBox.textContent = "Informe seu usuário ou matrícula."; errorBox.classList.add("show"); return; }
      setButtonBusy(submit, true, "Entrando…");
      const login = await backend.auth.signInWithPassword({ email: accountEmail(identifier), password });
      if (login.error) throw new Error("Usuário ou senha incorretos.");
      ui.session = login.data.session;
      await loadCurrentAccount();
      const requestedLogin = ui.loginRole;
      const actualRole = ui.profile.role === "pending" ? ui.profile.requested_role : ui.profile.role;
      if (requestedLogin !== actualRole) {
        await backend.auth.signOut();
        ui.session = null; ui.profile = null;
        throw new Error(`Este cadastro pertence ao perfil ${ROLE_CONFIG[actualRole]?.label || roleLabel(actualRole)}.`);
      }
      ui.view = "inicio";
      render();
      return;
    }
    if (form.id === "register-form") {
      const values = new FormData(form);
      const name = String(values.get("name") || "").trim().replace(/\s+/g, " ");
      const identifier = normalizeIdentifier(values.get("identifier"));
      const classroom = ui.registerRole === "student" ? String(values.get("classroom") || "") : null;
      const password = String(values.get("password") || "");
      const confirmation = String(values.get("passwordConfirm") || "");
      const errorBox = document.getElementById("register-error");
      const fail = message => { errorBox.textContent = message; errorBox.classList.add("show"); };
      if (name.length < 3) return fail("Informe o nome completo.");
      if (!/^[a-z0-9._-]{3,30}$/.test(identifier)) return fail("Use de 3 a 30 letras, números, ponto, traço ou underline.");
      if (ui.registerRole === "student" && !classroom) return fail("Selecione sua turma.");
      if (password.length < 6) return fail("A senha deve ter pelo menos 6 caracteres.");
      if (password !== confirmation) return fail("As senhas não coincidem.");
      setButtonBusy(submit, true, "Criando…");
      const signup = await backend.auth.signUp({
        email: accountEmail(identifier),
        password,
        options: { data: { full_name: name, registration: identifier, classroom, requested_role: ui.registerRole } },
      });
      if (signup.error) {
        if (signup.error.message.toLowerCase().includes("already")) throw new Error("Este usuário ou matrícula já possui cadastro.");
        throw signup.error;
      }
      let session = signup.data.session;
      if (!session) {
        const login = await backend.auth.signInWithPassword({ email: accountEmail(identifier), password });
        if (login.error) throw new Error("Cadastro criado, mas a confirmação de e-mail está ativada no Supabase. Desative essa opção seguindo o README.md.");
        session = login.data.session;
      }
      ui.session = session;
      await loadCurrentAccount();
      ui.loginRole = ui.registerRole;
      ui.authMode = "login";
      ui.view = "inicio";
      render();
      showToast(ui.profile.role === "pending" ? "Cadastro enviado para aprovação." : "Cadastro criado com sucesso.");
      return;
    }
    if (form.id === "checkin-form") {
      setButtonBusy(submit, true, "Registrando…");
      const registration = normalizeIdentifier(new FormData(form).get("registration"));
      const { error } = await backend.rpc("register_manual_attendance", { p_registration: registration });
      if (error) throw error;
      form.reset();
      await refreshData(false);
      showToast("Refeição registrada na cantina.");
      return;
    }
    if (form.id === "menu-form") {
      setButtonBusy(submit, true, "Salvando…");
      const values = new FormData(form);
      const payload = { menu_date: form.dataset.date, main_dish: String(values.get("main") || "").trim(), sides: String(values.get("sides") || "").trim(), dessert: String(values.get("dessert") || "").trim(), updated_by: ui.profile.id, updated_at: new Date().toISOString() };
      const { error } = await backend.from("weekly_menu").upsert(payload, { onConflict: "menu_date" });
      if (error) throw error;
      ui.modal = null;
      await refreshData(false);
      showToast("Cardápio atualizado.");
      return;
    }
    if (form.id === "search-form") { ui.search = String(new FormData(form).get("search") || "").trim(); render(); return; }
    if (form.id === "justification-form") {
      const values = new FormData(form);
      const file = document.getElementById("pdf-file")?.files?.[0];
      if (!file || file.type !== "application/pdf") throw new Error("Selecione um arquivo PDF válido.");
      if (file.size > MAX_PDF_SIZE) throw new Error("O PDF deve ter no máximo 5 MB.");
      setButtonBusy(submit, true, "Enviando…");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${ui.profile.id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await backend.storage.from("justifications").upload(filePath, file, { contentType: "application/pdf", upsert: false });
      if (upload.error) throw upload.error;
      const insert = await backend.from("justifications").insert({ student_id: ui.profile.id, absence_date: form.dataset.date, reason: String(values.get("reason") || "").trim(), file_path: filePath, file_name: file.name });
      if (insert.error) {
        await backend.storage.from("justifications").remove([filePath]);
        throw insert.error;
      }
      ui.modal = null;
      await refreshData(false);
      showToast("Justificativa enviada para a direção.");
    }
  } catch (error) {
    console.error(error);
    const target = form.querySelector(".login-error");
    if (target) { target.textContent = error.message || "Não foi possível continuar."; target.classList.add("show"); }
    else showToast(error.message || "Não foi possível concluir.", "error");
    setButtonBusy(submit, false);
  }
});

document.addEventListener("change", event => {
  if (event.target.id !== "pdf-file") return;
  const file = event.target.files[0];
  const label = document.getElementById("file-name");
  if (file && label) label.textContent = file.name;
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && ui.modal) { stopQrScanner(); ui.modal = null; render(); }
});
