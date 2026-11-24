CREATE TABLE IF NOT EXISTS registrations (
  unique_id      TEXT PRIMARY KEY,
  event          TEXT NOT NULL,
  event_name     TEXT NOT NULL DEFAULT '',
  email          TEXT NOT NULL,
  team_name      TEXT NOT NULL DEFAULT '',
  captain_name   TEXT NOT NULL DEFAULT '',
  team_size      TEXT NOT NULL DEFAULT '',
  phone          TEXT NOT NULL DEFAULT '',
  name           TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'pending',
  details        JSONB NOT NULL DEFAULT '{}'::jsonb,
  password_hash  TEXT NOT NULL DEFAULT '',
  token_hash     TEXT NOT NULL DEFAULT '',
  verified_at    TIMESTAMPTZ,
  uploads        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked        BOOLEAN NOT NULL DEFAULT false,
  notified_at    TIMESTAMPTZ
);

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS registrations_email_idx ON registrations (lower(email));
CREATE INDEX IF NOT EXISTS registrations_token_idx ON registrations (token_hash);
CREATE INDEX IF NOT EXISTS registrations_notifications_idx ON registrations (status, notified_at);

CREATE TABLE IF NOT EXISTS scores (
  unique_id  TEXT PRIMARY KEY,
  team       TEXT NOT NULL,
  points     NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Logout revocations are persisted so a copied cookie cannot be reused after
-- logout, even if the server restarts.
CREATE TABLE IF NOT EXISTS revoked_sessions (
  jti         TEXT PRIMARY KEY,
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
