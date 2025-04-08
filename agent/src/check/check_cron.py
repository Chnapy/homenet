from src.env import env
from crontab import CronTab
import sys
from src import consts

LAUNCHER_ABSOLUTE_PATH = sys.argv[1] if len(sys.argv) > 1 else None


def check_cron():

    if not LAUNCHER_ABSOLUTE_PATH:
        print("Launcher absolute path not passed as parameter.")
        print("Cron check skipped.")
        return

    sendDataCron = env.get("ACTIVE_SEND_DATA_CRON")
    print(f"Check cron: {sendDataCron} {LAUNCHER_ABSOLUTE_PATH}")

    if consts.is_windows:
        cron = CronTab(tabfile="homenet_cron.tab")
    else:
        cron = CronTab(user=True)

    job_timed_exists = any(
        job.command == LAUNCHER_ABSOLUTE_PATH and job.slices != "@reboot"
        for job in cron
    )

    if not job_timed_exists:
        job_timed = cron.new(
            command=LAUNCHER_ABSOLUTE_PATH, comment="Homenet agent Cron Job (time)"
        )
        job_timed.setall(sendDataCron)

        print("Cron job (time) added.")
    else:
        print("Cron job (time) already exist.")

    job_reboot_exists = any(
        job.command == LAUNCHER_ABSOLUTE_PATH and job.slices == "@reboot"
        for job in cron
    )

    if not job_reboot_exists:
        job_reboot = cron.new(
            command=LAUNCHER_ABSOLUTE_PATH, comment="Homenet agent Cron Job (reboot)"
        )
        job_reboot.setall("@reboot")

        print("Cron job (reboot) added.")
    else:
        print("Cron job (reboot) already exist.")

    if not job_timed_exists or not job_reboot_exists:
        cron.write()
        print("Cron updated.")
