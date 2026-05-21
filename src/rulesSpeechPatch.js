function findRulesGrid() {
  const titles = Array.from(document.querySelectorAll("h2"));
  const rulesTitle = titles.find((title) => title.textContent?.trim() === "Règles du Killer");
  const rulesCard = rulesTitle?.closest("section");
  return rulesCard?.querySelector(".mt-4.grid");
}

function renumberRuleBlocks(grid) {
  const blocks = Array.from(grid.children);
  blocks.forEach((block, index) => {
    const strong = block.querySelector("strong");
    if (!strong) return;
    strong.textContent = strong.textContent.replace(/^\d+\./, `${index + 1}.`);
  });
}

function addNoTalkingRule() {
  const grid = findRulesGrid();
  if (!grid || grid.dataset.noTalkingRuleApplied === "true") return;

  const rule = document.createElement("div");
  rule.className = "rounded-2xl bg-zinc-950/80 p-4 md:col-span-2";
  rule.innerHTML = `
    <strong>6. Silence sur le Killer</strong>
    <p class="mt-1 text-zinc-300">Il est interdit de parler du Killer, des missions, des cibles ou de l’appli pendant la partie. Seule exception : chuchoter discrètement à ta cible qu’elle vient d’être killée pour qu’elle vérifie son appli et accepte ou refuse le kill.</p>
  `;

  grid.appendChild(rule);
  grid.dataset.noTalkingRuleApplied = "true";
  renumberRuleBlocks(grid);
}

const observer = new MutationObserver(addNoTalkingRule);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("load", addNoTalkingRule);
setTimeout(addNoTalkingRule, 0);
