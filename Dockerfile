# PromptToPlay Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖（利用缓存）
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# 复制源代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data

# 环境变量默认值
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/prompttoplay.db

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# 启动
CMD ["node", "server.js"]
