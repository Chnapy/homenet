package main

import (
	grcp "agent/src/grpc"
	"fmt"

	"google.golang.org/protobuf/encoding/protojson"
)

var releaseID string

func main() {
	fmt.Println("releaseID", releaseID)
	if err := AutoUpdate(releaseID); err != nil {
		fmt.Printf("Mise à jour échouée: %v", err)
	}

	data := PrepareData(123)

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
