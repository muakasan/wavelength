# First stage - build static React files
FROM node:14.3.0-alpine AS build

WORKDIR /usr/src/app/

# Install npm deps
COPY ./client/package*.json ./client/
RUN npm install --prefix ./client

# Build static files
COPY client/src ./client/src
COPY client/public ./client/public
RUN npm run build --prefix ./client


# Second stage - setup run container
FROM python:3.8.3-alpine

WORKDIR /usr/src/app/

# Copy over static files, backend, requirements.txt
COPY --from=build /usr/src/app/client/build ./client/build
COPY backend ./backend
COPY requirements.txt requirements.txt

# Install requirements.txt and dependencies
RUN apk add --update gcc
RUN apk add --update linux-headers
RUN apk add --update musl-dev
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

CMD [ "gunicorn", "--chdir", "./backend", "--worker-class", "eventlet", "-w", "1", "server:app"]
