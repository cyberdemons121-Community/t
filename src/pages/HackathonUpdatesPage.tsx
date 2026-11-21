import { useEffect, useState } from "react";
import { Corners } from "../components/Corners";
import { Reveal } from "../components/Reveal";
import { ArrowUpRightIcon, CheckIcon } from "../components/Icons";
import { buttonPrimary } from "../components/styles";
import { eventPages } from "../data/events";

interface PortalUpload {
  field: string;
  name: string;
  url: string;
}

interface PortalData {
  ok: boolean;
  uniqueId: string;
  name: string;
  event: string;
  eventName: string;
  registeredFor: string;
  status: string;
  details: Record<string, string>;
  uploads: PortalUpload[];
}

const hackathon = eventPages.hackathon;

const editButton =
  "inline-flex items-center border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:border-ice/60 hover:text-ice disabled:cursor-not-allowed disabled:opacity-60";

export function HackathonUpdatesPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<"ppt" | "repo" | null>(null);
  const [repoInput, setRepoInput] = useState("");
  const [pptInput, setPptInput] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/me");
        if (response.status === 401) {
          window.location.replace("/login.html");
          return;
        }
        const result = (await response.json()) as PortalData & { error?: string };
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Could not load your updates.");
        }
        if (!cancelled) {
          setData(result);
          setRepoInput(result.details.repo || "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load your updates.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ppt = data?.uploads.find((file) => file.field === "ppt");
  const payment = data?.uploads.find((file) => file.field === "paymentScreenshot");
  const repo = data?.details.repo?.trim();
  const registeredFor = data?.registeredFor || "Hackathon";

  const beginEdit = (field: "ppt" | "repo") => {
    setEditing(field);
    setRepoInput(data?.details.repo || "");
    setPptInput(null);
    setActionError("");
    setActionMessage("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setPptInput(null);
    setActionError("");
  };

  const saveEdit = async () => {
    if (!data || !editing) return;
    if (editing === "ppt" && !pptInput) {
      setActionError("Choose a presentation file first.");
      return;
    }

    setSaving(true);
    setActionError("");
    setActionMessage("");

    try {
      const body = new FormData();
      if (editing === "repo") body.append("repo", repoInput.trim());
      if (editing === "ppt" && pptInput) body.append("ppt", pptInput, pptInput.name);

      const response = await fetch("/api/submission", { method: "POST", body });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not save changes.");
      }

      const refreshed = await fetch("/api/me");
      const next = (await refreshed.json()) as PortalData;
      setData(next);
      setRepoInput(next.details.repo || "");
      setEditing(null);
      setPptInput(null);
      setActionMessage("Changes saved to your submission.");
    } catch (saveError) {
      setActionError(
        saveError instanceof Error ? saveError.message : "Could not save changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -right-24 top-10 h-[420px] w-[420px] animate-drift rounded-full bg-ice/10 blur-[120px] motion-reduce:animate-none" />
      </div>

      <div className="container-x relative">
        {error ? (
          <div className="mx-auto max-w-xl border border-blood/40 bg-blood/5 p-8 text-center">
            <h1 className="text-2xl font-semibold text-white">Access unavailable</h1>
            <p className="mt-3 text-sm leading-relaxed text-fog">{error}</p>
            <a href="/login.html" className={`${buttonPrimary} mt-6`}>
              Back to login <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}

        {!data && !error ? (
          <div className="py-20 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-ice">
            Loading your submission...
          </div>
        ) : null}

        {data && data.event !== "hackathon" ? (
          <div className="mx-auto max-w-xl border border-ice/30 bg-ice/[0.04] p-8 text-center">
            <h1 className="text-2xl font-semibold text-white">Wrong event portal</h1>
            <p className="mt-3 text-sm leading-relaxed text-fog">
              This page is for verified hackathon participants. Use the link from your verification mail for your event.
            </p>
            <a href="/login.html" className={`${buttonPrimary} mt-6`}>
              Back to login <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}

        {data && data.event === "hackathon" ? (
          <>
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <span className="eyebrow text-ice">Hackathon // 2026</span>
                <span aria-hidden="true" className="h-px w-8 bg-white/20" />
                <span className="eyebrow text-fog/80">Submission portal</span>
              </div>
              <h1 className="mt-6 text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
                Your build, <span className="text-ice">on record.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-fog md:text-lg">
                Welcome back, {data.name}. This is your verified {hackathon.name} workspace — your uploaded
                presentation, project link, and the deadlines that matter.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 border border-ice/30 bg-ice/[0.05] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ice">
                  <CheckIcon className="h-3.5 w-3.5" />
                  {data.status || "verified"}
                </span>
                <span className="border border-white/10 bg-ink-800/50 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
                  {data.uniqueId}
                </span>
                <span className="border border-ice/30 bg-ice/[0.05] px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-ice">
                  {registeredFor}
                </span>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <Reveal delay={80}>
                <div className="group relative h-full border border-ice/25 bg-ice/[0.04] p-6 sm:p-8">
                  <Corners className="text-ice/40" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">01 / Presentation</p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Your PPT</h2>
                  {ppt ? (
                    <p className="mt-3 break-all font-mono text-xs leading-relaxed text-fog">{ppt.name}</p>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-fog">
                      No presentation file was found with this registration. Contact the organisers if you uploaded one.
                    </p>
                  )}

                  {editing === "ppt" ? (
                    <div className="mt-5">
                      <input
                        type="file"
                        accept=".ppt,.pptx,.pdf"
                        onChange={(event) => setPptInput(event.target.files?.[0] ?? null)}
                        aria-label="Choose a new presentation"
                        className="field file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-white"
                      />
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={saveEdit} disabled={saving} className={editButton}>
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={saving} className={editButton}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {ppt ? (
                        <a href={ppt.url} className={buttonPrimary}>
                          Download presentation <ArrowUpRightIcon className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                      <button type="button" onClick={() => beginEdit("ppt")} className={editButton}>
                        Edit PPT
                      </button>
                    </div>
                  )}
                </div>
              </Reveal>

              <Reveal delay={140}>
                <div className="group relative h-full border border-white/10 bg-ink-800/60 p-6 sm:p-8">
                  <Corners className="text-white/20" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">02 / Project</p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Repository link</h2>
                  {repo ? (
                    <p className="mt-3 break-all font-mono text-xs leading-relaxed text-ice">{repo}</p>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-fog">
                      No repository link was submitted with this registration.
                    </p>
                  )}

                  {editing === "repo" ? (
                    <div className="mt-5">
                      <input
                        type="url"
                        value={repoInput}
                        onChange={(event) => setRepoInput(event.target.value)}
                        placeholder="https://github.com/..."
                        aria-label="Repository link"
                        className="field"
                      />
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={saveEdit} disabled={saving} className={editButton}>
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={saving} className={editButton}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {repo ? (
                        <a href={repo} target="_blank" rel="noopener noreferrer" className={buttonPrimary}>
                          Open repository <ArrowUpRightIcon className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                      <button type="button" onClick={() => beginEdit("repo")} className={editButton}>
                        Edit repository
                      </button>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>

            {actionError ? (
              <p role="alert" className="mt-6 border border-blood/40 bg-blood/5 p-3 text-sm text-blood-bright">
                {actionError}
              </p>
            ) : null}
            {actionMessage ? (
              <p role="status" className="mt-6 border border-ice/30 bg-ice/[0.05] p-3 text-sm text-ice">
                {actionMessage}
              </p>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Reveal delay={180}>
                <div className="border border-white/10 bg-ink-800/40 p-6 sm:p-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">Submission details</p>
                  <dl className="mt-5 space-y-3 text-sm">
                    {[
                      ["Team", data.details.teamName],
                      ["Captain", data.details.captain],
                      ["Team size", data.details.teamSize],
                      ["Track", data.details.track],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-2">
                        <dt className="text-fog/80">{label}</dt>
                        <dd className="text-right text-white">{value || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                  {data.details.project ? (
                    <div className="mt-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog/80">What you are building</p>
                      <p className="mt-2 text-sm leading-relaxed text-fog">{data.details.project}</p>
                    </div>
                  ) : null}
                  {payment ? (
                    <a href={payment.url} className="mt-5 inline-flex font-mono text-[11px] uppercase tracking-[0.18em] text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current">
                      View payment screenshot →
                    </a>
                  ) : null}
                </div>
              </Reveal>

              <Reveal delay={220}>
                <div className="border border-white/10 bg-ink-800/40 p-6 sm:p-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">Event updates</p>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-blood-bright">Deadline</p>
                      <p className="mt-1 text-sm text-white">{hackathon.deadline}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ice">Event day</p>
                      <p className="mt-1 text-sm text-white">{hackathon.eventDate}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">Fee</p>
                      <p className="mt-1 text-sm text-white">{hackathon.entryFeeLabel}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
