-- +goose Up
CREATE TABLE users (
    id          TEXT PRIMARY KEY,
    login       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    position    TEXT NOT NULL DEFAULT '',
    email       TEXT NOT NULL DEFAULT '',
    department  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE namespaces (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE projects (
    id                TEXT PRIMARY KEY,
    namespace_id      TEXT NOT NULL REFERENCES namespaces(id),
    parent_project_id TEXT REFERENCES projects(id),
    name              TEXT NOT NULL,
    display_name      TEXT NOT NULL,
    description       TEXT NOT NULL DEFAULT ''
);

CREATE TABLE services (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id),
    name         TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    config       JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE role_assignments (
    user_id     TEXT NOT NULL REFERENCES users(id),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('namespace','project','service')),
    entity_id   TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('read','edit','responsible')),
    PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE TABLE drafts (
    id            TEXT PRIMARY KEY,
    entity_type   TEXT NOT NULL CHECK (entity_type IN ('namespace','project','service')),
    entity_id     TEXT NOT NULL,
    entity_name   TEXT NOT NULL DEFAULT '',
    config_before JSONB NOT NULL DEFAULT '{}',
    config_after  JSONB NOT NULL DEFAULT '{}',
    author_id     TEXT NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    status        TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','approved','cancelled')),
    approver_ids  TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_drafts_entity ON drafts(entity_type, entity_id);
CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_role_assignments_user ON role_assignments(user_id);

-- +goose Down
DROP TABLE IF EXISTS drafts;
DROP TABLE IF EXISTS role_assignments;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS namespaces;
DROP TABLE IF EXISTS users;
