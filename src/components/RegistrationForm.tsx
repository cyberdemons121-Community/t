import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { site } from "../data/site";
import type { RegistrationConfig, RegistrationField } from "../data/events";
import { CheckIcon, ChevronDownIcon } from "./Icons";
import { buttonGhost, buttonPrimary } from "./styles";

interface RegistrationFormProps {
  eventName: string;
  config: RegistrationConfig;
}

type FormValues = Record<string, string>;
type FileValues = Record<string, File | null>;
type FormErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function initialValues(fields: RegistrationField[]): FormValues {
  return Object.fromEntries(
    fields.filter((f) => f.type !== "file").map((field) => [field.name, ""]),
  );
}

function initialFiles(fields: RegistrationField[]): FileValues {
  return Object.fromEntries(
    fields.filter((f) => f.type === "file").map((field) => [field.name, null]),
  );
}

function validate(
  fields: RegistrationField[],
  values: FormValues,
  files: FileValues,
): FormErrors {
  const errors: FormErrors = {};

  for (const field of fields) {
    if (field.type === "file") {
      const file = files[field.name];
      if (field.required && !file) {
        errors[field.name] = "Please upload the required file.";
      } else if (file && file.size > 8 * 1024 * 1024) {
        errors[field.name] = "File is too large (max 8 MB).";
      }
      continue;
    }

    const value = (values[field.name] ?? "").trim();

    if (field.required && !value) {
      errors[field.name] = "This field is required.";
      continue;
    }

    if (!value) continue;

    if (field.type === "email" && !EMAIL_PATTERN.test(value)) {
      errors[field.name] = "Enter a valid email address.";
      continue;
    }

    if (field.minLength && value.length < field.minLength) {
      errors[field.name] =
        field.type === "textarea"
          ? `Add a little more detail (at least ${field.minLength} characters).`
          : `Use at least ${field.minLength} characters.`;
      continue;
    }

    if (field.maxLength && value.length > field.maxLength) {
      errors[field.name] = `Keep this under ${field.maxLength} characters.`;
    }
  }

  return errors;
}

