import sys
import time
import subprocess
from src.check.check_release import check_release
from src import consts


process: subprocess.Popen[bytes] | None = None


def start(releaseId: int):
    global process

    if process:
        return

    print("\033[92m" + f"homenet agent - start" + "\033[0m")

    try:
        process = subprocess.Popen(
            f"./{consts.AGENT_PATH} {sys.executable} {releaseId}", shell=True
        )
        process.wait()

        time.sleep(1)

    except KeyboardInterrupt:
        print("\033[93m\n" + "homenet agent - stop" + "\033[0m")


def stop():
    global process

    if process:
        print("\033[93m\n" + "homenet agent - stop" + "\033[0m")
        process.terminate()
        process = None


if __name__ == "__main__":
    releaseId = check_release(stop)
    start(releaseId)
