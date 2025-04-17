package main

import (
	ex "agent/src/executor"
	gen "agent/src/grpc/generated"
	p "agent/src/provider"
	"time"
)

func PrepareData(releaseTag string) *gen.AgentUpdateRequest {

	startTime := time.Now().UnixMilli()

	executor := ex.NewLocalExecutor()

	device := p.GetCurrentInstance(executor)
	device.Type = gen.AgentInstance_DEVICE

	duration := time.Now().UnixMilli() - startTime

	data := gen.AgentUpdateRequest{
		AgentMetadata: &gen.AgentMetadata{
			ReleaseTag:       releaseTag,
			ComputeStartTime: startTime,
			ComputeDuration:  duration,
		},
		Device: &device,
	}

	return &data
}
