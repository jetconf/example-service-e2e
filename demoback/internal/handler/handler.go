package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jussiar/demoback/internal/repository"
)

type Handler struct {
	db *repository.DB
}

func New(db *repository.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/auth/login", h.authLogin)
	mux.HandleFunc("/api/v1/auth/logout", h.authLogout)
	mux.HandleFunc("/api/v1/auth/me", h.authMe)

	mux.HandleFunc("/api/v1/catalog/tree", h.catalogTree)
	mux.HandleFunc("/api/v1/catalog/roles", h.catalogRoles)
	mux.HandleFunc("/api/v1/stats", h.stats)

	// /api/v1/catalog/{type}/{id}  and  /api/v1/catalog/{type}/{id}/config
	mux.HandleFunc("/api/v1/catalog/", h.catalogEntity)

	mux.HandleFunc("/api/v1/drafts", h.listDrafts)
	mux.HandleFunc("/api/v1/drafts/", h.draftAction)
}

// ─── helpers ───────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func readJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func errResp(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// ─── session (cookie-based, trivial) ───────────────────────────────────────

const sessionCookie = "configadmin_session"

func setSession(w http.ResponseWriter, userID string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    userID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func getSession(r *http.Request) string {
	c, err := r.Cookie(sessionCookie)
	if err != nil {
		return ""
	}
	return c.Value
}

func clearSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:    sessionCookie,
		Value:   "",
		Path:    "/",
		MaxAge:  -1,
		Expires: time.Unix(0, 0),
	})
}

// ─── role helpers ──────────────────────────────────────────────────────────

var roleRank = map[string]int{"read": 1, "edit": 2, "responsible": 3}

func maxRole(a, b string) string {
	if roleRank[b] > roleRank[a] {
		return b
	}
	return a
}

// effectiveRole computes the user's best role on the given entity, applying
// transitive inheritance: namespace → project → service (downward only).
func effectiveRole(roles []repository.RoleAssignment, projects []repository.Project,
	entityType, entityID string, userID string) string {

	best := ""
	for _, r := range roles {
		if r.UserID != userID {
			continue
		}
		if r.EntityType == entityType && r.EntityID == entityID {
			best = maxRole(best, r.Role)
			continue
		}
		// propagate downward from namespace/project to children
		switch entityType {
		case "project":
			if r.EntityType == "namespace" {
				// find if the project belongs to this namespace
				for _, p := range projects {
					if p.ID == entityID && p.NamespaceID == r.EntityID {
						best = maxRole(best, r.Role)
					}
				}
			}
		case "service":
			// direct role on the project that owns this service is handled via catalog tree data
		}
	}
	return best
}

// ─── Auth handlers ─────────────────────────────────────────────────────────

func (h *Handler) authLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errResp(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var body struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	if err := readJSON(r, &body); err != nil {
		errResp(w, http.StatusBadRequest, "invalid json")
		return
	}
	u, err := h.db.GetUserByLogin(r.Context(), body.Login)
	if err != nil || u.Password != body.Password {
		writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": "invalid credentials"})
		return
	}
	setSession(w, u.ID)
	u.Password = ""
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "user": u})
}

func (h *Handler) authLogout(w http.ResponseWriter, r *http.Request) {
	clearSession(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) authMe(w http.ResponseWriter, r *http.Request) {
	uid := getSession(r)
	if uid == "" {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	u, err := h.db.GetUserByID(r.Context(), uid)
	if err != nil {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	u.Password = ""
	writeJSON(w, http.StatusOK, u)
}

// ─── Catalog tree ──────────────────────────────────────────────────────────

func (h *Handler) catalogTree(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	ctx := r.Context()

	namespaces, err := h.db.ListNamespaces(ctx)
	if err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}
	projects, err := h.db.ListProjects(ctx)
	if err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}
	services, err := h.db.ListServices(ctx)
	if err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}
	roles, err := h.db.ListRoles(ctx)
	if err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}
	drafts, err := h.db.ListDrafts(ctx)
	if err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}

	tree := buildTree(userID, namespaces, projects, services, roles, drafts)
	writeJSON(w, http.StatusOK, tree)
}

