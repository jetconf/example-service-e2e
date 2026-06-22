package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context, dsn string) (*DB, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.New: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}
	return &DB{pool: pool}, nil
}

func (d *DB) Close() {
	d.pool.Close()
}

// ─── Auth ──────────────────────────────────────────────────────────────────

func (d *DB) GetUserByLogin(ctx context.Context, login string) (*User, error) {
	row := d.pool.QueryRow(ctx,
		`SELECT id, login, password, first_name, last_name, position, email, department
		   FROM users WHERE login = $1`, login)
	var u User
	if err := row.Scan(&u.ID, &u.Login, &u.Password, &u.FirstName, &u.LastName, &u.Position, &u.Email, &u.Department); err != nil {
		return nil, err
	}
	return &u, nil
}

func (d *DB) GetUserByID(ctx context.Context, id string) (*User, error) {
	row := d.pool.QueryRow(ctx,
		`SELECT id, login, password, first_name, last_name, position, email, department
		   FROM users WHERE id = $1`, id)
	var u User
	if err := row.Scan(&u.ID, &u.Login, &u.Password, &u.FirstName, &u.LastName, &u.Position, &u.Email, &u.Department); err != nil {
		return nil, err
	}
	return &u, nil
}

// ─── Catalog ───────────────────────────────────────────────────────────────

