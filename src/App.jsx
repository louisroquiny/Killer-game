import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, onValue, get } from "firebase/database";

function Button({ children, className = "", variant = "default", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    default: "bg-zinc-50 text-zinc-950 hover:bg-zinc-200",
    outline: "border border-zinc-700 bg-zinc-950 text-zinc-50 hover:bg-zinc-900",
    ghost: "bg-transparent text-zinc-300 hover:bg-zinc-900",
    destructive: "bg-red-700 text-white hover:bg-red-600",
  };
  return <button className={`${base} ${styles[variant] || styles.default} ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = "" }) {
  return <section className={`rounded-2xl border bg-zinc-900 shadow-xl ${className}`}>{children}</section>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Input({ className = "", ...props }) {
  return <input className={`w-full rounded-xl border px-3 py-3 outline-none ${className}`} {...props} />;
}

function Textarea({ className = "", ...props }) {
  return <textarea className={`w-full rounded-xl border px-3 py-3 outline-none ${className}`} {...props} />;
}

function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${className}`}>{children}</span>;
}

function Icon({ label }) {
  return <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center text-base">{label}</span>;
}

const Skull = (props) => <Icon label="💀" {...props} />;
const Shuffle = (props) => <Icon label="🔀" {...props} />;
const EyeOff = (props) => <Icon label="🎭" {...props} />;
const Trophy = (props) => <Icon label="🏆" {...props} />;
const RotateCcw = (props) => <Icon label="↻" {...props} />;
const Copy = (props) => <Icon label="📋" {...props} />;
const Lock = (props) => <Icon label="🔒" {...props} />;
const Users = (props) => <Icon label="👥" {...props} />;
const CheckCircle2 = (props) => <Icon label="✅" {...props} />;
const AlertTriangle = (props) => <Icon label="⚠️" {...props} />;
const Radio = (props) => <Icon label="📡" {...props} />;
const LinkIcon = (props) => <Icon label="🔗" {...props} />;
const Smartphone = (props) => <Icon label="📱" {...props} />;

/*
  MULTI-TÉLÉPHONE — SETUP FIREBASE

  1. Crée un projet Firebase.
  2. Active Realtime Database.
  3. Installe Firebase dans ton projet :
     npm install firebase
  4. Remplace les valeurs ci-dessous par ta config Firebase.
  5. Déploie l’app sur Vercel, Netlify ou Firebase Hosting.

  Règles de sécurité conseillées pour une soirée simple :
  {
    "rules": {
      "games": {
        "$gameId": {
          ".read": true,
          ".write": true
        }
      },
      ".read": false,
      ".write": false
    }
  }

  Pour une version plus sécurisée, il faudra ajouter une vraie authentification
  ou un secret organisateur côté Cloud Functions.
*/
const firebaseConfig = {
  apiKey: "AIzaSyAgkcaJV4Is2lPpj8v6raBzE4G2tWjUP90",
  authDomain: "killer-3dc0d.firebaseapp.com",
  databaseURL: "https://killer-3dc0d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "killer-3dc0d",
  storageBucket: "killer-3dc0d.firebasestorage.app",
  messagingSenderId: "545152056355",
  appId: "1:545152056355:web:e386cd2ff0e0d4c6008596",
};

const isFirebaseConfigured = !Object.values(firebaseConfig).some((value) => String(value).includes("REMPLACE_MOI"));
const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const database = firebaseApp ? getDatabase(firebaseApp) : null;

const DEFAULT_NAMES = [
  "Alex",
  "Camille",
  "Sam",
  "Charlie",
  "Lou",
  "Noa",
  "Max",
  "Sasha",
];

const DEFAULT_MISSIONS = [
  "Faire dire à ta cible : ‘Je te jure que c’est vrai.’",
  "Faire trinquer ta cible avec toi.",
  "Faire signer ou dessiner quelque chose à ta cible.",
  "Faire prononcer le mot ‘duperie’ à ta cible.",
  "Obtenir un selfie avec ta cible.",
  "Faire porter un accessoire à ta cible pendant 30 secondes.",
  "Faire rire ta cible avec une histoire inventée.",
  "Faire demander l’heure à ta cible.",
];

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function safeRandomId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeGameId(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function gameIdForTonight() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `DUP-${code}`;
}