type CatalogNode struct {
	Type          string        `json:"type"`
	ID            string        `json:"id"`
	Name          string        `json:"name"`
	DisplayName   string        `json:"displayName"`
	Description   string        `json:"description"`
	EffectiveRole *string       `json:"effectiveRole"`
	ActiveDraftID *string       `json:"activeDraftId,omitempty"`
	Children      []CatalogNode `json:"children,omitempty"`
	Config        any           `json:"config,omitempty"`
}

func buildTree(userID string, namespaces []repository.Namespace, projects []repository.Project,
	services []repository.Service, roles []repository.RoleAssignment, drafts []repository.Draft) []CatalogNode {

	// index active drafts by entity
	activeDraft := map[string]string{} // "type:id" → draftID
	for _, d := range drafts {
		if d.Status == "created" {
			activeDraft[d.EntityType+":"+d.EntityID] = d.ID
		}
	}

	// index projects/services
	projByNS := map[string][]repository.Project{}
	projByParent := map[string][]repository.Project{}
	for _, p := range projects {
		projByNS[p.NamespaceID] = append(projByNS[p.NamespaceID], p)
		if p.ParentProjectID != nil {
			projByParent[*p.ParentProjectID] = append(projByParent[*p.ParentProjectID], p)
		}
	}
	svcByProj := map[string][]repository.Service{}
	for _, s := range services {
		svcByProj[s.ProjectID] = append(svcByProj[s.ProjectID], s)
	}

	// role helper
	roleFor := func(entityType, entityID string) *string {
		r := computeEffectiveRole(userID, entityType, entityID, roles, projects, services)
		if r == "" {
			return nil
		}
		return &r
	}

	var buildProject func(p repository.Project) CatalogNode
	buildProject = func(p repository.Project) CatalogNode {
		node := CatalogNode{
			Type:          "project",
			ID:            p.ID,
			Name:          p.Name,
			DisplayName:   p.DisplayName,
			Description:   p.Description,
			EffectiveRole: roleFor("project", p.ID),
		}
		if id, ok := activeDraft["project:"+p.ID]; ok {
			node.ActiveDraftID = &id
		}
		for _, child := range projByParent[p.ID] {
			node.Children = append(node.Children, buildProject(child))
		}
		for _, s := range svcByProj[p.ID] {
			sn := CatalogNode{
				Type:          "service",
				ID:            s.ID,
				Name:          s.Name,
				DisplayName:   s.DisplayName,
				Description:   s.Description,
				EffectiveRole: roleFor("service", s.ID),
				Config:        s.Config,
			}
			if id, ok := activeDraft["service:"+s.ID]; ok {
				sn.ActiveDraftID = &id
			}
			node.Children = append(node.Children, sn)
		}
		return node
	}

	var tree []CatalogNode
	for _, ns := range namespaces {
		nsNode := CatalogNode{
			Type:          "namespace",
			ID:            ns.ID,
			Name:          ns.Name,
			DisplayName:   ns.DisplayName,
			Description:   ns.Description,
			EffectiveRole: roleFor("namespace", ns.ID),
		}
		if id, ok := activeDraft["namespace:"+ns.ID]; ok {
			nsNode.ActiveDraftID = &id
		}
		topProjects := []repository.Project{}
		for _, p := range projByNS[ns.ID] {
			if p.ParentProjectID == nil {
				topProjects = append(topProjects, p)
			}
		}
		for _, p := range topProjects {
			nsNode.Children = append(nsNode.Children, buildProject(p))
		}
		tree = append(tree, nsNode)
	}
	return tree
}

