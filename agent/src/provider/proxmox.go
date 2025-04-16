package provider

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
	"strings"
)

type ProxmoxProvider struct {
	*BaseProvider
}

func NewProxmoxProvider(executor ex.Executor) *ProxmoxProvider {
	return &ProxmoxProvider{
		BaseProvider: NewProvider(executor),
	}
}

func (e *ProxmoxProvider) Check() bool {
	return e.executor.IsDir("/etc/pve")
}

func (l *ProxmoxProvider) GetInstance() gen.AgentInstance {
	return l.BaseProvider.GetInstance(l)
}

func (e *ProxmoxProvider) GetOS() gen.AgentOS {
	return gen.AgentOS_PROXMOX
}

func (e *ProxmoxProvider) GetLan() string {
	return NewDebianProvider(e.executor).GetLan()
}

func (e *ProxmoxProvider) GetWan() *string {
	return NewDebianProvider(e.executor).GetWan()
}

func (e *ProxmoxProvider) GetDDNS() *string {
	return NewDebianProvider(e.executor).GetDDNS()
}

func (e *ProxmoxProvider) GetDHCP() []*gen.AgentInstance_AgentDHCPItem {
	return NewDebianProvider(e.executor).GetDHCP()
}

func (e *ProxmoxProvider) GetWeb() []*gen.AgentWebItem {
	port := int32(8006)
	return []*gen.AgentWebItem{
		{
			Port: &port,
			Ssl:  true,
		},
	}
}

func (e *ProxmoxProvider) GetSSH() *gen.AgentSSH {
	return NewDebianProvider(e.executor).GetSSH()
}

func (e *ProxmoxProvider) GetApps() []*gen.AgentApp {
	return NewDebianProvider(e.executor).GetApps()
}

func (e *ProxmoxProvider) GetInstanceList() []*gen.AgentInstance {

	instances := []*gen.AgentInstance{}

	qmList, _ := e.executor.Exec("qm list")
	var qmId string
	for _, line := range strings.Split(qmList, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		fields := strings.Fields(line)
		if strings.Contains(fields[0], "VMID") {
			continue
		}

		qmId = fields[0]

		qmExec := ex.NewQMExecutor(e.executor, qmId)

		qmInstance := GetCurrentInstance(qmExec)
		qmInstance.Type = gen.AgentInstance_PROXMOX

		instances = append(instances, &qmInstance)
	}

	pctList, _ := e.executor.Exec("pct list")
	var pctId string
	for _, line := range strings.Split(pctList, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		fields := strings.Fields(line)
		if strings.Contains(fields[0], "VMID") {
			continue
		}

		pctId = fields[0]

		pctExec := ex.NewPCTExecutor(e.executor, pctId)

		pctInstance := GetCurrentInstance(pctExec)
		pctInstance.Type = gen.AgentInstance_PROXMOX

		instances = append(instances, &pctInstance)
	}

	return instances
}
