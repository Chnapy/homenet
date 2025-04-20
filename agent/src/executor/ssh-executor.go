package executor

import (
	"agent/src/env"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/melbahja/goph"
)

type SSHExecutor struct {
	*BaseExecutor
	client *goph.Client
}

func NewSSHExecutor() *SSHExecutor {
	return &SSHExecutor{
		BaseExecutor: NewExecutor(),
	}
}

func (l *SSHExecutor) Connect(hostname string, username string, password string, port int) {

	if env.Env.LogLevel == env.LogLevelDebug {
		fmt.Println("ssh-connect -> hostname=" + hostname + " port=" + strconv.Itoa(port) + " username=" + username + " password=***")
	}

	auth := goph.Password(password)

	client, err := goph.NewUnknown(username, hostname, auth)
	if err != nil {
		fmt.Println(err)
	}

	l.client = client
}

func (l *SSHExecutor) Close() {
	l.client.Close()
}

func (l *SSHExecutor) Exec(command string) (string, error) {

	if env.Env.LogLevel == env.LogLevelDebug {
		fmt.Println("ssh-in <- " + command)
	}

	startTime := time.Now().UnixMilli()

	out, err := l.client.Run(command)

	output := strings.TrimSpace(string(out))

	duration := time.Now().UnixMilli() - startTime

	if err != nil {
		fmt.Printf("ssh-err [%d] -> %s\n", duration, err)
	}

	if env.Env.LogLevel == env.LogLevelDebug && len(output) > 0 {
		fmt.Printf("ssh-out [%d] -> %s\n", duration, l.FormatOutputForLog(output))
	}

	return output, err
}

func (l *SSHExecutor) IsDir(path string) bool {
	return l.BaseExecutor.IsDir(l, path)
}

func (l *SSHExecutor) IsFile(path string) bool {
	return l.BaseExecutor.IsFile(l, path)
}

func (l *SSHExecutor) IsWritable(path string) bool {
	return l.BaseExecutor.IsWritable(l, path)
}

func (l *SSHExecutor) Open(path string) string {
	return l.BaseExecutor.Open(l, path)
}

func (l *SSHExecutor) FormatOutputForLog(output string) string {
	return l.BaseExecutor.FormatOutputForLog(l, output)
}
