FROM ubuntu:22.04

# Avoid tzdata interactive prompt during apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install core desktop environment, VNC, and DOOM
RUN apt-get update && apt-get install -y \
    xfce4 \
    xfce4-goodies \
    tigervnc-standalone-server \
    python3-websockify \
    novnc \
    chocolate-doom \
    freedoom \
    && rm -rf /var/lib/apt/lists/*

# Create user
RUN useradd -m -u 1000 webuntu && \
    echo "webuntu:webuntu" | chpasswd && \
    adduser webuntu sudo
USER webuntu
ENV HOME=/home/webuntu
WORKDIR $HOME

# Setup VNC password and xstartup
RUN mkdir -p $HOME/.vnc && \
    echo "webuntu" | vncpasswd -f > $HOME/.vnc/passwd && \
    chmod 600 $HOME/.vnc/passwd && \
    echo "#!/bin/bash\nstartxfce4 &" > $HOME/.vnc/xstartup && \
    chmod +x $HOME/.vnc/xstartup

# Expose port 3000 for websockify
EXPOSE 3000

# Start VNC server and noVNC proxy to bind on 3000
CMD vncserver :1 -geometry 1280x800 -depth 24 -localhost no && \
    websockify --web=/usr/share/novnc/ 3000 localhost:5901
