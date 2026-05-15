import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Cable,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Crown,
  Cpu,
  Download,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Gauge,
  GraduationCap,
  Home,
  Layers,
  LineChart,
  Lock,
  LogOut,
  Medal,
  Menu,
  Monitor,
  Network,
  Play,
  Radio,
  Rocket,
  Route,
  Search,
  Send,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import NetworkBackground from "./components/NetworkBackground.jsx";
import { badges, courseNodes, levels, quizBank, seedLeaderboard, tutorAnswers } from "./data/course.js";
import {
  authModeLabel,
  getCurrentUser,
  getLocalStudents,
  loginUser,
  logoutUser,
  registerUser,
  saveCurrentUser,
} from "./services/auth.js";
import { downloadCertificate } from "./services/certificate.js";

const navItems = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "route", label: "Ruta", icon: Route },
  { id: "lab", label: "Laboratorio", icon: Network },
  { id: "leaderboard", label: "Ranking", icon: Trophy },
  { id: "profile", label: "Perfil", icon: User },
  { id: "teacher", label: "Profesor", icon: GraduationCap },
  { id: "tutor", label: "Tutor", icon: Bot },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getLevelInfo = (xp = 0) => {
  const index = levels.findLastIndex((level) => xp >= level.min);
  const currentIndex = Math.max(index, 0);
  const current = levels[currentIndex];
  const next = levels[currentIndex + 1] ?? { min: current.min + 1500, title: "Leyenda Gridly" };
  const progress = clamp(((xp - current.min) / (next.min - current.min)) * 100, 0, 100);
  return { number: currentIndex + 1, current, next, progress };
};

const getCompletion = (user) => {
  if (!user) return 0;
  return Math.round(((user.completed?.length ?? 0) / courseNodes.length) * 100);
};

const addBadge = (user, badgeId) => {
  if (user.badges?.includes(badgeId)) return user.badges;
  return [...(user.badges ?? []), badgeId];
};

const addActivity = (user, xp) => {
  const key = todayKey();
  return {
    ...(user.activity ?? {}),
    [key]: (user.activity?.[key] ?? 0) + xp,
  };
};

const playTone = (enabled, type = "success") => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = type === "level" ? 720 : type === "ping" ? 520 : 620;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  } catch {
    // Audio is a progressive enhancement.
  }
};

const getNextNode = (user) => courseNodes.find((node) => !user.completed?.includes(node.id)) ?? courseNodes.at(-1);

const isUnlocked = (node, user) => {
  const index = courseNodes.findIndex((item) => item.id === node.id);
  if (index <= 1) return true;
  const previous = courseNodes[index - 1];
  return user.completed?.includes(previous.id);
};

