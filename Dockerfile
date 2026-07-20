FROM linuxserver/webtop:ubuntu-xfce

# Install Webuntu dependencies, DOOM, and massive application suite
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    curl \
    gpg \
    chocolate-doom \
    freedoom \
    chromium-browser \
    gimp \
    vlc \
    libreoffice \
    geany \
    python3 \
    python3-pip \
    nodejs \
    npm \
    git \
    htop \
    neofetch \
    micro \
    && rm -rf /var/lib/apt/lists/*

# Install Starship prompt (blazing-fast Rust shell prompt)
RUN curl -sS https://starship.rs/install.sh | sh -s -- -y

# Install ultra-lightweight VSCodium and patch launcher
RUN wget -qO - https://gitlab.com/paulcarroty/vscodium-deb-rpm-repo/raw/master/pub.gpg \
    | gpg --dearmor \
    | dd of=/usr/share/keyrings/vscodium-archive-keyring.gpg && \
    echo 'deb [ signed-by=/usr/share/keyrings/vscodium-archive-keyring.gpg ] https://download.vscodium.com/debs vscodium main' \
    | tee /etc/apt/sources.list.d/vscodium.list && \
    apt-get update && apt-get install -y --no-install-recommends codium && \
    sed -i 's/Exec=\/usr\/share\/codium\/codium/Exec=\/usr\/share\/codium\/codium --disable-gpu --no-sandbox/' /usr/share/applications/codium.desktop && \
    rm -rf /var/lib/apt/lists/*

# Install Ollama AI, pre-pull qwen2:0.5b, and set up background service
RUN curl -fsSL https://ollama.com/install.sh | sh && \
    nohup ollama serve >/dev/null 2>&1 & sleep 5 && ollama pull qwen2:0.5b && \
    mkdir -p /custom-services.d/ollama && \
    echo "#!/usr/bin/with-contenv bash\nexec s6-setuidgid abc ollama serve" > /custom-services.d/ollama/run && \
    chmod +x /custom-services.d/ollama/run
