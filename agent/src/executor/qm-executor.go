package executor

import (
	"encoding/json"
	"fmt"
	"strings"
)

type QMExecutor struct {
	*BaseExecutor
	parentExecutor Executor
	id             string
}

type QMOutput struct {
	OutData  *string `json:"out-data,omitempty"`
	ErrData  *string `json:"err-data,omitempty"`
	exitcode int
}

func NewQMExecutor(parentExecutor Executor, id string) *QMExecutor {
	return &QMExecutor{
		BaseExecutor:   NewExecutor(),
		parentExecutor: parentExecutor,
		id:             id,
	}
}

func (l *QMExecutor) Exec(command string) (string, error) {

	var output, err = l.parentExecutor.Exec("qm guest exec " + l.id + " -- " + command)

	var jsonOutput QMOutput
	var _ = json.Unmarshal([]byte(output), &jsonOutput)

	if jsonOutput.exitcode != 0 {
		err = fmt.Errorf("%d", jsonOutput.exitcode)
	}

	if jsonOutput.ErrData != nil {
		err = fmt.Errorf("%s", *jsonOutput.ErrData)
		fmt.Println(*jsonOutput.ErrData)
	}

	if err != nil {
		fmt.Println(err)
	}

	var data string
	if err == nil && jsonOutput.OutData != nil {
		data = strings.TrimSpace(*jsonOutput.OutData)
	}

	return data, err
}

func (l *QMExecutor) IsDir(path string) bool {
	return l.BaseExecutor.IsDir(l, path)
}

func (l *QMExecutor) IsFile(path string) bool {
	return l.BaseExecutor.IsFile(l, path)
}

func (l *QMExecutor) IsWritable(path string) bool {
	return l.BaseExecutor.IsWritable(l, path)
}

func (l *QMExecutor) Open(path string) string {
	return l.BaseExecutor.Open(l, path)
}

func (l *QMExecutor) FormatOutputForLog(output string) string {
	return l.BaseExecutor.FormatOutputForLog(l, output)
}
