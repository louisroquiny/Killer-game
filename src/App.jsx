import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, onValue, get } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const db = app ? getDatabase(app) : null;

const DEFAULT_NAMES = ["Alex", "Camille", "Sam", "Charlie", "Lou", "Noa", "Max", "Sasha"].join("\n");
const DEFAULT_MISSIONS = [
  "Camille | Faire dire à ta cible : ‘Je te jure que c’est vrai.’",
  "Sam | Faire trinquer ta cible avec toi.",
  "Charlie | Faire signer ou dessiner quelque chose à ta cible.",
  "Lou | Faire prononcer le mot ‘duperie’ à ta cible.",
  "Noa | Obtenir un selfie avec ta cible.",
  "Max | Faire porter un accessoire à ta cible pendant 30 secondes.",
  "Sasha | Faire rire ta cible avec une histoire inventée.",
  "Alex | Faire demander l’heure à ta cible.",
].join("\n");

const CHINESE_CODE_WORDS = [
  "DRAGON",
  "LOTUS",
  "PANDA",
  "JADE",
  "TIGER",
  "BAMBOU",
  "LANTERNE",
  "PHENIX",
  "DYNASTIE",
  "PAGODE",
  "MURAILLE",
  "CERF-VOLANT",
  "THE",
  "YIN-YANG",
  "BOUSSOLE",
  "CALLIGRAPHIE",
  "SOIE",
  "LUNE",
  "RIZ",
  "MING",
  "QIN",
  "HAN",
  "KUNG-FU",
  "MAHJONG",
];

