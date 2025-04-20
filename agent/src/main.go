package main

import (
	"fmt"
	"log"

	"google.golang.org/protobuf/encoding/protojson"
)

var releaseTag string

func main() {
	log.Println("Homenet agent")

	updated, err := AutoUpdate(releaseTag)

	if err != nil {
		fmt.Printf("Auto-update failed: %v", err)
	}

	if updated {
		return
	}

	CheckCron()

	data := PrepareData(releaseTag)

	marshaler := protojson.MarshalOptions{
		Indent:          "  ",
		UseEnumNumbers:  false, // Use enum string names
		EmitUnpopulated: true,
	}
	out, err := marshaler.Marshal(data)
	if err != nil {
		fmt.Println("Error marshaling:", err)
		return
	}

	fmt.Println()
	fmt.Println(string(out))

	grcp.Grpc(data)
}
