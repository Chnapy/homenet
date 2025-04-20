package main

import (
	env "agent/src/env"
	"fmt"
	"log"
	"os"
	"os/exec"
	"runtime"
	"slices"
	"strings"
)

func CheckCron() {
	launcherPath, _ := os.Executable()
	if strings.HasPrefix(launcherPath, "/tmp/") {
		fmt.Println("Launcher in tmp dir, check-cron ignored")
		return
	}
	fmt.Println("Check Cron jobs")

	var entries []string
	var err error

	if runtime.GOOS == "windows" {
		entries, err = readWindowsCron()
	} else {
		entries, err = readUnixCron()
	}

	if err != nil {
		log.Printf("Erreur de lecture du cron : %v\n", err)
		return
	}

	pathParts := strings.Split(env.Env.Path, ":")
	slices.Sort(pathParts)
	pathEnv := strings.Join(slices.Compact(pathParts), ":")

	timedCron := env.Env.UpdateCron
	commandCron := fmt.Sprintf("PATH=%s %s", pathEnv, launcherPath)

	expectedJobTimed := fmt.Sprintf("%s %s # Homenet agent Cron Job (time)", timedCron, commandCron)
	expectedJobReboot := fmt.Sprintf("@reboot %s # Homenet agent Cron Job (reboot)", commandCron)

	log.Printf("Check cron : %s %s\n", timedCron, commandCron)

	jobTimedExists := false
	jobRebootExists := false
	updated := false

	for index, line := range entries {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		if strings.HasPrefix(line, "@reboot") {
			command := strings.TrimSpace(line[len("@reboot"):])

			if strings.Contains(command, launcherPath) {
				if jobRebootExists {
					entries[index] = ""
				} else {
					jobRebootExists = true

					if !strings.HasPrefix(command, commandCron) {
						entries[index] = expectedJobReboot
						updated = true
						log.Println("Cron job (reboot) updated.")
					}
				}
			}

		} else {
			parts := strings.Fields(line)
			if len(parts) < 6 {
				continue
			}

			time := strings.Join(parts[:5], " ")
			command := strings.TrimSpace(strings.Join(parts[5:], " "))

			if strings.Contains(command, launcherPath) {
				if jobTimedExists {
					entries[index] = ""
				} else {
					jobTimedExists = true

					if !strings.HasPrefix(command, commandCron) ||
						time != timedCron {
						entries[index] = expectedJobTimed
						updated = true
						log.Println("Cron job (time) updated.")
					}
				}
			}
		}
	}

	if !jobTimedExists {
		entries = append(entries, expectedJobTimed)
		updated = true
		log.Println("Cron job (time) added.")
	}

	if !jobRebootExists {
		entries = append(entries, expectedJobReboot)
		updated = true
		log.Println("Cron job (reboot) added.")
	}

	if updated {
		// fmt.Print(strings.Join(entries, "\n\n"))
		if runtime.GOOS == "windows" {
			err = writeWindowsCron(entries)
		} else {
			err = writeUnixCron(entries)
		}
		if err != nil {
			log.Printf("Cron write error : %v", err)
			return
		}
		log.Println("Cron jobs updated.")
	} else {
		log.Println("Cron jobs already clean, not update needed.")
	}
}

func readWindowsCron() ([]string, error) {
	content, err := os.ReadFile("homenet_cron.tab")
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	}
	return strings.Split(string(content), "\n"), nil
}

func readUnixCron() ([]string, error) {
	cmd := exec.Command("crontab", "-l")
	output, err := cmd.CombinedOutput()
	if err != nil {
		if strings.Contains(string(output), "no crontab for") {
			return []string{}, nil
		}
		return nil, fmt.Errorf("crontab -l failed: %v, output: %s", err, output)
	}
	return strings.Split(string(output), "\n"), nil
}

func writeWindowsCron(entries []string) error {
	content := strings.Join(entries, "\n")
	return os.WriteFile("homenet_cron.tab", []byte(content), 0644)
}

func writeUnixCron(entries []string) error {
	tmpFile, err := os.CreateTemp("", "cron")
	if err != nil {
		return err
	}
	defer os.Remove(tmpFile.Name())

	content := strings.Join(entries, "\n")
	if !strings.HasSuffix(content, "\n") {
		content += "\n"
	}
	if _, err := tmpFile.WriteString(content); err != nil {
		return err
	}
	tmpFile.Close()

	cmd := exec.Command("crontab", tmpFile.Name())
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("crontab install failed: %v, output: %s", err, output)
	}
	return nil
}
