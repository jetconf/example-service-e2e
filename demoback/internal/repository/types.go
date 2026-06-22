package repository

import "time"

type User struct {
	ID         string `json:"id"`
	Login      string `json:"login"`
	Password   string `json:"password"`
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	Position   string `json:"position"`
	Email      string `json:"email"`
	Department string `json:"department"`
}

type Namespace struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Description string `json:"description"`
}

type Project struct {
	ID              string  `json:"id"`
	NamespaceID     string  `json:"namespaceId"`
	ParentProjectID *string `json:"parentProjectId,omitempty"`
	Name            string  `json:"name"`
	DisplayName     string  `json:"displayName"`
	Description     string  `json:"description"`
}

type Service struct {
	ID          string                 `json:"id"`
	ProjectID   string                 `json:"projectId"`
	Name        string                 `json:"name"`
	DisplayName string                 `json:"displayName"`
	Description string                 `json:"description"`
	Config      map[string]interface{} `json:"config"`
}

type RoleAssignment struct {
	UserID     string `json:"userId"`
	EntityType string `json:"entityType"`
	EntityID   string `json:"entityId"`
	Role       string `json:"role"`
}

type Draft struct {
	ID           string                 `json:"id"`
	EntityType   string                 `json:"entityType"`
	EntityID     string                 `json:"entityId"`
	EntityName   string                 `json:"entityName"`
	ConfigBefore map[string]interface{} `json:"configBefore"`
	ConfigAfter  map[string]interface{} `json:"configAfter"`
	AuthorID     string                 `json:"authorId"`
	CreatedAt    time.Time              `json:"createdAt"`
	Status       string                 `json:"status"`
	ApproverIDs  []string               `json:"approverIds"`
}
