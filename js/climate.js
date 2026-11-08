// Climas de cor: cada bloco pertence a um clima, e a tela inteira assume o clima do bloco atual.
// As cores ficam em css/app.css ([data-climate="..."]); aqui só a regra de qual clima vale.

/** Clima de cada tipo de bloco (pelo id). Qualquer outro bloco é "pessoal". */
const CLIMATE_OF = {
  wake: "despertar", food: "despertar",
  deep: "foco", study: "foco", triage: "foco", valley: "foco", exec: "foco",
  train: "movimento", society: "movimento", futsal: "movimento",
  sunset: "noite",
};

/** Cor de fundo de cada clima, para a barra do navegador (theme-color). */
const PAGE = {
  despertar: "#ffd633", foco: "#ff7029", movimento: "#ca1643", pessoal: "#e1b3e6", noite: "#190f0b",
};

export const climateOf = (id) => CLIMATE_OF[id] || "pessoal";

/** Clima de um momento (ver momentAt): o do bloco atual, o do próximo num intervalo, Noite no sono. */
export function climateAt(mo) {
  if (mo.kind === "block") return climateOf(mo.block.id);
  if (mo.kind === "gap") return climateOf(mo.next.id);
  return "noite";
}

/** Aplica o clima na página. A troca de cores é suave (transição no CSS). */
export function applyClimate(name) {
  const root = document.documentElement;
  if (root.dataset.climate === name) return;
  root.dataset.climate = name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", PAGE[name]);
}
