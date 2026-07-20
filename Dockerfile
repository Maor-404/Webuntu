FROM linuxserver/webtop:ubuntu-xfce

# Install Webuntu dependencies, DOOM, and massive application suite
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    chocolate-doom \
    freedoom \
    chromium-browser \
    gimp \
    vlc \
    libreoffice \
    geany \
    && rm -rf /var/lib/apt/lists/*
