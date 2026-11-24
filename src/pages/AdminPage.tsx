import { useEffect, useState, type FormEvent } from "react";
import { Corners } from "../components/Corners";
import { Reveal } from "../components/Reveal";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CrosshairIcon,
  FileIcon,
} from "../components/Icons";
import { buttonGhost, buttonPrimary } from "../components/styles";

interface PptSubmission {
  uniqueId: string;
  team: string;
  captain: string;
  email: string;
  status: string;
  name: string;
  storedName: string;
  submittedAt: string;
  url: string;
}

interface Score {
  uniqueId: string;
  team: string;
  points: number;
  updatedAt: string;
}

interface CtfTeam {
  uniqueId: string;
  team: string;
  status: string;
}

interface AdminUser {
  uniqueId: string;
  name: string;
  email: string;
  event: string;
  eventName: string;
  teamName: string;
  captainName: string;
  teamSize: string;
  phone: string;
  status: string;
  blocked: boolean;
  verifiedAt: string | null;
  createdAt: string | null;
  details: Record<string, unknown>;
  uploads: Array<{ field: string; name: string; storedName: string; url: string }>;
}

interface AdminNotification {
  uniqueId: string;
  name: string;
  email: string;
  event: string;
  registeredFor: string;
  createdAt: string | null;
}

type AuthState = "loading" | "login" | "ready";
type Panel = "overview" | "users" | "notifications" | "hackathon" | "ctf";

const smallButton =
  "inline-flex items-center gap-2 border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white transition-colors hover:border-ice/60 hover:text-ice disabled:cursor-not-allowed disabled:opacity-60";

const dangerButton =
  "inline-flex items-center gap-2 border border-blood/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-blood-bright transition-colors hover:border-blood hover:bg-blood/10 disabled:cursor-not-allowed disabled:opacity-60";

const panelButton =
  "group relative w-full border border-white/10 bg-ink-800/60 p-6 text-left transition-colors hover:border-ice/50 sm:p-8";

const tabs: Array<{ id: Panel; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "notifications", label: "Notifications" },
  { id: "hackathon", label: "Hackathon" },
  { id: "ctf", label: "CTF" },
];

