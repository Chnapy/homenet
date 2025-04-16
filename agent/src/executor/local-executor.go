package executor

import (
	env "agent/src/env"
	"fmt"
	"os/exec"
	"strings"
)

// LocalExec implémente l'interface Exec pour l'exécution locale
type LocalExecutor struct {
	*BaseExecutor
}

// NewLocalExecutor crée une nouvelle instance de LocalExec
func NewLocalExecutor() *LocalExecutor {
	return &LocalExecutor{
		BaseExecutor: NewExecutor(),
	}
}

// Exec exécute une commande shell localement
func (l *LocalExecutor) Exec(command string) (string, error) {
	if env.Env.LogLevel == env.LogLevelDebug {
		fmt.Printf("local-in <- %s\n", command)
	}

	cmd := exec.Command("sh", "-c", command)
	output, err := cmd.CombinedOutput()
	result := strings.TrimSpace(string(output))

	if err != nil {
		fmt.Println(err)
	}

	if env.Env.LogLevel == env.LogLevelDebug {
		fmt.Printf("local-out -> %s\n", l.FormatOutputForLog(result))
	}

	return result, err
}

func (l *LocalExecutor) IsDir(path string) bool {
	return l.BaseExecutor.IsDir(l, path)
}

func (l *LocalExecutor) IsFile(path string) bool {
	return l.BaseExecutor.IsFile(l, path)
}

func (l *LocalExecutor) IsWritable(path string) bool {
	return l.BaseExecutor.IsWritable(l, path)
}

func (l *LocalExecutor) Open(path string) string {
	return l.BaseExecutor.Open(l, path)
}

func (l *LocalExecutor) FormatOutputForLog(output string) string {
	return l.BaseExecutor.FormatOutputForLog(l, output)
}
