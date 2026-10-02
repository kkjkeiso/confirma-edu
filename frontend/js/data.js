"use strict";

async function loadCurrentAccount() {
  const userId = ui.session?.user?.id;
  if (!userId) return;
  let { data: profile, error } = await backend.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  if (profile.role === "pending" && profile.requested_role === "direction") {
    const bootstrap = await backend.rpc("bootstrap_first_direction");
    if (!bootstrap.error && bootstrap.data === true) {
      const refreshed = await backend.from("profiles").select("*").eq("id", userId).single();
      if (!refreshed.error) profile = refreshed.data;
    }
  }
  ui.profile = profile;
  if (profile.role !== "pending") {
    await refreshData(false);
    subscribeRealtime();
  }
}

async function refreshData(showMessage = true) {
  if (!backend || !ui.profile || ui.profile.role === "pending") return;
  if (showMessage) { reportsCache.week = null; reportsCache.month = null; reportsCache.year = null; }
  const start = firstDayRange(45);
  const end = dateKey();
  const requests = [
    backend.from("profiles").select("*").order("full_name"),
    backend.from("meal_confirmations").select("*").gte("meal_date", start).lte("meal_date", end).order("meal_date", { ascending: false }),
    backend.from("attendance").select("*").gte("meal_date", start).lte("meal_date", end).order("checked_in_at", { ascending: false }),
    backend.from("weekly_menu").select("*").gte("menu_date", weekDates()[0]).lte("menu_date", weekDates()[4]).order("menu_date"),
    backend.from("justifications").select("*").order("created_at", { ascending: false }),
    backend.from("qr_sessions").select("token, meal_date, active, expires_at").eq("meal_date", dateKey()).eq("active", true).maybeSingle(),
  ];
  const results = await Promise.all(requests);
  const fatal = results.slice(0, 5).find(result => result.error);
  if (fatal) throw fatal.error;
  data.profiles = results[0].data || [];
  data.confirmations = results[1].data || [];
  data.attendance = results[2].data || [];
  data.menu = results[3].data || [];
  data.justifications = results[4].data || [];
  data.qrSession = results[5].error ? null : results[5].data;
  render();
  if (showMessage) showToast("Dados atualizados.");
  notifyJustificationReviews();
}

async function loadReportPeriod(period) {
  const buckets = reportBuckets(period);
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;
  const [confirmationsResult, attendanceResult] = await Promise.all([
    backend.from("meal_confirmations").select("meal_date, will_eat").gte("meal_date", start).lte("meal_date", end),
    backend.from("attendance").select("meal_date").gte("meal_date", start).lte("meal_date", end),
  ]);
  if (confirmationsResult.error || attendanceResult.error) {
    reportsCache[period] = null;
    showToast("Não foi possível carregar o relatório.", "error");
    return;
  }
  reportsCache[period] = { confirmations: confirmationsResult.data || [], attendance: attendanceResult.data || [] };
  if (ui.view === "relatorios" && ui.reportPeriod === period) render();
}

function notifyJustificationReviews() {
  if (ui.profile?.role !== "student") return;
  const toNotify = data.justifications.filter(item => item.student_id === ui.profile.id && item.status !== "pending" && !item.notified_at);
  if (!toNotify.length) return;
  if (toNotify.length === 1) {
    const item = toNotify[0];
    showToast(`Sua justificativa de ${formatDate(item.absence_date)} foi ${item.status === "approved" ? "aprovada" : "recusada"}.`, item.status === "approved" ? "success" : "error");
  } else {
    showToast(`${toNotify.length} justificativas suas foram analisadas. Confira o histórico.`);
  }
  toNotify.forEach(item => { item.notified_at = new Date().toISOString(); });
  backend.rpc("mark_justifications_seen").catch(console.error);
}

function subscribeRealtime() {
  if (realtimeChannel) backend.removeChannel(realtimeChannel);
  realtimeChannel = backend.channel(`confirmaedu-${ui.profile.id}`);
  ["profiles", "meal_confirmations", "attendance", "weekly_menu", "justifications", "qr_sessions"].forEach(table => {
    realtimeChannel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
      clearTimeout(realtimeTimer);
      realtimeTimer = setTimeout(() => refreshData(false).catch(console.error), 350);
    });
  });
  realtimeChannel.subscribe();
}

function exportCSV() {
  const rows = [["Aluno", "Matrícula", "Turma", "Data", "Situação"], ...recentAbsences().map(person => [person.full_name, person.registration, person.classroom || "", person.confirmation.meal_date, "Confirmou e não compareceu"])];
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `confirmaedu-ausencias-${dateKey()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Lista de ausências exportada.");
}
