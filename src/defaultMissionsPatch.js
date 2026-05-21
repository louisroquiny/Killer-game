const DECOY_DEFAULT_MISSIONS = [
  "Robin | Obtenir de ta cible qu’elle te raconte une anecdote improbable.",
  "François | Faire dire à ta cible le mot ‘dragon’ dans une conversation.",
  "François-Xavier | Convaincre ta cible d’inventer un faux proverbe.",
  "Clément | Faire prendre une photo de toi par ta cible.",
  "Julien | Faire choisir à ta cible un surnom pour quelqu’un de la soirée.",
  "Guillaume | Obtenir que ta cible te prête un objet pendant 20 secondes.",
  "Sébastien | Faire deviner à ta cible un animal sans le nommer.",
].join("\n");

const REAL_DEFAULT_MISSION_HINTS = [
  "Aider ta cible à tricher",
  "top de ces animaux pref",
  "acheter un cochon",
  "signer ou dessiner quelque chose",
  "selfie avec ta cible tirant la langue",
  "porter un accessoire",
  "manger du piment",
];

function looksLikeOldDefaultMissions(value) {
  return REAL_DEFAULT_MISSION_HINTS.some((hint) => value.includes(hint));
}

function setNativeTextareaValue(textarea, value) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
  descriptor?.set?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function replaceDefaultMissionTextarea() {
  const titles = Array.from(document.querySelectorAll("h2"));
  const missionTitle = titles.find((title) => title.textContent?.trim() === "Les missions");
  const missionCard = missionTitle?.closest("section");
  const textarea = missionCard?.querySelector("textarea");

  if (!textarea || textarea.dataset.decoyMissionsApplied === "true") return;
  if (!looksLikeOldDefaultMissions(textarea.value)) return;

  textarea.dataset.decoyMissionsApplied = "true";
  setNativeTextareaValue(textarea, DECOY_DEFAULT_MISSIONS);
}

const observer = new MutationObserver(replaceDefaultMissionTextarea);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("load", replaceDefaultMissionTextarea);
setTimeout(replaceDefaultMissionTextarea, 0);
