FROM node:16

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y sqlite3 && \
    apt-get install -y libsodium-dev

RUN npm i npm@latest -g

WORKDIR /usr/src/app
COPY app/package*.json ./
RUN npm i

COPY app/ /usr/src/app

CMD containers/pawn/entrypoint
