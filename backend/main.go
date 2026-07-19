package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

// Fly.io API configuration
const flyAPIUrl = "https://api.machines.dev/v1/apps"
var flyAppName = os.Getenv("FLY_APP_NAME") // Needs to be set to your fly app name
var flyToken = os.Getenv("FLY_API_TOKEN")

func main() {
	if flyAppName == "" {
		flyAppName = "webuntu-desktop-nodes" // Default fallback
	}

	http.HandleFunc("/api/start", handleStartMachine)
	http.HandleFunc("/ws/proxy", handleMachineWSProxy)

	port := ":8080"
	fmt.Printf("Webuntu Cloud Orchestrator running on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

// handleStartMachine requests Fly.io to boot an ephemeral micro-VM
func handleStartMachine(w http.ResponseWriter, r *http.Request) {
	if flyToken == "" {
		http.Error(w, "Server not configured for cloud deployment (missing FLY_API_TOKEN)", http.StatusInternalServerError)
		return
	}

	// Machine creation payload
	payload := map[string]interface{}{
		"name":   "", // Auto-generate name
		"region": "iad", // Ashburn, VA (or closest to user)
		"config": map[string]interface{}{
			"image": "registry.fly.io/webuntu-desktop:latest",
			"guest": map[string]interface{}{
				"cpu_kind": "shared",
				"cpus":     1,
				"memory_mb": 1024,
			},
			"auto_destroy": true, // Critical for "No Combustion" - auto delete on exit
		},
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/%s/machines", flyAPIUrl, flyAppName), bytes.NewBuffer(body))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	req.Header.Set("Authorization", "Bearer "+flyToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to contact cloud API: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		http.Error(w, fmt.Sprintf("Cloud provider rejected request: %s", string(respBody)), resp.StatusCode)
		return
	}

	// Forward the machine ID and internal IP back to the frontend
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// handleMachineWSProxy routes the user's local WebSocket traffic to the internal cloud VM
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

	// Connect to the target machine via Flycast internal network (e.g. noVNC port 6080)
	targetURL := fmt.Sprintf("ws://[%s]:6080/websockify", machineIP)
	
	// Dial the internal machine
	machineWS, _, err := websocket.DefaultDialer.Dial(targetURL, nil)
	if err != nil {
		log.Printf("Failed to connect to micro-VM %s: %v", machineIP, err)
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
