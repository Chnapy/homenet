package provider

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
	utils "agent/src/utils"
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"regexp"
	"slices"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type DebianProvider struct {
	*BaseProvider
}

func NewDebianProvider(executor ex.Executor) *DebianProvider {
	return &DebianProvider{
		BaseProvider: NewProvider(executor),
	}
}

// Méthode abstraite (panique si non implémentée)
func (e *DebianProvider) Check() bool {

	uname, _ := e.executor.Exec("uname -a")

	if strings.Contains(strings.ToLower(uname), "debian") {
		return true
	}

	osReleasePath := "/etc/os-release"

	// Vérification de l'existence du fichier
	if !e.executor.IsFile(osReleasePath) {
		return false
	}

	// Lecture du contenu du fichier
	configFile := e.executor.Open(osReleasePath)

	// Parsing des propriétés
	configs := utils.GetProperties(configFile)

	// Extraction du nom de l'OS
	osName, exists := configs["NAME"]
	if !exists {
		return false
	}

	// Vérification de la présence de "debian"
	return strings.Contains(strings.ToLower(osName), "debian")
}

func (l *DebianProvider) GetInstance() gen.AgentInstance {
	return l.BaseProvider.GetInstance(l)
}

func (e *DebianProvider) GetOS() gen.AgentOS {
	return gen.AgentOS_DEBIAN
}

func (e *DebianProvider) GetLan() string {
	// Exécution de la commande "ip addr"
	result, err := e.executor.Exec("ip addr")

	if err != nil {
		fmt.Println("Debian: GetLan error -", err)
		return ""
	}

	// Découpage du résultat en lignes
	scanner := bufio.NewScanner(strings.NewReader(result))
	for scanner.Scan() {
		line := scanner.Text()

		// Vérification des motifs dans la ligne
		if strings.Contains(line, "inet ") && strings.Contains(line, "scope global") {
			// Extraction de l'adresse IP
			parts := strings.Fields(line)
			if len(parts) < 2 {
				continue
			}

			ipWithMask := strings.Split(parts[1], "/")
			if len(ipWithMask) < 1 {
				continue
			}
			ip := ipWithMask[0]

			// Vérification si IP locale
			if utils.IsIPLAN(ip) {
				return ip
			}
		}
	}

	return ""
}

func (e *DebianProvider) GetWan() *string {
	// Exécution de la commande "ip addr"
	result, _ := e.executor.Exec("ip addr")

	// Découpage du résultat en lignes
	scanner := bufio.NewScanner(strings.NewReader(result))
	for scanner.Scan() {
		line := scanner.Text()

		// Vérification des motifs dans la ligne
		if strings.Contains(line, "inet ") && strings.Contains(line, "scope global") {
			// Extraction de l'adresse IP
			parts := strings.Fields(line)
			if len(parts) < 2 {
				continue
			}

			ipWithMask := strings.Split(parts[1], "/")
			if len(ipWithMask) < 1 {
				continue
			}
			ip := ipWithMask[0]

			// Vérification si IP locale
			if !utils.IsIPLAN(ip) {
				return &ip
			}
		}
	}

	return nil
}

func (e *DebianProvider) GetDDNS() *string {
	out, err := e.executor.Exec("hostname -f")
	if err != nil || !strings.Contains(out, ".") {
		return nil
	}

	return &out
}

func (e *DebianProvider) GetDHCP() []*gen.AgentInstance_AgentDHCPItem {
	dhcpFilePath := "/etc/config/dhcp"
	if !e.executor.IsFile(dhcpFilePath) {
		return nil
	}

	dhcpContent := e.executor.Open(dhcpFilePath)

	var dhcpList []*gen.AgentInstance_AgentDHCPItem
	var domain string
	var currentItem *gen.AgentInstance_AgentDHCPItem

	scanner := bufio.NewScanner(strings.NewReader(dhcpContent))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		parts := strings.Fields(line)

		switch parts[0] {
		case "config":
			currentItem = &gen.AgentInstance_AgentDHCPItem{}
		case "option":
			optionValue := strings.ReplaceAll(parts[2], "'", "")
			optionType := parts[1]

			switch optionType {
			case "domain":
				domain = optionValue
			case "ip":
				if currentItem != nil && !strings.Contains(optionValue, ":ffff") {
					currentItem.Address = optionValue
				}
			case "name":
				if currentItem != nil && domain != "" {
					if strings.HasSuffix(optionValue, ".com") {
						currentItem.Alias = optionValue
					} else {
						currentItem.Alias = fmt.Sprintf("%s.%s", optionValue, domain)
					}
				}
			}
		}

		if currentItem != nil && currentItem.Address != "" && currentItem.Alias != "" {
			dhcpList = append(dhcpList, currentItem)
			currentItem = nil
		}
	}

	if len(dhcpList) == 0 {
		return nil
	}
	return dhcpList
}

func (e *DebianProvider) GetWeb() []*gen.AgentWebItem {
	return []*gen.AgentWebItem{}
}