func (d *DB) ListNamespaces(ctx context.Context) ([]Namespace, error) {
	rows, err := d.pool.Query(ctx, `SELECT id, name, display_name, description FROM namespaces ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Namespace
	for rows.Next() {
		var n Namespace
		if err := rows.Scan(&n.ID, &n.Name, &n.DisplayName, &n.Description); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

func (d *DB) GetNamespace(ctx context.Context, id string) (*Namespace, error) {
	row := d.pool.QueryRow(ctx, `SELECT id, name, display_name, description FROM namespaces WHERE id = $1`, id)
	var n Namespace
	if err := row.Scan(&n.ID, &n.Name, &n.DisplayName, &n.Description); err != nil {
		return nil, err
	}
	return &n, nil
}

func (d *DB) ListProjects(ctx context.Context) ([]Project, error) {
	rows, err := d.pool.Query(ctx, `SELECT id, namespace_id, parent_project_id, name, display_name, description FROM projects ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.NamespaceID, &p.ParentProjectID, &p.Name, &p.DisplayName, &p.Description); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (d *DB) GetProject(ctx context.Context, id string) (*Project, error) {
	row := d.pool.QueryRow(ctx, `SELECT id, namespace_id, parent_project_id, name, display_name, description FROM projects WHERE id = $1`, id)
	var p Project
	if err := row.Scan(&p.ID, &p.NamespaceID, &p.ParentProjectID, &p.Name, &p.DisplayName, &p.Description); err != nil {
		return nil, err
	}
	return &p, nil
}

func (d *DB) ListServices(ctx context.Context) ([]Service, error) {
	rows, err := d.pool.Query(ctx, `SELECT id, project_id, name, display_name, description, config FROM services ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Service
	for rows.Next() {
		var s Service
		var cfgRaw []byte
		if err := rows.Scan(&s.ID, &s.ProjectID, &s.Name, &s.DisplayName, &s.Description, &cfgRaw); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(cfgRaw, &s.Config); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (d *DB) GetService(ctx context.Context, id string) (*Service, error) {
	row := d.pool.QueryRow(ctx, `SELECT id, project_id, name, display_name, description, config FROM services WHERE id = $1`, id)
	var s Service
	var cfgRaw []byte
	if err := row.Scan(&s.ID, &s.ProjectID, &s.Name, &s.DisplayName, &s.Description, &cfgRaw); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(cfgRaw, &s.Config); err != nil {
		return nil, err
	}
	return &s, nil
}

func (d *DB) UpdateServiceConfig(ctx context.Context, id string, cfg map[string]interface{}) error {
	raw, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	_, err = d.pool.Exec(ctx, `UPDATE services SET config = $1 WHERE id = $2`, raw, id)
	return err
}

// ─── Roles ─────────────────────────────────────────────────────────────────

func (d *DB) ListRoles(ctx context.Context) ([]RoleAssignment, error) {
	rows, err := d.pool.Query(ctx, `SELECT user_id, entity_type, entity_id, role FROM role_assignments`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []RoleAssignment
	for rows.Next() {
		var r RoleAssignment
		if err := rows.Scan(&r.UserID, &r.EntityType, &r.EntityID, &r.Role); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (d *DB) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := d.pool.Query(ctx, `SELECT id, login, password, first_name, last_name, position, email, department FROM users ORDER BY login`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Login, &u.Password, &u.FirstName, &u.LastName, &u.Position, &u.Email, &u.Department); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

// ─── Drafts ────────────────────────────────────────────────────────────────

func (d *DB) ListDrafts(ctx context.Context) ([]Draft, error) {
	rows, err := d.pool.Query(ctx,
		`SELECT id, entity_type, entity_id, entity_name, config_before, config_after,
		        author_id, created_at, status, approver_ids
		   FROM drafts ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanDrafts(rows)
}

func (d *DB) GetDraft(ctx context.Context, id string) (*Draft, error) {
	row := d.pool.QueryRow(ctx,
		`SELECT id, entity_type, entity_id, entity_name, config_before, config_after,
		        author_id, created_at, status, approver_ids
		   FROM drafts WHERE id = $1`, id)
	var dr Draft
	var before, after []byte
	var approverIDs []string
	if err := row.Scan(&dr.ID, &dr.EntityType, &dr.EntityID, &dr.EntityName,
		&before, &after, &dr.AuthorID, &dr.CreatedAt, &dr.Status, &approverIDs); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(before, &dr.ConfigBefore); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(after, &dr.ConfigAfter); err != nil {
		return nil, err
	}
	dr.ApproverIDs = approverIDs
	return &dr, nil
}

func (d *DB) CreateDraft(ctx context.Context, dr Draft) error {
	before, err := json.Marshal(dr.ConfigBefore)
	if err != nil {
		return err
	}
	after, err := json.Marshal(dr.ConfigAfter)
	if err != nil {
		return err
	}
	_, err = d.pool.Exec(ctx,
		`INSERT INTO drafts (id, entity_type, entity_id, entity_name, config_before, config_after,
		                     author_id, created_at, status, approver_ids)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		dr.ID, dr.EntityType, dr.EntityID, dr.EntityName, before, after,
		dr.AuthorID, dr.CreatedAt, dr.Status, dr.ApproverIDs)
	return err
}

func (d *DB) UpdateDraftStatus(ctx context.Context, id, status string) error {
	_, err := d.pool.Exec(ctx, `UPDATE drafts SET status = $1 WHERE id = $2`, status, id)
	return err
}

func (d *DB) GetActiveDraftForEntity(ctx context.Context, entityType, entityID string) (*Draft, error) {
	row := d.pool.QueryRow(ctx,
		`SELECT id, entity_type, entity_id, entity_name, config_before, config_after,
		        author_id, created_at, status, approver_ids
		   FROM drafts
		  WHERE entity_type = $1 AND entity_id = $2 AND status = 'created'
		  LIMIT 1`, entityType, entityID)
	var dr Draft
	var before, after []byte
	var approverIDs []string
	if err := row.Scan(&dr.ID, &dr.EntityType, &dr.EntityID, &dr.EntityName,
		&before, &after, &dr.AuthorID, &dr.CreatedAt, &dr.Status, &approverIDs); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(before, &dr.ConfigBefore); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(after, &dr.ConfigAfter); err != nil {
		return nil, err
	}
	dr.ApproverIDs = approverIDs
	return &dr, nil
}

func (d *DB) CountStats(ctx context.Context, userID string) (namespaces, services int, activeDrafts int, err error) {
	err = d.pool.QueryRow(ctx, `SELECT COUNT(*) FROM namespaces`).Scan(&namespaces)
	if err != nil {
		return
	}
	err = d.pool.QueryRow(ctx, `SELECT COUNT(*) FROM services`).Scan(&services)
	if err != nil {
		return
	}
	// active drafts = created drafts where the user is author OR has any role on the entity
	err = d.pool.QueryRow(ctx, `
		SELECT COUNT(DISTINCT d.id)
		  FROM drafts d
		 WHERE d.status = 'created'
		   AND (
		     d.author_id = $1
		     OR EXISTS (
		       SELECT 1 FROM role_assignments r
		        WHERE r.user_id = $1
		          AND r.entity_type = d.entity_type
		          AND r.entity_id   = d.entity_id
		     )
		   )`, userID).Scan(&activeDrafts)
	return
}

// ─── helpers ───────────────────────────────────────────────────────────────

type pgRows interface {
	Next() bool
	Scan(...interface{}) error
	Err() error
}

func scanDrafts(rows pgRows) ([]Draft, error) {
	var out []Draft
	for rows.Next() {
		var dr Draft
		var before, after []byte
		var approverIDs []string
		var createdAt time.Time
		if err := rows.Scan(&dr.ID, &dr.EntityType, &dr.EntityID, &dr.EntityName,
			&before, &after, &dr.AuthorID, &createdAt, &dr.Status, &approverIDs); err != nil {
			return nil, err
		}
		dr.CreatedAt = createdAt
		if err := json.Unmarshal(before, &dr.ConfigBefore); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(after, &dr.ConfigAfter); err != nil {
			return nil, err
		}
		dr.ApproverIDs = approverIDs
		out = append(out, dr)
	}
	return out, rows.Err()
}
