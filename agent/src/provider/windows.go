package provider

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
	"os"
	"regexp"
	"slices"
	"strings"
)

type WindowsProvider struct {
	*BaseProvider
}

func NewWindowsProvider(executor ex.Executor) *WindowsProvider {
	return &WindowsProvider{
		BaseProvider: NewProvider(executor),
	}
}

func (e *WindowsProvider) Check() bool {
	exe, _ := os.Executable()
	if strings.HasSuffix(exe, ".exe") {
		return true
	}

	_, err := e.executor.Exec("uname -a")
	return err != nil
}

func (l *WindowsProvider) GetInstance() gen.AgentInstance {
	return l.BaseProvider.GetInstance(l)
}

func (e *WindowsProvider) GetOS() gen.AgentOS {
	return gen.AgentOS_WINDOWS
}

func (e *WindowsProvider) GetLan() string {
	ipconfigOutput, _ := e.executor.Exec("ipconfig")

	re := regexp.MustCompile(`Adresse IPv4[^\d]+(\d+\.\d+\.\d+\.\d+)`)
	match := re.FindStringSubmatch(ipconfigOutput)

	return match[1]
}

func (e *WindowsProvider) GetWan() *string {
	return nil
}

func (e *WindowsProvider) GetDDNS() *string {
	return nil
}

func (e *WindowsProvider) GetDHCP() []*gen.AgentInstance_AgentDHCPItem {
	return []*gen.AgentInstance_AgentDHCPItem{}
}

func (a *WindowsProvider) GetWeb() []*gen.AgentWebItem {
	return []*gen.AgentWebItem{}
}

func (a *WindowsProvider) GetSSH() *gen.AgentSSH {
	return nil
}

func (a *WindowsProvider) GetApps() []*gen.AgentApp {
	return slices.DeleteFunc(
		[]*gen.AgentApp{
			a.GetWireguard(),
			a.GetSunshine(),
		},
		func(app *gen.AgentApp) bool {
			return app == nil
		},
	)
}

func (e *WindowsProvider) GetInstanceList() []*gen.AgentInstance {
	return []*gen.AgentInstance{}
}

func (a *WindowsProvider) GetWireguard() *gen.AgentApp {
	_, err := a.executor.Exec("where wireguard")
	if err != nil {
		return nil
	}

	ipconfigOutput, _ := a.executor.Exec("ipconfig")

	re := regexp.MustCompile(`Adresse IPv4[^\d]+(\d+\.\d+\.\d+\.\d+)`)
	match := re.FindStringSubmatch(ipconfigOutput)

	vpnAddress := match[1]

	var agentVpnModeClient gen.AgentApp_AgentVpnMode = gen.AgentApp_CLIENT

	return &gen.AgentApp{
		Slug:       gen.AgentApp_WIREGUARD,
		VpnMode:    &agentVpnModeClient,
		VpnAddress: &vpnAddress,
		VpnClients: []string{},
	}
}

func (a *WindowsProvider) GetSunshine() *gen.AgentApp {
	_, err := a.executor.Exec("dir \"C:/Program Files/Sunshine\"")
	if err != nil {
		return nil
	}

	port32 := int32(47990)
	return &gen.AgentApp{
		Slug: gen.AgentApp_SUNSHINE,
		Web: []*gen.AgentWebItem{
			{
				Port: &port32,
			},
		},
	}
}
