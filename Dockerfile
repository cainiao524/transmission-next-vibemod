FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.29-alpine

ENV TRANSMISSION_URL=http://host.docker.internal:9091

ARG VERSION_SHA

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/init-webui.sh /docker-entrypoint.d/10-init-webui.sh
RUN chmod +x /docker-entrypoint.d/10-init-webui.sh
COPY --from=builder /app/dist /usr/share/nginx/html.default
COPY --from=builder /app/dist /usr/share/nginx/html

# 写入版本标记（含防误改声明），绑定镜像版本；VERSION= 行变化即视为镜像更新
RUN printf '# WebUI 版本标记：由镜像构建时自动写入，绑定当前镜像版本。\n# 请勿手动修改 VERSION= 行：改动会在容器启动时触发 WebUI 全量替换（页面重置为镜像内置版本）。\nVERSION=%s\n' "${VERSION_SHA}" > /usr/share/nginx/html.default/VERSION

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
