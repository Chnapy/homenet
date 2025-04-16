package provider

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
	utils "agent/src/utils"
	"regexp"
	"slices"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type OpenWRTProvider struct {
	*BaseProvider
}

func NewOpenWRTProvider(executor ex.Executor) *OpenWRTProvider {
	return &OpenWRTProvider{
		BaseProvider: NewProvider(executor),
	}
}

func (e *OpenWRTProvider) Check() bool {
	if !e.executor.IsFile("/etc/glversion") {
		return false
	}

	osReleasePath := "/etc/os-release"
	if !e.executor.IsFile(osReleasePath) {
		return false
	}

	configFile := e.executor.Open(osReleasePath)
	configs := utils.GetProperties(configFile)
	osName, hasOsName := configs["NAME"]
	return hasOsName && strings.Contains(strings.ToLower(osName), "openwrt")
}

func (l *OpenWRTProvider) GetInstance() gen.AgentInstance {
	return l.BaseProvider.GetInstance(l)
}

func (e *OpenWRTProvider) GetOS() gen.AgentOS {
	return gen.AgentOS_OPENWRT_GLINET
}

func (e *OpenWRTProvider) GetLan() string {
	return NewDebianProvider(e.executor).GetLan()
}

func (e *OpenWRTProvider) GetWan() *string {
	return NewDebianProvider(e.executor).GetWan()
}

func (e *OpenWRTProvider) GetDDNS() *string {
	ddnsFilePath := "/etc/config/gl_ddns"
	if !e.executor.IsFile(ddnsFilePath) {
		return nil
	}

	ddnsFile := e.executor.Open(ddnsFilePath)

	enabled := false
	domain := ""

	for _, lineRaw := range strings.Split(ddnsFile, "\n") {
		line := strings.TrimSpace(lineRaw)
		if strings.HasPrefix(line, "config service") {
			enabled = true
			domain = ""
		}

		if strings.HasPrefix(line, "option domain") {
			domain = strings.ReplaceAll(strings.Split(line, " ")[2], "'", "")
		}

		if strings.HasPrefix(line, "option enabled") {
			enabledStr := strings.ReplaceAll(strings.Split(line, " ")[2], "'", "")
			enabled = enabledStr == "1"
		}

		if enabled && domain != "" {
			return &domain
		}
	}

	if enabled && domain != "" {
		return &domain
	}
	return nil
}

func (e *OpenWRTProvider) GetDHCP() []*gen.AgentInstance_AgentDHCPItem {
	return NewDebianProvider(e.executor).GetDHCP()
}

func (a *OpenWRTProvider) GetWeb() []*gen.AgentWebItem {
	var webList []*gen.AgentWebItem

	return webList
}

func (a *OpenWRTProvider) GetSSH() *gen.AgentSSH {
	return NewDebianProvider(a.executor).GetSSH()
}

func (a *OpenWRTProvider) GetApps() []*gen.AgentApp {
	return slices.DeleteFunc(
		[]*gen.AgentApp{
			a.GetWireguard(),
			a.GetNginx(),
			a.GetAdguardHome(),
		},
		func(app *gen.AgentApp) bool {
			return app == nil
		},
	)
}

func (e *OpenWRTProvider) GetInstanceList() []*gen.AgentInstance {
	return NewDebianProvider(e.executor).GetInstanceList()
}

func (a *OpenWRTProvider) GetWireguard() *gen.AgentApp {
	configFilePath := "/etc/config/wireguard_server"
	if !a.executor.IsFile(configFilePath) {
		return nil
	}

	configFile := a.executor.Open(configFilePath)

	vpnAddress := ""
	var vpnClients []string

	for _, lineRaw := range strings.Split(configFile, "\n") {
		line := strings.TrimSpace(lineRaw)
		parts := strings.Fields(line)

		if len(parts) < 3 || parts[0] != "option" {
			continue
		}

		optionValue := strings.ReplaceAll(parts[2], "'", "")
		switch parts[1] {
		case "address_v4":
			vpnAddress = strings.Split(optionValue, "/")[0]
		case "client_ip":
			vpnClients = append(vpnClients, strings.Split(optionValue, "/")[0])
		}
	}

	if vpnAddress == "" {
		return nil
	}

	var agentVpnModeServer gen.AgentApp_AgentVpnMode = gen.AgentApp_SERVER

	return &gen.AgentApp{
		Slug:       gen.AgentApp_WIREGUARD,
		VpnMode:    &agentVpnModeServer,
		VpnAddress: &vpnAddress,
		VpnClients: vpnClients,
	}
}

func (a *OpenWRTProvider) GetNginx() *gen.AgentApp {
	var reverseProxy []*gen.AgentApp_AgentReverseProxy

	configFolderPath := "/etc/nginx"
	if !a.executor.IsDir(configFolderPath) {
		return nil
	}

	output, _ := a.executor.Exec("find " + configFolderPath + " -type f -name '*.conf'")
	configFilesPaths := strings.Split(output, "\n")

	configFiles := []string{}

	for _, path := range configFilesPaths {
		content := a.executor.Open(path)
		configFiles = append(configFiles, content)
	}

	pattern := regexp.MustCompile(`(?s)[^#]*?listen\s+(\d+)[^#]*?server_name\s+([^\s]+)\s*;[^#]*?proxy_pass\s+([^\s]+);`)

	for _, fileContent := range configFiles {
		matches := pattern.FindAllStringSubmatch(fileContent, -1)

		for _, match := range matches {
			if len(match) < 4 {
				continue
			}

			fromPort := match[1]
			domain := match[2]
			fullAddress := match[3]

			addressParts := strings.Split(fullAddress, "://")
			ssl := addressParts[0] == "https"
			toParts := strings.Split(addressParts[1], ":")

			var port32 int32
			if len(toParts) > 1 {
				port, _ := strconv.Atoi(toParts[1])
				port32 = int32(port)
			}

			reverseProxy = append(reverseProxy, &gen.AgentApp_AgentReverseProxy{
				FromDomain: &gen.AgentApp_AgentReverseProxy_From{
					Domain: domain,
					Ssl:    fromPort == "443",
				},
				ToAddress: &gen.AgentApp_AgentReverseProxy_To{
					Address: toParts[0],
					Ssl:     ssl,
					Port:    &port32,
				},
			})
		}
	}

	if len(reverseProxy) == 0 {
		return nil
	}

	return &gen.AgentApp{
		Slug:         gen.AgentApp_NGINX,
		ReverseProxy: reverseProxy,
	}
}

func (a *OpenWRTProvider) GetAdguardHome() *gen.AgentApp {
	configFilePath := "/etc/AdGuardHome/config.yaml"
	if !a.executor.IsFile(configFilePath) {
		return nil
	}

	content := a.executor.Open(configFilePath)
	var config map[string]interface{}
	yaml.Unmarshal([]byte(content), &config)

	var web []*gen.AgentWebItem
	if httpConfig, ok := config["http"].(map[string]interface{}); ok {
		if address, ok := httpConfig["address"].(string); ok {
			parts := strings.Split(address, ":")
			if len(parts) > 1 {
				port, _ := strconv.Atoi(parts[1])
				port32 := int32(port)
				web = append(web, &gen.AgentWebItem{Port: &port32})
			}
		}
	}

	return &gen.AgentApp{
		Slug: gen.AgentApp_ADGUARD_HOME,
		Web:  web,
	}
}
