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
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := gen.NewAgentClient(conn)

	// Contact the server and print out its response.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	r, err := c.Update(ctx, data)
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("gRPC response: %s", r.Foo)
}
