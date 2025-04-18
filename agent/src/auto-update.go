package main

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"syscall"

	"github.com/blang/semver"
	"github.com/rhysd/go-github-selfupdate/selfupdate"
)

func AutoUpdate(releaseTag string) (bool, error) {
	fmt.Println("Release tag:", releaseTag)
	if releaseTag == "" {
		fmt.Println("Release tag is empty, auto-update ignored")
		return false, nil
	}

	token := "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"

	selfupdate.EnableLog()

	updater, _ := selfupdate.NewUpdater(selfupdate.Config{
		APIToken: token,
		Filters:  []string{".*"},
	})

	v := semver.MustParse(releaseTag)
	latestRelease, err := updater.UpdateSelf(v, "chnapy/homenet")
	fmt.Println("Last release", latestRelease)

	if err != nil {
		return false, fmt.Errorf("échec récupération release: %w", err)
	}

	if latestRelease.Version.Equals(v) {
		fmt.Printf("Agent already up-to-date %s\n", latestRelease.Version.String())

		return false, nil
	}

	fmt.Printf("Agent up-to-date from %s to %s\n", v.String(), latestRelease.Version.String())
	Restart()

	return true, nil
}

func Restart() error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	args := os.Args

	fmt.Println("App restarting...")

	// Unix
	if runtime.GOOS == "linux" {
		env := os.Environ()
		return syscall.Exec(exe, args, env)
	}

	// Windows or fallback
	cmd := exec.Command(exe, args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	return cmd.Start()
}
