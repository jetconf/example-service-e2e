package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

func main() {
	dsn := os.Getenv("DB_URL")
	if dsn == "" {
		log.Fatal("DB_URL is required")
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	if err := db.PingContext(context.Background()); err != nil {
		log.Fatalf("ping: %v", err)
	}

	goose.SetBaseFS(nil)
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("set dialect: %v", err)
	}

	dir := "/migrations/postgres"
	if d := os.Getenv("MIGRATIONS_DIR"); d != "" {
		dir = d
	}

	if err := goose.Up(db, dir); err != nil {
		log.Fatalf("goose up: %v", err)
	}
	fmt.Println("migrations applied successfully")
}