function codeFor(index) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${index + 1}-${code}`;
}

function buildTargetsWithoutSelf(cleanNames) {
  const circle = shuffle(cleanNames);
  const targetByName = new Map();

  circle.forEach((name, index) => {
    const nextTarget = circle[(index + 1) % circle.length];
    targetByName.set(name, nextTarget);
  });

  return cleanNames.map((name) => targetByName.get(name));
}

function buildGame(names, missions) {
  const cleanNames = names.map((n, i) => n.trim() || `Joueur ${i + 1}`);
  const targets = buildTargetsWithoutSelf(cleanNames);
  const shuffledMissions = shuffle(missions.filter(Boolean));

  return cleanNames.map((name, index) => ({
    id: safeRandomId("player"),
    name,
    target: targets[index],
    mission: shuffledMissions[index % shuffledMissions.length],
    code: codeFor(index),
    alive: true,
    kills: 0,
  }));
}

function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    alive: player.alive,
    kills: player.kills,
  };
}

function buildSheetText(player, gameId) {
  return `KILLER — DUPERIE\nCode partie : ${gameId}\nNom : ${player.name}\nTa cible : ${player.target}\nTa mission : ${player.mission}\nTon code secret, à donner seulement quand tu es killé : ${player.code}`;
}

async function copyTextSafely(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    }
  } catch (error) {
    // Continue to fallback instead of throwing a NotAllowedError into React.
  }

  try {
    if (typeof document === "undefined") {
      return { ok: false, method: "none" };
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    return { ok: successful, method: successful ? "execCommand" : "manual" };
  } catch (error) {
    return { ok: false, method: "manual" };
  }
}

function gameRef(gameId) {
  return ref(database, `games/${gameId}`);
}

function playerRef(gameId, playerId) {
  return ref(database, `games/${gameId}/players/${playerId}`);
}

function eventRef(gameId, eventId) {
  return ref(database, `games/${gameId}/events/${eventId}`);
}

function runSelfTests() {
  const testNames = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const testMissions = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"];
  const game = buildGame(testNames, testMissions);

  const tests = [
    {
      name: "buildGame creates exactly 8 players",
      pass: game.length === 8,
    },
    {
      name: "no player targets themself",
      pass: game.every((player) => player.name !== player.target),
    },
    {
      name: "each player receives a mission",
      pass: game.every((player) => typeof player.mission === "string" && player.mission.length > 0),
    },
    {
      name: "each player receives a unique code",
      pass: new Set(game.map((player) => player.code)).size === game.length,
    },
    {
      name: "publicPlayer hides target, mission and secret code",
      pass: (() => {
        const visible = publicPlayer(game[0]);
        return !visible.target && !visible.mission && !visible.code && visible.name === game[0].name;
      })(),
    },
    {
      name: "normalizeGameId removes unsafe characters and uppercases",
      pass: normalizeGameId(" dup-12 ab! ") === "DUP-12AB",
    },
    {
      name: "sheet text includes game code, player name, target, mission and secret code",
      pass: (() => {
        const sheet = buildSheetText(game[0], "DUP-TEST");
        return sheet.includes("DUP-TEST") && sheet.includes(game[0].name) && sheet.includes(game[0].target) && sheet.includes(game[0].mission) && sheet.includes(game[0].code);
      })(),
    },
    {
      name: "Firebase config contains a Realtime Database URL",
      pass: typeof firebaseConfig.databaseURL === "string" && firebaseConfig.databaseURL.startsWith("https://"),
    },
  ];

  return tests;
}

function getPlayersArray(game) {
  if (!game?.players) return [];
  return Object.values(game.players);
}

function getEventsArray(game) {
  if (!game?.events) return [];
  return Object.values(game.events).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export default function KillerDuperieApp() {
  const [mode, setMode] = useState("home");
  const [namesText, setNamesText] = useState(DEFAULT_NAMES.join("\n"));
  const [missionsText, setMissionsText] = useState(DEFAULT_MISSIONS.join("\n"));
  const [gameIdInput, setGameIdInput] = useState("");
  const [playerCodeInput, setPlayerCodeInput] = useState("");
  const [gameId, setGameId] = useState("");
  const [localAdminCode, setLocalAdminCode] = useState("");
  const [game, setGame] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [victimCode, setVictimCode] = useState("");
  const [message, setMessage] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const testResults = useMemo(() => runSelfTests(), []);
  const players = useMemo(() => getPlayersArray(game), [game]);
  const events = useMemo(() => getEventsArray(game), [game]);
  const alivePlayers = players.filter((p) => p.alive);
  const deadCount = players.length - alivePlayers.length;
  const winner = players.length > 0 && alivePlayers.length === 1 ? alivePlayers[0] : null;
  const currentPlayer = players.find((p) => p.id === currentPlayerId) || null;
  const isAdmin = mode === "admin" && game?.adminCode && localAdminCode === game.adminCode;
  const publicUrl = typeof window !== "undefined" && gameId ? `${window.location.origin}${window.location.pathname}?game=${gameId}` : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlGameId = normalizeGameId(params.get("game") || "");
    if (urlGameId) {
      setGameIdInput(urlGameId);
      joinGame(urlGameId, "public");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!database || !gameId) return undefined;

    const unsubscribe = onValue(gameRef(gameId), (snapshot) => {
      const value = snapshot.val();
      setGame(value);
      if (!value) {
        setMessage("Aucune partie trouvée avec ce code.");
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  async function createGame() {
    setMessage("");

    if (!isFirebaseConfigured || !database) {
      setMessage("Firebase n’est pas encore configuré. Remplace les valeurs REMPLACE_MOI dans firebaseConfig, puis redéploie l’app.");
      return;
    }

    const names = namesText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, 8);

    const missions = missionsText
      .split("\n")
      .map((m) => m.trim())
      .filter(Boolean);

    if (names.length !== 8) {
      setMessage("Il faut exactement 8 joueurs.");
      return;
    }

    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
      setMessage("Chaque joueur doit avoir un nom unique pour éviter les confusions de cible.");
      return;
    }

    if (missions.length < 8) {
      setMessage("Prévois au moins 8 missions.");
      return;
    }

    const newGameId = gameIdForTonight();
    const adminCode = codeFor(99);
    const builtPlayers = buildGame(names, missions);
    const playersObject = Object.fromEntries(builtPlayers.map((player) => [player.id, player]));
    const now = Date.now();
    const initialEventId = safeRandomId("event");

    await set(gameRef(newGameId), {
      id: newGameId,
      adminCode,
      status: "active",
      createdAt: now,
      updatedAt: now,
      players: playersObject,
      events: {
        [initialEventId]: {
          id: initialEventId,
          text: "La partie a commencé. Les identités restent secrètes.",
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: now,
        },
      },
    });

    setGameId(newGameId);
    setGameIdInput(newGameId);
    setLocalAdminCode(adminCode);
    setMode("admin");
    setMessage(`Partie créée. Code partie : ${newGameId}. Code admin : ${adminCode}. Garde le code admin pour toi.`);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `?game=${newGameId}`);
    }
  }

  async function joinGame(id = gameIdInput, nextMode = "public") {
    setMessage("");
    const normalized = normalizeGameId(id);

    if (!isFirebaseConfigured || !database) {
      setMessage("Firebase n’est pas encore configuré. L’app multi-téléphone fonctionnera après avoir rempli firebaseConfig.");
      return;
    }

    if (!normalized) {
      setMessage("Entre un code partie.");
      return;
    }

    const snapshot = await get(gameRef(normalized));
    if (!snapshot.exists()) {
      setMessage("Aucune partie trouvée avec ce code.");
      return;
    }

    setGameId(normalized);
    setGameIdInput(normalized);
    setMode(nextMode);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `?game=${normalized}`);
    }
  }

  function enterAdmin() {
    if (!game) {
      setMessage("Rejoins d’abord une partie.");
      return;
    }

    if (!localAdminCode || localAdminCode !== game.adminCode) {
      setMessage("Code admin incorrect.");
      return;
    }

    setMode("admin");
    setMessage("Mode organisateur activé.");
  }

  function enterPlayer() {
    setMessage("");
    if (!game) {
      setMessage("Rejoins d’abord une partie.");
      return;
    }

    const normalized = playerCodeInput.trim().toUpperCase();
    const player = players.find((p) => p.code.toUpperCase() === normalized);

    if (!player) {
      setMessage("Code joueur inconnu.");
      return;
    }

    setCurrentPlayerId(player.id);
    setMode("player");
    setMessage(`Bienvenue ${player.name}. Ta fiche secrète est chargée.`);
  }

  async function submitKill() {
    setMessage("");

    if (!database || !gameId || !currentPlayer) {
      setMessage("Connecte-toi comme joueur avant de déclarer un kill.");
      return;
    }

    if (!currentPlayer.alive) {
      setMessage("Tu es éliminé, tu ne peux plus déclarer de kill.");
      return;
    }

    const normalized = victimCode.trim().toUpperCase();
    const victim = players.find((p) => p.code.toUpperCase() === normalized);

    if (!victim) {
      setMessage("Code inconnu. Vérifie le code donné par la victime.");
      return;
    }

    if (!victim.alive) {
      setMessage("Cette personne a déjà été éliminée.");
      return;
    }

    if (victim.id === currentPlayer.id) {
      setMessage("Tu ne peux pas t’éliminer toi-même.");
      return;
    }

    const now = Date.now();
    const remainingAfterKill = alivePlayers.length - 1;
    const newEventId = safeRandomId("event");

    await update(playerRef(gameId, victim.id), {
      alive: false,
      updatedAt: now,
    });

    await update(playerRef(gameId, currentPlayer.id), {
      kills: (currentPlayer.kills || 0) + 1,
      target: victim.target,
      updatedAt: now,
    });

    await set(eventRef(gameId, newEventId), {
      id: newEventId,
      text: `Une personne a été killée. Il reste ${remainingAfterKill} survivant(s).`,
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: now,
    });

    await update(gameRef(gameId), {
      updatedAt: now,
      status: remainingAfterKill === 1 ? "finished" : "active",
    });

    setVictimCode("");
    setMessage("Kill validé. Tout le monde voit l’annonce anonyme en temps réel.");
  }

  async function resetRemoteGame() {
    if (!database || !gameId || !isAdmin) {
      setMessage("Seul l’organisateur peut réinitialiser la partie.");
      return;
    }

    await set(gameRef(gameId), null);
    setMode("home");
    setGame(null);
    setGameId("");
    setGameIdInput("");
    setCurrentPlayerId("");
    setLocalAdminCode("");
    setMessage("Partie supprimée.");

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  async function copySheet(player) {
    const text = buildSheetText(player, gameId);
    const result = await copyTextSafely(text);

    if (result.ok) {
      setMessage(`Fiche de ${player.name} copiée.`);
    } else {
      setMessage(`Copie automatique bloquée. Sélectionne et copie manuellement cette fiche :\n\n${text}`);
    }
  }

  async function copyPublicLink() {
    const result = await copyTextSafely(publicUrl);
    setMessage(result.ok ? "Lien public copié." : `Copie automatique bloquée. Lien : ${publicUrl}`);
  }

  function renderFirebaseWarning() {
    if (isFirebaseConfigured) return null;

    return (
      <Card className="bg-amber-950/40 border-amber-800 text-amber-100 rounded-2xl shadow-xl">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-5 w-5" /> Firebase à configurer
          </div>
          <p className="text-sm text-amber-100/80">
            Cette version est prête pour le multi-téléphone, mais il faut remplacer les valeurs REMPLACE_MOI dans <span className="font-mono">firebaseConfig</span> avant de la déployer.
          </p>
        </CardContent>
      </Card>
    );
  }

  function renderPublicBoard() {
    return (
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Écran public</h2>
              <p className="text-sm text-zinc-400">Code partie : <span className="font-mono text-zinc-200">{gameId || "—"}</span></p>
            </div>
            <Badge className="bg-zinc-800 text-zinc-100 border-zinc-700">
              <Radio className="mr-1 h-3 w-3" /> Live
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-950 p-4 text-center">
              <div className="text-4xl font-black">{alivePlayers.length}</div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">survivants</div>
            </div>
            <div className="rounded-xl bg-zinc-950 p-4 text-center">
              <div className="text-4xl font-black">{deadCount}</div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">kills</div>
            </div>
          </div>

          {winner ? (
            <div className="rounded-2xl border border-yellow-700 bg-yellow-950/40 p-4 text-yellow-100">
              <div className="flex items-center gap-2 text-xl font-black">
                <Trophy className="h-6 w-6" /> Dernier survivant
              </div>
              <div className="mt-2 text-3xl font-black">{winner.name}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-zinc-500">Aucun événement pour l’instant.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="rounded-xl bg-zinc-950 p-3 text-sm">
                    <span className="text-zinc-500">{event.at}</span> — {event.text}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-zinc-400">
              <EyeOff className="h-5 w-5" />
              <span className="uppercase tracking-[0.35em] text-xs">Soirée Duperie</span>
            </div>
            <h1 className="mt-2 text-4xl sm:text-6xl font-black tracking-tight">Killer</h1>
            <p className="mt-2 max-w-2xl text-zinc-400">
              Qui sera le roi de la duperie ?
            </p>
          </div>
          <Badge className="w-fit bg-zinc-800 text-zinc-100 border-zinc-700 text-sm px-3 py-1">
            {game ? `${alivePlayers.length}/${players.length} en vie` : "Multi-téléphone"}
          </Badge>
        </header>

        {renderFirebaseWarning()}

        {message && (
          <div className="whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
            {message}
          </div>
        )}

        {mode === "home" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  <h2 className="text-xl font-bold">Rejoindre une partie</h2>
                </div>
                <p className="text-sm text-zinc-400">Tes amis entrent le code partie, puis leur code joueur secret.</p>
                <Input
                  value={gameIdInput}
                  onChange={(event) => setGameIdInput(normalizeGameId(event.target.value))}
                  placeholder="Code partie, ex. DUP-ABC123"
                  className="h-12 bg-zinc-950 border-zinc-700 rounded-xl font-mono uppercase"
                />
                <Button onClick={() => joinGame(gameIdInput, "public")} className="w-full rounded-2xl h-12 font-bold">
                  Rejoindre l’écran public
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h2 className="text-xl font-bold">Créer la partie</h2>
                </div>
                <p className="text-sm text-zinc-400">Réservé à l’organisateur. Tu généreras les fiches et le lien public.</p>
                <Button onClick={() => setMode("setup")} variant="outline" className="w-full rounded-2xl h-12 border-zinc-700 bg-zinc-950 font-bold">
                  Préparer les 8 joueurs
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {mode === "setup" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h2 className="text-xl font-bold">Les 8 joueurs</h2>
                </div>
                <p className="text-sm text-zinc-400">Un nom par ligne. Les noms doivent être uniques.</p>
                <Textarea
                  value={namesText}
                  onChange={(e) => setNamesText(e.target.value)}
                  className="min-h-56 bg-zinc-950 border-zinc-700 rounded-xl"
                />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <h2 className="text-xl font-bold">Les missions</h2>
                </div>
                <p className="text-sm text-zinc-400">Une mission par ligne. Au moins 8 missions pour éviter les doublons.</p>
                <Textarea
                  value={missionsText}
                  onChange={(e) => setMissionsText(e.target.value)}
                  className="min-h-56 bg-zinc-950 border-zinc-700 rounded-xl"
                />
              </CardContent>
            </Card>

            <div className="lg:col-span-2 flex flex-col sm:flex-row gap-3">
              <Button onClick={createGame} className="rounded-2xl h-12 text-base font-bold">
                <Shuffle className="mr-2 h-5 w-5" /> Créer la partie live
              </Button>
              <Button variant="outline" onClick={() => setShowTests(!showTests)} className="rounded-2xl h-12 border-zinc-700 bg-zinc-950">
                {showTests ? "Cacher les tests" : "Afficher les tests"}
              </Button>
              <Button variant="ghost" onClick={() => setMode("home")} className="rounded-2xl h-12">
                Retour
              </Button>
            </div>

            {showTests && (
              <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-xl font-bold">Tests intégrés</h2>
                  <div className="grid gap-2">
                    {testResults.map((test) => (
                      <div key={test.name} className="flex items-center gap-2 rounded-xl bg-zinc-950 p-3 text-sm">
                        {test.pass ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-red-300" />}
                        <span>{test.name}</span>
                        <Badge className={test.pass ? "ml-auto bg-emerald-950 text-emerald-200" : "ml-auto bg-red-950 text-red-200"}>
                          {test.pass ? "OK" : "Échec"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {game && mode === "public" && (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-2xl font-black">Connexion joueur</h2>
                <p className="text-sm text-zinc-400">Entre ton code secret pour voir ta cible et déclarer un kill.</p>
                <Input
                  value={playerCodeInput}
                  onChange={(event) => setPlayerCodeInput(event.target.value.toUpperCase())}
                  placeholder="Ton code joueur"
                  className="h-12 bg-zinc-950 border-zinc-700 rounded-xl font-mono uppercase"
                />
                <Button onClick={enterPlayer} className="w-full rounded-2xl h-12 font-bold">
                  Voir ma fiche secrète
                </Button>

                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <h3 className="font-bold">Organisateur</h3>
                  <Input
                    value={localAdminCode}
                    onChange={(event) => setLocalAdminCode(event.target.value.toUpperCase())}
                    placeholder="Code admin"
                    className="h-12 bg-zinc-950 border-zinc-700 rounded-xl font-mono uppercase"
                  />
                  <Button variant="outline" onClick={enterAdmin} className="w-full rounded-2xl h-12 border-zinc-700 bg-zinc-950">
                    Entrer en mode organisateur
                  </Button>
                </div>
              </CardContent>
            </Card>
            {renderPublicBoard()}
          </div>
        )}

        {game && mode === "player" && currentPlayer && (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-2xl font-black">Ta fiche secrète</h2>
                <div key={currentPlayer.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">Joueur</div>
                      <div className="text-3xl font-black">{currentPlayer.name}</div>
                    </div>
                    <Badge className={currentPlayer.alive ? "bg-emerald-950 text-emerald-200" : "bg-red-950 text-red-200"}>
                      {currentPlayer.alive ? "En vie" : "Killé"}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-zinc-900 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Ta cible</div>
                      <div className="mt-1 text-xl font-bold">{currentPlayer.alive ? currentPlayer.target : "—"}</div>
                    </div>
                    <div className="rounded-xl bg-zinc-900 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Ton code secret</div>
                      <div className="mt-1 text-xl font-mono font-bold">{currentPlayer.code}</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-zinc-900 p-4">
                    <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Ta mission</div>
                    <p className="mt-2 text-lg leading-relaxed">{currentPlayer.alive ? currentPlayer.mission : "Tu es éliminé. Donne ton code à ton assassin."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <Skull className="h-6 w-6" /> Déclarer un kill
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Quand ta cible est éliminée, elle te donne son code. Entre-le ici.
                  </p>
                  <Input
                    value={victimCode}
                    onChange={(e) => setVictimCode(e.target.value.toUpperCase())}
                    placeholder="Code de la victime"
                    className="h-12 bg-zinc-950 border-zinc-700 rounded-xl font-mono uppercase"
                  />
                  <Button onClick={submitKill} className="w-full rounded-2xl h-12 text-base font-bold">
                    Valider le kill
                  </Button>
                  <Button variant="ghost" onClick={() => setMode("public")} className="w-full rounded-2xl h-12">
                    Retour écran public
                  </Button>
                </CardContent>
              </Card>
              {renderPublicBoard()}
            </div>
          </div>
        )}

        {game && mode === "admin" && isAdmin && (
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-2xl font-black">Organisateur</h2>
                <div className="rounded-xl bg-zinc-950 p-4 space-y-2">
                  <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Code partie</div>
                  <div className="text-3xl font-mono font-black">{gameId}</div>
                </div>
                <div className="rounded-xl bg-zinc-950 p-4 space-y-2">
                  <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">Lien public</div>
                  <div className="break-all text-sm text-zinc-300">{publicUrl}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={copyPublicLink} className="rounded-2xl h-12 font-bold">
                    <LinkIcon className="mr-2 h-4 w-4" /> Copier le lien
                  </Button>
                  <Button variant="outline" onClick={() => setShowAdmin(!showAdmin)} className="rounded-2xl h-12 border-zinc-700 bg-zinc-950">
                    {showAdmin ? "Cacher les fiches" : "Voir les fiches"}
                  </Button>
                </div>
                <Button variant="destructive" onClick={resetRemoteGame} className="rounded-2xl h-12">
                  <RotateCcw className="mr-2 h-4 w-4" /> Supprimer la partie
                </Button>
              </CardContent>
            </Card>

            {renderPublicBoard()}

            {showAdmin && (
              <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800 text-zinc-50 rounded-2xl shadow-xl">
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-2xl font-black">Fiches joueurs — à envoyer en privé</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {players.map((player) => (
                      <div key={player.id} className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xl font-black">{player.name}</div>
                            <div className="text-sm text-zinc-500">Code : <span className="font-mono">{player.code}</span></div>
                          </div>
                          <Badge className={player.alive ? "bg-emerald-950 text-emerald-200" : "bg-red-950 text-red-200"}>
                            {player.alive ? "En vie" : "Killé"}
                          </Badge>
                        </div>
                        <div className="text-sm text-zinc-300">Cible : <strong>{player.target}</strong></div>
                        <div className="text-sm text-zinc-300">Mission : {player.mission}</div>
                        <Button variant="outline" onClick={() => copySheet(player)} className="rounded-xl border-zinc-700 bg-zinc-900">
                          <Copy className="mr-2 h-4 w-4" /> Copier sa fiche
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
