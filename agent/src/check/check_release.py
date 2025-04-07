from typing import Callable
import requests
from src.exec.local_exec import LocalExec
from src import consts

RELEASE_ID_PATH = "RELEASE_ID"

RELEASE_ROUTE = "https://api.github.com/repos/Chnapy/homenet/releases/latest"

# TODO remove & invalidate token
Authorization = f"Bearer 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"

exec = LocalExec()


def check_release(
    stopFn: Callable[[], None],
):
    global exec, Authorization, RELEASE_ID_PATH, RELEASE_ROUTE

    print("Check agent last release...")

    if not exec.isWritable("."):
        raise RuntimeError("Current directory is not writable, run cancelled")

    try:
        currentId = int(exec.open(RELEASE_ID_PATH).strip())
        if not exec.isFile(consts.AGENT_PATH):
            raise FileNotFoundError(f"Agent file not found {consts.AGENT_PATH}")
    except BaseException:
        currentId = -1

    releaseResponse = requests.get(
        url=RELEASE_ROUTE,
        headers={
            "Authorization": Authorization,
        },
    )
    release = dict(releaseResponse.json())

    releaseId = release.get("id")
    if releaseId == currentId:
        print(f"Same release ({currentId}), update cancelled")
        # start()
        return

    print(f"New release: {releaseId}")
    assetsUrl = release.get("assets_url") or ""

    assetsResponse = requests.get(
        url=assetsUrl,
        headers={
            "Authorization": Authorization,
        },
    )
    assets: list[dict[str, str]] = assetsResponse.json()

    fileUrl = ""
    for asset in assets:
        if asset["name"] == "agent":
            fileUrl = asset["url"]
            break

    stopFn()

    dl = (
        "curl -LSs --fail --show-error "
        + '-H "Accept: application/octet-stream" '
        + f'-H "Authorization: {Authorization}" '
        + f"{fileUrl} "
        + f"-o {consts.AGENT_PATH}"
    )

    print(f"Download agent to {consts.AGENT_PATH}")
    exec.exec(f'mkdir -p "$(dirname "{consts.AGENT_PATH}")"')
    exec.exec(dl)

    exec.exec(f"chmod +x {consts.AGENT_PATH}")

    exec.exec(f"echo {releaseId} > {RELEASE_ID_PATH}")

    print(f"Agent updated with last release ({releaseId})")

    # start()
