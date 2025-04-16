package utils

import "net"

func IsIPLAN(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return false
	}

	// Plages IP privées :
	// - 10.0.0.0/8
	// - 172.16.0.0/12
	// - 192.168.0.0/16
	for _, cidr := range []string{"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"} {
		_, network, _ := net.ParseCIDR(cidr)
		if network.Contains(ip) {
			return true
		}
	}
	return false
}
