package provider

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type HAOSProvider struct {
	*BaseProvider
}

func NewHAOSProvider(executor ex.Executor) *HAOSProvider {
	return &HAOSProvider{
		BaseProvider: NewProvider(executor),
	}
}

func (e *HAOSProvider) Check() bool {
	_, err := e.executor.Exec("ha --help")
	return err == nil
}

func (l *HAOSProvider) GetInstance() gen.AgentInstance {
	return l.BaseProvider.GetInstance(l)
}

func (e *HAOSProvider) GetOS() gen.AgentOS {
	return gen.AgentOS_HAOS
}

func (e *HAOSProvider) GetLan() string {
	return NewDebianProvider(e.executor).GetLan()
}

func (e *HAOSProvider) GetWan() *string {
	return NewDebianProvider(e.executor).GetWan()
}

func (e *HAOSProvider) GetDDNS() *string {
	return NewDebianProvider(e.executor).GetDDNS()
}

func (e *HAOSProvider) GetDHCP() []*gen.AgentInstance_AgentDHCPItem {
	return NewDebianProvider(e.executor).GetDHCP()
}

func (a *HAOSProvider) GetWeb() []*gen.AgentWebItem {
	var webList []*gen.AgentWebItem

	// Partie Home Assistant Core
	haInfo, err := a.executor.Exec("ha core info")
	if err != nil {
		fmt.Print(err)
	}

	var properties map[string]interface{}
	if err := yaml.Unmarshal([]byte(haInfo), &properties); err != nil {
		fmt.Print(err)
	}

	if port, ok := properties["port"].(int); ok {
		ssl := false
		if sslVal, ok := properties["ssl"].(string); ok {
			ssl = sslVal == "true"
		}
		port32 := int32(port)
		webList = append(webList, &gen.AgentWebItem{Port: &port32, Ssl: ssl})
	}

	// Partie Docker Observer
	haObserver, err := a.executor.Exec("docker inspect hassio_observer")
	if err != nil {
		fmt.Print(err)
	}

	var observerConfig []struct {
		HostConfig struct {
			PortBindings map[string][]struct {
				HostPort string `json:"HostPort"`
			} `json:"PortBindings"`
		} `json:"HostConfig"`
	}

	if err := json.Unmarshal([]byte(haObserver), &observerConfig); err != nil {
		fmt.Print(err)
	}

	if len(observerConfig) > 0 {
		if bindings, ok := observerConfig[0].HostConfig.PortBindings["80/tcp"]; ok && len(bindings) > 0 {
			if port, err := strconv.Atoi(bindings[0].HostPort); err == nil {
				port32 := int32(port)
				webList = append(webList, &gen.AgentWebItem{Port: &port32, Ssl: false})
			}
		}
	}

	return webList
}

func (a *HAOSProvider) GetSSH() *gen.AgentSSH {
	var ports []int32

	addonListOutput, err := a.executor.Exec("ha addons --raw-json")
	if err != nil {
		fmt.Print(err)
	}

	var addonListRaw struct {
		Data struct {
			Addons []struct {
				Slug string `json:"slug"`
			} `json:"addons"`
		} `json:"data"`
	}

	if err := json.Unmarshal([]byte(addonListOutput), &addonListRaw); err != nil {
		fmt.Println(err)
	}

	addonList := addonListRaw.Data.Addons

	for _, addon := range addonList {
		addonInfoOutput, err := a.executor.Exec(fmt.Sprintf("ha addons info %s --raw-json", addon.Slug))
		if err != nil {
			fmt.Println(err)
			continue
		}

		var addonInfoRaw struct {
			Data struct {
				Network *map[string]int `json:"network"`
			} `json:"data"`
		}

		if err := json.Unmarshal([]byte(addonInfoOutput), &addonInfoRaw); err != nil {
			fmt.Println(err)
			continue
		}

		addonInfo := addonInfoRaw.Data
		network := addonInfo.Network
		if network == nil {
			continue
		}

		for key, value := range *network {
			if port := value; port == 22 {
				if parts := strings.Split(key, "/"); len(parts) > 0 {
					if hostPort, err := strconv.Atoi(parts[0]); err == nil {
						ports = append(ports, int32(hostPort))
					}
				}
			}
		}
	}

	if len(ports) == 0 {
		return nil
	}

	return &gen.AgentSSH{Ports: ports}
}

func (a *HAOSProvider) GetApps() []*gen.AgentApp {
	var apps []*gen.AgentApp

	addonListOutput, err := a.executor.Exec("ha addons --raw-json")
	if err != nil {
		fmt.Print(err)
	}

	var addonListObj struct {
		Data struct {
			Addons []struct {
				Slug string `json:"slug"`
			} `json:"addons"`
		} `json:"data"`
	}

	if err := json.Unmarshal([]byte(addonListOutput), &addonListObj); err != nil {
		fmt.Print(err)
	}

	addonList := addonListObj.Data.Addons

	for _, addon := range addonList {
		addonInfoOutput, err := a.executor.Exec(fmt.Sprintf("ha addons info %s --raw-json", addon.Slug))
		if err != nil {
			fmt.Print(err)
			continue
		}

		var addonInfoRaw struct {
			Data struct {
				Name        string         `json:"name"`
				Network     map[string]int `json:"network"`
				IngressPort int            `json:"ingress_port"`
			} `json:"data"`
		}

		if err := json.Unmarshal([]byte(addonInfoOutput), &addonInfoRaw); err != nil {
			// fmt.Println("FOO", err, addonInfoOutput)
			continue
		}

		addonInfo := addonInfoRaw.Data
		network := addonInfo.Network
		if network == nil {
			continue
		}

		ingressPort := strconv.Itoa(addonInfo.IngressPort)
		port := ingressPort

		_, port1ok := network[port]
		_, port2ok := network[port+"/tcp"]

		if port == "0" || (!port1ok && !port2ok) {
			ingressPort = "80"

			http1, http1ok := network["80"]
			http2, http2ok := network["80/tcp"]

			if http1ok {
				port = strconv.Itoa(http1)
			} else if http2ok {
				port = strconv.Itoa(http2)
			} else {
				continue
			}
		}

		slug := gen.AgentApp_UNKNOWN_APP
		switch strings.ToLower(addonInfo.Name) {
		case "zigbee2mqtt":
			slug = gen.AgentApp_ZIGBEE2MQTT
		case "node-red":
			slug = gen.AgentApp_NODE_RED
		}
		// fmt.Println("NAME:", addonInfo.Name, slug.String())

		portInt, _ := strconv.Atoi(port)
		port32 := int32(portInt)
		apps = append(apps, &gen.AgentApp{
			Slug: slug,
			Web:  []*gen.AgentWebItem{{Port: &port32, Ssl: false}},
		})
	}

	return apps
}

func (e *HAOSProvider) GetInstanceList() []*gen.AgentInstance {
	return []*gen.AgentInstance{}
}
