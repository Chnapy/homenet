import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from src.exec.local_exec import LocalExec
from src.exec.ssh_exec import SSHExec
from src.collect import collect


# Fonction pour collecter les données de l'appareil
def collect_device_info():
    return collect(LocalExec())


def collect_proxmox():
    exec = SSHExec(LocalExec())
    exec.connect(
        hostname="proxmox.lan",
        username="root",
        password="gringolo1",
    )

    return collect(exec)


# Serveur HTTP pour exposer les données en JSON
class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/device-info":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            # Collecte des données et conversion en JSON
            device_info = collect_device_info()
            self.wfile.write(json.dumps(device_info, indent=4).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


# Fonction principale pour démarrer le serveur HTTP
def run_server(port: int = 8881):
    server_address = ("", port)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"Agent running on port {port}. Access /device-info to view data.")
    httpd.serve_forever()
