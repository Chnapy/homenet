FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

ENV NODE_ENV=production
ENV VITE_BACKEND_API=http://backend:8081/api
# http://vps-0c88ff97.vps.ovh.net:8081

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist/ /usr/share/nginx/html
COPY nginx/ /etc/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
