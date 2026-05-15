const SESSION_KEY = "gridly.session";
const USERS_KEY = "gridly.users";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

let firebaseAuthPromise;

const uid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `gridly-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const initials = (name = "Estudiante") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "GR";

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const baseProfile = ({ id, name, email, role = "student", provider = "local" }) => ({
  id,
  name,
  email,
  role,
  provider,
  avatar: initials(name),
  avatarUrl: "",
  university: "Universidad de Córdoba",
  program: "Licenciatura en Informática",
  headline: "Estudiante de fundamentos de redes",
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastVisit: "",
  minutesStudied: 0,
  completed: [],
  quizScores: {},
  badges: [],
  certificates: [],
  labs: [],
  weeklyGoal: 650,
  sound: true,
  createdAt: new Date().toISOString(),
  activity: {},
});

const getUsers = () => readJson(USERS_KEY, []);

const saveUsers = (users) => writeJson(USERS_KEY, users);

const upsertProfile = (profile) => {
  const users = getUsers();
  const index = users.findIndex((user) => user.id === profile.id || user.email === profile.email);
  if (index >= 0) {
    users[index] = { ...users[index], ...profile };
  } else {
    users.push(profile);
  }
  saveUsers(users);
  writeJson(SESSION_KEY, users[index >= 0 ? index : users.length - 1]);
  return users[index >= 0 ? index : users.length - 1];
};

const getFirebaseAuth = async () => {
  if (!firebaseAuthPromise) {
    firebaseAuthPromise = Promise.all([import("firebase/app"), import("firebase/auth")]).then(
      ([appModule, authModule]) => {
        const app = appModule.getApps().length
          ? appModule.getApps()[0]
          : appModule.initializeApp(firebaseConfig);
        return { auth: authModule.getAuth(app), authModule };
      }
    );
  }
  return firebaseAuthPromise;
};

export const authModeLabel = firebaseEnabled ? "Firebase Auth" : "Modo demo local";

export const registerUser = async ({ name, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (firebaseEnabled) {
    const { auth, authModule } = await getFirebaseAuth();
    const credential = await authModule.createUserWithEmailAndPassword(auth, normalizedEmail, password);
    await authModule.updateProfile(credential.user, { displayName: name });
    const existing = getUsers().find((user) => user.id === credential.user.uid || user.email === normalizedEmail);
    return upsertProfile(
      existing ??
        baseProfile({
          id: credential.user.uid,
          name,
          email: normalizedEmail,
          role,
          provider: "firebase",
        })
    );
  }

  const users = getUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }

  const profile = {
    ...baseProfile({ id: uid(), name, email: normalizedEmail, role, provider: "local" }),
    passwordHash: btoa(unescape(encodeURIComponent(password))),
  };
  saveUsers([...users, profile]);
  writeJson(SESSION_KEY, profile);
  return profile;
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (firebaseEnabled) {
    const { auth, authModule } = await getFirebaseAuth();
    const credential = await authModule.signInWithEmailAndPassword(auth, normalizedEmail, password);
    const existing = getUsers().find((user) => user.id === credential.user.uid || user.email === normalizedEmail);
    return upsertProfile(
      existing ??
        baseProfile({
          id: credential.user.uid,
          name: credential.user.displayName || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          role: "student",
          provider: "firebase",
        })
    );
  }

  const passwordHash = btoa(unescape(encodeURIComponent(password)));
  const profile = getUsers().find((user) => user.email === normalizedEmail && user.passwordHash === passwordHash);
  if (!profile) throw new Error("Correo o contraseña incorrectos.");
  writeJson(SESSION_KEY, profile);
  return profile;
};

export const getCurrentUser = async () => readJson(SESSION_KEY, null);

export const saveCurrentUser = async (profile) => upsertProfile(profile);

export const logoutUser = async () => {
  if (firebaseEnabled) {
    const { auth, authModule } = await getFirebaseAuth();
    await authModule.signOut(auth);
  }
  localStorage.removeItem(SESSION_KEY);
};

export const getLocalStudents = () =>
  getUsers()
    .filter((user) => user.role !== "teacher")
    .map(({ passwordHash, ...safeUser }) => safeUser);
