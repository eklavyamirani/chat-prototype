FROM mcr.microsoft.com/devcontainers/dotnet:1-8.0-bookworm

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# pull the latest nvim. This is a workaround for debian's nvim being too old.
# TODO: can this be turned into a devcontainer feature?
RUN curl --fail-with-body -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux-arm64.tar.gz \
     && sudo rm -rf /opt/nvim \
     && sudo tar -C /opt -xzf nvim-linux-arm64.tar.gz

# now set the user to be vscode so we can setup the nvim config for that user.
USER vscode

RUN git clone https://github.com/eklavyamirani/kickstart.nvim.git "${XDG_CONFIG_HOME:-$HOME/.config}"/nvim

RUN echo 'export PATH="$PATH:/opt/nvim-linux-arm64/bin"' >> /home/vscode/.zshrc

# [Optional] Uncomment this line to install global node packages.
# RUN su vscode -c "source /usr/local/share/nvm/nvm.sh && npm install -g <your-package-here>" 2>&1
