FROM node:18-alpine
WORKDIR /app
# Копіюємо конфіги з папки server
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install
# Копіюємо все інше (включаючи папку client рівнем вище)
WORKDIR /app
COPY . .
WORKDIR /app/server
EXPOSE 3000
CMD ["node", "index.js"]
