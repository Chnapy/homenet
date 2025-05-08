package grpc

import (
	"context"
	"log"
	"time"

	env "agent/src/env"
	gen "agent/src/grpc/generated"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func Grpc(data *gen.AgentUpdateRequest) {
	addr := env.Env.BackendRoute

	// Set up a connection to the server.
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Grpc: did not connect - %v", err)
	}
	defer conn.Close()
	c := gen.NewAgentClient(conn)

	// Contact the server and print out its response.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	log.Println("Grpc: connection state -", conn.GetState().String())

	startTime := time.Now().UnixMilli()
	r, err := c.Update(ctx, data)
	log.Println("Grpc: duration", time.Now().UnixMilli()-startTime)
	if err != nil {
		log.Fatalf("Grpc: could not greet - %v", err)
	}
	log.Printf("Grpc: response - %s", r.Message)
}
