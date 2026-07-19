package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

var dockerClient *client.Client

func init() {
	var err error
	dockerClient, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Printf("Warning: Failed to initialize Docker client. Error: %v", err)
	}
}

func main() {
	http.HandleFunc("/api/start", handleStartContainer)
	http.HandleFunc("/ws/proxy", handleMachineWSProxy)

	port := ":8080"
	fmt.Printf("Webuntu Codespaces Orchestrator running on http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

// handleStartContainer spins up a fresh Ubuntu container inside Codespaces via Docker-in-Docker
func handleStartContainer(w http.ResponseWriter, r *http.Request) {
	if dockerClient == nil {
		http.Error(w, "Docker client not initialized.", http.StatusInternalServerError)
		return
	}

	ctx := context.Background()

	// Use our custom local image or fallback to the base
	imageName := "webuntu-desktop:latest"
	
	// Check if our custom image exists locally, if not, use the base for testing
	_, _, err := dockerClient.ImageInspectWithRaw(ctx, imageName)
	if err != nil {
		log.Printf("Custom image %s not found locally, falling back to base image", imageName)
		imageName = "linuxserver/novnc:latest"
	}

	resp, err := dockerClient.ContainerCreate(ctx, &container.Config{
		Image: imageName,
		Tty:   true,
		OpenStdin: true,
	}, &container.HostConfig{
		AutoRemove: true, // Container deletes itself when stopped
	}, nil, nil, "")

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create container: %v", err), http.StatusInternalServerError)
		return
	}

	if err := dockerClient.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		http.Error(w, fmt.Sprintf("Failed to start container: %v", err), http.StatusInternalServerError)
		return
	}
	
	// Get the container's internal IP to proxy noVNC traffic to it
	inspect, err := dockerClient.ContainerInspect(ctx, resp.ID)
	internalIP := "localhost"
	if err == nil && inspect.NetworkSettings != nil {
		internalIP = inspect.NetworkSettings.IPAddress
	}

	w.Header().Set("Content-Type", "application/json")
	// Frontend expects private_ip
	fmt.Fprintf(w, `{"containerId": "%s", "private_ip": "%s"}`, resp.ID, internalIP)
}

// handleMachineWSProxy routes the user's local WebSocket traffic to the internal Docker container
func handleMachineWSProxy(w http.ResponseWriter, r *http.Request) {
	machineIP := r.URL.Query().Get("ip")
	if machineIP == "" {
		http.Error(w, "Missing target machine IP", http.StatusBadRequest)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade client to websocket: %v", err)
		return
	}
	defer ws.Close()

	// Connect to the target Docker container's internal IP on the default websockify port
	targetURL := fmt.Sprintf("ws://%s:3000/websockify", machineIP)
	
	// Dial the internal machine
	machineWS, _, err := websocket.DefaultDialer.Dial(targetURL, nil)
	if err != nil {
		log.Printf("Failed to connect to local container %s: %v", machineIP, err)
		return
	}
	defer machineWS.Close()

	// Stream from Machine -> Client
	go func() {
		for {
			messageType, p, err := machineWS.ReadMessage()
			if err != nil {
				return
			}
			if err := ws.WriteMessage(messageType, p); err != nil {
				return
			}
		}
	}()

	// Stream from Client -> Machine
	for {
		messageType, p, err := ws.ReadMessage()
		if err != nil {
			break
		}
		if err := machineWS.WriteMessage(messageType, p); err != nil {
			break
		}
	}
}
