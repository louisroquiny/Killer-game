import { getApps, initializeApp } from "firebase/app";
import { getDatabase, get, ref, update } from "firebase/database";

const DEFAULT_TIMER_SECONDS = 120 * 60;
const OLD_DEFAULT_TIMER_SECONDS = 30 * 60;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function getFirebaseDb() {
  if (!Object.values(firebaseConfig).every(Boolean)) return null;
  const app = getApps()[0] || initializeApp(firebaseConfig);
  return getDatabase(app);
}

function findTimerMinuteInput() {
  const labels = Array.from(document.querySelectorAll("label"));
  const label = labels.find((item) => item.textContent?.trim() === "Durée en minutes");
  return label?.parentElement?.querySelector("input") || null;
}

function setNativeInputValue(input, value) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  descriptor?.set?.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setDefaultTimerInputTo120() {
  const input = findTimerMinuteInput();
  if (!input || input.dataset.defaultTimer120Applied === "true") return;
  if (input.value === "30" || input.value === "") setNativeInputValue(input, "120");
  input.dataset.defaultTimer120Applied = "true";
}

async function upgradeGameTimerIfStillOldDefault() {
  const gameId = new URLSearchParams(window.location.search).get("game");
  if (!gameId) return;

  const db = getFirebaseDb();
  if (!db) return;

  const timerRef = ref(db, `games/${gameId}/timer`);
  const snapshot = await get(timerRef);
  const timer = snapshot.val();

  if (!timer) return;
  const isOldDefault =
    Number(timer.durationSeconds) === OLD_DEFAULT_TIMER_SECONDS &&
    Number(timer.remainingSeconds) === OLD_DEFAULT_TIMER_SECONDS &&
    timer.running === false;

  if (!isOldDefault) return;

  await update(timerRef, {
    durationSeconds: DEFAULT_TIMER_SECONDS,
    remainingSeconds: DEFAULT_TIMER_SECONDS,
    running: false,
    startedAt: null,
  });
}

function applyDefaultTimerPatch() {
  setDefaultTimerInputTo120();
  upgradeGameTimerIfStillOldDefault().catch(() => {});
}

const observer = new MutationObserver(applyDefaultTimerPatch);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("load", applyDefaultTimerPatch);
window.addEventListener("popstate", applyDefaultTimerPatch);
setInterval(applyDefaultTimerPatch, 1500);
setTimeout(applyDefaultTimerPatch, 0);
