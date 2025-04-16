package provider

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
	utils "agent/src/utils"
	"bufio"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
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
			if utils.IsIPLAN(ip) {
				return ip
			}
		}
	}

	panic("No IP found")
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
	return nil
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
		if len(parts) < 3 {
			continue
		}

		switch parts[0] {
		case "config":
			currentItem = &gen.AgentInstance_AgentDHCPItem{}
		case "option":
			optionType := parts[1]
			optionValue := strings.Trim(parts[2], "'")

			switch optionType {
			case "domain":
				domain = optionValue
			case "ip":
				if currentItem != nil && !strings.Contains(optionValue, ":ffff") {
					currentItem.Address = optionValue
				}
			case "name":
				if currentItem != nil && domain != "" {
					currentItem.Alias = fmt.Sprintf("%s.%s", optionValue, domain)
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
			e.GetCodeServer(),
		},
		func(app *gen.AgentApp) bool {
			return app == nil
		},
	)
}

func (e *DebianProvider) GetInstanceList() []*gen.AgentInstance {
	return []*gen.AgentInstance{}
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
		fmt.Println(err)
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