const getWeeklyXp = (user) => {
  const entries = Object.entries(user.activity ?? {});
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startKey = start.toISOString().slice(0, 10);
  return entries.filter(([date]) => date >= startKey).reduce((sum, [, xp]) => sum + xp, 0);
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [authMode, setAuthMode] = useState("register");
  const [selectedNode, setSelectedNode] = useState(null);
  const [quizNode, setQuizNode] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getCurrentUser().then((profile) => {
      if (profile) {
        const rewarded = applyDailyReward(profile);
        setUser(rewarded);
        saveCurrentUser(rewarded);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const applyDailyReward = (profile) => {
    const today = todayKey();
    if (profile.lastVisit === today) return profile;

    const continued = profile.lastVisit === yesterdayKey();
    const nextStreak = continued ? (profile.streak ?? 0) + 1 : 1;
    const gainedXp = profile.lastVisit ? 45 + Math.min(nextStreak * 5, 70) : 80;
    const next = {
      ...profile,
      xp: (profile.xp ?? 0) + gainedXp,
      streak: nextStreak,
      bestStreak: Math.max(profile.bestStreak ?? 0, nextStreak),
      lastVisit: today,
      activity: addActivity(profile, gainedXp),
      badges: nextStreak >= 7 ? addBadge(profile, "perfect-week") : profile.badges ?? [],
    };
    window.setTimeout(() => {
      setToast({ title: "Racha actualizada", detail: `Ganaste ${gainedXp} XP por estudiar hoy.` });
      playTone(next.sound, nextStreak >= 7 ? "level" : "success");
    }, 600);
    return next;
  };

  const persistUser = async (next, notification, tone = "success") => {
    setUser(next);
    await saveCurrentUser(next);
    if (notification) setToast(notification);
    playTone(next.sound, tone);
  };

  const handleAuth = async (payload) => {
    const profile = authMode === "login" ? await loginUser(payload) : await registerUser(payload);
    const rewarded = applyDailyReward(profile);
    await saveCurrentUser(rewarded);
    setUser(rewarded);
    setActiveView("dashboard");
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setActiveView("dashboard");
  };

  const completeNode = async (node, extra = {}) => {
    if (!user) return;
    const alreadyCompleted = user.completed?.includes(node.id);
    const scoreBonus = extra.score ? Math.round(extra.score * 1.5) : 0;
    const gainedXp = alreadyCompleted ? Math.max(30, Math.round(node.xp * 0.2)) : node.xp + scoreBonus;
    const completed = alreadyCompleted ? user.completed : [...(user.completed ?? []), node.id];
    let nextBadges = user.badges ?? [];
    if (!alreadyCompleted && completed.length === 1) nextBadges = addBadge({ badges: nextBadges }, "first-step");
    if (node.id === "module-9") nextBadges = addBadge({ badges: nextBadges }, "ipv4-master");
    if (node.id === "module-14") nextBadges = addBadge({ badges: nextBadges }, "router-master");
    if (node.id === "final-exam") nextBadges = addBadge({ badges: nextBadges }, "finalist");

    const certificates = alreadyCompleted || !node.certificate
      ? user.certificates ?? []
      : [...(user.certificates ?? []), { id: node.id, title: node.title, date: todayKey() }];

    const next = {
      ...user,
      xp: (user.xp ?? 0) + gainedXp,
      completed,
      certificates,
      badges: nextBadges,
      minutesStudied: (user.minutesStudied ?? 0) + (alreadyCompleted ? 4 : node.minutes),
      quizScores: extra.score ? { ...(user.quizScores ?? {}), [node.id]: extra.score } : user.quizScores ?? {},
      activity: addActivity(user, gainedXp),
    };

    const beforeLevel = getLevelInfo(user.xp).number;
    const afterLevel = getLevelInfo(next.xp).number;
    await persistUser(
      next,
      {
        title: alreadyCompleted ? "Practica reforzada" : "Actividad completada",
        detail: `+${gainedXp} XP en ${node.short}.`,
      },
      afterLevel > beforeLevel ? "level" : "success"
    );
  };

  const registerLabAction = async (labId, xp = 80) => {
    if (!user) return;
    const exists = user.labs?.includes(labId);
    const next = {
      ...user,
      xp: (user.xp ?? 0) + (exists ? 20 : xp),
      labs: exists ? user.labs : [...(user.labs ?? []), labId],
      badges: labId === "cli" ? addBadge(user, "ping-king") : user.badges ?? [],
      activity: addActivity(user, exists ? 20 : xp),
      minutesStudied: (user.minutesStudied ?? 0) + 6,
    };
    await persistUser(next, { title: "Laboratorio registrado", detail: `+${exists ? 20 : xp} XP por practica.` }, "ping");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <NetworkBackground />
        <div className="brand-mark">G</div>
      </div>
    );
  }

  if (!user) {
    return <Landing authMode={authMode} setAuthMode={setAuthMode} onSubmit={handleAuth} />;
  }

  return (
    <div className="app-shell">
      <NetworkBackground />
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="side-brand">
          <div className="brand-mark">G</div>
          <div>
            <strong>Gridly</strong>
            <span>Redes interactivas</span>
          </div>
        </div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeView === item.id ? "active" : ""}
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="side-footer">
          <LevelPill user={user} />
          <button className="ghost-button wide" onClick={handleLogout}>
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </aside>

      <main className="workspace">
        <Topbar
          user={user}
          onMenu={() => setSidebarOpen(true)}
          onProfile={() => setActiveView("profile")}
          onToggleSound={() => persistUser({ ...user, sound: !user.sound })}
        />

        <AnimatePresence mode="wait">
          <motion.section
            key={activeView}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            className="view"
          >
            {activeView === "dashboard" && (
              <Dashboard user={user} onSelectNode={setSelectedNode} onQuiz={setQuizNode} onNavigate={setActiveView} />
            )}
            {activeView === "route" && (
              <CourseRoute user={user} onSelectNode={setSelectedNode} onQuiz={setQuizNode} onComplete={completeNode} />
            )}
            {activeView === "lab" && <LabStudio user={user} onLabAction={registerLabAction} />}
            {activeView === "leaderboard" && <Leaderboard user={user} />}
            {activeView === "profile" && <Profile user={user} onSave={persistUser} />}
            {activeView === "teacher" && <TeacherPanel user={user} />}
            {activeView === "tutor" && <Tutor user={user} onLabAction={registerLabAction} />}
          </motion.section>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedNode && (
          <ModuleModal
            node={selectedNode}
            user={user}
            onClose={() => setSelectedNode(null)}
            onComplete={completeNode}
            onQuiz={() => {
              setQuizNode(selectedNode);
              setSelectedNode(null);
            }}
          />
        )}
        {quizNode && (
          <QuizModal
            node={quizNode}
            onClose={() => setQuizNode(null)}
            onFinish={(score) => {
              completeNode(quizNode, { score });
              setQuizNode(null);
            }}
          />
        )}
        {toast && <Toast toast={toast} />}
      </AnimatePresence>
    </div>
  );
}

