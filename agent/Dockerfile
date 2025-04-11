# FROM dockcross/linux-armv7

# # Installer les dépendances OpenWRT
# RUN apt update && apt install -y \
#     python3-dev \
#     libc6-dev-armel-cross \
#     zlib1g-dev \
#     binutils-arm-linux-gnueabi \
#     libncurses5-dev \
#     build-essential \
#     bison \
#     flex \
#     libssl-dev \
#     bc

# WORKDIR /workspace

# # Copier les fichiers sources
# COPY . .

# RUN pip install -r requirements.txt

# # # Compiler le programme (remplacez 'toto.c' par votre fichier)
# # RUN arm-linux-gnueabihf-gcc toto/toto.c -o script_armv7 \
# #     -I/usr/include/python3.11 \
# #     # -DSIZEOF_WCHAR_T=4 \
# #     # -DHAVE_PTHREAD_H=1 \
# #     -DPLATFORM_UNKNOWN \
# #     -lpython3.11 \
# #     -static

FROM arm32v7/python:3.11-slim

RUN apt update && apt install -y \
    # python3-dev \
    libc6-dev-armel-cross \
    zlib1g-dev \
    # binutils-arm-linux-gnueabi \
    libncurses5-dev \
    build-essential \
    bison \
    flex \
    libssl-dev \
    libffi-dev \
    libsodium-dev \
    bc

WORKDIR /app

RUN uname -a

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

RUN make build-agent

CMD ["./dist/agent"]
