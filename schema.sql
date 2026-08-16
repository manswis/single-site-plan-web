-- ============================================================================
-- e-Plan Studio: Cloudflare D1 Database Schema
-- Table: tickets (Support requests, bug reports, and timeline tracking)
-- Table: auth_failures (Brute-force lockout prevention for admin console)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,                       -- e.g. REQ-BCE5-T923
    type TEXT NOT NULL,                        -- 'bug' | 'feature' | 'error' | 'suggestion'
    priority TEXT NOT NULL DEFAULT 'medium',   -- 'low' | 'medium' | 'high'
    status TEXT NOT NULL DEFAULT 'open',       -- 'open' | 'in_review' | 'in_progress' | 'resolved' | 'closed'
    name TEXT DEFAULT '',                      -- Optional requester name
    email TEXT NOT NULL,                       -- Contact email for updates
    subject TEXT NOT NULL,                     -- Summary headline
    message TEXT NOT NULL,                     -- Detailed user description
    public_response TEXT DEFAULT '',           -- Official admin/dev response (supports plain text or JSON array)
    internal_notes TEXT DEFAULT '',            -- Private developer triage notes
    ip_hash TEXT NOT NULL,                     -- Daily salted SHA-256 hash (Zero PII retention)
    client_info TEXT DEFAULT '{}',             -- Client diagnostic context (OS, browser, resolution)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for queries and rate limiting
CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_ip_hash_created ON tickets(ip_hash, created_at DESC);

-- Table: auth_failures (Rate limiting for admin passkey attempts)
CREATE TABLE IF NOT EXISTS auth_failures (
    ip_hash TEXT NOT NULL,
    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_failures_ip_time ON auth_failures(ip_hash, attempt_time DESC);
