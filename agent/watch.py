import time
import os
import subprocess


def watch_and_run(script_path: str, check_interval: int = 1):
    """Run given script & watch"""
    directory = os.path.dirname(script_path) or "."
    tracked_files: dict[str, object] = {}

    print("\033[92m" + f"watch - starts on {directory}" + "\033[0m")

    while True:
        try:
            current_files = os.listdir(directory)
            modified = False

            # Vérification des modifications et nouveaux fichiers
            for f in current_files:
                path = os.path.join(directory, f)
                if os.path.isfile(path):
                    mtime = os.path.getmtime(path)
                    if f not in tracked_files or tracked_files[f] != mtime:
                        tracked_files[f] = mtime
                        modified = True

            # Vérification des suppressions
            for f in list(tracked_files.keys()):
                if f not in current_files:
                    del tracked_files[f]
                    modified = True

            if modified:
                print("\033[92m\n" + f"watch - changes detected" + "\n\033[0m")
                subprocess.run(["python", "-m", "src"], check=True)

            time.sleep(check_interval)

        except KeyboardInterrupt:
            print("\033[93m\n" + "watch - stop" + "\033[0m")
            break


if __name__ == "__main__":
    script_to_watch = "./src/__main__.py"
    watch_and_run(script_to_watch)
