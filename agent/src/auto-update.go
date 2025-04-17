package main

import (
	"fmt"

	"github.com/blang/semver"
	"github.com/rhysd/go-github-selfupdate/selfupdate"
)

func AutoUpdate(releaseID string) error {
	token := "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"

	selfupdate.EnableLog()

	updater, _ := selfupdate.NewUpdater(selfupdate.Config{
		APIToken: token,
		Filters:  []string{".*"},
	})

	v := semver.MustParse(releaseID)
	latestRelease, err := updater.UpdateSelf(v, "chnapy/homenet")
	fmt.Println("Last release", latestRelease)

	if err != nil {
		return fmt.Errorf("échec récupération release: %w", err)
	}

	if latestRelease.Version.Equals(v) {
		fmt.Printf("Agent already up-to-date %s\n", latestRelease.Version.String())
	} else {
		fmt.Printf("Agent up-to-date from %s to %s\n", v.String(), latestRelease.Version.String())
	}

	return nil
}