function Button({ children, variant = "default", className = "", ...props }) {
  const variants = {
    default: "bg-white text-zinc-950 hover:bg-zinc-200",
    outline: "border border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-900",
    ghost: "text-zinc-300 hover:bg-zinc-900",
    danger: "bg-red-700 text-white hover:bg-red-600",
  };

  return (
    <button className={`rounded-2xl px-4 py-3 font-bold transition disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return <section className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl ${className}`}>{children}</section>;
}

function Field({ as = "input", className = "", ...props }) {
  const Component = as;
  return <Component className={`w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none ${className}`} {...props} />;
}

function Badge({ children, className = "" }) {
  return <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-sm font-bold ${className}`}>{children}</span>;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeGameCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `DUP-${code}`;
}

function makeAdminCode() {
  return `ADMIN-${Math.floor(1000 + Math.random() * 9000)}`;
}

function makePlayerCodes(count) {
  const candidates = [];
  for (const word of CHINESE_CODE_WORDS) {
    for (let number = 1; number <= 9; number += 1) {
      candidates.push(`${word}-${number}`);
    }
  }

  const shuffled = shuffle(candidates);
  if (count <= shuffled.length) return shuffled.slice(0, count);

  return Array.from({ length: count }, (_, index) => `${shuffled[index % shuffled.length]}-${index + 1}`);
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function parseLines(text) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

function parseMissionLine(line) {
  const separator = line.indexOf("|");
  if (separator === -1) return { target: "", mission: line.trim() };
  return {
    target: line.slice(0, separator).trim(),
    mission: line.slice(separator + 1).trim(),
  };
}

function buildMissionCards(names, missionLines) {
  const parsed = missionLines.map(parseMissionLine);
  const nameByKey = new Map(names.map((name) => [normalizeName(name), name]));
  const explicitTargets = new Set();

  const cards = parsed.map((item) => {
    if (!item.target) return { target: "", mission: item.mission };
    const target = nameByKey.get(normalizeName(item.target));
    if (!target) throw new Error(`Cible inconnue : ${item.target}`);
    const key = normalizeName(target);
    if (explicitTargets.has(key)) throw new Error(`La cible ${target} est attribuée à plusieurs missions.`);
    explicitTargets.add(key);
    return { target, mission: item.mission };
  });

  const remainingTargets = shuffle(names.filter((name) => !explicitTargets.has(normalizeName(name))));
  return cards.map((card) => (card.target ? card : { ...card, target: remainingTargets.shift() }));
}

function assignCardsToPlayers(names, missionCards) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const cards = shuffle(missionCards);
    if (cards.every((card, index) => normalizeName(card.target) !== normalizeName(names[index]))) return cards;
  }

  throw new Error("Impossible d’attribuer les missions sans qu’un joueur se cible lui-même. Essaie de modifier une cible de mission.");
}

function buildPlayers(names, missionLines) {
  const missionCards = buildMissionCards(names, missionLines);
  const assignedCards = assignCardsToPlayers(names, missionCards);
  const codes = makePlayerCodes(names.length);

  return names.map((name, index) => ({
    id: randomId("player"),
    name,
    target: assignedCards[index].target,
    mission: assignedCards[index].mission,
    code: codes[index],
    alive: true,
    kills: 0,
  }));
}

function getPlayers(game) {
  return Object.values(game?.players || {});
}

function getEvents(game) {
  return Object.values(game?.events || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function validateSetup(names, missionLines) {
  if (names.length < 2) return "Il faut au moins 2 joueurs.";
  if (new Set(names.map(normalizeName)).size !== names.length) return "Chaque joueur doit avoir un nom unique.";
  if (missionLines.length !== names.length) return `Il faut exactement autant de missions que de joueurs : ${names.length} joueur(s), ${missionLines.length} mission(s).`;

  try {
    const cards = buildMissionCards(names, missionLines);
    if (cards.some((card) => !card.mission)) return "Chaque ligne de mission doit contenir une mission.";
    if (new Set(cards.map((card) => normalizeName(card.target))).size !== names.length) return "Chaque joueur doit être ciblé exactement une fois.";
  } catch (error) {
    return error.message;
  }

  return "";
}

function runSelfTests() {
  const names = ["Robin", "Clement", "Francois", "Alice"];
  const missionLines = [
    "Clement | Faire trinquer Clement",
    "Francois | Faire rire Francois",
    "Alice | Obtenir un selfie avec Alice",
    "Robin | Faire dire duperie a Robin",
  ];
  const players = buildPlayers(names, missionLines);
  const cards = buildMissionCards(names, missionLines);
  const assassin = { ...players[0] };
  const victim = { ...players.find((player) => player.name === assassin.target) };
  assassin.target = victim.target;
  assassin.mission = victim.mission;

  return [
    { name: "un joueur est créé par nom", pass: players.length === names.length },
    { name: "chaque joueur a une mission unique", pass: new Set(players.map((p) => p.mission)).size === players.length },
    { name: "chaque joueur est ciblé exactement une fois", pass: new Set(players.map((p) => p.target)).size === players.length && players.every((p) => names.includes(p.target)) },
    { name: "personne ne se cible soi-même au départ", pass: players.every((p) => normalizeName(p.name) !== normalizeName(p.target)) },
    { name: "les cibles écrites dans les missions sont conservées", pass: cards.some((card) => card.target === "Francois" && card.mission === "Faire rire Francois") },
    { name: "les codes joueurs sont simples et thématiques", pass: players.every((player) => CHINESE_CODE_WORDS.some((word) => player.code.startsWith(`${word}-`))) },
    { name: "les codes joueurs sont uniques", pass: new Set(players.map((player) => player.code)).size === players.length },
    { name: "l'assassin récupère la cible et la mission de la victime", pass: assassin.target === victim.target && assassin.mission === victim.mission },
    { name: "la validation bloque missions differentes des joueurs", pass: validateSetup(names, missionLines.slice(0, 3)).includes("autant de missions") },
    { name: "la validation bloque une cible inconnue", pass: validateSetup(names, ["Zoé | Mission", "Clement | Mission", "Francois | Mission", "Alice | Mission"]).includes("Cible inconnue") },
  ];
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function App() {
  const [mode, setMode] = useState("home");
  const [namesText, setNamesText] = useState(DEFAULT_NAMES);
  const [missionsText, setMissionsText] = useState(DEFAULT_MISSIONS);
  const [gameId, setGameId] = useState("");
  const [gameIdInput, setGameIdInput] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [playerCode, setPlayerCode] = useState("");
  const [pendingPrivateCode, setPendingPrivateCode] = useState("");
  const [victimCode, setVictimCode] = useState("");
  const [game, setGame] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [message, setMessage] = useState("");
  const [showCards, setShowCards] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const players = useMemo(() => getPlayers(game), [game]);
  const events = useMemo(() => getEvents(game), [game]);
  const alivePlayers = players.filter((player) => player.alive);
  const deadCount = players.length - alivePlayers.length;
  const winner = players.length > 0 && alivePlayers.length === 1 ? alivePlayers[0] : null;
  const currentPlayer = players.find((player) => player.id === currentPlayerId);
  const isAdmin = game?.adminCode && adminCode === game.adminCode;
  const publicUrl = gameId ? `${window.location.origin}${window.location.pathname}?game=${gameId}` : "";
  const tests = useMemo(runSelfTests, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = normalizeCode(params.get("game"));
    const privateCode = normalizeCode(params.get("player"));
    if (privateCode) {
      setPendingPrivateCode(privateCode);
      setPlayerCode(privateCode);
    }
    if (fromUrl) joinGame(fromUrl, "public");
  }, []);

  useEffect(() => {
    if (!db || !gameId) return undefined;
    return onValue(ref(db, `games/${gameId}`), (snapshot) => {
      const value = snapshot.val();
      setGame(value);
      if (!value) setMessage("Aucune partie trouvée avec ce code.");
    });
  }, [gameId]);

  useEffect(() => {
    if (!pendingPrivateCode || !players.length) return;
    const player = players.find((item) => item.code.toUpperCase() === pendingPrivateCode);
    if (!player) return;
    setCurrentPlayerId(player.id);
    setMode("player");
    setPendingPrivateCode("");
    setMessage(`Bienvenue ${player.name}.`);
  }, [pendingPrivateCode, players]);

  function ensureFirebase() {
    if (db) return true;
    setMessage("Firebase n'est pas configuré. Ajoute les variables VITE_FIREBASE_* dans Vercel ou dans ton fichier .env.local.");
    return false;
  }

  function privateUrl(player) {
    if (!gameId) return "";
    return `${window.location.origin}${window.location.pathname}?game=${gameId}&player=${encodeURIComponent(player.code)}`;
  }

  async function createGame() {
    if (!ensureFirebase()) return;
    setMessage("");
    const names = parseLines(namesText);
    const missionLines = parseLines(missionsText);
    const error = validateSetup(names, missionLines);
    if (error) return setMessage(error);
    const id = makeGameCode();
    const newAdminCode = makeAdminCode();
    const now = Date.now();
    const builtPlayers = buildPlayers(names, missionLines);
    const initialEventId = randomId("event");
    await set(ref(db, `games/${id}`), {
      id,
      adminCode: newAdminCode,
      status: "active",
      createdAt: now,
      updatedAt: now,
      players: Object.fromEntries(builtPlayers.map((player) => [player.id, player])),
      events: {
        [initialEventId]: {
          id: initialEventId,
          text: "La partie a commencé. Les identités restent secrètes.",
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: now,
        },
      },
    });
    setGameId(id);
    setGameIdInput(id);
    setAdminCode(newAdminCode);
    setMode("admin");
    window.history.replaceState({}, "", `?game=${id}`);
    setMessage(`Partie créée. Code partie : ${id}. Code admin : ${newAdminCode}.`);
  }

  async function joinGame(id = gameIdInput, nextMode = "public") {
    if (!ensureFirebase()) return;
    const normalized = normalizeCode(id);
    setMessage("");
    if (!normalized) return setMessage("Entre un code partie.");
    const snapshot = await get(ref(db, `games/${normalized}`));
    if (!snapshot.exists()) return setMessage("Aucune partie trouvée avec ce code.");
    setGameId(normalized);
    setGameIdInput(normalized);
    setMode(nextMode);
    window.history.replaceState({}, "", `?game=${normalized}`);
  }

  function enterPlayer() {
    const player = players.find((item) => item.code.toUpperCase() === normalizeCode(playerCode));
    if (!player) return setMessage("Code joueur inconnu.");
    setCurrentPlayerId(player.id);
    setMode("player");
    setMessage(`Bienvenue ${player.name}.`);
  }

  function enterAdmin() {
    if (!isAdmin) return setMessage("Code admin incorrect.");
    setMode("admin");
    setMessage("Mode organisateur activé.");
  }

  async function submitKill() {
    if (!ensureFirebase()) return;
    if (!currentPlayer) return setMessage("Connecte-toi comme joueur avant de déclarer un kill.");
    if (!currentPlayer.alive) return setMessage("Tu es éliminé, tu ne peux plus déclarer de kill.");
    const victim = players.find((player) => player.code.toUpperCase() === normalizeCode(victimCode));
    if (!victim) return setMessage("Code inconnu. Vérifie le code donné par la victime.");
    if (!victim.alive) return setMessage("Cette personne a déjà été éliminée.");
    if (victim.id === currentPlayer.id) return setMessage("Tu ne peux pas t’éliminer toi-même.");
    const now = Date.now();
    const remainingAfterKill = alivePlayers.length - 1;
    const eventId = randomId("event");
    await update(ref(db, `games/${gameId}/players/${victim.id}`), { alive: false, updatedAt: now });
    await update(ref(db, `games/${gameId}/players/${currentPlayer.id}`), {
      kills: (currentPlayer.kills || 0) + 1,
      target: victim.target,
      mission: victim.mission,
      updatedAt: now,
    });
    await set(ref(db, `games/${gameId}/events/${eventId}`), {
      id: eventId,
      text: `Une personne a été killée. Il reste ${remainingAfterKill} survivant(s).`,
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now,
    });
    await update(ref(db, `games/${gameId}`), { status: remainingAfterKill === 1 ? "finished" : "active", updatedAt: now });
    setVictimCode("");
    setMessage("Kill validé. Tu récupères la cible et la mission de la victime.");
  }

  async function deleteGame() {
    if (!ensureFirebase()) return;
    if (!isAdmin) return setMessage("Seul l’organisateur peut supprimer la partie.");
    await set(ref(db, `games/${gameId}`), null);
    setGame(null);
    setGameId("");
    setGameIdInput("");
    setAdminCode("");
    setCurrentPlayerId("");
    setMode("home");
    window.history.replaceState({}, "", window.location.pathname);
    setMessage("Partie supprimée.");
  }

  function playerSheet(player) {
    return `KILLER\nJoueur : ${player.name}\nLien privé : ${privateUrl(player)}\nCode joueur : ${player.code}\nCible actuelle : ${player.target}\nMission actuelle : ${player.mission}`;
  }

  async function copySheet(player) {
    const ok = await copyText(playerSheet(player));
    setMessage(ok ? `Fiche privée de ${player.name} copiée.` : playerSheet(player));
  }

  async function copyPrivateLink(player) {
    const ok = await copyText(privateUrl(player));
    setMessage(ok ? `Lien privé de ${player.name} copié.` : privateUrl(player));
  }

  async function copyLink() {
    const ok = await copyText(publicUrl);
    setMessage(ok ? "Lien public copié." : publicUrl);
  }

  function PublicBoard() {
    return (
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Écran public</h2>
            <p className="text-sm text-zinc-400">Code partie : <span className="font-mono text-zinc-200">{gameId || "—"}</span></p>
          </div>
          <Badge className="border-zinc-700 bg-zinc-800 text-zinc-100">Live</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-zinc-950 p-4 text-center"><div className="text-4xl font-black">{alivePlayers.length}</div><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">survivants</div></div>
          <div className="rounded-xl bg-zinc-950 p-4 text-center"><div className="text-4xl font-black">{deadCount}</div><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">kills</div></div>
        </div>
        {winner ? <div className="mt-4 rounded-2xl border border-yellow-700 bg-yellow-950/40 p-4 text-yellow-100"><div className="text-xl font-black">Dernier survivant</div><div className="mt-2 text-3xl font-black">{winner.name}</div></div> : null}
        {!winner ? <div className="mt-4 space-y-2">{events.length === 0 ? <p className="text-sm text-zinc-500">Aucun événement pour l’instant.</p> : null}{events.map((event) => <div key={event.id} className="rounded-xl bg-zinc-950 p-3 text-sm"><span className="text-zinc-500">{event.at}</span> — {event.text}</div>)}</div> : null}
      </Card>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-50 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-5xl font-black tracking-tight sm:text-6xl">Killer</h1><p className="mt-2 max-w-2xl text-zinc-400">Qui sera le roi de la duperie ?</p></div>
          <Badge className="border-zinc-700 bg-zinc-800 text-zinc-100">{game ? `${alivePlayers.length}/${players.length} en vie` : "Multi-téléphone"}</Badge>
        </header>
        {message ? <div className="whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-200">{message}</div> : null}

        {mode === "home" ? <div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="text-xl font-bold">Rejoindre une partie</h2><p className="mt-2 text-sm text-zinc-400">Entre le code partie, puis ton code joueur secret.</p><Field className="mt-4 font-mono uppercase" value={gameIdInput} onChange={(event) => setGameIdInput(normalizeCode(event.target.value))} placeholder="DUP-ABC12" /><Button className="mt-4 w-full" onClick={() => joinGame(gameIdInput, "public")}>Rejoindre</Button></Card><Card><h2 className="text-xl font-bold">Créer la partie</h2><p className="mt-2 text-sm text-zinc-400">Nombre de joueurs libre. Une mission peut être liée à une cible avec le format : Cible | Mission.</p><Button className="mt-4 w-full" variant="outline" onClick={() => setMode("setup")}>Préparer les joueurs</Button></Card></div> : null}

        {mode === "setup" ? <div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="text-xl font-bold">Les joueurs</h2><p className="mt-2 text-sm text-zinc-400">Un nom par ligne. Minimum 2 joueurs.</p><Field as="textarea" className="mt-4 min-h-60" value={namesText} onChange={(event) => setNamesText(event.target.value)} /></Card><Card><h2 className="text-xl font-bold">Les missions</h2><p className="mt-2 text-sm text-zinc-400">Une ligne par mission. Format conseillé : <span className="font-mono text-zinc-200">Nom cible | Mission</span>. Sans nom cible, la cible est choisie au hasard.</p><Field as="textarea" className="mt-4 min-h-60" value={missionsText} onChange={(event) => setMissionsText(event.target.value)} /></Card><div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row"><Button onClick={createGame}>Créer la partie live</Button><Button variant="outline" onClick={() => setShowTests(!showTests)}>{showTests ? "Cacher les tests" : "Afficher les tests"}</Button><Button variant="ghost" onClick={() => setMode("home")}>Retour</Button></div>{showTests ? <Card className="lg:col-span-2"><h2 className="text-xl font-bold">Tests intégrés</h2><div className="mt-3 grid gap-2">{tests.map((test) => <div key={test.name} className="flex items-center justify-between rounded-xl bg-zinc-950 p-3 text-sm"><span>{test.name}</span><Badge className={test.pass ? "border-emerald-800 bg-emerald-950 text-emerald-200" : "border-red-800 bg-red-950 text-red-200"}>{test.pass ? "OK" : "Échec"}</Badge></div>)}</div></Card> : null}</div> : null}

        {game && mode === "public" ? <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><Card><h2 className="text-2xl font-black">Connexion joueur</h2><p className="mt-2 text-sm text-zinc-400">Entre ton code joueur pour voir ta fiche, ou ouvre ton lien privé.</p><Field className="mt-4 font-mono uppercase" value={playerCode} onChange={(event) => setPlayerCode(event.target.value.toUpperCase())} placeholder="DRAGON-8" /><Button className="mt-4 w-full" onClick={enterPlayer}>Voir ma fiche</Button><div className="mt-6 border-t border-zinc-800 pt-4"><h3 className="font-bold">Organisateur</h3><Field className="mt-3 font-mono uppercase" value={adminCode} onChange={(event) => setAdminCode(event.target.value.toUpperCase())} placeholder="Code admin" /><Button className="mt-3 w-full" variant="outline" onClick={enterAdmin}>Mode organisateur</Button></div></Card><PublicBoard /></div> : null}

        {game && mode === "player" && currentPlayer ? <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><Card><h2 className="text-2xl font-black">Ta fiche secrète</h2><div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Joueur</div><div className="text-3xl font-black">{currentPlayer.name}</div></div><Badge className={currentPlayer.alive ? "border-emerald-800 bg-emerald-950 text-emerald-200" : "border-red-800 bg-red-950 text-red-200"}>{currentPlayer.alive ? "En vie" : "Killé"}</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-zinc-900 p-4"><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Ta cible actuelle</div><div className="mt-1 text-xl font-bold">{currentPlayer.alive ? currentPlayer.target : "—"}</div></div><div className="rounded-xl bg-zinc-900 p-4"><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Ton code secret</div><div className="mt-1 font-mono text-xl font-bold">{currentPlayer.code}</div></div></div><div className="mt-3 rounded-xl bg-zinc-900 p-4"><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Ta mission actuelle</div><p className="mt-2 text-lg leading-relaxed">{currentPlayer.alive ? currentPlayer.mission : "Tu es éliminé. Donne ton code à ton assassin."}</p></div></div></Card><div className="space-y-4"><Card><h2 className="text-2xl font-black">Déclarer un kill</h2><p className="mt-2 text-sm text-zinc-400">Entre le code donné par ta victime. Tu récupéreras sa cible et sa mission.</p><Field className="mt-4 font-mono uppercase" value={victimCode} onChange={(event) => setVictimCode(event.target.value.toUpperCase())} placeholder="Code de la victime" /><Button className="mt-4 w-full" onClick={submitKill}>Valider le kill</Button><Button className="mt-2 w-full" variant="ghost" onClick={() => setMode("public")}>Retour écran public</Button></Card><PublicBoard /></div></div> : null}

        {game && mode === "admin" && isAdmin ? <div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="text-2xl font-black">Organisateur</h2><div className="mt-4 rounded-xl bg-zinc-950 p-4"><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Code partie</div><div className="mt-1 font-mono text-3xl font-black">{gameId}</div></div><div className="mt-3 rounded-xl bg-zinc-950 p-4"><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Lien public</div><div className="mt-1 break-all text-sm text-zinc-300">{publicUrl}</div></div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Button onClick={copyLink}>Copier le lien public</Button><Button variant="outline" onClick={() => setShowCards(!showCards)}>{showCards ? "Cacher les fiches" : "Voir les fiches"}</Button></div><Button className="mt-3 w-full" variant="danger" onClick={deleteGame}>Supprimer la partie</Button></Card><PublicBoard />{showCards ? <Card className="lg:col-span-2"><h2 className="text-2xl font-black">Fiches joueurs</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{players.map((player) => <div key={player.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xl font-black">{player.name}</div><div className="text-sm text-zinc-500">Code : <span className="font-mono">{player.code}</span></div></div><Badge className={player.alive ? "border-emerald-800 bg-emerald-950 text-emerald-200" : "border-red-800 bg-red-950 text-red-200"}>{player.alive ? "En vie" : "Killé"}</Badge></div><div className="mt-3 text-sm text-zinc-300">Lien privé : <span className="break-all text-zinc-400">{privateUrl(player)}</span></div><div className="mt-3 text-sm text-zinc-300">Cible actuelle : <strong>{player.target}</strong></div><div className="mt-1 text-sm text-zinc-300">Mission actuelle : {player.mission}</div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => copyPrivateLink(player)}>Copier lien privé</Button><Button variant="outline" onClick={() => copySheet(player)}>Copier fiche</Button></div></div>)}</div></Card> : null}</div> : null}
      </div>
    </main>
  );
}
