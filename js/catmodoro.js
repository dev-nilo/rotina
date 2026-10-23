// cat-modoro: timer de foco do Deep Work.
// O tempo é guardado como timestamps (endsAt), então continua certo
// mesmo se o Safari pausar a página com a tela bloqueada.

import { state, save, now, day } from "./store.js";

export const PRESETS = {
  "90/15": { focus: 90, rest: 15 },
  "25/5": { focus: 25, rest: 5 },
};

/** state.timer = null | { phase: "focus" | "rest", startedAt, endsAt, preset } */

export function start() {
  const p = PRESETS[state.settings.timerPreset];
  const t = now().getTime();
  state.timer = { phase: "focus", startedAt: t, endsAt: t + p.focus * 60000, preset: state.settings.timerPreset };
  save();
}

export function stop() {
  state.timer = null;
  save();
}

/** Pula para a próxima fase agora (foco → pausa conta como ciclo feito). */
export function skip() {
  if (!state.timer) return;
  state.timer.endsAt = now().getTime();
  tick();
}

/**
 * Avança as fases que já terminaram. Chamado a cada segundo e ao reabrir o app.
 * Devolve true quando alguma fase mudou.
 */
export function tick() {
  const timer = state.timer;
  if (!timer) return false;
  const t = now().getTime();
  let changed = false;

  if (timer.phase === "focus" && t >= timer.endsAt) {
    day().cycles += 1;
    const rest = PRESETS[timer.preset].rest;
    timer.phase = "rest";
    timer.startedAt = timer.endsAt;
    timer.endsAt = timer.endsAt + rest * 60000;
    changed = true;
  }
  if (timer.phase === "rest" && t >= timer.endsAt) {
    state.timer = null;
    changed = true;
  }
  if (changed) save();
  return changed;
}

export function remaining() {
  if (!state.timer) return 0;
  return Math.max(0, state.timer.endsAt - now().getTime());
}

export function formatRemaining(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "focus" → gato atento, "rest" → espreguiçando, null → dormindo. */
export function catSVG(phase) {
  const open = `<g class="cat cat-awake">
      <path d="M78 100 Q100 96 95 76" class="tail"/>
      <path d="M42 104 C38 80 44 62 60 62 C76 62 82 80 78 104 Z"/>
      <path d="M44 46 L42 25 L54 36 Q60 34 66 36 L78 25 L76 46 Q76 62 60 62 Q44 62 44 46 Z"/>
      <circle cx="53" cy="47" r="2" class="fill"/><circle cx="67" cy="47" r="2" class="fill"/>
      <path d="M58 53 L60 55 L62 53"/>
    </g>`;
  const stretch = `<g class="cat cat-stretch">
      <path d="M100 64 Q114 50 108 34" class="tail"/>
      <path d="M50 86 Q70 58 94 60 Q104 62 102 78 L100 100"/>
      <path d="M52 97 Q72 86 88 92 L90 100"/>
      <path d="M22 84 L20 66 L30 74 Q36 72 42 74 L52 66 L50 84 Q50 98 36 98 Q22 98 22 84 Z"/>
      <path d="M28 85 q3 2.5 6 0 M38 85 q3 2.5 6 0"/>
      <path d="M26 100 L8 100 M34 100 L16 102"/>
    </g>`;
  const sleep = `<g class="cat cat-sleep">
      <path d="M26 96 Q22 66 58 64 Q96 62 98 92 Q98 100 90 100 L32 100 Q26 100 26 96 Z"/>
      <path d="M96 94 Q94 106 66 103"/>
      <path d="M30 90 L29 74 L38 80 Q43 79 48 80 L56 74 L55 90 Q55 100 42 100 Q30 100 30 90 Z"/>
      <path d="M35 89 q3 2 6 0 M44 89 q3 2 6 0"/>
      <text x="66" y="46" class="z z1">z</text><text x="78" y="32" class="z z2">z</text>
    </g>`;
  const body = phase === "focus" ? open : phase === "rest" ? stretch : sleep;
  return `<svg viewBox="0 0 120 112" class="cat-svg" aria-hidden="true">${body}</svg>`;
}
