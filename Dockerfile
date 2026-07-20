FROM linuxserver/webtop:ubuntu-xfce

# Install Webuntu dependencies, DOOM, and massive application suite
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    gpg \
    chocolate-doom \
    freedoom \
    chromium-browser \
    gimp \
    vlc \
    libreoffice \
    geany \
    && rm -rf /var/lib/apt/lists/*

# Install ultra-lightweight VSCodium and patch launcher
RUN wget -qO - https://gitlab.com/paulcarroty/vscodium-deb-rpm-repo/raw/master/pub.gpg \
    | gpg --dearmor \
    | dd of=/usr/share/keyrings/vscodium-archive-keyring.gpg && \
    echo 'deb [ signed-by=/usr/share/keyrings/vscodium-archive-keyring.gpg ] https://download.vscodium.com/debs vscodium main' \
    | tee /etc/apt/sources.list.d/vscodium.list && \
    apt-get update && apt-get install -y --no-install-recommends codium && \
    sed -i 's/Exec=\/usr\/share\/codium\/codium/Exec=\/usr\/share\/codium\/codium --disable-gpu --no-sandbox/' /usr/share/applications/codium.desktop && \
    rm -rf /var/lib/apt/lists/*
