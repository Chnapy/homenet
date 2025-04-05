import json
from src.agent import collect_device_info, run_server

if __name__ == "__main__":
    try:

        print("Startup collected info", json.dumps(collect_device_info(), indent=2))

        run_server()
    except KeyboardInterrupt:
        print("\nAgent stopped.")
