package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

var dockerClient *client.Client
var activeContainerID string
var targetURL *url.URL

func init() {
	var err error
	dockerClient, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Printf("Warning: Failed to initialize Docker client. Error: %v", err)
	}
}

func main() {
	if dockerClient == nil {
		log.Fatal("Docker client not initialized. Make sure Docker is running.")
	}

	// Spin up the container immediately on boot
	ctx := context.Background()
	log.Println("Initializing Webuntu Cloud OS...")

	imageName := "webuntu-desktop:latest"
	_, _, err := dockerClient.ImageInspectWithRaw(ctx, imageName)
	if err != nil {
		log.Fatalf("Error: Custom image %s not found. Please run 'docker build -t webuntu-desktop .' first.", imageName)
	}

	// Create persistent drive (Idea 1)
	drivePath := "./webuntu_drive"
	os.MkdirAll(drivePath, 0777)
	absDrivePath, _ := filepath.Abs(drivePath)

	// Inject custom .bashrc for AI alias and neofetch
	bashrcPath := filepath.Join(drivePath, ".bashrc")
	if _, err := os.Stat(bashrcPath); os.IsNotExist(err) {
		bashrcContent := `
# Webuntu Ultimate .bashrc
neofetch

alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ai='ollama run qwen2:0.5b'

echo -e "\e[1;32mWelcome to Webuntu Cloud OS!\e[0m"
echo -e "Type \e[1;36mai\e[0m and press Enter to chat with your local AI assistant."
`
		os.WriteFile(bashrcPath, []byte(bashrcContent), 0644)
	}

	hostConfig := &container.HostConfig{
		AutoRemove:  true,
		ShmSize:     1024 * 1024 * 1024, // 1GB shared memory for browsers
		SecurityOpt: []string{"seccomp=unconfined"},
		Binds: []string{
			fmt.Sprintf("%s:/config", absDrivePath),
		},
	}

	// Attempt hardware acceleration
	if _, err := os.Stat("/dev/dri"); err == nil {
		hostConfig.Resources.Devices = []container.DeviceMapping{
			{
				PathOnHost:        "/dev/dri",
				PathInContainer:   "/dev/dri",
				CgroupPermissions: "mrw",
			},
		}
		log.Println("Hardware acceleration enabled (/dev/dri passed to container)")
	}

	// Create a new container
	resp, err := dockerClient.ContainerCreate(ctx, &container.Config{
		Image: imageName,
		Tty:   true,
		OpenStdin: true,
		Env: []string{
			"PUID=1000",
			"PGID=1000",
			"TZ=Etc/UTC",
		},
	}, hostConfig, nil, nil, "")

	if err != nil {
		log.Fatalf("Failed to create container: %v", err)
	}

	if err := dockerClient.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		log.Fatalf("Failed to start container: %v", err)
	}
	
	activeContainerID = resp.ID
	log.Printf("Webuntu Cloud VM started successfully (Container ID: %s)", activeContainerID)

	// Get the container's internal IP
	inspect, err := dockerClient.ContainerInspect(ctx, activeContainerID)
	internalIP := "localhost"
	if err == nil && inspect.NetworkSettings != nil {
		internalIP = inspect.NetworkSettings.IPAddress
	}

	// webtop (KasmVNC) runs its web server on port 3000
	targetURL, _ = url.Parse(fmt.Sprintf("http://%s:3000", internalIP))
	
	log.Printf("Proxying traffic to Cloud VM at %s", targetURL.String())

	// Create a reverse proxy to forward all HTTP/WebSocket traffic to the KasmVNC server
	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	
	// Webtop KasmVNC requires some specific headers sometimes, but usually standard proxy works
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// KasmVNC sometimes redirects or sets cookies, the proxy handles this transparently
		proxy.ServeHTTP(w, r)
	})

	port := ":8080"
	fmt.Printf("\n=======================================================\n")
	fmt.Printf("🚀 WEBUNTU CLOUD DESKTOP is LIVE!\n")
	fmt.Printf("🌐 Open http://localhost%s in your browser\n", port)
	fmt.Printf("=======================================================\n")
	
	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
