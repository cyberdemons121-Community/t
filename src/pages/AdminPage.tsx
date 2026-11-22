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

type AuthState = "loading" | "login" | "ready";
type Panel = "choose" | "hackathon" | "ctf";

const smallButton =
  "inline-flex items-center gap-2 border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white transition-colors hover:border-ice/60 hover:text-ice disabled:cursor-not-allowed disabled:opacity-60";

const panelButton =
  "group relative w-full border border-white/10 bg-ink-800/60 p-6 text-left transition-colors hover:border-ice/50 sm:p-8";

export function AdminPage() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [panel, setPanel] = useState<Panel>("choose");

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
    if (auth === "ready" && panel === "ctf") void loadScores();
  }, [auth, panel]);

  useEffect(() => {
    if (auth === "ready" && panel === "hackathon") void loadPpts();
  }, [auth, panel]);

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim()) {
      setLoginError("Enter the admin password.");
      return;
    }

    setLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
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
    setPanel("choose");
    setPpts([]);
    setScores([]);
    setTeams([]);
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
              Enter the admin password configured on the server to manage submissions and scores.
            </p>
            <form onSubmit={onLogin} className="mt-6 space-y-5" noValidate>
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

        {auth === "ready" && panel === "choose" ? (
          <div className="mt-12">
            <p className="text-lg text-fog">Which event are you reviewing?</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <button type="button" onClick={() => setPanel("hackathon")} className={panelButton}>
                <Corners className="text-ice/40" />
                <span className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">01 / Hackathon</span>
                  <FileIcon className="h-5 w-5 text-ice" />
                </span>
                <span className="mt-5 block text-2xl font-semibold tracking-tight text-white">
                  Presentation submissions
                </span>
                <span className="mt-3 block max-w-md text-sm leading-relaxed text-fog">
                  Review every PPT uploaded by participants and download the original files.
                </span>
                <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ice">
                  Open submissions <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </span>
              </button>

              <button type="button" onClick={() => setPanel("ctf")} className={panelButton}>
                <Corners className="text-blood/50" />
                <span className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-blood-bright">02 / CTF</span>
                  <CrosshairIcon className="h-5 w-5 text-blood-bright" />
                </span>
                <span className="mt-5 block text-2xl font-semibold tracking-tight text-white">
                  Live scoreboard
                </span>
                <span className="mt-3 block max-w-md text-sm leading-relaxed text-fog">
                  Enter and update points. Teams are ranked with the highest score first.
                </span>
                <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-blood-bright">
                  Open scoreboard <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {auth === "ready" && panel !== "choose" ? (
          <div className="mt-12">
            <button type="button" onClick={() => setPanel("choose")} className={smallButton}>
              ← Choose event
            </button>
          </div>
        ) : null}

        {auth === "ready" && panel === "hackathon" ? (
          <div className="mt-8">
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
              <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-ice">
                Loading presentations...
              </p>
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
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
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
                <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-ice">
                  Loading scoreboard...
                </p>
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
