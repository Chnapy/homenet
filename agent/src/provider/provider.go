package provider

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
)

type Provider interface {
	Check() bool
	GetInstance() gen.AgentInstance
	GetOS() gen.AgentOS
	GetLan() string
	GetWan() *string
	GetDDNS() *string
	GetDHCP() []*gen.AgentInstance_AgentDHCPItem
	GetWeb() []*gen.AgentWebItem
	GetSSH() *gen.AgentSSH
	GetApps() []*gen.AgentApp
	GetInstanceList() []*gen.AgentInstance
}

type BaseProvider struct {
	executor ex.Executor
}

func NewProvider(executor ex.Executor) *BaseProvider {
	return &BaseProvider{
		executor: executor,
	}
}

func (b *BaseProvider) GetInstance(e Provider) gen.AgentInstance {
	return gen.AgentInstance{
		Os:        e.GetOS(),
		Lan:       e.GetLan(),
		Wan:       e.GetWan(),
		Ddns:      e.GetDDNS(),
		Dhcp:      e.GetDHCP(),
		Web:       e.GetWeb(),
		Ssh:       e.GetSSH(),
		Apps:      e.GetApps(),
		Instances: e.GetInstanceList(),
	}
}
