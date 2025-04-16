package env

import "os"

type EnvType struct {
	LogLevel     string
	BackendRoute string
	UpdateCron   string
}

const (
	LogLevelDebug = "debug"
	LogLevelInfo  = "info"
)

var defaultEnv = EnvType{
	LogLevel:     LogLevelInfo, //LogLevelDebug,
	BackendRoute: "192.168.8.217:50051",
	UpdateCron:   "0 */6 * * *",
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
}
