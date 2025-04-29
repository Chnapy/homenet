package executor

type DockerExecutor struct {
	*BaseExecutor
	parentExecutor Executor
	id             string
}

func NewDockerExecutor(parentExecutor Executor, id string) *DockerExecutor {
	return &DockerExecutor{
		BaseExecutor:   NewExecutor(),
		parentExecutor: parentExecutor,
		id:             id,
	}
}

func (l *DockerExecutor) Exec(command string) (string, error) {
	return l.parentExecutor.Exec("docker exec " + l.id + " " + command)
}

func (l *DockerExecutor) IsDir(path string) bool {
	return l.BaseExecutor.IsDir(l, path)
}

func (l *DockerExecutor) IsFile(path string) bool {
	return l.BaseExecutor.IsFile(l, path)
}

func (l *DockerExecutor) IsWritable(path string) bool {
	return l.BaseExecutor.IsWritable(l, path)
}

func (l *DockerExecutor) Open(path string) string {
	return l.BaseExecutor.Open(l, path)
}

func (l *DockerExecutor) FormatOutputForLog(output string) string {
	return l.BaseExecutor.FormatOutputForLog(l, output)
}
