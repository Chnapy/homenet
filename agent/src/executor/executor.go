package executor

import (
	"strings"
	"unicode/utf8"
)

// Interface représentant le contrat Executor
type Executor interface {
	Exec(command string) (string, error)
	IsDir(path string) bool
	IsFile(path string) bool
	IsWritable(path string) bool
	Open(path string) string
	FormatOutputForLog(output string) string
}

// Implémentation de base avec les méthodes par défaut
type BaseExecutor struct {
	// parentExecutor *Executor
}

// Constructeur
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

	var lines = strings.SplitN(output, "\n", 21)
	if len(lines) > 20 {
		lines = lines[:20]
	}
	truncated := strings.Join(lines, "\n")

	// Limite à 400 caractères
	if utf8.RuneCountInString(truncated) > 1000 {
		runes := []rune(truncated)
		truncated = string(runes[:1000])
	}

	return truncated
}
