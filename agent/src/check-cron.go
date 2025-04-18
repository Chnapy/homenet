package main

import (
	env "agent/src/env"
	"fmt"
	"log"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

func CheckCron() {
	launcherPath, _ := os.Executable()
	if strings.HasPrefix(launcherPath, "/tmp/") {
		fmt.Println("Launcher in tmp dir, check-cron ignored")
		return
	}

	sendDataCron := env.Env.UpdateCron
	log.Printf("Check cron : %s %s\n", sendDataCron, launcherPath)

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

	jobTimedExists := checkJobExists(entries, launcherPath, false)
	jobRebootExists := checkJobExists(entries, launcherPath, true)

	updated := false

	if !jobTimedExists {
		entry := fmt.Sprintf("%s %s # Homenet agent Cron Job (time)", sendDataCron, launcherPath)
		entries = append(entries, entry)
		updated = true
		log.Println("Tâche cron (time) ajoutée.")
	} else {
		log.Println("Tâche cron (time) existe déjà.")
	}

	if !jobRebootExists {
		entry := fmt.Sprintf("@reboot %s # Homenet agent Cron Job (reboot)", launcherPath)
		entries = append(entries, entry)
		updated = true
		log.Println("Tâche cron (reboot) ajoutée.")
	} else {
		log.Println("Tâche cron (reboot) existe déjà.")
	}

	if updated {
		if runtime.GOOS == "windows" {
			err = writeWindowsCron(entries)
		} else {
			err = writeUnixCron(entries)
		}
		if err != nil {
			log.Printf("Erreur d'écriture du cron : %v", err)
			return
		}
		log.Println("Cron mis à jour.")
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

func checkJobExists(entries []string, launcherPath string, isReboot bool) bool {
	for _, line := range entries {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		if strings.HasPrefix(line, "@reboot") {
			command := strings.TrimSpace(line[len("@reboot"):])

			if isReboot && strings.HasPrefix(command, launcherPath) {
				return true
			}

		} else {
			parts := strings.Fields(line)
			if len(parts) < 6 {
				continue
			}
			command := strings.TrimSpace(strings.Join(parts[5:], " "))

			if !isReboot && strings.HasPrefix(command, launcherPath) {
				return true
			}
		}
	}
	return false
}
