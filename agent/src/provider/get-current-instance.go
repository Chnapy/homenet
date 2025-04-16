package provider

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
)

func GetCurrentInstance(executor ex.Executor) gen.AgentInstance {

	var providerList = []Provider{
		NewOpenWRTProvider(executor),
		NewHAOSProvider(executor),
		NewProxmoxProvider(executor),
		NewDebianProvider(executor),
	}

	for _, provider := range providerList {
		if provider.Check() {
			return provider.GetInstance()
		}
	}

	uname, _ := executor.Exec("uname -a")
	return gen.AgentInstance{
		Os:        gen.AgentOS_UNKNOWN_OS,
		UnknownOS: &uname,
		Lan:       "",
		Web:       []*gen.AgentWebItem{},
		Apps:      []*gen.AgentApp{},
		Instances: []*gen.AgentInstance{},
	}
}
