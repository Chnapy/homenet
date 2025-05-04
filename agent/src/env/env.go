package env

import (
	"encoding/json"
	"os"
)

type EnvType struct {
	LogLevel     string
	BackendRoute string
	UpdateCron   string
	Path         string
}

const (
	LogLevelDebug = "debug"
	LogLevelInfo  = "info"
)

var defaultEnv = EnvType{
	LogLevel:     LogLevelDebug, //LogLevelDebug,
	BackendRoute: "141.94.221.48:50051",
	UpdateCron:   "0 */6 * * *",
	Path:         "",
}

func GetenvWithDefault(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	return value
}

var Env = EnvType{
	LogLevel:     GetenvWithDefault("LOG_LEVEL", defaultEnv.LogLevel),
	BackendRoute: GetenvWithDefault("BACKEND_ROUTE", defaultEnv.BackendRoute),
	UpdateCron:   GetenvWithDefault("UPDATE_CRON", defaultEnv.UpdateCron),
	Path:         GetenvWithDefault("PATH", defaultEnv.Path),
}

func GetEnvMap() map[string]string {
	var envMap map[string]string
	var envJson, _ = json.Marshal(Env)
	json.Unmarshal(envJson, &envMap)
	return envMap
}
