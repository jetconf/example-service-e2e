package config

import "github.com/caarlos0/env/v11"

type Config struct {
	Host     string `env:"HOST"      envDefault:"0.0.0.0"`
	Port     string `env:"PORT"      envDefault:"8080"`
	DBURL    string `env:"DB_URL"    required:"true"`
	LogLevel string `env:"LOG_LEVEL" envDefault:"info"`
}

func Load() (*Config, error) {
	var c Config
	if err := env.Parse(&c); err != nil {
		return nil, err
	}
	return &c, nil
}
