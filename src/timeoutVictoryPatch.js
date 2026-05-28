import { getApps, initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let currentGame = null;
let currentGameId = "";
let unsubscribe = null;

function db() {
  if (!Object.values(firebaseConfig).every(Boolean)) return null;
  return getDatabase(getApps()[0] || initializeApp(firebaseConfig));
}

function players(game) {
  return Object.values(game?.players || {});
}

function timeoutWinners(game) {
  if (game?.status !== "finished_timeout") return null;
  const alive = players(game).filter((player) => player.alive);
  if (!alive.length) return [];
  const maxKills = Math.max(...alive.map((player) => Number(player.kills || 0)));
  return alive.filter((player) => Number(player.kills || 0) === maxKills);
}

function patchVictoryDisplay() {
  const winners = timeoutWinners(currentGame);
  if (!winners) return;

  const maxKills = Number(winners[0]?.kills || 0);
  const label = winners.length > 1 ? "Vainqueurs" : "Vainqueur";
  const names = winners.map((player) => player.name).join(" · ");
  const message = winners.length > 1
    ? `Le chrono est terminé. Égalité : ces survivants ont chacun ${maxKills} kill(s).`
    : `Le chrono est terminé. ${winners[0].name} gagne avec ${maxKills} kill(s).`;

  Array.from(document.querySelectorAll("div"))
    .filter((element) => ["Vainqueur", "Vainqueurs"].includes(element.textContent?.trim()))
    .forEach((element) => {
      element.textContent = label;
      if (element.nextElementSibling) element.nextElementSibling.textContent = names;
      const paragraph = element.nextElementSibling?.nextElementSibling;
      if (paragraph?.tagName === "P") paragraph.textContent = message;
    });
}

function patchRules() {
  const oldText = "S’il ne reste qu’un joueur, il gagne. Si le chrono termine avant, tous les survivants sont déclarés vainqueurs.";
  const newText = "S’il ne reste qu’un joueur, il gagne. Si le chrono termine avec plusieurs survivants, le joueur survivant qui a le plus de kills gagne. En cas d’égalité de kills, il y a égalité.";
  document.querySelectorAll("p").forEach((paragraph) => {
    if (paragraph.textContent?.trim() === oldText) paragraph.textContent = newText;
  });
}

function subscribe() {
  const gameId = new URLSearchParams(window.location.search).get("game") || "";
  if (!gameId || gameId === currentGameId) return;
  currentGameId = gameId;
  if (unsubscribe) unsubscribe();
  const database = db();
  if (!database) return;
  unsubscribe = onValue(ref(database, `games/${gameId}`), (snapshot) => {
    currentGame = snapshot.val();
    patchRules();
    patchVictoryDisplay();
  });
}

function tick() {
  subscribe();
  patchRules();
  patchVictoryDisplay();
}

new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
window.addEventListener("load", tick);
window.addEventListener("popstate", () => { currentGameId = ""; tick(); });
setInterval(tick, 1500);
setTimeout(tick, 0);
