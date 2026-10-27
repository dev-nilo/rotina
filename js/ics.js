// Gera arquivos .ics para o Calendário do iPhone fazer os avisos
// (um web app no iPhone não consegue agendar notificações locais).

import { logicalDate } from "./store.js";

const pad = (n) => String(n).padStart(2, "0");

/** Horário local "flutuante" (sem fuso): o Calendário usa o fuso do aparelho. */
function localStamp(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escape(text) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function calendar(events) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rotina//PT-BR", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

/**
 * A semana inteira como eventos semanais, cada um com alerta no início.
 * `scheduleOf(weekday)` dá a agenda base de cada dia da semana (0 = domingo).
 */
export function routineICS(scheduleOf, wake) {
  const today = logicalDate();
  today.setHours(0, 0, 0, 0);
  const created = utcStamp(new Date());

  const events = [];
  for (let i = 0; i < 7; i++) {
    const base = new Date(today);
    base.setDate(today.getDate() + i);
    const weekday = base.getDay();
    for (const b of scheduleOf(weekday)) {
      const start = new Date(base.getTime() + (wake + b.start) * 60000);
      const end = new Date(base.getTime() + (wake + b.end) * 60000);
      events.push([
        "BEGIN:VEVENT",
        `UID:rotina-${weekday}-${b.id}@rotina`,
        `DTSTAMP:${created}`,
        `DTSTART:${localStamp(start)}`,
        `DTEND:${localStamp(end)}`,
        "RRULE:FREQ=WEEKLY",
        `SUMMARY:${escape(b.title)}`,
        `DESCRIPTION:${escape(b.steps.join(" · "))}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escape(b.title)}`,
        "TRIGGER:PT0M",
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"));
    }
  }
  return calendar(events);
}

/** Um evento único para o fim da fase atual do cat-modoro. */
export function phaseEndICS(timer) {
  const title = timer.phase === "focus" ? "cat-modoro: fim do foco" : "cat-modoro: fim da pausa";
  const body = timer.phase === "focus" ? "Hora da pausa. Levante e caminhe." : "Pausa encerrada. De volta ao foco.";
  return calendar([
    [
      "BEGIN:VEVENT",
      `UID:catmodoro-${timer.endsAt}@rotina`,
      `DTSTAMP:${utcStamp(new Date())}`,
      `DTSTART:${utcStamp(new Date(timer.startedAt))}`,
      `DTEND:${utcStamp(new Date(timer.endsAt))}`,
      `SUMMARY:${escape(title)}`,
      `DESCRIPTION:${escape(body)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escape(title)}`,
      "TRIGGER;RELATED=END:PT0M",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n"),
  ]);
}

/** Abre o .ics; no iPhone o Safari oferece "Adicionar ao Calendário". */
export function openICS(text, filename) {
  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