// computeEffectiveRole applies transitive inheritance (namespace → project → service).
func computeEffectiveRole(userID, entityType, entityID string,
	roles []repository.RoleAssignment, projects []repository.Project, services []repository.Service) string {

	best := ""
	for _, r := range roles {
		if r.UserID != userID {
			continue
		}
		switch {
		case r.EntityType == entityType && r.EntityID == entityID:
			best = maxRole(best, r.Role)
		case entityType == "project" && r.EntityType == "namespace":
			for _, p := range projects {
				if p.ID == entityID && p.NamespaceID == r.EntityID {
					best = maxRole(best, r.Role)
				}
			}
		case entityType == "service" && r.EntityType == "namespace":
			for _, s := range services {
				if s.ID == entityID {
					for _, p := range projects {
						if p.ID == s.ProjectID && p.NamespaceID == r.EntityID {
							best = maxRole(best, r.Role)
						}
					}
				}
			}
		case entityType == "service" && r.EntityType == "project":
			for _, s := range services {
				if s.ID == entityID && s.ProjectID == r.EntityID {
					best = maxRole(best, r.Role)
				}
			}
		}
	}
	return best
}

// ─── Entity detail ─────────────────────────────────────────────────────────

func (h *Handler) catalogEntity(w http.ResponseWriter, r *http.Request) {
	// path: /api/v1/catalog/{type}/{id}  or  /api/v1/catalog/{type}/{id}/config
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/catalog/"), "/")
	if len(parts) < 2 {
		errResp(w, http.StatusNotFound, "not found")
		return
	}
	entityType := parts[0]
	entityID := parts[1]
	isConfig := len(parts) >= 3 && parts[2] == "config"

	if isConfig && r.Method == http.MethodPost {
		h.saveConfig(w, r, entityType, entityID)
		return
	}
	if r.Method != http.MethodGet {
		errResp(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := r.URL.Query().Get("userId")
	ctx := r.Context()

	roles, _ := h.db.ListRoles(ctx)
	projects, _ := h.db.ListProjects(ctx)
	services, _ := h.db.ListServices(ctx)
	users, _ := h.db.ListUsers(ctx)

	type EntityDetail struct {
		Type             string                 `json:"type"`
		ID               string                 `json:"id"`
		Name             string                 `json:"name"`
		DisplayName      string                 `json:"displayName"`
		Description      string                 `json:"description"`
		EffectiveRole    *string                `json:"effectiveRole"`
		ResponsibleUsers []repository.User      `json:"responsibleUsers"`
		ActiveDraft      *repository.Draft      `json:"activeDraft,omitempty"`
		Config           map[string]interface{} `json:"config,omitempty"`
	}

	roleStr := computeEffectiveRole(userID, entityType, entityID, roles, projects, services)
	var effectiveRole *string
	if roleStr != "" {
		effectiveRole = &roleStr
	}

	// collect responsible users for this entity
	responsible := responsibleUsers(entityType, entityID, roles, users, projects, services)

	activeDraft, _ := h.db.GetActiveDraftForEntity(ctx, entityType, entityID)

	detail := EntityDetail{
		Type:             entityType,
		ID:               entityID,
		EffectiveRole:    effectiveRole,
		ResponsibleUsers: responsible,
		ActiveDraft:      activeDraft,
	}

	switch entityType {
	case "namespace":
		ns, err := h.db.GetNamespace(ctx, entityID)
		if err != nil {
			errResp(w, http.StatusNotFound, "namespace not found")
			return
		}
		detail.Name = ns.Name
		detail.DisplayName = ns.DisplayName
		detail.Description = ns.Description
	case "project":
		p, err := h.db.GetProject(ctx, entityID)
		if err != nil {
			errResp(w, http.StatusNotFound, "project not found")
			return
		}
		detail.Name = p.Name
		detail.DisplayName = p.DisplayName
		detail.Description = p.Description
	case "service":
		s, err := h.db.GetService(ctx, entityID)
		if err != nil {
			errResp(w, http.StatusNotFound, "service not found")
			return
		}
		detail.Name = s.Name
		detail.DisplayName = s.DisplayName
		detail.Description = s.Description
		detail.Config = s.Config
	default:
		errResp(w, http.StatusBadRequest, "unknown entity type")
		return
	}

	writeJSON(w, http.StatusOK, detail)
}

func responsibleUsers(entityType, entityID string, roles []repository.RoleAssignment,
	users []repository.User, projects []repository.Project, services []repository.Service) []repository.User {

	seen := map[string]bool{}
	var out []repository.User
	for _, r := range roles {
		if r.Role != "responsible" {
			continue
		}
		matches := false
		switch {
		case r.EntityType == entityType && r.EntityID == entityID:
			matches = true
		case entityType == "project" && r.EntityType == "namespace":
			for _, p := range projects {
				if p.ID == entityID && p.NamespaceID == r.EntityID {
					matches = true
				}
			}
		case entityType == "service" && r.EntityType == "namespace":
			for _, s := range services {
				if s.ID == entityID {
					for _, p := range projects {
						if p.ID == s.ProjectID && p.NamespaceID == r.EntityID {
							matches = true
						}
					}
				}
			}
		case entityType == "service" && r.EntityType == "project":
			for _, s := range services {
				if s.ID == entityID && s.ProjectID == r.EntityID {
					matches = true
				}
			}
		}
		if matches && !seen[r.UserID] {
			seen[r.UserID] = true
			for _, u := range users {
				if u.ID == r.UserID {
					u.Password = ""
					out = append(out, u)
				}
			}
		}
	}
	return out
}

// ─── Save config (create draft) ────────────────────────────────────────────

func (h *Handler) saveConfig(w http.ResponseWriter, r *http.Request, entityType, entityID string) {
	var body struct {
		UserID string                 `json:"userId"`
		Config map[string]interface{} `json:"config"`
	}
	if err := readJSON(r, &body); err != nil {
		errResp(w, http.StatusBadRequest, "invalid json")
		return
	}

	ctx := r.Context()

	// check no existing active draft
	existing, err := h.db.GetActiveDraftForEntity(ctx, entityType, entityID)
	if err == nil && existing != nil {
		writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": "active draft already exists"})
		return
	}

	// get entity name and current config
	entityName := entityID
	var configBefore map[string]interface{}
	switch entityType {
	case "namespace":
		ns, err := h.db.GetNamespace(ctx, entityID)
		if err != nil {
			errResp(w, http.StatusNotFound, "namespace not found")
			return
		}
		entityName = ns.DisplayName
	case "project":
		p, err := h.db.GetProject(ctx, entityID)
		if err != nil {
			errResp(w, http.StatusNotFound, "project not found")
			return
		}
		entityName = p.DisplayName
	case "service":
		s, err := h.db.GetService(ctx, entityID)
		if err != nil {
			errResp(w, http.StatusNotFound, "service not found")
			return
		}
		entityName = s.DisplayName
		configBefore = s.Config
	}

	if configBefore == nil {
		configBefore = map[string]interface{}{}
	}

	roles, _ := h.db.ListRoles(ctx)
	// collect approvers = responsible users on this entity (excluding author)
	projects, _ := h.db.ListProjects(ctx)
	services, _ := h.db.ListServices(ctx)
	users, _ := h.db.ListUsers(ctx)
	respUsers := responsibleUsers(entityType, entityID, roles, users, projects, services)
	approverIDs := []string{}
	for _, u := range respUsers {
		if u.ID != body.UserID {
			approverIDs = append(approverIDs, u.ID)
		}
	}

	draftID := fmt.Sprintf("draft-%d", time.Now().UnixNano())
	draft := repository.Draft{
		ID:           draftID,
		EntityType:   entityType,
		EntityID:     entityID,
		EntityName:   entityName,
		ConfigBefore: configBefore,
		ConfigAfter:  body.Config,
		AuthorID:     body.UserID,
		CreatedAt:    time.Now(),
		Status:       "created",
		ApproverIDs:  approverIDs,
	}
	if err := h.db.CreateDraft(ctx, draft); err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "draftId": draftID})
}

