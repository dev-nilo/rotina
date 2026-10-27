// Avisos por push. Um web app no iPhone não consegue agendar notificações locais,
// então o app manda os horários dos próximos dias para um Worker (worker/),
// que dispara cada aviso na hora. Só funciona com o app instalado na Tela de Início (iOS 16.4+).

import { state, save, now, dayKey, peekDay } from "./store.js";
import { scheduleFor } from "./assistant.js";
import { PRESETS } from "./catmodoro.js";

const WORKER = "https://rotina-push.dev-neelo.workers.dev";
const VAPID_PUBLIC_KEY = "BCQz3KV1zM_AKlUt4yeJfvYTLyz_B9fF00TZa4ptTYAydU9I0RIJ-irHrdWqajkevXnUqokL9vGIKY8THx331m0";
const DAYS = 7;
const SENT = "rotina.push.sent";

export const supported = () => "PushManager" in window && "serviceWorker" in navigator && "Notification" in window;

/**
 * Avisos de hoje e dos próximos dias: início de cada bloco (menos nos dias caóticos)
 * e o fim de cada fase do cat-modoro. Inclui os já passados de hoje para a lista
 * só mudar quando a rotina muda, e não a cada minuto.
 */
export function upcoming() {
  const items = [];
  const t0 = now().getTime();
  for (let i = 0; i < DAYS; i++) {
    const key = dayKey(new Date(t0 + i * 86400000));
    if (peekDay(key)?.mode === "chaotic") continue;
    for (const b of scheduleFor(key)) {
      const at = new Date(`${key}T00:00:00`);
      at.setMinutes(state.settings.wake + b.start);
      items.push({ at: at.getTime(), title: b.title, body: b.steps.join(" · "), tag: `${key}:${b.id}` });
    }
  }

  const timer = state.timer;
  if (timer) {
    if (timer.phase === "focus") {
      items.push({ at: timer.endsAt, title: "cat-modoro: fim do foco", body: "Hora da pausa. Levante e caminhe.", tag: "timer" });
    }
    const restEnd = timer.phase === "focus" ? timer.endsAt + PRESETS[timer.preset].rest * 60000 : timer.endsAt;
    items.push({ at: restEnd, title: "cat-modoro: fim da pausa", body: "Pausa encerrada. De volta ao foco.", tag: "timer" });
  }
  return items;
}

async function post(path, body) {
  const res = await fetch(`${WORKER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Worker respondeu ${res.status}`);
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Pede permissão e inscreve o aparelho. Precisa ser chamado num toque do usuário. */
export async function enable() {
  if ((await Notification.requestPermission()) !== "granted") return false;
  const reg = await navigator.serviceWorker.ready;
  await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY });
  state.push = true;
  save();
  await upload(true);
  return true;
}

export async function disable() {
  state.push = false;
  save();
  const sub = await currentSubscription();
  if (!sub) return;
  await post("/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
  try {
    localStorage.removeItem(SENT);
  } catch {}
}

/** Manda os avisos para o Worker, a menos que sejam os mesmos do último envio. */
async function upload(force) {
  const sub = await currentSubscription();
  if (!sub) return;
  const items = upcoming();
  const sig = JSON.stringify([sub.endpoint, items]);
  let last = null;
  try {
    last = localStorage.getItem(SENT);
  } catch {}
  if (!force && last === sig) return;
  await post("/schedule", { subscription: sub.toJSON(), items });
  try {
    localStorage.setItem(SENT, sig);
  } catch {}
}

let timeout;
/** Barato o bastante para chamar a cada render: só usa a rede quando os avisos mudaram. */
export function sync() {
  if (!state.push || !supported()) return;
  clearTimeout(timeout);
  timeout = setTimeout(() => upload(false).catch(() => {}), 1500);
}
