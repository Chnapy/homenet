package main

import (
	"fmt"
	"log"

	grpc "agent/src/grpc"

	"google.golang.org/protobuf/encoding/protojson"
)

var releaseTag string

func main() {
	log.Println("Homenet agent: start")

	updated, err := AutoUpdate(releaseTag)

	if err != nil {
		fmt.Printf("Main: AutoUpdate failed %v", err)
	}

	if updated {
		return
	}

	CheckCron()

	preparedData := PrepareData(releaseTag)

	marshaler := protojson.MarshalOptions{
		Indent:          "  ",
		UseEnumNumbers:  false, // Use enum string names
		EmitUnpopulated: true,
	}
	out, err := marshaler.Marshal(preparedData)
	if err != nil {
		fmt.Println("Main: error preparedData marshaling -", err)
		return
	}

	fmt.Println()
	fmt.Println("Main: preparedData -", string(out))

	grpc.Grpc(preparedData)

	log.Println("Homenet agent: end")
}
