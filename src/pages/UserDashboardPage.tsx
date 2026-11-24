import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Corners } from "../components/Corners";
import { Reveal } from "../components/Reveal";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CrosshairIcon,
  FileIcon,
  UsersIcon,
} from "../components/Icons";
import { buttonGhost, buttonPrimary } from "../components/styles";
import { site } from "../data/site";

type UploadField = "ppt" | "paymentScreenshot" | "profilePic";

interface TeamMember {
  name: string;
  role: string;
  email: string;
  phone: string;
  college: string;
}

interface Upload {
  field: UploadField;
  name: string;
  storedName: string;
  url: string;
  viewUrl: string;
  uploadedAt: string | null;
}

interface Profile {
  captain: string;
  teamName: string;
  teamSize: string;
  phone: string;
  college: string;
  city: string;
  experience: string;
  repo: string;
}

interface Flags {
  verified: boolean;
  paymentUploaded: boolean;
  pptUploaded: boolean;
  profilePictureUploaded: boolean;
  teamMemberCount: number;
}

interface MeResponse {
  ok: boolean;
  uniqueId: string;
  name: string;
  event: string;
  eventName: string;
  registeredFor: string;
  status: string;
  verifiedAt: string | null;
  createdAt: string | null;
  details: Record<string, unknown>;
  profile: Profile;
  teamMembers: TeamMember[];
  uploads: Upload[];
  profilePicUrl: string | null;
  flags: Flags;
  score?: number | null;
  error?: string;
}

type AuthState = "loading" | "guest" | "ready";

const emptyProfile: Profile = {
  captain: "",
  teamName: "",
  teamSize: "",
  phone: "",
  college: "",
  city: "",
  experience: "",
  repo: "",
};

const emptyMember: TeamMember = {
  name: "",
  role: "",
  email: "",
  phone: "",
  college: "",
};

const uploadLabels: Record<UploadField, string> = {
  ppt: "Presentation",
  paymentScreenshot: "Payment proof",
  profilePic: "Profile picture",
};

const labelMap: Record<string, string> = {
  eventName: "Event",
  teamName: "Team",
  captain: "Captain",
  handle: "Handle",
  teamSize: "Team size",
  email: "Email",
  phone: "Phone",
  name: "Name",
  college: "College",
  city: "City",
  experience: "Experience",
  repo: "Project repo",
  ppt: "Presentation",
  paymentScreenshot: "Payment proof",
  transactionId: "Transaction ID",
};

function humanize(key: string) {
  return (
    labelMap[key] ||
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .replace(/^./, (char) => char.toUpperCase())
  );
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "CD"
  );
}

function cleanMember(member: TeamMember): TeamMember {
  return {
    name: member.name.trim(),
    role: member.role.trim(),
    email: member.email.trim(),
    phone: member.phone.trim(),
    college: member.college.trim(),
  };
}

async function request<T extends { ok?: boolean; error?: string }>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, init);
  const data = (await response.json().catch(() => ({}))) as T;
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Request failed. Please try again.");
  }
  return data;
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`group relative border border-white/10 bg-ink-800/60 p-6 sm:p-8 ${className}`}>
      <Corners className="text-ice/40" />
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-1"
      />
    </label>
  );
}

