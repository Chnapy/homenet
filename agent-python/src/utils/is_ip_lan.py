def is_ip_lan(ip: str) -> bool:
    return ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172.")
