package executor

import (
	"strings"
	"unicode/utf8"
)

type Executor interface {
	Exec(command string) (string, error)
	IsDir(path string) bool
	IsFile(path string) bool
	IsWritable(path string) bool
	Open(path string) string
	FormatOutputForLog(output string) string
}

type BaseExecutor struct {
}

func NewExecutor() *BaseExecutor {
	return &BaseExecutor{}
}

func (b *BaseExecutor) IsDir(e Executor, path string) bool {
	_, err := e.Exec("test -d " + path)
	return err == nil
}

func (b *BaseExecutor) IsFile(e Executor, path string) bool {
	_, err := e.Exec("test -f " + path)
	return err == nil
}

func (b *BaseExecutor) IsWritable(e Executor, path string) bool {
	_, err := e.Exec("test -w " + path)
	return err == nil
}

func (b *BaseExecutor) Open(e Executor, path string) string {
	out, _ := e.Exec("cat " + path)
	return out
}

func (b *BaseExecutor) FormatOutputForLog(e Executor, output string) string {

	nbrLines := 10
	nbrCharacters := 500

	var lines = strings.SplitN(output, "\n", nbrLines+1)
	if len(lines) > nbrLines {
		lines = lines[:nbrLines]
	}
	truncated := strings.Join(lines, "\n")

	if utf8.RuneCountInString(truncated) > nbrCharacters {
		runes := []rune(truncated)
		truncated = string(runes[:nbrCharacters])
	}

	return truncated
}
