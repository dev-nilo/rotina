// Entrega os avisos do Rotina por push.
// O app calcula os horários dos próximos dias e manda para cá (POST /schedule);
// o cron roda a cada minuto e dispara o que venceu.
// Tudo fica numa única chave do KV: são poucas inscrições, e assim o cron faz 1 leitura por minuto.

import { send } from "./webpush.js";

const KEY = "subs";
const MAX_SUBS = 5;
const MAX_ITEMS = 300;
/** Avisos atrasados mais que isso (Worker parado, por exemplo) são descartados. */
const LATE_MS = 10 * 60000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });

async function idOf(endpoint) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return [...new Uint8Array(hash).slice(0, 12)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function validSubscription(s) {
  return (
    typeof s?.endpoint === "string" && s.endpoint.startsWith("https://") && s.endpoint.length < 1000 &&
    typeof s.keys?.p256dh === "string" && typeof s.keys?.auth === "string"
  );
}

/** Só avisos futuros, com textos curtos, em ordem. */
function cleanItems(items, now) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i) => Number.isFinite(i?.at) && i.at > now && i.at < now + 9 * 86400000 && typeof i.title === "string")
    .slice(0, MAX_ITEMS)
    .map((i) => ({
      at: i.at,
      title: i.title.slice(0, 80),
      body: String(i.body ?? "").slice(0, 200),
      tag: String(i.tag ?? "").slice(0, 80),
    }))
    .sort((a, b) => a.at - b.at);
}

async function load(env) {
  return (await env.PUSH.get(KEY, "json")) ?? {};
}

async function schedule(request, env) {
  const body = await request.json().catch(() => null);
  if (!validSubscription(body?.subscription)) return json({ error: "inscrição inválida" }, 400);

  const now = Date.now();
  const subs = await load(env);
  const id = await idOf(body.subscription.endpoint);
  subs[id] = { subscription: body.subscription, items: cleanItems(body.items, now), updatedAt: now };

  // Limite de inscrições: sai a que está há mais tempo sem atualizar.
  const ids = Object.keys(subs).sort((a, b) => subs[b].updatedAt - subs[a].updatedAt);
  for (const old of ids.slice(MAX_SUBS)) delete subs[old];

  await env.PUSH.put(KEY, JSON.stringify(subs));
  return json({ ok: true, items: subs[id].items.length });
}

async function unsubscribe(request, env) {
  const body = await request.json().catch(() => null);
  if (typeof body?.endpoint !== "string") return json({ error: "endpoint ausente" }, 400);
  const subs = await load(env);
  delete subs[await idOf(body.endpoint)];
  await env.PUSH.put(KEY, JSON.stringify(subs));
  return json({ ok: true });
}

async function deliver(env) {
  const now = Date.now();
  const subs = await load(env);
  const keys = {
    privateJwk: JSON.parse(env.VAPID_PRIVATE_JWK),
    publicKey: env.VAPID_PUBLIC_KEY,
    subject: env.VAPID_SUBJECT,
  };
  let changed = false;

  for (const [id, sub] of Object.entries(subs)) {
    const due = sub.items.filter((i) => i.at <= now);
    if (!due.length) continue;
    sub.items = sub.items.filter((i) => i.at > now);
    changed = true;

    for (const item of due) {
      if (now - item.at > LATE_MS) continue;
      const status = await send(sub.subscription, { title: item.title, body: item.body, tag: item.tag }, keys);
      if (status === 404 || status === 410) {
        delete subs[id];
        break;
      }
      if (status >= 400) console.log(`push ${status} para ${id}`);
    }
  }
  if (changed) await env.PUSH.put(KEY, JSON.stringify(subs));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const { pathname } = new URL(request.url);
    if (request.method === "POST" && pathname === "/schedule") return schedule(request, env);
    if (request.method === "POST" && pathname === "/unsubscribe") return unsubscribe(request, env);
    return json({ error: "não encontrado" }, 404);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(deliver(env));
  },
};
