package executor

type PCTExecutor struct {
	*BaseExecutor
	parentExecutor Executor
	id             string
}

func NewPCTExecutor(parentExecutor Executor, id string) *PCTExecutor {
	return &PCTExecutor{
		BaseExecutor:   NewExecutor(),
		parentExecutor: parentExecutor,
		id:             id,
	}
}

func (l *PCTExecutor) Exec(command string) (string, error) {
	return l.parentExecutor.Exec("pct exec " + l.id + " -- " + command)
}

func (l *PCTExecutor) IsDir(path string) bool {
	return l.BaseExecutor.IsDir(l, path)
}

func (l *PCTExecutor) IsFile(path string) bool {
	return l.BaseExecutor.IsFile(l, path)
}

func (l *PCTExecutor) IsWritable(path string) bool {
	return l.BaseExecutor.IsWritable(l, path)
}

func (l *PCTExecutor) Open(path string) string {
	return l.BaseExecutor.Open(l, path)
}

func (l *PCTExecutor) FormatOutputForLog(output string) string {
	return l.BaseExecutor.FormatOutputForLog(l, output)
}