func (e *DebianProvider) GetSSH() *gen.AgentSSH {
	sshdFilePath := "/etc/ssh/sshd_config"
	dropbearFilePath := "/etc/config/dropbear"
	var ports []int32

	// Lecture de sshd_config
	if e.executor.IsFile(sshdFilePath) {
		content := e.executor.Open(sshdFilePath)
		scanner := bufio.NewScanner(strings.NewReader(content))
		for scanner.Scan() {
			line := scanner.Text()
			// Ignore les commentaires et espaces
			configPart := strings.TrimSpace(strings.SplitN(line, "#", 2)[0])
			if strings.HasPrefix(configPart, "Port ") {
				parts := strings.Fields(configPart)
				if len(parts) >= 2 {
					if port, err := strconv.Atoi(parts[1]); err == nil {
						ports = append(ports, int32(port))
					}
				}
			}
		}
		if len(ports) == 0 {
			ports = append(ports, 22)
		}
	}

	// Lecture de dropbear
	if e.executor.IsFile(dropbearFilePath) {
		content := e.executor.Open(dropbearFilePath)
		scanner := bufio.NewScanner(strings.NewReader(content))
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			lineParts := strings.Fields(line)
			if len(lineParts) > 2 && lineParts[0] == "option" && lineParts[1] == "Port" {
				optionValue := strings.ReplaceAll(lineParts[2], "'", "")
				if port, err := strconv.Atoi(optionValue); err == nil {
					ports = append(ports, int32(port))
					break
				}
			}
		}
	}

	if len(ports) > 0 {
		return &gen.AgentSSH{Ports: ports}
	}
	return nil
}

func (e *DebianProvider) GetApps() []*gen.AgentApp {
	return slices.DeleteFunc(
		[]*gen.AgentApp{
			e.GetHomenet(),
			e.GetDocker(),
			e.GetDockerRegistry(),
			e.GetWireguard(),
			e.GetCaddy(),
			e.GetNtfy(),
			e.GetUptimeKuma(),
			e.GetCodeServer(),
		},
		func(app *gen.AgentApp) bool {
			return app == nil
		},
	)
}

func (e *DebianProvider) GetInstanceList() []*gen.AgentInstance {

	instances := []*gen.AgentInstance{}

	containerListOut, err := e.executor.Exec("docker ps --format=json")

	if err != nil {
		fmt.Println("Debian: GetInstanceList error -", err)
		return instances
	}

	type DockerPS struct {
		ID    string
		Names string
		Ports string
		Image string
	}

	mapByNames := map[string]*gen.AgentInstance{}

	for _, line := range strings.Split(containerListOut, "\n") {

		if strings.TrimSpace(line) == "" {
			continue
		}

		var containerItem DockerPS
		var _ = json.Unmarshal([]byte(line), &containerItem)

		containerId := strings.TrimSpace(containerItem.ID)
		if containerId == "" {
			continue
		}

		dockerExec := ex.NewDockerExecutor(e.executor, containerId)

		dockerInstance := GetCurrentInstance(dockerExec)
		dockerInstance.Type = gen.AgentInstance_DOCKER

		if dockerInstance.Lan == "" {
			out, _ := e.executor.Exec("docker inspect --format '{{json .NetworkSettings.Networks}}' " + containerId)

			var dockerNetwork map[string]struct {
				IPAddress string
			}
			var _ = json.Unmarshal([]byte(out), &dockerNetwork)

			for _, network := range dockerNetwork {
				dockerInstance.Lan = network.IPAddress
			}
		}

		mapByNames[containerItem.Names] = &dockerInstance

		instances = append(instances, &dockerInstance)
	}

	for _, instance := range mapByNames {
		for _, app := range instance.Apps {
			for _, proxy := range app.ReverseProxy {
				instanceByName, ok := mapByNames[proxy.ToAddress.Address]
				if !ok {
					continue
				}

				proxy.ToAddress.Address = instanceByName.Lan
			}
		}
	}

	return instances
}

func (a *DebianProvider) GetHomenet() *gen.AgentApp {
	out, _ := a.executor.Exec("sh -c 'echo $HOMENET'")
	if strings.TrimSpace(out) == "" {
		return nil
	}

	return &gen.AgentApp{
		Slug: gen.AgentApp_HOMENET,
		Web: []*gen.AgentWebItem{
			{},
		},
	}
}

func (a *DebianProvider) GetDocker() *gen.AgentApp {
	_, err := a.executor.Exec("docker -v")
	if err != nil {
		return nil
	}

	return &gen.AgentApp{
		Slug: gen.AgentApp_DOCKER,
	}
}

func (a *DebianProvider) GetDockerRegistry() *gen.AgentApp {
	isDir := a.executor.IsDir("/var/lib/registry")
	if !isDir {
		return nil
	}

	return &gen.AgentApp{
		Slug: gen.AgentApp_DOCKER_REGISTRY,
	}
}

