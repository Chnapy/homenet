from src.env import env
from src.mode import active, passive

if __name__ == "__main__":
    try:
        if env.get("MODE") == "active":
            active.run()
        else:
            passive.run()

    except KeyboardInterrupt:
        print("\nAgent stopped.")