function generateUniqueId(eventName: string) {
  const prefix = eventName.toLowerCase().includes("hackathon") ? "CDH" : "CDC";
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(2, 8);
  const time = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${time}${rand}`;
}

function buildMailto(
  eventName: string,
  config: RegistrationConfig,
  values: FormValues,
  files: FileValues,
  uniqueId: string,
): string {
  const primary =
    values.teamName?.trim() ||
    values.handle?.trim() ||
    values.captain?.trim() ||
    values.email?.trim() ||
    "registration";

  const subject = `${config.subjectTag} ${eventName} — ${primary} — ${uniqueId}`;
  const body = [
    `${eventName} registration`,
    `Unique ID (pending verification): ${uniqueId}`,
    site.name,
    "",
    ...config.fields.map((field) => {
      if (field.type === "file") {
        const f = files[field.name];
        return `${field.label}: ${f ? `${f.name} (${Math.round(f.size / 1024)} KB)` : "—"} [attach manually if sending by email]`;
      }
      const value = values[field.name]?.trim();
      return `${field.label}: ${value || "—"}`;
    }),
    "",
    `Entry fee: ${site.entryFee} ${site.entryFeeNote}`,
    `Prize pool: ${site.prizePool}`,
    "",
    "Sent from the CyberDemons site. Payment verification required for confirmation and login credentials.",
  ].join("\n");

  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildDiscordContent(
  eventName: string,
  config: RegistrationConfig,
  values: FormValues,
  files: FileValues,
  uniqueId: string,
): string {
  const lines = [
    `**${config.subjectTag} ${eventName}**`,
    `**Unique ID (pending):** ${uniqueId}`,
    `**Entry fee:** ${site.entryFee} ${site.entryFeeNote} | **Prize pool:** ${site.prizePool}`,
    "",
    ...config.fields.map((field) => {
      if (field.type === "file") {
        const f = files[field.name];
        return `**${field.label}:** ${f ? `${f.name} (${Math.round(f.size / 1024)} KB)` : "—"}`;
      }
      const value = values[field.name]?.trim();
      return `**${field.label}:** ${value || "—"}`;
    }),
  ];

  return lines.join("\n").slice(0, 1900);
}

async function postDiscord(
  webhookUrl: string,
  body: BodyInit,
  headers?: HeadersInit,
): Promise<void> {
  const res = await fetch(webhookUrl, { method: "POST", body, headers });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      // ignore
    }
    throw new Error(`Webhook error ${res.status}${detail ? `: ${detail}` : ""}`);
  }
}

async function sendToDiscord(
  webhookUrl: string,
  eventName: string,
  config: RegistrationConfig,
  values: FormValues,
  files: FileValues,
  uniqueId: string,
): Promise<"ok" | "partial"> {
  const content = buildDiscordContent(eventName, config, values, files, uniqueId);

  // Send registration details as a JSON message first (more reliable than multipart from browsers).
  await postDiscord(
    webhookUrl,
    JSON.stringify({
      content,
      username: "CyberDemons Registration",
      allowed_mentions: { parse: [] },
    }),
    { "Content-Type": "application/json" },
  );

  // Upload files as separate messages so details are delivered even if an attachment fails.
  const fileFields = config.fields.filter((f) => f.type === "file");
  const uploads = fileFields
    .map((field) => {
      const file = files[field.name];
      if (!file) return null;
      const form = new FormData();
      form.append(
        "payload_json",
        JSON.stringify({
          content: `**Attachment for ${uniqueId}** — ${field.label}: ${file.name}`,
          username: "CyberDemons Registration",
          allowed_mentions: { parse: [] },
        }),
      );
      form.append("files[0]", file, file.name);
      return postDiscord(webhookUrl, form);
    })
    .filter((p): p is Promise<void> => p !== null);

  if (uploads.length === 0) return "ok";

  const results = await Promise.allSettled(uploads);
  return results.every((r) => r.status === "fulfilled") ? "ok" : "partial";
}

export function RegistrationForm({ eventName, config }: RegistrationFormProps) {
  const rawId = useId();
  const formId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const [values, setValues] = useState<FormValues>(() => initialValues(config.fields));
  const [files, setFiles] = useState<FileValues>(() => initialFiles(config.fields));
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mailto, setMailto] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [webhookStatus, setWebhookStatus] = useState<"none" | "ok" | "partial" | "failed">("none");
  const confirmationRef = useRef<HTMLDivElement>(null);

  const webhookUrl = config.webhookUrl ?? site.discordWebhookUrl;
  const whatsappUrl = config.whatsappUrl ?? site.whatsappUrl;
  const discordInviteUrl = config.discordInviteUrl ?? site.discordInviteUrl;

  useEffect(() => {
    if (sent) confirmationRef.current?.focus();
  }, [sent]);

  const update = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const updateFile = (name: string, file: File | null) => {
    setFiles((current) => ({ ...current, [name]: file }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(config.fields, values, files);
    setErrors(nextErrors);

    const firstInvalid = config.fields.find((field) => nextErrors[field.name]);
    if (firstInvalid) {
      document.getElementById(`${formId}-${firstInvalid.name}`)?.focus();
      return;
    }

    const id = generateUniqueId(eventName);
    setUniqueId(id);
    const mail = buildMailto(eventName, config, values, files, id);
    setMailto(mail);

    setSubmitting(true);
    let status: "none" | "ok" | "partial" | "failed" = "none";
    if (webhookUrl) {
      try {
        status = await sendToDiscord(webhookUrl, eventName, config, values, files, id);
      } catch (error) {
        console.error("Registration webhook submission failed:", error);
        status = "failed";
      }
    }
    setWebhookStatus(status);
    setSubmitting(false);
    setSent(true);
  };

  const edit = () => {
    setSent(false);
    window.requestAnimationFrame(() => {
      document.getElementById(`${formId}-${config.fields[0]?.name ?? ""}`)?.focus();
    });
  };

  const primary =
    values.teamName?.trim() || values.handle?.trim() || values.captain?.trim() || "operator";

  const hasPaymentScreenshot = config.fields.some((f) => f.name === "paymentScreenshot");

  return (
    <div className="group relative border border-white/10 bg-ink-800/60 p-6 transition-colors duration-500 hover:border-white/20 sm:p-8">
      <div className="eyebrow flex items-center gap-3">
        <span className="text-blood-bright">06</span>
        <span aria-hidden="true" className="h-px w-8 bg-white/20" />
        <span className="text-fog/80">Registration</span>
      </div>

      <h2 id={`${formId}-title`} className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
        {config.title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-fog">{config.description}</p>

      {hasPaymentScreenshot ? (
        <div className="mt-6 grid gap-4 border border-ice/20 bg-ice/[0.04] p-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <img
            src={site.paymentQr}
            alt="Payment QR code"
            className="h-32 w-32 border border-white/10 bg-white object-contain p-1 sm:h-36 sm:w-36"
            loading="lazy"
          />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">Payment</p>
            <p className="mt-2 text-sm leading-relaxed text-fog">
              Entry fee: <span className="font-medium text-white">{site.entryFee} {site.entryFeeNote}</span>. Scan the QR to pay, then upload your payment screenshot below.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fog/80">
              Prize pool: <span className="text-white">{site.prizePool}</span> (Hackathon & CTF)
            </p>
          </div>
        </div>
      ) : null}

      {sent ? (
        <div
          ref={confirmationRef}
          role="status"
          aria-live="polite"
          tabIndex={-1}
          className="mt-8 border border-ice/30 bg-ice/[0.05] p-6 motion-safe:animate-scale-in focus:outline-none"
        >
          <span className="flex h-10 w-10 animate-border-pulse items-center justify-center border border-ice/50 text-ice motion-reduce:animate-none">
            <CheckIcon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-xl font-medium text-white">Thank you for registering, {primary}.</h3>
          <p className="mt-2 text-sm leading-relaxed text-fog">
            Your registration for <span className="text-white">{eventName}</span> has been submitted
            {webhookStatus === "ok" || webhookStatus === "partial" ? " to our team" : ""}.
            After payment verification you will receive a <span className="text-white">confirmation mail</span> and a{" "}
            <span className="text-white">unique ID</span> (team/individual) with login credentials.
          </p>

          <div className="mt-4 border border-white/10 bg-ink/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fog/80">Your unique ID (pending verification)</p>
            <p className="mt-1 font-mono text-lg font-medium tracking-[0.08em] text-ice">{uniqueId}</p>
            <p className="mt-2 text-xs leading-relaxed text-fog/80">
              Save this ID for reference. Final confirmation and credentials will be sent after payment verification.
            </p>
          </div>

          {webhookStatus === "partial" ? (
            <p className="mt-4 text-sm leading-relaxed text-blood-bright">
              Your details were sent, but one or more uploaded files could not be auto-attached to Discord from this browser. Please use the email option below to attach your payment screenshot/PPT if needed.
            </p>
          ) : webhookStatus === "failed" ? (
            <p className="mt-4 text-sm leading-relaxed text-blood-bright">
              We couldn’t auto-send your files/details to our verification channel from this browser (this can happen due to browser/network or webhook restrictions). Please use the email option below and attach your uploaded files manually.
            </p>
          ) : webhookStatus === "none" ? (
            <p className="mt-4 text-sm leading-relaxed text-fog">
              Verification submission channel will be finalized soon. Use the email option below to send your details (and attach your payment screenshot/PPT) if needed.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonPrimary}>
                Continue to WhatsApp <span aria-hidden="true">→</span>
              </a>
            ) : null}
            {discordInviteUrl ? (
              <a href={discordInviteUrl} target="_blank" rel="noopener noreferrer" className={whatsappUrl ? buttonGhost : buttonPrimary}>
                Join/see updates on Discord <span aria-hidden="true">→</span>
              </a>
            ) : null}
            <a href={mailto} className={whatsappUrl || discordInviteUrl ? buttonGhost : buttonPrimary}>
              Open mail app <span aria-hidden="true">→</span>
            </a>
            <a href="/login.html" className={buttonGhost}>Login</a>
          </div>

          <ul className="mt-5 space-y-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fog/80">
            {!whatsappUrl || !discordInviteUrl ? (
              <li>• Some WhatsApp/Discord links may be added or updated soon.</li>
            ) : null}
            <li>• After payment verification: confirmation mail + unique ID + login credentials.</li>
            <li>• Login to play the CTF or see hackathon updates (after access is activated).</li>
          </ul>

          <button
            type="button"
            onClick={edit}
            className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-fog underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            Edit registration
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} aria-labelledby={`${formId}-title`} className="mt-8">
          <div className="grid gap-5 sm:grid-cols-2">
            {config.fields.map((field) => {
              const id = `${formId}-${field.name}`;
              const error = errors[field.name];
              const helpId = `${id}-help`;
              const errorId = `${id}-error`;
              const describedBy = error ? errorId : field.help ? helpId : undefined;
              const file = field.type === "file" ? files[field.name] : null;

              return (
                <div key={field.name} className={field.fullWidth ? "sm:col-span-2" : undefined}>
                  <label htmlFor={id} className="field-label">
                    {field.label}{" "}
                    {field.required ? (
                      <span className="text-blood-bright" aria-hidden="true">*</span>
                    ) : (
                      <span className="normal-case tracking-normal text-fog/80">(optional)</span>
                    )}
                  </label>

                  {field.type === "select" ? (
                    <div className="relative">
                      <select
                        id={id}
                        name={field.name}
                        required={field.required}
                        value={values[field.name] ?? ""}
                        onChange={(event) => update(field.name, event.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className={`field appearance-none pr-10 ${error ? "field-error" : ""} ${
                          values[field.name] ? "text-white" : "text-fog/80"
                        }`}
                      >
                        <option value="" disabled className="bg-ink text-fog">Select</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option} className="bg-ink text-white">{option}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog/80" />
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      id={id}
                      name={field.name}
                      rows={4}
                      required={field.required}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      value={values[field.name] ?? ""}
                      onChange={(event) => update(field.name, event.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={describedBy}
                      placeholder={field.placeholder}
                      className={`field resize-y ${error ? "field-error" : ""}`}
                    />
                  ) : field.type === "file" ? (
                    <div>
                      <input
                        id={id}
                        name={field.name}
                        type="file"
                        required={field.required}
                        accept={field.accept}
                        onChange={(event) => updateFile(field.name, event.target.files?.[0] ?? null)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className={`field file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-white hover:file:bg-white/15 ${error ? "field-error" : ""}`}
                      />
                      {file ? (
                        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ice">
                          Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <input
                      id={id}
                      name={field.name}
                      type={field.type}
                      required={field.required}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      autoComplete={field.autoComplete}
                      value={values[field.name] ?? ""}
                      onChange={(event) => update(field.name, event.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={describedBy}
                      placeholder={field.placeholder}
                      className={`field ${error ? "field-error" : ""}`}
                    />
                  )}

                  {error ? (
                    <p id={errorId} className="mt-1.5 font-mono text-[10px] text-blood-bright">
                      {error}
                    </p>
                  ) : field.help ? (
                    <p id={helpId} className="mt-1.5 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-fog/80">
                      {field.help}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <button type="submit" disabled={submitting} className={`${buttonPrimary} mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60`}>
            {submitting ? "Submitting..." : config.submitLabel}
            <span aria-hidden="true">→</span>
          </button>

          <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fog/80">
            <span className="text-blood-bright">*</span> Required. Submit details and uploads for verification. After payment verification you’ll receive a confirmation mail, unique ID, and login credentials.
          </p>
        </form>
      )}
    </div>
  );
}
