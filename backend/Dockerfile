# Stage 1: Build the backend
FROM node:20.14.0-alpine AS backend-builder
WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
COPY . .
RUN npm run build --production

# Stage 2: Run the backend application
ARG PORT
ENV PORT=$PORT
FROM node:20.14.0-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=443
COPY --from=backend-builder /app/ .
EXPOSE 443
CMD ["npm", "run", "start"]
#test
