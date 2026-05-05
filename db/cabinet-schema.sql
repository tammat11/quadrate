CREATE TABLE IF NOT EXISTS cabinet_accounts (
    phone TEXT NOT NULL,
    list_element_id TEXT NOT NULL,
    list_element_name TEXT NOT NULL DEFAULT '',
    partner_bitrix_id TEXT NOT NULL DEFAULT '',
    employee_id TEXT NOT NULL DEFAULT '',
    employee_name TEXT NOT NULL DEFAULT '',
    phone_masked TEXT NOT NULL DEFAULT '',
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (phone, list_element_id)
);

CREATE TABLE IF NOT EXISTS cabinet_auth_codes (
    phone TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cabinet_sessions (
    token TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    accounts_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cabinet_sync_runs (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    accounts_count INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cabinet_accounts_phone_idx
    ON cabinet_accounts (phone);

CREATE INDEX IF NOT EXISTS cabinet_auth_codes_expires_at_idx
    ON cabinet_auth_codes (expires_at);

CREATE INDEX IF NOT EXISTS cabinet_sessions_phone_idx
    ON cabinet_sessions (phone);

CREATE INDEX IF NOT EXISTS cabinet_sessions_expires_at_idx
    ON cabinet_sessions (expires_at);

CREATE TABLE IF NOT EXISTS bootstrap_snapshots (
    snapshot_key TEXT PRIMARY KEY,
    payload_json JSONB NOT NULL,
    source TEXT NOT NULL DEFAULT 'dashboard-bootstrap',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bootstrap_sync_runs (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    counts_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