// ─── Roles ─────────────────────────────────────────────────────────────────

func (h *Handler) catalogRoles(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	ctx := r.Context()

	roles, err := h.db.ListRoles(ctx)
	if err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}

	type RoleEntry struct {
		EntityType  string `json:"entityType"`
		EntityID    string `json:"entityId"`
		EntityName  string `json:"entityName"`
		Role        string `json:"role"`
	}

	namespaces, _ := h.db.ListNamespaces(ctx)
	projects, _ := h.db.ListProjects(ctx)
	services, _ := h.db.ListServices(ctx)

	nameFor := func(t, id string) string {
		switch t {
		case "namespace":
			for _, n := range namespaces {
				if n.ID == id {
					return n.DisplayName
				}
			}
		case "project":
			for _, p := range projects {
				if p.ID == id {
					return p.DisplayName
				}
			}
		case "service":
			for _, s := range services {
				if s.ID == id {
					return s.DisplayName
				}
			}
		}
		return id
	}

	var out []RoleEntry
	for _, r := range roles {
		if r.UserID != userID {
			continue
		}
		out = append(out, RoleEntry{
			EntityType: r.EntityType,
			EntityID:   r.EntityID,
			EntityName: nameFor(r.EntityType, r.EntityID),
			Role:       r.Role,
		})
	}
	writeJSON(w, http.StatusOK, out)
}

