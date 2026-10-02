"use strict";

async function boot() {
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
  } catch (error) {
    console.error(error);
    await backend.auth.signOut().catch(() => {});
    ui.session = null;
  }
  if (ui.session) {
    try {
      await loadCurrentAccount();
    } catch (error) {
      console.error(error);
      ui.profile = null;
    }
  }
  ui.booting = false;
  render();
}

function watchOpenHours() {
  let open = isWithinOpenHours();
  setInterval(() => {
    const nowOpen = isWithinOpenHours();
    if (nowOpen !== open) {
      open = nowOpen;
      render();
    }
  }, 30000);
}

watchOpenHours();
boot();