export function UserDashboardPage() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Profile>(emptyProfile);
  const [repoDraft, setRepoDraft] = useState("");
  const [memberDraft, setMemberDraft] = useState<TeamMember>(emptyMember);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember>(emptyMember);
  const [files, setFiles] = useState<Partial<Record<UploadField, File>>>({});

  const refresh = useCallback(async () => {
    const result = await request<MeResponse>("/api/me");
    setMe(result);
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await request<MeResponse>("/api/me");
        if (!cancelled) {
          setMe(result);
          setAuth("ready");
        }
      } catch {
        if (!cancelled) {
          setError("Could not reach the server. Try again in a moment.");
          setAuth("guest");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!me) return;
    setProfileDraft({ ...emptyProfile, ...me.profile });
    setRepoDraft(me.profile.repo || "");
  }, [me]);

  function showNotice(kind: "ok" | "error", text: string) {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 4500);
  }

  async function act(key: string, success: string, action: () => Promise<void>) {
    setBusy(key);
    setNotice(null);
    try {
      await action();
      showNotice("ok", success);
    } catch (actionError) {
      showNotice(
        "error",
        actionError instanceof Error ? actionError.message : "That action failed.",
      );
    } finally {
      setBusy("");
    }
  }

  async function copyId() {
    if (!me?.uniqueId) return;
    try {
      await navigator.clipboard.writeText(me.uniqueId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.assign("/login.html");
    }
  }

  if (auth === "loading") {
    return (
      <section className="container-x pb-24 pt-36">
        <Reveal>
          <div className="border border-white/10 bg-ink-800/50 p-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ice">
              Loading your portal...
            </p>
          </div>
        </Reveal>
      </section>
    );
  }

  if (auth === "guest" || !me) {
    return (
      <section className="container-x pb-24 pt-36">
        <Reveal>
          <div className="group relative mx-auto max-w-xl border border-white/10 bg-ink-800/60 p-8 text-center sm:p-12">
            <Corners className="text-ice/50" />
            <CrosshairIcon className="mx-auto h-10 w-10 text-ice" />
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
              Sign in to view your dashboard
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-fog">
              Your status, uploads, profile picture, team members, and PPT submission all live here.
              Use the unique ID and password sent after verification.
            </p>
            {error ? <p className="mt-4 text-sm text-blood-bright">{error}</p> : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/login.html" className={buttonPrimary}>Go to login</a>
              <a href="/hackathon.html" className={buttonGhost}>Hackathon</a>
            </div>
          </div>
        </Reveal>
      </section>
    );
  }

  const currentMe = me;
  const flags: Flags = me.flags ?? {
    verified: me.status === "verified",
    paymentUploaded: me.uploads.some((file) => file.field === "paymentScreenshot"),
    pptUploaded: me.uploads.some((file) => file.field === "ppt"),
    profilePictureUploaded: me.uploads.some((file) => file.field === "profilePic"),
    teamMemberCount: me.teamMembers.length,
  };
  const uploadByField = (field: UploadField) => me.uploads.find((file) => file.field === field);
  const ppt = uploadByField("ppt");
  const payment = uploadByField("paymentScreenshot");
  const avatar = uploadByField("profilePic");
  const checklist = [
    {
      label: "Registration verified",
      hint: flags.verified ? "Access active" : "Awaiting verification",
      done: flags.verified,
    },
    {
      label: "Payment proof uploaded",
      hint: payment ? "On file" : "Upload required",
      done: flags.paymentUploaded,
    },
    {
      label: "Presentation submitted",
      hint: ppt ? "On file" : "Due 23 December 2026",
      done: flags.pptUploaded,
    },
    {
      label: "Profile & team ready",
      hint:
        me.event === "hackathon"
          ? `${flags.teamMemberCount} member${flags.teamMemberCount === 1 ? "" : "s"} added`
          : "Solo entry",
      done: flags.profilePictureUploaded || flags.teamMemberCount > 0 || me.event !== "hackathon",
    },
  ];
  const doneCount = checklist.filter((item) => item.done).length;
  const progress = Math.round((doneCount / checklist.length) * 100);

  const detailPairs = Object.entries(me.details || {}).filter(
    ([key, value]) =>
      !["files", "uploads", "registeredFor", "teamMembers"].includes(key) &&
      !key.endsWith("UpdatedAt") &&
      displayValue(value) !== "—",
  );

  const activity = [
    { title: "Registration created", time: me.createdAt },
    { title: "Access verified", time: me.verifiedAt },
    ...me.uploads
      .filter((file) => file.uploadedAt)
      .map((file) => ({ title: `${uploadLabels[file.field]} uploaded`, time: file.uploadedAt })),
  ]
    .filter((item) => item.time)
    .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
    .slice(0, 5);

  function persistProfile() {
    void act("profile", "Profile updated.", async () => {
      await request("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profileDraft),
      });
      await refresh();
    });
  }

  function saveRepo() {
    void act("repo", "Project link updated.", async () => {
      await request("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repo: repoDraft }),
      });
      await refresh();
    });
  }

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const member = cleanMember(memberDraft);
    if (!member.name) {
      showNotice("error", "Enter a name for the new member.");
      return;
    }
    void act("member-add", `${member.name} added to your team.`, async () => {
      await request("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamMembers: [...currentMe.teamMembers, member] }),
      });
      setMemberDraft(emptyMember);
      await refresh();
    });
  }

  function saveMemberEdit() {
    if (editingIndex === null) return;
    const member = cleanMember(editingMember);
    if (!member.name) {
      showNotice("error", "A member needs a name.");
      return;
    }
    void act("member-save", `${member.name} updated.`, async () => {
      const next = [...currentMe.teamMembers];
      next[editingIndex] = member;
      await request("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamMembers: next }),
      });
      setEditingIndex(null);
      await refresh();
    });
  }

  function removeMember(index: number) {
    const member = currentMe.teamMembers[index];
    if (!member || !window.confirm(`Remove ${member.name || "this member"} from your team?`)) return;
    void act("member-remove", `${member.name || "Member"} removed.`, async () => {
      await request("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamMembers: currentMe.teamMembers.filter((_, i) => i !== index) }),
      });
      if (editingIndex === index) setEditingIndex(null);
      await refresh();
    });
  }

  function uploadFile(field: UploadField) {
    const file = files[field];
    if (!file) {
      showNotice("error", "Choose a file first.");
      return;
    }
    void act(`upload-${field}`, `${uploadLabels[field]} updated.`, async () => {
      const body = new FormData();
      body.append(field, file);
      await request("/api/me/uploads", { method: "POST", body });
      setFiles((current) => ({ ...current, [field]: undefined }));
      await refresh();
    });
  }

  function removeFile(field: UploadField) {
    if (!window.confirm(`Remove your ${uploadLabels[field].toLowerCase()}?`)) return;
    void act(`remove-${field}`, `${uploadLabels[field]} removed.`, async () => {
      await request(`/api/me/uploads/${field}`, { method: "DELETE" });
      await refresh();
    });
  }

  return (
    <section className="relative overflow-hidden pb-24 pt-28 md:pb-32 md:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -left-32 top-16 h-[420px] w-[420px] animate-drift rounded-full bg-blood/10 blur-[120px] motion-reduce:animate-none" />
        <div className="absolute -right-24 top-1/3 h-[440px] w-[440px] animate-drift-reverse rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
      </div>

      <div className="container-x relative">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow flex items-center gap-3 text-fog">
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-blink bg-ice motion-reduce:animate-none" />
                <span className="text-ice">Participant portal</span>
                <span aria-hidden="true" className="text-white/20">//</span>
                <span>{me.registeredFor || me.eventName}</span>
              </p>
              <h1 className="mt-6 text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-none tracking-[-0.03em]">
                Welcome back, <span className="text-ice">{me.name || "operator"}</span>.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
                Manage your status, profile, team, files, and presentation from one place.
              </p>
            </div>
            <button type="button" onClick={signOut} disabled={signingOut} className={buttonGhost}>
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </Reveal>

        {notice ? (
          <div
            role="status"
            className={`mt-8 border px-4 py-3 text-sm ${
              notice.kind === "ok"
                ? "border-ice/40 bg-ice/[0.06] text-ice"
                : "border-blood/40 bg-blood/[0.08] text-blood-bright"
            }`}
          >
            {notice.text}
          </div>
        ) : null}

        <Reveal>
          <div className="mt-10 border border-ice/25 bg-ice/[0.04] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">
                  Event readiness
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {doneCount} of {checklist.length} steps complete
                </h2>
              </div>
              <div className="text-right">
                <p className="font-display text-4xl font-semibold text-ice">{progress}%</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">Profile strength</p>
              </div>
            </div>
            <div className="mt-6 h-1.5 w-full bg-white/10">
              <div className="h-full bg-ice transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {checklist.map((item) => (
                <div key={item.label} className="flex gap-3 border border-white/10 bg-ink/50 p-4">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                      item.done ? "border-ice/60 bg-ice/10 text-ice" : "border-white/20 text-fog"
                    }`}
                  >
                    {item.done ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                  </span>
                  <div>
                    <p className="text-sm text-white">{item.label}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fog">
                      {item.hint}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <Card className="h-full border-ice/20 bg-ice/[0.04]">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-ice/30 bg-ink/70 font-display text-2xl font-semibold text-ice">
                  {avatar ? (
                    <img src={avatar.viewUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    initials(profileDraft.captain || me.name)
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight text-white">Your profile</h2>
                  <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
                    {profileDraft.teamName || "No team name yet"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Captain / display name"
                  value={profileDraft.captain}
                  onChange={(value) => setProfileDraft((draft) => ({ ...draft, captain: value }))}
                  placeholder="Your name"
                />
                <Field
                  label="Team name"
                  value={profileDraft.teamName}
                  onChange={(value) => setProfileDraft((draft) => ({ ...draft, teamName: value }))}
                  placeholder="Team name"
                />
                <Field
                  label="Phone"
                  value={profileDraft.phone}
                  onChange={(value) => setProfileDraft((draft) => ({ ...draft, phone: value }))}
                  placeholder="+91..."
                />
                <Field
                  label="College"
                  value={profileDraft.college}
                  onChange={(value) => setProfileDraft((draft) => ({ ...draft, college: value }))}
                  placeholder="Institution"
                />
                <Field
                  label="City"
                  value={profileDraft.city}
                  onChange={(value) => setProfileDraft((draft) => ({ ...draft, city: value }))}
                  placeholder="City"
                />
                <Field
                  label="Experience"
                  value={profileDraft.experience}
                  onChange={(value) => setProfileDraft((draft) => ({ ...draft, experience: value }))}
                  placeholder="Beginner / Intermediate / Pro"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={persistProfile}
                  disabled={busy === "profile"}
                  className={buttonPrimary}
                >
                  {busy === "profile" ? "Saving..." : "Save profile"}
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                  Team size: {profileDraft.teamSize || `${me.teamMembers.length + 1} (team)`}
                </span>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="field-label">Profile picture</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="Choose a profile picture"
                    onChange={(event) =>
                      setFiles((current) => ({ ...current, profilePic: event.target.files?.[0] }))
                    }
                    className="field min-w-0 flex-1 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => uploadFile("profilePic")}
                    disabled={busy === "upload-profilePic"}
                    className={buttonGhost}
                  >
                    {busy === "upload-profilePic" ? "Uploading..." : "Upload"}
                  </button>
                  {avatar ? (
                    <button
                      type="button"
                      onClick={() => removeFile("profilePic")}
                      disabled={busy === "remove-profilePic"}
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog underline decoration-white/20 underline-offset-4 hover:text-blood-bright"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card className="h-full">
              <div className="flex items-center gap-3">
                <UsersIcon className="h-5 w-5 text-ice" />
                <h2 className="text-xl font-semibold tracking-tight text-white">Team members</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-fog">
                Captain: <span className="text-white">{profileDraft.captain || me.name}</span>. Add up to
                10 members. Changes are saved to your registration immediately.
              </p>

              <div className="mt-6 space-y-3">
                {me.teamMembers.length ? (
                  me.teamMembers.map((member, index) => (
                    <div key={`${member.name}-${index}`} className="border border-white/10 bg-ink/50 p-4">
                      {editingIndex === index ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label="Name"
                            value={editingMember.name}
                            onChange={(value) => setEditingMember((draft) => ({ ...draft, name: value }))}
                          />
                          <Field
                            label="Role"
                            value={editingMember.role}
                            onChange={(value) => setEditingMember((draft) => ({ ...draft, role: value }))}
                            placeholder="Developer / researcher..."
                          />
                          <Field
                            label="Email"
                            type="email"
                            value={editingMember.email}
                            onChange={(value) => setEditingMember((draft) => ({ ...draft, email: value }))}
                          />
                          <Field
                            label="Phone"
                            value={editingMember.phone}
                            onChange={(value) => setEditingMember((draft) => ({ ...draft, phone: value }))}
                          />
                          <div className="sm:col-span-2 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={saveMemberEdit}
                              disabled={busy === "member-save"}
                              className={buttonPrimary}
                            >
                              {busy === "member-save" ? "Saving..." : "Save member"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingIndex(null)}
                              className={buttonGhost}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">{member.name}</p>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                              {member.role || "Member"}
                              {member.email ? ` // ${member.email}` : ""}
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingIndex(index);
                                setEditingMember({ ...member });
                              }}
                              className="font-mono text-[10px] uppercase tracking-[0.14em] text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMember(index)}
                              disabled={busy === "member-remove"}
                              className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog underline decoration-white/20 underline-offset-4 hover:text-blood-bright"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-fog">
                    No team members added yet. Solo entries are fine — add people if your team grows.
                  </p>
                )}
              </div>

              <form onSubmit={addMember} className="mt-6 border-t border-white/10 pt-6">
                <p className="field-label">Add a member</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Name"
                    value={memberDraft.name}
                    onChange={(value) => setMemberDraft((draft) => ({ ...draft, name: value }))}
                    placeholder="Full name"
                  />
                  <Field
                    label="Role"
                    value={memberDraft.role}
                    onChange={(value) => setMemberDraft((draft) => ({ ...draft, role: value }))}
                    placeholder="Developer / researcher..."
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={memberDraft.email}
                    onChange={(value) => setMemberDraft((draft) => ({ ...draft, email: value }))}
                    placeholder="optional"
                  />
                  <Field
                    label="Phone"
                    value={memberDraft.phone}
                    onChange={(value) => setMemberDraft((draft) => ({ ...draft, phone: value }))}
                    placeholder="optional"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy === "member-add"}
                  className={`${buttonGhost} mt-5 w-full`}
                >
                  {busy === "member-add" ? "Adding..." : "Add team member"}
                </button>
              </form>
            </Card>
          </Reveal>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <Card className="h-full border-ice/25 bg-ice/[0.04]">
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-ice" />
                <h2 className="text-xl font-semibold tracking-tight text-white">Presentation / PPT</h2>
              </div>
              <div className="mt-5 border border-white/10 bg-ink/60 p-4">
                <p className="field-label">Current file</p>
                <p className="mt-2 break-all font-mono text-xs text-white">
                  {ppt ? ppt.name : "No presentation uploaded"}
                </p>
                {ppt ? (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                    Uploaded {formatDate(ppt.uploadedAt)}
                  </p>
                ) : null}
              </div>

              <div className="mt-6">
                <p className="field-label">Replace presentation (PPT / PPTX / PDF)</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <input
                    type="file"
                    accept=".ppt,.pptx,.pdf"
                    aria-label="Choose a presentation"
                    onChange={(event) =>
                      setFiles((current) => ({ ...current, ppt: event.target.files?.[0] }))
                    }
                    className="field min-w-0 flex-1 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => uploadFile("ppt")}
                    disabled={busy === "upload-ppt"}
                    className={buttonPrimary}
                  >
                    {busy === "upload-ppt" ? "Uploading..." : "Upload / update"}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {ppt ? (
                  <a href={ppt.url} className={buttonGhost}>
                    Download PPT <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {ppt ? (
                  <button
                    type="button"
                    onClick={() => removeFile("ppt")}
                    disabled={busy === "remove-ppt"}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog underline decoration-white/20 underline-offset-4 hover:text-blood-bright"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="field-label">Project / repository link</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <input
                    type="url"
                    value={repoDraft}
                    onChange={(event) => setRepoDraft(event.target.value)}
                    placeholder="https://github.com/..."
                    className="field min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    onClick={saveRepo}
                    disabled={busy === "repo"}
                    className={buttonGhost}
                  >
                    {busy === "repo" ? "Saving..." : "Save link"}
                  </button>
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                  Hard deadline: 23 December 2026 // Event: 26 December 2026
                </p>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card className="h-full">
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-ice" />
                <h2 className="text-xl font-semibold tracking-tight text-white">Uploads</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {me.uploads.map((file) => (
                  <li
                    key={`${file.field}-${file.storedName}`}
                    className="border border-white/10 bg-ink/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ice">
                          {uploadLabels[file.field] || file.field}
                        </p>
                        <p className="mt-1 truncate text-sm text-white">{file.name}</p>
                      </div>
                      <a
                        href={file.url}
                        className="shrink-0 text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current"
                      >
                        <ArrowUpRightIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </li>
                ))}
                {!me.uploads.length ? (
                  <li className="text-sm text-fog">No files uploaded yet.</li>
                ) : null}
              </ul>

              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="field-label">Payment proof</p>
                <p className="mt-2 text-sm text-white">{payment ? payment.name : "Not uploaded"}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="Choose payment proof"
                    onChange={(event) =>
                      setFiles((current) => ({
                        ...current,
                        paymentScreenshot: event.target.files?.[0],
                      }))
                    }
                    className="field min-w-0 flex-1 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => uploadFile("paymentScreenshot")}
                    disabled={busy === "upload-paymentScreenshot"}
                    className={buttonGhost}
                  >
                    {busy === "upload-paymentScreenshot" ? "Uploading..." : "Upload"}
                  </button>
                  {payment ? (
                    <button
                      type="button"
                      onClick={() => removeFile("paymentScreenshot")}
                      disabled={busy === "remove-paymentScreenshot"}
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog underline decoration-white/20 underline-offset-4 hover:text-blood-bright"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
          </Reveal>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <Card>
              <h2 className="text-lg font-semibold tracking-tight text-white">Activity</h2>
              <ul className="mt-5 space-y-4">
                {activity.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="flex gap-4">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-ice" />
                    <div>
                      <p className="text-sm text-white">{item.title}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                        {formatDate(item.time)}
                      </p>
                    </div>
                  </li>
                ))}
                {!activity.length ? <li className="text-sm text-fog">No activity yet.</li> : null}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card>
              <div className="flex items-center gap-3">
                <CheckIcon className="h-5 w-5 text-ice" />
                <h2 className="text-lg font-semibold tracking-tight text-white">Credentials & score</h2>
              </div>
              <div className="mt-5 border border-white/10 bg-ink/60 p-4 font-mono text-[11px] leading-relaxed text-fog">
                <p><span className="text-white">Login ID:</span> {me.uniqueId}</p>
                <p className="mt-1"><span className="text-white">Password:</span> •••••••••• (bcrypt hash stored)</p>
                <p className="mt-1"><span className="text-white">Status:</span> {me.status || "pending"}</p>
                <button
                  type="button"
                  onClick={copyId}
                  className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ice underline decoration-white/20 underline-offset-4"
                >
                  {copied ? "Copied" : "Copy ID"}
                </button>
              </div>
              {typeof me.score === "number" ? (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="field-label">CTF score</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-ice">{me.score}</p>
                </div>
              ) : null}
              <p className="mt-5 text-xs leading-relaxed text-fog/80">
                Lost access? Contact{" "}
                <a
                  href={`mailto:${site.email}?subject=Password%20reset%20${me.uniqueId}`}
                  className="text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current"
                >
                  {site.email}
                </a>
                .
              </p>
            </Card>
          </Reveal>
        </div>

        <Reveal>
          <Card className="mt-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">Remaining submitted details</h2>
            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {detailPairs.map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="field-label">{humanize(key)}</dt>
                  <dd className="mt-1 break-words text-sm text-white">{displayValue(value)}</dd>
                </div>
              ))}
              {!detailPairs.length ? (
                <p className="text-sm text-fog">No additional details were submitted.</p>
              ) : null}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/hackathon-updates.html" className={buttonGhost}>Hackathon updates</a>
              <a href="/hackathon.html" className={buttonGhost}>Hackathon</a>
              <a href={site.ctfUrl} className={buttonPrimary} target="_blank" rel="noreferrer">
                CTF board <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
