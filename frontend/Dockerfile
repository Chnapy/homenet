FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

# RUN npm prune --omit=dev
# RUN rm -R src public

FROM nginx:alpine

COPY --from=build /app/dist/ /usr/share/nginx/html
COPY nginx/ /etc/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