function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function AdminPage() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [adminUser, setAdminUser] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [panel, setPanel] = useState<Panel>("overview");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<"all" | "hackathon" | "ctf">("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userActionBusy, setUserActionBusy] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [credentialsResult, setCredentialsResult] = useState<{
    uniqueId: string;
    password: string;
    deliveredTo: string;
    fallback: boolean;
  } | null>(null);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const [ppts, setPpts] = useState<PptSubmission[]>([]);
  const [pptsLoading, setPptsLoading] = useState(false);
  const [pptsError, setPptsError] = useState("");

  const [scores, setScores] = useState<Score[]>([]);
  const [teams, setTeams] = useState<CtfTeam[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState("");
  const [teamInput, setTeamInput] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const [savingScore, setSavingScore] = useState(false);
  const [scoreMessage, setScoreMessage] = useState("");
  const [scoreError, setScoreError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch("/api/admin/me");
        if (!cancelled) setAuth(response.ok ? "ready" : "login");
      } catch {
        if (!cancelled) setAuth("login");
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError("");
    try {
      const response = await fetch("/api/admin/users");
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        users?: AdminUser[];
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not load users.");
      }
      setUsers(result.users || []);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Could not load users.");
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await fetch("/api/admin/notifications");
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        notifications?: AdminNotification[];
        unreadCount?: number;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not load notifications.");
      }
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Could not load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function loadPpts() {
    setPptsLoading(true);
    setPptsError("");
    try {
      const response = await fetch("/api/admin/hackathon/ppts");
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        ppts?: PptSubmission[];
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not load presentations.");
      }
      setPpts(result.ppts || []);
    } catch (error) {
      setPptsError(error instanceof Error ? error.message : "Could not load presentations.");
    } finally {
      setPptsLoading(false);
    }
  }

  async function loadScores() {
    setScoresLoading(true);
    setScoresError("");
    try {
      const response = await fetch("/api/admin/ctf/scores");
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        scores?: Score[];
        teams?: CtfTeam[];
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not load the scoreboard.");
      }
      setScores(result.scores || []);
      setTeams(result.teams || []);
    } catch (error) {
      setScoresError(error instanceof Error ? error.message : "Could not load the scoreboard.");
    } finally {
      setScoresLoading(false);
    }
  }

  useEffect(() => {
    if (auth !== "ready") return;
    void loadUsers();
    void loadNotifications();
  }, [auth]);

  useEffect(() => {
    if (auth === "ready" && panel === "ctf") void loadScores();
  }, [auth, panel]);

  useEffect(() => {
    if (auth === "ready" && panel === "hackathon") void loadPpts();
  }, [auth, panel]);

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminUser.trim() || !password.trim()) {
      setLoginError("Enter both the admin username and password.");
      return;
    }

    setLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: adminUser.trim(), password }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Admin login failed.");
      }
      setAuth("ready");
      setPassword("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Admin login failed.");
    } finally {
      setLoggingIn(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    setAuth("login");
    setPanel("overview");
    setUsers([]);
    setCredentialsResult(null);
    setNotifications([]);
    setPpts([]);
    setScores([]);
    setTeams([]);
    setSelectedUserId("");
  };

  const onToggleBlock = async (user: AdminUser) => {
    const blocked = !user.blocked;
    const action = blocked ? "block" : "unblock";
    if (blocked && !window.confirm(`Block ${user.name || user.uniqueId}? They will lose access immediately.`)) return;

    setUserActionBusy(user.uniqueId);
    setUserMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.uniqueId)}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || `Could not ${action} user.`);
      setUserMessage(`${user.name || user.uniqueId} ${blocked ? "blocked" : "unblocked"}.`);
      await loadUsers();
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : `Could not ${action} user.`);
    } finally {
      setUserActionBusy("");
    }
  };

  const onResendCredentials = async (user: AdminUser) => {
    if (
      !window.confirm(
        `Generate new credentials for ${user.name || user.uniqueId} and email them? This invalidates the previous password.`,
      )
    ) return;

    setUserActionBusy(user.uniqueId);
    setUserMessage("");
    setCredentialsResult(null);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(user.uniqueId)}/resend-credentials`,
        { method: "POST" },
      );
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        password?: string;
        deliveredTo?: string;
        fallback?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not resend credentials.");
      const deliveredTo = result.deliveredTo || "";
      setCredentialsResult({
        uniqueId: user.uniqueId,
        password: result.password || "",
        deliveredTo,
        fallback: Boolean(result.fallback),
      });
      setUserMessage(
        result.fallback
          ? `Email to ${user.email} was rejected. Credentials were sent to ${deliveredTo} instead — copy the password below to forward manually.`
          : `New credentials emailed to ${deliveredTo}.`,
      );
      await loadUsers();
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Could not resend credentials.");
    } finally {
      setUserActionBusy("");
    }
  };

  const onDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Permanently delete ${user.name || user.uniqueId} and all their uploaded files?`)) return;

    setUserActionBusy(user.uniqueId);
    setUserMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.uniqueId)}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not delete user.");
      if (selectedUserId === user.uniqueId) setSelectedUserId("");
      setUserMessage(`${user.name || user.uniqueId} deleted.`);
      await Promise.all([loadUsers(), loadNotifications(), loadPpts(), loadScores()]);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Could not delete user.");
    } finally {
      setUserActionBusy("");
    }
  };

  const onMarkNotificationsRead = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch("/api/admin/notifications/read", { method: "POST" });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not mark notifications as read.");
      await loadNotifications();
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Could not mark notifications as read.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const onOpenNotification = (notification: AdminNotification) => {
    setSelectedUserId(notification.uniqueId);
    setPanel("users");
  };

  const onSaveScore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const points = Number(pointsInput);
    setScoreError("");
    setScoreMessage("");

    if (!teamInput.trim() || pointsInput.trim() === "" || !Number.isFinite(points) || points < 0) {
      setScoreError("Choose a team and enter a score of zero or more.");
      return;
    }

    setSavingScore(true);
    try {
      const response = await fetch("/api/admin/ctf/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: teamInput.trim(), uniqueId: selectedId, points }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not save the score.");
      }
      setPointsInput("");
      setScoreMessage(`Score saved for ${teamInput.trim()}.`);
      await loadScores();
    } catch (error) {
      setScoreError(error instanceof Error ? error.message : "Could not save the score.");
    } finally {
      setSavingScore(false);
    }
  };

  const onRemoveScore = async (score: Score) => {
    setScoreError("");
    setScoreMessage("");
    if (!window.confirm(`Remove ${score.team} from the scoreboard?`)) return;

    try {
      const params = new URLSearchParams();
      if (score.uniqueId) params.set("uniqueId", score.uniqueId);
      else params.set("team", score.team);
      const response = await fetch(`/api/admin/ctf/scores?${params.toString()}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not remove the score.");
      }
      setScoreMessage(`${score.team} removed from the scoreboard.`);
      await loadScores();
    } catch (error) {
      setScoreError(error instanceof Error ? error.message : "Could not remove the score.");
    }
  };

  const rankedScores = [...scores].sort(
    (a, b) => b.points - a.points || a.team.localeCompare(b.team),
  );

  const filteredUsers = users.filter((user) => {
    const matchesEvent =
      eventFilter === "all" ||
      (eventFilter === "ctf" ? user.event === "ctf" : user.event !== "ctf");
    const query = userSearch.trim().toLowerCase();
    const matchesQuery =
      !query ||
      [user.name, user.email, user.uniqueId, user.teamName, user.captainName, user.phone]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return matchesEvent && matchesQuery;
  });

  const selectedUser = users.find((user) => user.uniqueId === selectedUserId) || null;

  return (
    <section className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -right-24 top-10 h-[420px] w-[420px] animate-drift rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
      </div>

      <div className="container-x relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-fog">
              <span aria-hidden="true" className="h-1.5 w-1.5 animate-blink bg-blood motion-reduce:animate-none" />
              <span className="text-ice">Admin console</span>
              <span aria-hidden="true" className="text-white/20">//</span>
              <span>Event control</span>
            </p>
            <h1 className="mt-6 text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
              Run both <span className="text-ice">fronts.</span>
            </h1>
          </Reveal>
          {auth === "ready" ? (
            <button type="button" onClick={onLogout} className={smallButton}>
              Sign out
            </button>
          ) : null}
        </div>

        {auth === "loading" ? (
          <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.24em] text-ice">
            Checking admin access...
          </p>
        ) : null}

        {auth === "login" ? (
          <div className="mx-auto mt-12 max-w-lg border border-white/10 bg-ink-800/60 p-6 sm:p-8">
            <Corners className="text-ice/40" />
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">Restricted area</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Admin sign in</h2>
            <p className="mt-2 text-sm leading-relaxed text-fog">
              Sign in with the admin username and password configured on the server.
            </p>
            <form onSubmit={onLogin} className="mt-6 space-y-5" noValidate>
              <div>
                <label htmlFor="admin-user" className="field-label">Admin username</label>
                <input
                  id="admin-user"
                  type="text"
                  autoComplete="username"
                  value={adminUser}
                  onChange={(event) => { setAdminUser(event.target.value); setLoginError(""); }}
                  className="field"
                  placeholder="Admin username"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="field-label">Admin password</label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setLoginError(""); }}
                  className="field"
                  placeholder="Admin password"
                />
              </div>
              {loginError ? (
                <p role="alert" className="border border-blood/40 bg-blood/10 p-3 text-sm text-blood-bright">
                  {loginError}
                </p>
              ) : null}
              <button type="submit" disabled={loggingIn} className={`${buttonPrimary} w-full disabled:opacity-60`}>
                {loggingIn ? "Checking..." : "Open dashboard"}
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        ) : null}

        {auth === "ready" ? (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-y border-white/10 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPanel(tab.id)}
                className={`inline-flex items-center gap-2 border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  panel === tab.id
                    ? "border-ice/60 bg-ice/10 text-ice"
                    : "border-white/10 text-fog hover:border-white/30 hover:text-white"
                }`}
              >
                {tab.label}
                {tab.id === "notifications" && unreadCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blood px-1.5 text-[10px] text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            ))}
            <button type="button" onClick={() => { void loadUsers(); void loadNotifications(); }} className={`${smallButton} ml-auto`}>
              Refresh data
            </button>
          </div>
        ) : null}

        {auth === "ready" && panel === "overview" ? (
          <div className="mt-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total users", value: users.length, tone: "text-white" },
                { label: "Verified", value: users.filter((user) => user.status === "verified").length, tone: "text-ice" },
                { label: "Pending", value: users.filter((user) => user.status === "pending").length, tone: "text-blood-bright" },
                { label: "New notifications", value: unreadCount, tone: "text-ice" },
              ].map((stat) => (
                <div key={stat.label} className="border border-white/10 bg-ink-800/60 p-5">
                  <p className="field-label">{stat.label}</p>
                  <p className={`mt-3 font-display text-4xl font-semibold ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <button type="button" onClick={() => setPanel("users")} className={panelButton}>
                <Corners className="text-ice/40" />
                <span className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">01 / People</span>
                  <ArrowUpRightIcon className="h-5 w-5 text-ice" />
                </span>
                <span className="mt-5 block text-2xl font-semibold tracking-tight text-white">
                  Users &amp; details
                </span>
                <span className="mt-3 block max-w-md text-sm leading-relaxed text-fog">
                  Search every registration, inspect submitted details and files, block access, or remove a user.
                </span>
              </button>

              <button type="button" onClick={() => setPanel("notifications")} className={panelButton}>
                <Corners className="text-blood/50" />
                <span className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-blood-bright">02 / Alerts</span>
                  <CrosshairIcon className="h-5 w-5 text-blood-bright" />
                </span>
                <span className="mt-5 block text-2xl font-semibold tracking-tight text-white">
                  New user notifications
                </span>
                <span className="mt-3 block max-w-md text-sm leading-relaxed text-fog">
                  {unreadCount > 0
                    ? `${unreadCount} registration${unreadCount === 1 ? "" : "s"} waiting for review.`
                    : "You are all caught up. New registrations will appear here."}
                </span>
              </button>

              <button type="button" onClick={() => setPanel("hackathon")} className={panelButton}>
                <Corners className="text-ice/40" />
                <span className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">03 / Hackathon</span>
                  <FileIcon className="h-5 w-5 text-ice" />
                </span>
                <span className="mt-5 block text-2xl font-semibold tracking-tight text-white">
                  Presentation submissions
                </span>
                <span className="mt-3 block max-w-md text-sm leading-relaxed text-fog">
                  Review every PPT uploaded by participants and download the original files.
                </span>
              </button>

              <button type="button" onClick={() => setPanel("ctf")} className={panelButton}>
                <Corners className="text-blood/50" />
                <span className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-blood-bright">04 / CTF</span>
                  <CrosshairIcon className="h-5 w-5 text-blood-bright" />
                </span>
                <span className="mt-5 block text-2xl font-semibold tracking-tight text-white">
                  Live scoreboard
                </span>
                <span className="mt-3 block max-w-md text-sm leading-relaxed text-fog">
                  Enter and update points. Teams are ranked with the highest score first.
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {auth === "ready" && panel === "users" ? (
          <div className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">People // Registrations</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">All users</h2>
                <p className="mt-2 text-sm text-fog">
                  {filteredUsers.length} of {users.length} registration{users.length === 1 ? "" : "s"} shown.
                </p>
              </div>
              <button type="button" onClick={() => void loadUsers()} disabled={usersLoading} className={smallButton}>
                {usersLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {userMessage ? (
              <p role="status" className="mt-5 flex items-center gap-2 border border-ice/30 bg-ice/[0.05] p-3 text-sm text-ice">
                <CheckIcon className="h-4 w-4" />
                {userMessage}
              </p>
            ) : null}
            {credentialsResult ? (
              <div className="mt-5 border border-ice/40 bg-ice/[0.06] p-4">
                <p className="field-label">New credentials for {credentialsResult.uniqueId}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <code className="break-all border border-white/10 bg-ink/60 px-3 py-2 font-mono text-xs text-white">
                    {credentialsResult.password}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        `Unique ID: ${credentialsResult.uniqueId}\nPassword: ${credentialsResult.password}`,
                      );
                    }}
                    className={smallButton}
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                  Delivered to {credentialsResult.deliveredTo}
                  {credentialsResult.fallback ? " (admin fallback)" : ""}
                </p>
              </div>
            ) : null}
            {usersError ? (
              <p role="alert" className="mt-5 border border-blood/40 bg-blood/5 p-4 text-sm text-blood-bright">
                {usersError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <input
                type="search"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search name, email, ID, team, phone"
                className="field max-w-md flex-1"
                aria-label="Search users"
              />
              <div className="flex border border-white/10">
                {(["all", "hackathon", "ctf"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setEventFilter(option)}
                    className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
                      eventFilter === option ? "bg-ice/10 text-ice" : "text-fog hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {usersLoading && users.length === 0 ? (
              <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-ice">Loading users...</p>
            ) : null}

            {!usersLoading && !usersError && filteredUsers.length === 0 ? (
              <p className="mt-10 border border-white/10 bg-ink-800/40 p-8 text-center text-sm text-fog">
                No users match this filter.
              </p>
            ) : null}

            {filteredUsers.length > 0 ? (
              <div className="mt-6 overflow-x-auto border border-white/10 bg-ink-800/40">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">
                      <th className="px-5 py-4 font-normal">User</th>
                      <th className="px-5 py-4 font-normal">Unique ID</th>
                      <th className="px-5 py-4 font-normal">Event</th>
                      <th className="px-5 py-4 font-normal">Status</th>
                      <th className="px-5 py-4 font-normal">Registered</th>
                      <th className="px-5 py-4 font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.uniqueId}
                        className={`border-b border-white/5 last:border-0 ${selectedUserId === user.uniqueId ? "bg-white/[0.03]" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <p className="text-white">{user.name || "—"}</p>
                          <p className="mt-1 text-xs text-fog">{user.email || user.phone || "—"}</p>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-ice">{user.uniqueId}</td>
                        <td className="px-5 py-4 text-xs text-fog">{user.eventName || user.event}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="border border-ice/25 bg-ice/[0.05] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ice">
                              {user.status}
                            </span>
                            {user.blocked ? (
                              <span className="border border-blood/40 bg-blood/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-blood-bright">
                                blocked
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-fog">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setSelectedUserId(user.uniqueId)} className={smallButton}>
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => void onResendCredentials(user)}
                              disabled={userActionBusy === user.uniqueId}
                              className={smallButton}
                            >
                              {userActionBusy === user.uniqueId ? "..." : "Resend"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void onToggleBlock(user)}
                              disabled={userActionBusy === user.uniqueId}
                              className={smallButton}
                            >
                              {userActionBusy === user.uniqueId ? "..." : user.blocked ? "Unblock" : "Block"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteUser(user)}
                              disabled={userActionBusy === user.uniqueId}
                              className={dangerButton}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {selectedUser ? (
              <div className="group relative mt-8 border border-ice/25 bg-ice/[0.04] p-6 sm:p-8">
                <Corners className="text-ice/50" />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">User detail</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                      {selectedUser.name || selectedUser.uniqueId}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-ice">{selectedUser.uniqueId}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedUserId("")} className={smallButton}>
                    Close
                  </button>
                </div>

                <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="field-label">Email</dt>
                    <dd className="mt-1 break-all text-sm text-white">{selectedUser.email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Phone</dt>
                    <dd className="mt-1 text-sm text-white">{selectedUser.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Event</dt>
                    <dd className="mt-1 text-sm text-white">{selectedUser.eventName || selectedUser.event}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Team</dt>
                    <dd className="mt-1 text-sm text-white">{selectedUser.teamName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Captain</dt>
                    <dd className="mt-1 text-sm text-white">{selectedUser.captainName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Team size</dt>
                    <dd className="mt-1 text-sm text-white">{selectedUser.teamSize || "—"}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Verified</dt>
                    <dd className="mt-1 text-sm text-white">{formatDate(selectedUser.verifiedAt)}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Registered</dt>
                    <dd className="mt-1 text-sm text-white">{formatDate(selectedUser.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Access</dt>
                    <dd className="mt-1 text-sm text-white">
                      {selectedUser.blocked ? "Blocked" : selectedUser.status}
                    </dd>
                  </div>
                </dl>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="field-label">Submitted details</p>
                  <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(selectedUser.details || {})
                      .filter(([key]) => !["files", "uploads", "registeredFor"].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <dt className="field-label">{humanize(key)}</dt>
                          <dd className="mt-1 break-words text-sm text-white">{displayValue(value)}</dd>
                        </div>
                      ))}
                  </dl>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="field-label">Uploaded files</p>
                  {selectedUser.uploads.length ? (
                    <ul className="mt-4 space-y-2">
                      {selectedUser.uploads.map((file, index) => (
                        <li key={`${file.storedName}-${index}`}>
                          <a href={file.url} className="inline-flex items-center gap-2 text-sm text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current">
                            {file.name}
                            <ArrowUpRightIcon className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-fog">No files uploaded.</p>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void onResendCredentials(selectedUser)}
                    disabled={userActionBusy === selectedUser.uniqueId}
                    className={smallButton}
                  >
                    {userActionBusy === selectedUser.uniqueId ? "Sending..." : "Resend credentials"}
                  </button>
                  <button type="button" onClick={() => void onToggleBlock(selectedUser)} className={smallButton}>
                    {selectedUser.blocked ? "Unblock user" : "Block user"}
                  </button>
                  <button type="button" onClick={() => void onDeleteUser(selectedUser)} className={dangerButton}>
                    Delete user
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {auth === "ready" && panel === "notifications" ? (
          <div className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-blood-bright">Alerts // New users</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Notifications</h2>
                <p className="mt-2 text-sm text-fog">
                  {unreadCount} unread registration{unreadCount === 1 ? "" : "s"}.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => void loadNotifications()} disabled={notificationsLoading} className={smallButton}>
                  {notificationsLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={() => void onMarkNotificationsRead()}
                  disabled={notificationsLoading || unreadCount === 0}
                  className={smallButton}
                >
                  Mark all read
                </button>
              </div>
            </div>

            {notificationsError ? (
              <p role="alert" className="mt-5 border border-blood/40 bg-blood/5 p-4 text-sm text-blood-bright">
                {notificationsError}
              </p>
            ) : null}

            {notificationsLoading && notifications.length === 0 ? (
              <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-ice">Loading notifications...</p>
            ) : null}

            {!notificationsLoading && !notificationsError && notifications.length === 0 ? (
              <div className="mt-10 border border-white/10 bg-ink-800/40 p-10 text-center">
                <CheckIcon className="mx-auto h-8 w-8 text-ice" />
                <p className="mt-4 text-sm text-fog">No new registrations. You are all caught up.</p>
              </div>
            ) : null}

            {notifications.length > 0 ? (
              <div className="mt-6 space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.uniqueId}
                    className="flex flex-wrap items-center gap-4 border border-white/10 bg-ink-800/60 p-5"
                  >
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 animate-blink bg-blood motion-reduce:animate-none" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white">
                        New {notification.registeredFor} registration:{" "}
                        <span className="text-ice">{notification.name || notification.email}</span>
                      </p>
                      <p className="mt-1 text-xs text-fog">
                        {notification.email} · {notification.event} · {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    <button type="button" onClick={() => onOpenNotification(notification)} className={smallButton}>
                      Review user
                      <ArrowUpRightIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {auth === "ready" && panel === "hackathon" ? (
          <div className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">Hackathon // Submissions</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">All uploaded PPTs</h2>
                <p className="mt-2 text-sm text-fog">
                  {ppts.length} presentation{ppts.length === 1 ? "" : "s"} on record.
                </p>
              </div>
              <button type="button" onClick={() => void loadPpts()} disabled={pptsLoading} className={smallButton}>
                {pptsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {pptsError ? (
              <p role="alert" className="mt-6 border border-blood/40 bg-blood/5 p-4 text-sm text-blood-bright">
                {pptsError}
              </p>
            ) : null}

            {pptsLoading && ppts.length === 0 ? (
              <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-ice">Loading presentations...</p>
            ) : null}

            {!pptsLoading && !pptsError && ppts.length === 0 ? (
              <p className="mt-10 border border-white/10 bg-ink-800/40 p-8 text-center text-sm text-fog">
                No presentations have been submitted yet.
              </p>
            ) : null}

            {ppts.length > 0 ? (
              <div className="mt-8 overflow-x-auto border border-white/10 bg-ink-800/40">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">
                      <th className="px-5 py-4 font-normal">#</th>
                      <th className="px-5 py-4 font-normal">Team</th>
                      <th className="px-5 py-4 font-normal">Presentation</th>
                      <th className="px-5 py-4 font-normal">Submitted</th>
                      <th className="px-5 py-4 font-normal">Status</th>
                      <th className="px-5 py-4 font-normal">File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ppts.map((ppt, index) => (
                      <tr key={`${ppt.storedName}-${index}`} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-4 font-mono text-xs text-fog">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-white">{ppt.team || "—"}</p>
                          <p className="mt-1 text-xs text-fog">{ppt.captain || ppt.email || ppt.uniqueId}</p>
                        </td>
                        <td className="max-w-[320px] break-all px-5 py-4 font-mono text-xs text-ice">{ppt.name}</td>
                        <td className="px-5 py-4 text-xs text-fog">
                          {ppt.submittedAt ? new Date(ppt.submittedAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="border border-ice/25 bg-ice/[0.05] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ice">
                            {ppt.status || "pending"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <a href={ppt.url} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white underline decoration-white/20 underline-offset-4 hover:text-ice">
                            Download <ArrowUpRightIcon className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}

        {auth === "ready" && panel === "ctf" ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-blood-bright">CTF // Scoreboard</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Rankings</h2>
                  <p className="mt-2 text-sm text-fog">Highest score first.</p>
                </div>
                <button type="button" onClick={() => void loadScores()} disabled={scoresLoading} className={smallButton}>
                  {scoresLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {scoresError ? (
                <p role="alert" className="mt-6 border border-blood/40 bg-blood/5 p-4 text-sm text-blood-bright">
                  {scoresError}
                </p>
              ) : null}

              {scoresLoading && rankedScores.length === 0 ? (
                <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-ice">Loading scoreboard...</p>
              ) : null}

              {!scoresLoading && !scoresError && rankedScores.length === 0 ? (
                <p className="mt-10 border border-white/10 bg-ink-800/40 p-8 text-center text-sm text-fog">
                  No scores yet. Add the first one from the panel on the right.
                </p>
              ) : null}

              {rankedScores.length > 0 ? (
                <div className="mt-8 border border-white/10 bg-ink-800/40">
                  {rankedScores.map((score, index) => (
                    <div
                      key={`${score.uniqueId || score.team}-${index}`}
                      className="flex flex-wrap items-center gap-4 border-b border-white/5 px-5 py-4 last:border-0 sm:flex-nowrap"
                    >
                      <span
                        className={`w-10 shrink-0 font-mono text-lg ${
                          index === 0 ? "text-ice" : index < 3 ? "text-blood-bright" : "text-fog"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-white">{score.team}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fog/80">
                          {score.uniqueId || "manual entry"}
                        </p>
                      </div>
                      <span className="font-mono text-xl text-ice">{score.points}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog/80">pts</span>
                      <button
                        type="button"
                        onClick={() => void onRemoveScore(score)}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog underline decoration-white/20 underline-offset-4 hover:text-blood-bright"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="border border-ice/25 bg-ice/[0.04] p-6">
              <Corners className="text-ice/40" />
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">Score control</p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">Add or update points</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">
                Pick a registered team or type a new one. Saving with the same team updates its score.
              </p>
              <form onSubmit={onSaveScore} className="mt-6 space-y-5" noValidate>
                <div>
                  <label htmlFor="score-team" className="field-label">Team</label>
                  <input
                    id="score-team"
                    list="ctf-team-list"
                    value={teamInput}
                    onChange={(event) => {
                      setTeamInput(event.target.value);
                      setSelectedId(teams.find((team) => team.team === event.target.value)?.uniqueId || "");
                    }}
                    className="field"
                    placeholder="Team name"
                  />
                  <datalist id="ctf-team-list">
                    {teams.map((team) => (
                      <option key={team.uniqueId || team.team} value={team.team} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="score-points" className="field-label">Points</label>
                  <input
                    id="score-points"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pointsInput}
                    onChange={(event) => setPointsInput(event.target.value)}
                    className="field"
                    placeholder="0"
                  />
                </div>
                {scoreError ? (
                  <p role="alert" className="border border-blood/40 bg-blood/10 p-3 text-sm text-blood-bright">
                    {scoreError}
                  </p>
                ) : null}
                {scoreMessage ? (
                  <p role="status" className="flex items-center gap-2 border border-ice/30 bg-ice/[0.05] p-3 text-sm text-ice">
                    <CheckIcon className="h-4 w-4" />
                    {scoreMessage}
                  </p>
                ) : null}
                <button type="submit" disabled={savingScore} className={`${buttonPrimary} w-full disabled:opacity-60`}>
                  {savingScore ? "Saving..." : "Save score"}
                  <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </button>
              </form>
              <p className="mt-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fog/80">
                {teams.length} registered CTF team{teams.length === 1 ? "" : "s"} available for selection.
              </p>
            </div>
          </div>
        ) : null}

        {auth === "ready" ? (
          <div className="mt-16">
            <a href="/" className={buttonGhost}>
              Back to site <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
