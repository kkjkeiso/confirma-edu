"use strict";

async function boot() {
  await loadTemplates([
    "frontend/html/login.html",
    "frontend/html/shared.html",
    "frontend/html/student.html",
    "frontend/html/canteen.html",
    "frontend/html/direction.html",
  ]);
  applyTheme();
  if (!isConfigured) {
    ui.booting = false;
    render();
    return;
  }
  try {
    const { data: sessionData, error } = await backend.auth.getSession();
    if (error) throw error;
    ui.session = sessionData.session;
    if (ui.session) await loadCurrentAccount();
  } catch (error) {
    console.error(error);
    await backend.auth.signOut().catch(() => {});
    ui.session = null;
    ui.profile = null;
  }
  ui.booting = false;
  render();
}

boot();
