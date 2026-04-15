package executor

import (
	env "agent/src/env"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/mattn/go-shellwords"
)

type LocalExecutor struct {
	*BaseExecutor
}

func NewLocalExecutor() *LocalExecutor {
	return &LocalExecutor{
		BaseExecutor: NewExecutor(),
	}
}

func (l *LocalExecutor) Exec(command string) (string, error) {
	if env.Env.LogLevel == env.LogLevelDebug {
		fmt.Printf("local-in <- %s\n", command)
	}

	exe, _ := os.Executable()

	startTime := time.Now().UnixMilli()

	// parts := strings.Fields(command)
	parts, _ := shellwords.Parse(command)
	var name string
	var args []string
	if strings.HasSuffix(exe, ".exe") {
		name = "cmd"
		args = append([]string{"/C"}, parts...)
	} else if len(parts) > 1 && parts[0] == "pct" && parts[1] == "exec" {
		name = "pct"
		args = parts[1:]
	} else if len(parts) > 2 && parts[0] == "qm" && parts[2] == "exec" {
		name = "qm"
		args = parts[1:]
	} else if len(parts) > 1 && parts[0] == "docker" && parts[1] == "exec" {
		name = "docker"
		args = parts[1:]
	} else {
		name = "sh"
		args = append([]string{"-c"}, command)
	}

	cmd := exec.Command(name, args...)
	output, err := cmd.CombinedOutput()
	result := strings.TrimSpace(string(output))

	duration := time.Now().UnixMilli() - startTime

	if err != nil {
		fmt.Printf("local-err [%d] -> %s\n", duration, err)
		if !strings.HasPrefix(command, "sudo ") && strings.Contains(result, "Permission denied") {
			return l.Exec("sudo " + command)
		}
	}

	if env.Env.LogLevel == env.LogLevelDebug && len(result) > 0 {
		fmt.Printf("local-out [%d] -> %s\n", duration, l.FormatOutputForLog(result))
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
