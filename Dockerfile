FROM lscr.io/linuxserver/novnc:latest

# Install Webuntu dependencies and DOOM
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    chocolate-doom \
    freedoom \
    htop \
    curl \
    git \
    build-essential \
    python3 \
    neofetch && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add a custom Webuntu background or config if needed
# COPY ./assets/wallpaper.jpg /config/.config/xfce4/desktop/

EXPOSE 3000
EXPOSE 8080