// ─── Stats ─────────────────────────────────────────────────────────────────

func (h *Handler) stats(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	ns, svc, drafts, err := h.db.CountStats(r.Context(), userID)
	if err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{
		"namespaces":   ns,
		"services":     svc,
		"activeDrafts": drafts,
	})
}

// ─── Drafts ────────────────────────────────────────────────────────────────

func (h *Handler) listDrafts(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	ctx := r.Context()

	drafts, err := h.db.ListDrafts(ctx)
	if err != nil {
		errResp(w, http.StatusInternalServerError, err.Error())
		return
	}
	roles, _ := h.db.ListRoles(ctx)
	projects, _ := h.db.ListProjects(ctx)
	services, _ := h.db.ListServices(ctx)

	var out []repository.Draft
	for _, d := range drafts {
		if d.AuthorID == userID {
			out = append(out, d)
			continue
		}
		r := computeEffectiveRole(userID, d.EntityType, d.EntityID, roles, projects, services)
		if r != "" {
			out = append(out, d)
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handler) draftAction(w http.ResponseWriter, r *http.Request) {
	// /api/v1/drafts/{id}/approve  or  /api/v1/drafts/{id}/cancel
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/drafts/"), "/")
	if len(parts) < 2 {
		errResp(w, http.StatusNotFound, "not found")
		return
	}
	draftID := parts[0]
	action := parts[1]
	if r.Method != http.MethodPost {
		errResp(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		UserID string `json:"userId"`
	}
	if err := readJSON(r, &body); err != nil {
		errResp(w, http.StatusBadRequest, "invalid json")
		return
	}

	ctx := r.Context()
	draft, err := h.db.GetDraft(ctx, draftID)
	if err != nil {
		if err == pgx.ErrNoRows {
			errResp(w, http.StatusNotFound, "draft not found")
		} else {
			errResp(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	if draft.Status != "created" {
		writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": "draft is not in created status"})
		return
	}

	switch action {
	case "approve":
		// self-approval: author must wait 15 min
		if draft.AuthorID == body.UserID && time.Since(draft.CreatedAt) < 15*time.Minute {
			writeJSON(w, http.StatusOK, map[string]any{"ok": false, "error": "must wait 15 minutes before self-approval"})
			return
		}
		if err := h.db.UpdateDraftStatus(ctx, draftID, "approved"); err != nil {
			errResp(w, http.StatusInternalServerError, err.Error())
			return
		}
		// apply config to service
		if draft.EntityType == "service" {
			if err := h.db.UpdateServiceConfig(ctx, draft.EntityID, draft.ConfigAfter); err != nil {
				errResp(w, http.StatusInternalServerError, err.Error())
				return
			}
		}
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
	case "cancel":
		if err := h.db.UpdateDraftStatus(ctx, draftID, "cancelled"); err != nil {
			errResp(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
	default:
		errResp(w, http.StatusNotFound, "unknown action")
	}
}
