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

	exe, err := os.Executable()
	if err != nil {
		fmt.Println(err)
		return false, err
	}
	args := os.Args

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
	Restart(exe, args)

	return true, nil
}

func Restart(exe string, args []string) {

	fmt.Printf("App restarting [%s]...\n", runtime.GOOS)
	fmt.Println("Current exe:", exe)

	// Unix
	if runtime.GOOS == "linux" {
		env := os.Environ()
		err := syscall.Exec(exe, args, env)
		if err != nil {
			fmt.Println(err, exe, args)
		}
		return
	}

	// Windows or fallback
	cmd := exec.Command(exe, args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	err := cmd.Start()
	if err != nil {
		fmt.Println(err)
	}
}
