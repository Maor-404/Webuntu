FROM linuxserver/webtop:ubuntu-xfce

# Install Webuntu dependencies and DOOM
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    chocolate-doom \
    freedoom \
    && rm -rf /var/lib/apt/lists/*