func (a *DebianProvider) GetWireguard() *gen.AgentApp {
	configDirPath := "/etc/wireguard"
	if !a.executor.IsDir(configDirPath) {
		return nil
	}

	output, _ := a.executor.Exec("find " + configDirPath + " -type f -name '*.conf'")
	configFilesPaths := strings.Split(output, "\n")

	vpnAddress := ""

	for _, path := range configFilesPaths {
		content := a.executor.Open(path)

		for _, lineRaw := range strings.Split(content, "\n") {
			line := strings.TrimSpace(lineRaw)
			if strings.HasPrefix(line, "#") {
				continue
			}

			parts := strings.Fields(line)

			if len(parts) < 3 || parts[0] != "Address" {
				continue
			}

			vpnAddress = strings.Split(parts[2], "/")[0]
		}
	}

	var agentVpnModeClient gen.AgentApp_AgentVpnMode = gen.AgentApp_CLIENT

	return &gen.AgentApp{
		Slug:       gen.AgentApp_WIREGUARD,
		VpnMode:    &agentVpnModeClient,
		VpnAddress: &vpnAddress,
		VpnClients: []string{},
	}
}

func (a *DebianProvider) GetNtfy() *gen.AgentApp {
	out, _ := a.executor.Exec("sh -c 'echo $NTFY_LISTEN_HTTP'")
	if strings.TrimSpace(out) == "" {
		return nil
	}

	portInt, _ := strconv.Atoi(strings.Split(out, ":")[1])
	portInt32 := int32(portInt)

	return &gen.AgentApp{
		Slug: gen.AgentApp_NTFY,
		Web: []*gen.AgentWebItem{
			{
				Port: &portInt32,
			},
		},
	}
}

func (a *DebianProvider) GetUptimeKuma() *gen.AgentApp {
	out := a.executor.Open("/app/package.json")
	if out == "" {
		return nil
	}

	var packagejson struct {
		Name string `json:"name"`
	}
	var err = json.Unmarshal([]byte(out), &packagejson)

	if err != nil || packagejson.Name != "uptime-kuma" {
		return nil
	}

	portInt32 := int32(3001)

	return &gen.AgentApp{
		Slug: gen.AgentApp_UPTIME_KUMA,
		Web: []*gen.AgentWebItem{
			{
				Port: &portInt32,
			},
		},
	}
}

func (a *DebianProvider) GetCaddy() *gen.AgentApp {
	var reverseProxy []*gen.AgentApp_AgentReverseProxy

	configPath := "/etc/caddy/Caddyfile"
	if !a.executor.IsFile(configPath) {
		return nil
	}

	fileContent := a.executor.Open(configPath)

	pattern := regexp.MustCompile(`(?ms)^(https?://[^\s{]+)[^{]*\{[^}]*?reverse_proxy\s+([^\s}]+)`)

	matches := pattern.FindAllStringSubmatch(fileContent, -1)

	for _, match := range matches {
		// fmt.Println(match[1], match[2])
		if len(match) < 3 {
			continue
		}

		// fromPort := match[1]
		domainParts := strings.Split(match[1], "://")
		domain := domainParts[1]
		domainSsl := domainParts[0] == "https"

		toAddress := match[2]
		if !strings.Contains(toAddress, "://") {
			toAddress = "http://" + toAddress
		}
		addressParts := strings.Split(toAddress, "://")
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
				Ssl:    domainSsl,
			},
			ToAddress: &gen.AgentApp_AgentReverseProxy_To{
				Address: toParts[0],
				Ssl:     ssl,
				Port:    &port32,
			},
		})
	}

	return &gen.AgentApp{
		Slug:         gen.AgentApp_CADDY,
		ReverseProxy: reverseProxy,
	}
}

func (e *DebianProvider) GetCodeServer() *gen.AgentApp {
	if !e.executor.IsFile("/bin/code-server") {
		return nil
	}

	app := &gen.AgentApp{
		Slug: gen.AgentApp_CODE_SERVER,
		Web:  []*gen.AgentWebItem{},
	}

	// Récupérer le home directory de l'utilisateur courant
	usr, err := user.Current()
	homeDir := ""
	if err == nil {
		homeDir = usr.HomeDir
	} else {
		// Fallback sur $HOME si user.Current() échoue (ex: cross-compilation)
		homeDir = os.Getenv("HOME")
	}

	configPath := filepath.Join(homeDir, ".config", "code-server", "config.yaml")
	if !e.executor.IsFile(configPath) {
		return app
	}

	stream := e.executor.Open(configPath)
	var config map[string]interface{}
	if err := yaml.Unmarshal([]byte(stream), &config); err != nil {
		fmt.Println("Debian: GetCodeServer error -", err)
		return app
	}

	// Extraction du port depuis "bind-addr"
	if bindAddr, ok := config["bind-addr"].(string); ok {
		parts := strings.Split(bindAddr, ":")
		if len(parts) == 2 {
			if port, err := strconv.Atoi(parts[1]); err == nil {
				finalPort := int32(port)
				app.Web = append(app.Web, &gen.AgentWebItem{
					Port: &finalPort,
					Ssl:  false,
				})
			}
		}
	}

	return app
}
