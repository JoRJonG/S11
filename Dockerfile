# filepath: Dockerfile
FROM node:18-alpine

# ตั้งค่า working directory
WORKDIR /app

# คัดลอก package.json และติดตั้ง dependencies
COPY package*.json ./
RUN npm ci --only=production

# คัดลอกโค้ดทั้งหมด
COPY . .

# Build แอป
RUN npm run build

# เปิดพอร์ต 5000
EXPOSE 5000

# รันในโหมด production
CMD ["npm", "start"]