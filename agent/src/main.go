package main

import (
	grcp "agent/src/grpc"
	"fmt"

	"google.golang.org/protobuf/encoding/protojson"
)

var releaseID string

func main() {
	fmt.Println("release", releaseID)

	// var launcherPath string = ""
	var releaseId int32 = 123

	data := PrepareData(releaseId)

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
