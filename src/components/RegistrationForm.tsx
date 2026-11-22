import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { site } from "../data/site";
import type { RegistrationConfig, RegistrationField } from "../data/events";
import { CheckIcon, ChevronDownIcon } from "./Icons";
import { buttonGhost, buttonPrimary } from "./styles";

interface RegistrationFormProps {
  eventName: string;
  eventId: string;
  config: RegistrationConfig;
  entryFeeLabel: string;
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

export function RegistrationForm({
  eventName,
  eventId,
  config,
  entryFeeLabel,
}: RegistrationFormProps) {
  const rawId = useId();
  const formId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const [values, setValues] = useState<FormValues>(() => initialValues(config.fields));
  const [files, setFiles] = useState<FileValues>(() => initialFiles(config.fields));
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const confirmationRef = useRef<HTMLDivElement>(null);

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

    setSubmitting(true);
    setSubmitError("");

    const body = new FormData();
    body.append("eventName", eventName);
    body.append("eventId", eventId);
    Object.entries(values).forEach(([name, value]) => body.append(name, value));
    Object.entries(files).forEach(([name, file]) => {
      if (file) body.append(name, file, file.name);
    });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        uniqueId?: string;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Registration could not be submitted.");
      }
      setUniqueId(data.uniqueId ?? "");
      setSent(true);
    } catch (error) {
      setSubmitError(
        error instanceof DOMException && error.name === "AbortError"
          ? "The server took too long to respond (2 minutes). Please try again."
          : error instanceof Error
            ? error.message
            : "Registration could not be submitted.",
      );
    } finally {
      window.clearTimeout(timeout);
      setSubmitting(false);
    }
  };

  const edit = () => {
    setSent(false);
    setSubmitError("");
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
              Entry fee: <span className="font-medium text-white">{entryFeeLabel}</span>. Scan the QR to pay, then upload your payment screenshot below.
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
            Your <span className="text-white">{eventName}</span> details and uploads have been sent for
            verification. Once approved, we’ll email your <span className="text-white">unique ID</span>{" "}
            and <span className="text-white">password</span> for login.
          </p>

          <div className="mt-4 border border-white/10 bg-ink/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fog/80">Your unique ID (pending verification)</p>
            <p className="mt-1 font-mono text-lg font-medium tracking-[0.08em] text-ice">{uniqueId}</p>
            <p className="mt-2 text-xs leading-relaxed text-fog/80">
              Save this ID for reference. Your login password is sent only after verification.
            </p>
          </div>

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
            <a href="/login.html" className={buttonGhost}>Login</a>
          </div>

          <ul className="mt-5 space-y-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fog/80">
            <li>• Details saved to the registration sheet.</li>
            <li>• Verification mail sent to the team with your uploads.</li>
            <li>• After approval: confirmation mail with unique ID + password.</li>
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

          {submitError ? (
            <p role="alert" className="mt-5 border border-blood/40 bg-blood/5 p-3 text-sm text-blood-bright">
              {submitError}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className={`${buttonPrimary} mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60`}>
            {submitting ? "Submitting..." : config.submitLabel}
            <span aria-hidden="true">→</span>
          </button>

          <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fog/80">
            <span className="text-blood-bright">*</span> Required. Submit details and uploads for verification. After approval you’ll receive a confirmation mail with your unique ID and login password.
          </p>
        </form>
      )}
    </div>
  );
}
