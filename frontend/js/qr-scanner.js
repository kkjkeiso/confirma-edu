"use strict";

async function startQrScanner() {
  stopQrScanner();
  const video = document.getElementById("qr-video");
  const status = document.getElementById("qr-status");
  if (!video || !status) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    status.innerHTML = "⚠ Câmera não disponível neste navegador.";
    status.classList.add("error");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    if (ui.modal?.type !== "qr-scanner" || !document.getElementById("qr-video")) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    qrStream = stream;
    video.srcObject = stream;
    await video.play();
    qrScanning = true;
    qrLastScan = 0;
    status.innerHTML = '<span class="status-dot"></span>Câmera ativa — procurando QR Code';
    qrFrameId = requestAnimationFrame(scanQrFrame);
  } catch {
    status.innerHTML = "⚠ Não foi possível acessar a câmera. Verifique a permissão.";
    status.classList.add("error");
  }
}

function scanQrFrame(timestamp) {
  if (!qrScanning || ui.modal?.type !== "qr-scanner") return;
  const video = document.getElementById("qr-video");
  const canvas = document.getElementById("qr-canvas");
  if (!video || !canvas) return stopQrScanner();
  if (timestamp - qrLastScan > 160 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    qrLastScan = timestamp;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width && height && typeof window.jsQR === "function") {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(video, 0, 0, width, height);
      const image = context.getImageData(0, 0, width, height);
      const result = window.jsQR(image.data, width, height, { inversionAttempts: "attemptBoth" });
      if (result?.data) {
        completeQrCheckin(result.data);
        return;
      }
    }
  }
  qrFrameId = requestAnimationFrame(scanQrFrame);
}

function stopQrScanner() {
  qrScanning = false;
  if (qrFrameId) cancelAnimationFrame(qrFrameId);
  qrFrameId = null;
  if (qrStream) qrStream.getTracks().forEach(track => track.stop());
  qrStream = null;
}

async function completeQrCheckin(value) {
  const text = String(value || "").trim();
  const status = document.getElementById("qr-status");
  if (!text.startsWith(QR_PREFIX)) {
    if (status) { status.textContent = "QR Code não reconhecido. Use o código da cantina."; status.classList.add("error"); }
    return;
  }
  stopQrScanner();
  if (status) status.textContent = "Validando presença…";
  const token = text.slice(QR_PREFIX.length);
  const { error } = await backend.rpc("register_qr_attendance", { p_token: token });
  if (error) {
    ui.modal = null;
    render();
    showToast(error.message.includes("inválido") ? error.message : "Não foi possível validar este QR Code.", "error");
    return;
  }
  await refreshData(false);
  ui.modal = { type: "qr-success" };
  render();
  showToast("Presença registrada pelo QR Code.");
}