function Landing({ authMode, setAuthMode, onSubmit }) {
  return (
    <main className="landing">
      <NetworkBackground />
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="brand-line">
            <span className="brand-mark">G</span>
            <span>Gridly · Universidad de Córdoba</span>
          </div>
          <h1>Gridly</h1>
          <p>
            Aprende conceptos básicos de redes con una ruta interactiva, XP, rachas, laboratorios visuales,
            ranking competitivo y certificados descargables.
          </p>
          <div className="hero-actions">
            <a href="#auth" className="primary-link">
              Comenzar
              <ChevronRight size={18} />
            </a>
            <span>Proyecto de Manuel Vargas · Licenciatura en Informática</span>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="signal-orbit">
            <span />
            <span />
            <span />
            <div className="core-router">
              <Network size={42} />
            </div>
          </div>
          <div className="floating-metric one">
            <Flame size={18} />
            Rachas diarias
          </div>
          <div className="floating-metric two">
            <Trophy size={18} />
            Ranking global
          </div>
          <div className="floating-metric three">
            <Terminal size={18} />
            CLI Cisco
          </div>
        </div>
      </section>

      <section className="auth-strip" id="auth">
        <AuthPanel mode={authMode} setMode={setAuthMode} onSubmit={onSubmit} />
        <div className="feature-grid">
          {[
            ["Sistema XP", "Niveles profesionales, metas semanales y bonificaciones por practica."],
            ["Laboratorio virtual", "Topologias, paquetes animados, ping, ARP y simulador de terminal."],
            ["Perfil academico", "Insignias, certificados, estadisticas y progreso exportable."],
          ].map(([title, text]) => (
            <article className="feature-card" key={title}>
              <Sparkles size={18} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function AuthPanel({ mode, setMode, onSubmit }) {
  const [form, setForm] = useState({
    name: "Manuel Vargas",
    email: "manuel@gridly.edu",
    password: "gridly123",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (reason) {
      setError(reason.message || "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-panel" onSubmit={submit}>
      <div className="panel-heading">
        <span>{authModeLabel}</span>
        <h2>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
      </div>

      <div className="segmented">
        <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
          Registro
        </button>
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
          Login
        </button>
      </div>

      {mode === "register" && (
        <label>
          Nombre completo
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
      )}

      <label>
        Correo
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </label>

      <label>
        Contraseña
        <span className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            minLength={6}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar contraseña">
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>

      {mode === "register" && (
        <label>
          Tipo de perfil
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
          </select>
        </label>
      )}

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" disabled={busy} type="submit">
        {busy ? "Procesando..." : mode === "login" ? "Entrar a Gridly" : "Crear perfil"}
        <ChevronRight size={18} />
      </button>
    </form>
  );
}

function Topbar({ user, onMenu, onProfile, onToggleSound }) {
  const level = getLevelInfo(user.xp);
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Abrir menú">
        <Menu size={20} />
      </button>
      <div>
        <p>Hola, {user.name.split(" ")[0]}</p>
        <h2>{level.current.title}</h2>
      </div>
      <div className="top-actions">
        <button className="icon-button" onClick={onToggleSound} aria-label="Sonido">
          {user.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button className="profile-chip" onClick={onProfile}>
          <Avatar user={user} />
          <span>{user.xp.toLocaleString("es-CO")} XP</span>
        </button>
      </div>
    </header>
  );
}

function Dashboard({ user, onSelectNode, onQuiz, onNavigate }) {
  const level = getLevelInfo(user.xp);
  const completion = getCompletion(user);
  const nextNode = getNextNode(user);
  const weeklyXp = getWeeklyXp(user);
  const goalProgress = clamp((weeklyXp / user.weeklyGoal) * 100, 0, 100);
  const completedExams = courseNodes.filter((node) => node.type === "exam" && user.completed?.includes(node.id)).length;

  return (
    <>
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Panel inteligente</span>
          <h1>Aprende redes como si estuvieras administrando una infraestructura real.</h1>
          <p>
            Continua tu ruta, gana XP, desbloquea insignias y usa laboratorios visuales para reforzar cada concepto.
          </p>
          <div className="hero-actions compact">
            <button className="primary-button" onClick={() => onSelectNode(nextNode)}>
              <Play size={18} />
              Continuar
            </button>
            <button className="ghost-button" onClick={() => onNavigate("lab")}>
              <Terminal size={17} />
              Abrir laboratorio
            </button>
          </div>
        </div>
        <ProgressRing value={completion} label="Progreso total" />
      </div>

      <div className="stats-grid">
        <StatCard icon={Zap} label="XP total" value={user.xp.toLocaleString("es-CO")} helper={level.current.title} />
        <StatCard icon={Flame} label="Racha" value={`${user.streak} dias`} helper={`Mejor: ${user.bestStreak} dias`} />
        <StatCard icon={BookOpen} label="Módulos" value={`${user.completed?.length ?? 0}/${courseNodes.length}`} helper="actividades completadas" />
        <StatCard icon={Award} label="Insignias" value={user.badges?.length ?? 0} helper={`${completedExams} checkpoints superados`} />
      </div>

      <div className="dashboard-grid">
        <article className="panel next-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Siguiente paso</span>
              <h3>{nextNode.title}</h3>
            </div>
            <span className="xp-badge">+{nextNode.xp} XP</span>
          </div>
          <p>{nextNode.summary}</p>
          <div className="node-meta">
            <span>{nextNode.minutes} min</span>
            <span>{nextNode.difficulty}</span>
            <span>{nextNode.stage}</span>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={() => onSelectNode(nextNode)}>
              Estudiar
              <ChevronRight size={17} />
            </button>
            <button className="ghost-button" onClick={() => onQuiz(nextNode)}>
              Quiz
              <ClipboardList size={16} />
            </button>
          </div>
        </article>

        <article className="panel chart-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Meta semanal</span>
              <h3>{weeklyXp} / {user.weeklyGoal} XP</h3>
            </div>
            <Gauge size={22} />
          </div>
          <div className="goal-track">
            <span style={{ width: `${goalProgress}%` }} />
          </div>
          <ActivityCalendar user={user} />
        </article>

        <article className="panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Nivel</span>
              <h3>Nivel {level.number}</h3>
            </div>
            <Crown size={22} />
          </div>
          <p>{level.current.title}</p>
          <div className="level-track">
            <span style={{ width: `${level.progress}%` }} />
          </div>
          <small>
            Faltan {Math.max(0, level.next.min - user.xp).toLocaleString("es-CO")} XP para {level.next.title}.
          </small>
        </article>
      </div>

      <section className="panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Mapa de progreso</span>
            <h3>Ruta tipo árbol tecnológico</h3>
          </div>
          <button className="ghost-button" onClick={() => onNavigate("route")}>
            Ver ruta
            <ChevronRight size={16} />
          </button>
        </div>
        <TechTree user={user} onSelectNode={onSelectNode} compact />
      </section>
    </>
  );
}

function CourseRoute({ user, onSelectNode, onQuiz, onComplete }) {
  const stages = [...new Set(courseNodes.map((node) => node.stage))];
  const [filter, setFilter] = useState("Todos");

  const visibleNodes = filter === "Todos" ? courseNodes : courseNodes.filter((node) => node.stage === filter);

  return (
    <>
      <div className="view-heading">
        <div>
          <span className="eyebrow">Ruta academica</span>
          <h1>Conceptos básicos de redes</h1>
          <p>Ve desbloqueando módulos, checkpoints, laboratorios y el examen final.</p>
        </div>
        <div className="segmented horizontal">
          {["Todos", ...stages].map((stage) => (
            <button className={filter === stage ? "active" : ""} key={stage} onClick={() => setFilter(stage)}>
              {stage}
            </button>
          ))}
        </div>
      </div>

      <TechTree user={user} onSelectNode={onSelectNode} />

      <div className="module-grid">
        {visibleNodes.map((node) => (
          <ModuleCard
            key={node.id}
            node={node}
            user={user}
            onSelect={() => onSelectNode(node)}
            onQuiz={() => onQuiz(node)}
            onComplete={() => onComplete(node)}
          />
        ))}
      </div>
    </>
  );
}

function ModuleCard({ node, user, onSelect, onQuiz, onComplete }) {
  const completed = user.completed?.includes(node.id);
  const unlocked = isUnlocked(node, user);
  const Icon = node.type === "lab" ? Network : node.type === "exam" || node.type === "final" ? ShieldCheck : BookOpen;

  return (
    <article className={`module-card ${completed ? "completed" : ""} ${!unlocked ? "locked" : ""}`}>
      <div className="module-accent" style={{ background: node.accent }} />
      <div className="module-top">
        <span className="module-icon">
          {unlocked ? <Icon size={19} /> : <Lock size={18} />}
        </span>
        <span className="xp-badge">+{node.xp} XP</span>
      </div>
      <h3>{node.title}</h3>
      <p>{node.summary}</p>
      <div className="node-meta">
        <span>{node.minutes} min</span>
        <span>{node.difficulty}</span>
      </div>
      <div className="button-row">
        <button className="primary-button small" onClick={onSelect} disabled={!unlocked}>
          {completed ? "Repasar" : "Abrir"}
        </button>
        <button className="ghost-button small" onClick={onQuiz} disabled={!unlocked}>
          Quiz
        </button>
        {!completed && (
          <button className="icon-button" onClick={onComplete} disabled={!unlocked} aria-label="Completar">
            <Check size={16} />
          </button>
        )}
      </div>
    </article>
  );
}

function TechTree({ user, onSelectNode, compact = false }) {
  return (
    <div className={`tech-tree ${compact ? "compact" : ""}`}>
      {courseNodes.map((node, index) => {
        const completed = user.completed?.includes(node.id);
        const unlocked = isUnlocked(node, user);
        return (
          <button
            className={`tree-node ${completed ? "done" : ""} ${unlocked ? "unlocked" : "locked"}`}
            style={{ "--accent": node.accent }}
            key={node.id}
            onClick={() => unlocked && onSelectNode(node)}
            title={node.title}
          >
            <span>{completed ? <CheckCircle2 size={18} /> : unlocked ? index + 1 : <Lock size={16} />}</span>
            <strong>{node.short}</strong>
          </button>
        );
      })}
    </div>
  );
}

function LabStudio({ user, onLabAction }) {
  return (
    <>
      <div className="view-heading">
        <div>
          <span className="eyebrow">Modo visual interactivo</span>
          <h1>Laboratorio virtual de redes</h1>
          <p>Experimenta con topologías, paquetes, ARP, ping y comandos de diagnóstico.</p>
        </div>
      </div>
      <div className="lab-grid">
        <NetworkLab onLabAction={onLabAction} />
        <CliSimulator user={user} onLabAction={onLabAction} />
        <SubnetGame onLabAction={onLabAction} />
        <TopologyVisualizer onLabAction={onLabAction} />
      </div>
    </>
  );
}

function NetworkLab({ onLabAction }) {
  const [devices, setDevices] = useState([
    { id: "pc", label: "PC", icon: Monitor, x: 12, y: 28, ip: "192.168.1.10" },
    { id: "switch", label: "Switch", icon: Server, x: 38, y: 42, ip: "Capa 2" },
    { id: "router", label: "Router", icon: Radio, x: 63, y: 26, ip: "192.168.1.1" },
    { id: "internet", label: "Internet", icon: Wifi, x: 82, y: 52, ip: "8.8.8.8" },
  ]);
  const [dragging, setDragging] = useState(null);
  const [packet, setPacket] = useState(false);

  const move = (event) => {
    if (!dragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 6, 90);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 10, 82);
    setDevices((items) => items.map((device) => (device.id === dragging ? { ...device, x, y } : device)));
  };

  const runPing = () => {
    setPacket(true);
    onLabAction("visual-ping", 90);
    window.setTimeout(() => setPacket(false), 1800);
  };

  return (
    <article className="panel lab-panel wide-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Mini Packet Tracer</span>
          <h3>PC → Switch → Router → Internet</h3>
        </div>
        <button className="primary-button small" onClick={runPing}>
          <Cable size={16} />
          Ping
        </button>
      </div>
      <div className="network-canvas" onPointerMove={move} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
        <svg className="links" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={devices.map((device) => `${device.x},${device.y}`).join(" ")}
            fill="none"
            stroke="rgba(110, 231, 183, .48)"
            strokeWidth="1.2"
          />
          {packet && <circle className="packet-dot" r="1.4" />}
        </svg>
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <button
              key={device.id}
              className="device-node"
              style={{ left: `${device.x}%`, top: `${device.y}%` }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragging(device.id);
              }}
            >
              <Icon size={22} />
              <strong>{device.label}</strong>
              <span>{device.ip}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function CliSimulator({ onLabAction }) {
  const [history, setHistory] = useState([
    "Gridly IOS 1.0",
    "Router> escribe help para ver comandos disponibles",
  ]);
  const [prompt, setPrompt] = useState("Router>");
  const [input, setInput] = useState("");

  const runCommand = (event) => {
    event.preventDefault();
    const command = input.trim();
    if (!command) return;
    const lower = command.toLowerCase();
    let response = "";
    let nextPrompt = prompt;

    if (lower === "help") response = "enable | show ip interface brief | show arp | ping 192.168.1.1 | traceroute 8.8.8.8 | clear";
    else if (lower === "enable") {
      response = "Modo privilegiado activado.";
      nextPrompt = "Router#";
    } else if (lower === "configure terminal") {
      response = "Enter configuration commands, one per line. End with CNTL/Z.";
      nextPrompt = "Router(config)#";
    } else if (lower === "show ip interface brief")
      response = "Interface              IP-Address      OK? Method Status Protocol\nGig0/0                 192.168.1.1     YES manual up     up\nGig0/1                 10.0.0.1        YES manual up     up";
    else if (lower === "show arp")
      response = "Protocol  Address          Age  Hardware Addr   Type  Interface\nInternet  192.168.1.10     2    00-1A-2B-3C-4D  ARPA  Gig0/0";
    else if (lower.startsWith("ping")) {
      response = "Sending 5, 100-byte ICMP Echos\n!!!!!\nSuccess rate is 100 percent, round-trip min/avg/max = 1/3/7 ms";
      onLabAction("cli", 110);
    } else if (lower.startsWith("traceroute"))
      response = "1 192.168.1.1 2 ms\n2 10.0.0.1 8 ms\n3 8.8.8.8 18 ms";
    else if (lower === "clear") {
      setHistory([]);
      setInput("");
      return;
    } else response = "% Comando no reconocido. Prueba con help.";

    setPrompt(nextPrompt);
    setHistory((items) => [...items, `${prompt} ${command}`, response]);
    setInput("");
  };

  return (
    <article className="panel cli-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Simulador CLI</span>
          <h3>Terminal de router</h3>
        </div>
        <Terminal size={22} />
      </div>
      <div className="terminal-window">
        {history.map((line, index) => (
          <pre key={`${line}-${index}`}>{line}</pre>
        ))}
      </div>
      <form className="terminal-input" onSubmit={runCommand}>
        <span>{prompt}</span>
        <input value={input} onChange={(event) => setInput(event.target.value)} autoComplete="off" />
      </form>
    </article>
  );
}

function SubnetGame({ onLabAction }) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const check = () => {
    if (answer.trim() === "192.168.10.0") {
      setStatus("Correcto: la red es 192.168.10.0/24.");
      onLabAction("subnet", 100);
    } else {
      setStatus("Revisa la mascara /24: los primeros 24 bits pertenecen a la red.");
    }
  };

  return (
    <article className="panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Mini juego</span>
          <h3>Subnetting rápido</h3>
        </div>
        <Cpu size={22} />
      </div>
      <p>Host: 192.168.10.34/24. Escribe la dirección de red.</p>
      <div className="inline-form">
        <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="192.168.10.0" />
        <button className="primary-button small" onClick={check}>
          Validar
        </button>
      </div>
      {status && <p className="feedback">{status}</p>}
    </article>
  );
}

function TopologyVisualizer({ onLabAction }) {
  const [mode, setMode] = useState("estrella");
  const topologies = {
    estrella: ["PC1", "PC2", "PC3", "Servidor", "AP"],
    bus: ["Nodo A", "Nodo B", "Nodo C", "Nodo D"],
    anillo: ["A", "B", "C", "D", "E"],
    malla: ["R1", "R2", "R3", "R4"],
  };
  const getPosition = (index, total) => {
    if (mode === "bus") return { left: `${17 + index * 22}%`, top: "50%" };
    if (mode === "estrella" && index === 0) return { left: "50%", top: "50%" };
    const adjustedIndex = mode === "estrella" ? index - 1 : index;
    const adjustedTotal = mode === "estrella" ? total - 1 : total;
    const angle = (Math.PI * 2 * adjustedIndex) / adjustedTotal - Math.PI / 2;
    return {
      left: `${50 + Math.cos(angle) * 34}%`,
      top: `${50 + Math.sin(angle) * 34}%`,
    };
  };

  return (
    <article className="panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Topologías</span>
          <h3>Visualizador dinámico</h3>
        </div>
        <Layers size={22} />
      </div>
      <div className="segmented horizontal">
        {Object.keys(topologies).map((item) => (
          <button
            key={item}
            className={mode === item ? "active" : ""}
            onClick={() => {
              setMode(item);
              onLabAction(`topology-${item}`, 35);
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className={`topology ${mode}`}>
        {topologies[mode].map((node, index) => (
          <span key={node} style={getPosition(index, topologies[mode].length)}>
            {node}
          </span>
        ))}
      </div>
    </article>
  );
}

function Leaderboard({ user }) {
  const [tab, setTab] = useState("general");
  const localStudents = getLocalStudents().filter((student) => student.id !== user.id);
  const rows = [...seedLeaderboard, ...localStudents, user]
    .map((student) => ({ ...student, level: getLevelInfo(student.xp).number, avatar: student.avatar || "GR" }))
    .sort((a, b) => b.xp - a.xp);

  return (
    <>
      <div className="view-heading">
        <div>
          <span className="eyebrow">Competencia sana</span>
          <h1>Ranking Gridly</h1>
          <p>Compara XP, niveles, rachas e insignias desbloqueadas.</p>
        </div>
        <div className="segmented horizontal">
          {["semanal", "mensual", "general"].map((item) => (
            <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="leaderboard">
        {rows.map((row, index) => (
          <article className={`rank-row ${row.id === user.id ? "me" : ""}`} key={row.id}>
            <span className={`rank rank-${index + 1}`}>{index + 1}</span>
            <Avatar user={row} />
            <div>
              <h3>{row.name}</h3>
              <p>Nivel {row.level} · {row.badge || getLevelInfo(row.xp).current.title}</p>
            </div>
            <div className="rank-xp">
              <strong>{row.xp.toLocaleString("es-CO")}</strong>
              <span>XP</span>
            </div>
            <div className="rank-streak">
              <Flame size={17} />
              {row.streak ?? 0}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Profile({ user, onSave }) {
  const [form, setForm] = useState(user);
  const level = getLevelInfo(user.xp);
  const completedBadges = badges.filter((badge) => user.badges?.includes(badge.id));

  return (
    <>
      <div className="profile-header">
        <div className="profile-cover">
          <Avatar user={user} large />
          <div>
            <span className="eyebrow">Perfil profesional</span>
            <h1>{user.name}</h1>
            <p>{user.headline}</p>
          </div>
        </div>
        <ProgressRing value={getCompletion(user)} label="Curso" />
      </div>

      <div className="profile-grid">
        <article className="panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Personalización</span>
              <h3>Datos del estudiante</h3>
            </div>
            <Settings size={22} />
          </div>
          <div className="settings-grid">
            <label>
              Nombre
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              Foto URL
              <input value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} />
            </label>
            <label>
              Titular
              <input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} />
            </label>
            <label>
              Meta semanal XP
              <input
                type="number"
                value={form.weeklyGoal}
                onChange={(event) => setForm({ ...form, weeklyGoal: Number(event.target.value) })}
              />
            </label>
          </div>
          <button className="primary-button" onClick={() => onSave(form, { title: "Perfil actualizado", detail: "Tus datos quedaron guardados." })}>
            Guardar cambios
          </button>
        </article>

        <article className="panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Resumen</span>
              <h3>Nivel {level.number}</h3>
            </div>
            <Award size={22} />
          </div>
          <div className="profile-stats">
            <span><strong>{user.xp.toLocaleString("es-CO")}</strong>XP</span>
            <span><strong>{user.minutesStudied}</strong>min</span>
            <span><strong>{user.certificates?.length ?? 0}</strong>certificados</span>
          </div>
          <p>{level.current.title}</p>
          <div className="level-track">
            <span style={{ width: `${level.progress}%` }} />
          </div>
        </article>

        <article className="panel badges-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Achievements</span>
              <h3>Insignias</h3>
            </div>
            <Medal size={22} />
          </div>
          <div className="badge-grid">
            {badges.map((badge) => {
              const unlocked = completedBadges.some((item) => item.id === badge.id);
              return (
                <div className={`badge-card ${unlocked ? "unlocked" : ""}`} key={badge.id}>
                  <Award size={20} />
                  <strong>{badge.title}</strong>
                  <span>{badge.rule}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel certificates-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">PDF</span>
              <h3>Certificados</h3>
            </div>
            <FileText size={22} />
          </div>
          <div className="certificate-list">
            {(user.certificates ?? []).length === 0 && <p>Completa módulos con certificado para activar descargas.</p>}
            {(user.certificates ?? []).map((certificate) => (
              <button
                className="certificate-item"
                key={certificate.id}
                onClick={() => downloadCertificate({ user, title: certificate.title })}
              >
                <FileText size={18} />
                <span>{certificate.title}</span>
                <Download size={17} />
              </button>
            ))}
          </div>
        </article>
      </div>
    </>
  );
}

function TeacherPanel({ user }) {
  const students = [...getLocalStudents(), ...seedLeaderboard].sort((a, b) => b.xp - a.xp);
  const exportCsv = () => {
    const lines = ["nombre,email,xp,racha,completados"].concat(
      students.map((student) => `${student.name},${student.email ?? ""},${student.xp},${student.streak ?? 0},${student.completed?.length ?? ""}`)
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gridly-estudiantes.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="view-heading">
        <div>
          <span className="eyebrow">Panel de profesor</span>
          <h1>Seguimiento académico</h1>
          <p>Vista de progreso, resultados, anuncios y exportación para clase.</p>
        </div>
        <button className="primary-button" onClick={exportCsv}>
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon={Users} label="Estudiantes" value={students.length} helper="perfiles registrados" />
        <StatCard icon={BarChart3} label="XP promedio" value={Math.round(students.reduce((sum, s) => sum + s.xp, 0) / students.length)} helper="rendimiento general" />
        <StatCard icon={ClipboardList} label="Actividades" value={courseNodes.length} helper="módulos y exámenes" />
        <StatCard icon={ShieldCheck} label="Profesor" value={user.role === "teacher" ? "Activo" : "Demo"} helper="panel disponible" />
      </div>

      <article className="panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Lista</span>
            <h3>Progreso de estudiantes</h3>
          </div>
          <Search size={21} />
        </div>
        <div className="student-table">
          {students.map((student) => (
            <div className="student-row" key={student.id}>
              <Avatar user={student} />
              <strong>{student.name}</strong>
              <span>{student.xp.toLocaleString("es-CO")} XP</span>
              <span>{getLevelInfo(student.xp).current.title}</span>
              <div className="mini-track">
                <span style={{ width: `${student.completed ? (student.completed.length / courseNodes.length) * 100 : 46}%` }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel quiz-builder">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Quizzes inteligentes</span>
            <h3>Banco de preguntas</h3>
          </div>
          <SlidersHorizontal size={22} />
        </div>
        <div className="question-bank">
          {quizBank.slice(0, 4).map((question) => (
            <div key={question.question}>
              <strong>{question.question}</strong>
              <span>Respuesta: {question.answer}</span>
            </div>
          ))}
        </div>
      </article>
    </>
  );
}

function Tutor({ user, onLabAction }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: `Hola ${user.name.split(" ")[0]}, soy tu tutor de redes. Puedo ayudarte con IPv4, IPv6, DHCP, ARP, TCP, UDP y comandos de prueba.` },
  ]);
  const [input, setInput] = useState("");

  const answer = (text) => {
    const lower = text.toLowerCase();
    const match = tutorAnswers.find((item) => item.keys.some((key) => lower.includes(key)));
    return (
      match?.answer ??
      "Puedo ayudarte a descomponer el concepto. Empieza identificando capa, dispositivo, protocolo y objetivo de la comunicacion."
    );
  };

  const submit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((items) => [...items, { from: "user", text }, { from: "bot", text: answer(text) }]);
    setInput("");
    onLabAction("tutor", 30);
  };

  return (
    <div className="tutor-layout">
      <article className="panel tutor-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Tutor de Redes</span>
            <h3>Asistente integrado</h3>
          </div>
          <Bot size={23} />
        </div>
        <div className="chat-window">
          {messages.map((message, index) => (
            <div className={`chat-bubble ${message.from}`} key={`${message.text}-${index}`}>
              {message.text}
            </div>
          ))}
        </div>
        <form className="chat-input" onSubmit={submit}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Pregúntame sobre DHCP, ARP o IPv6" />
          <button className="primary-button small">
            <Send size={16} />
            Enviar
          </button>
        </form>
      </article>
      <article className="panel tutor-suggestions">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Retos</span>
            <h3>Preguntas recomendadas</h3>
          </div>
          <Rocket size={22} />
        </div>
        {["Explícame IPv6", "¿Qué hace DHCP?", "Diferencia entre TCP y UDP", "¿Cómo funciona ARP?"].map((item) => (
          <button key={item} onClick={() => setInput(item)}>
            {item}
            <ChevronRight size={16} />
          </button>
        ))}
      </article>
    </div>
  );
}

function ModuleModal({ node, user, onClose, onComplete, onQuiz }) {
  const completed = user.completed?.includes(node.id);
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.article className="modal-card" initial={{ scale: 0.96, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 24 }}>
        <button className="icon-button close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className="module-accent large" style={{ background: node.accent }} />
        <span className="eyebrow">{node.stage} · {node.difficulty}</span>
        <h2>{node.title}</h2>
        <p>{node.summary}</p>
        <div className="lesson-grid">
          <div>
            <h3>Resultados de aprendizaje</h3>
            <ul>
              {node.outcomes.map((item) => (
                <li key={item}><CheckCircle2 size={16} />{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Práctica</h3>
            <p>{node.practice}</p>
            <div className="node-meta">
              <span>{node.minutes} min</span>
              <span>+{node.xp} XP</span>
              {node.certificate && <span>Certificado</span>}
            </div>
          </div>
        </div>
        <div className="lesson-simulation">
          <PacketAnimation type={node.id.includes("arp") || node.id === "module-13" ? "arp" : "packet"} />
        </div>
        <div className="button-row">
          <button className="primary-button" onClick={() => onComplete(node)}>
            {completed ? "Reforzar XP" : "Marcar completado"}
            <Zap size={17} />
          </button>
          <button className="ghost-button" onClick={onQuiz}>
            Iniciar quiz
            <ClipboardList size={16} />
          </button>
        </div>
      </motion.article>
    </motion.div>
  );
}

function QuizModal({ node, onClose, onFinish }) {
  const questions = useMemo(() => [...quizBank].sort(() => Math.random() - 0.5).slice(0, 5), [node.id]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const current = questions[index];

  const choose = (option) => {
    const nextAnswers = [...answers, option === current.answer];
    if (index + 1 >= questions.length) {
      const score = Math.round((nextAnswers.filter(Boolean).length / questions.length) * 100);
      onFinish(score);
    } else {
      setAnswers(nextAnswers);
      setIndex(index + 1);
    }
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.article className="modal-card quiz-card" initial={{ scale: 0.96, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 24 }}>
        <button className="icon-button close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <span className="eyebrow">Quiz inteligente · {node.short}</span>
        <h2>{current.question}</h2>
        <div className="quiz-progress">
          <span style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <div className="answer-grid">
          {current.options.map((option) => (
            <button key={option} onClick={() => choose(option)}>
              {option}
            </button>
          ))}
        </div>
        <p>{index + 1} de {questions.length}</p>
      </motion.article>
    </motion.div>
  );
}

function PacketAnimation({ type }) {
  return (
    <div className={`packet-animation ${type}`}>
      <span className="host a">PC</span>
      <span className="host b">Switch</span>
      <span className="host c">Router</span>
      <span className="host d">Web</span>
      <i />
      <i />
      <i />
      <strong>{type === "arp" ? "¿Quién tiene esta IP?" : "Paquetes viajando por la red"}</strong>
    </div>
  );
}

function ActivityCalendar({ user }) {
  const days = Array.from({ length: 21 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (20 - index));
    const key = date.toISOString().slice(0, 10);
    const xp = user.activity?.[key] ?? 0;
    return { key, xp };
  });
  return (
    <div className="activity-calendar">
      {days.map((day) => (
        <span key={day.key} title={`${day.key}: ${day.xp} XP`} style={{ opacity: day.xp ? 0.45 + clamp(day.xp / 250, 0, 0.55) : 0.18 }} />
      ))}
    </div>
  );
}

function ProgressRing({ value, label }) {
  return (
    <div className="progress-ring" style={{ "--value": `${value}%` }}>
      <strong>{value}%</strong>
      <span>{label}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">
        <Icon size={21} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function LevelPill({ user }) {
  const level = getLevelInfo(user.xp);
  return (
    <div className="level-pill">
      <span>Nivel {level.number}</span>
      <strong>{level.current.title}</strong>
      <div className="level-track">
        <span style={{ width: `${level.progress}%` }} />
      </div>
    </div>
  );
}

function Avatar({ user, large = false }) {
  return user.avatarUrl ? (
    <img className={`avatar ${large ? "large" : ""}`} src={user.avatarUrl} alt={user.name} />
  ) : (
    <span className={`avatar ${large ? "large" : ""}`}>{user.avatar || user.name?.slice(0, 2).toUpperCase() || "GR"}</span>
  );
}

function Toast({ toast }) {
  return (
    <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <Sparkles size={18} />
      <div>
        <strong>{toast.title}</strong>
        <span>{toast.detail}</span>
      </div>
    </motion.div>
  );
}

export default App;
