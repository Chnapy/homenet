import json
import os
from typing import Literal, TypedDict
from dotenv import load_dotenv


class Env(TypedDict):
    # info: normal logs
    # debug: maximum logs
    LOG_LEVEL: Literal["info", "debug"]

    # active: send data to backend following interval
    # passive: wait for backend request
    MODE: Literal["active", "passive"]

    # hours interval, or None to wait for backend inconsistency
    RELEASE_CHECK_INTERVAL: int | None

    # backend route where data is pushed
    ACTIVE_BACKEND_ROUTE: str | None

    # hours interval for each data push
    ACTIVE_SEND_DATA_INTERVAL: int


def get_default_env():
    return Env(
        LOG_LEVEL="debug",
        MODE="active",
        RELEASE_CHECK_INTERVAL=None,
        ACTIVE_BACKEND_ROUTE=None,
        ACTIVE_SEND_DATA_INTERVAL=6,
    )


def loadEnv():
    load_dotenv()

    tempEnv = get_default_env()

    for key in tempEnv.keys():
        value = os.environ.get(key)
        if value != None:
            tempEnv[key] = value

    print(f"Env loaded.\n{json.dumps(tempEnv, indent=2)}\n")

    return tempEnv


env = loadEnv()

envStr = {key: "" if env.get(key) == None else str(env.get(key)) for key in env.keys()}
