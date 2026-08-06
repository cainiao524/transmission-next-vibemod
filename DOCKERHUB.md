# Transmission VibeMod

面向 Transmission 4.x 的现代化、响应式第三方 WebUI。基于 React、Vite、Tailwind CSS 与 shadcn/ui 构建，通过 Transmission RPC v17 提供完整的任务管理体验。

## 功能特性

- 任务列表 / 网格两种视图，支持列宽拖动、排序与一键对齐
- 添加磁力链接与种子文件、拖放快速添加
- 开始、暂停、删除、校验、重新汇报、队列排序
- 移动数据位置、标签、Tracker、Peer、文件树与文件优先级
- 批量与范围选择、键盘快捷键、速度历史图表及会话设置
- 深色 / 浅色主题，简体中文与英文界面

## 快速开始

### docker run

```bash
docker run -d \
  --name transmission-next-vibemod \
  -p 9095:80 \
  -e TRANSMISSION_URL=http://host.docker.internal:9091 \
  --add-host host.docker.internal:host-gateway \   # Linux / NAS 需要；Docker Desktop 可删除
  lowsabishi/transmission-next-vibemod:latest
```

### docker-compose

```yaml
services:
  transmission-next-vibemod:
    image: lowsabishi/transmission-next-vibemod:latest
    container_name: transmission-next-vibemod
    extra_hosts:
      - "host.docker.internal:host-gateway"   # Linux / NAS 需要；Docker Desktop 可删除
    ports:
      - "9095:80"
    environment:
      - TRANSMISSION_URL=http://host.docker.internal:9091
    volumes:
      - ./webui:/usr/share/nginx/html
    restart: unless-stopped
```

镜像内置 WebUI、Nginx 与 Transmission RPC 代理配置，无需手动配置。首次启动会自动将内置 WebUI 释放到 `./webui` 目录，之后可直接覆盖该目录文件实时生效。浏览器访问 `http://<主机>:9095`，使用 Transmission RPC 的账户登录即可使用。

> `TRANSMISSION_URL` 是 Transmission RPC 的地址。默认值 `http://host.docker.internal:9091` 适用于 Docker Desktop；Linux / 群晖等 NAS 需在 compose 中添加 `extra_hosts: ["host.docker.internal:host-gateway"]`（docker run 加 `--add-host host.docker.internal:host-gateway`）。也可以直接填写宿主机 IP，例如 `http://192.168.1.100:9091`；同一 Compose 网络可写 `http://transmission:9091`。

## 镜像标签

- `latest`：跟随最新稳定版本
- `v1.5-baka9`：固定版本标签（支持 linux/amd64、linux/arm64）

备用镜像（GHCR）：`ghcr.io/cainiao524/transmission-next-vibemod`

## 相关链接

- GitHub 项目：https://github.com/cainiao524/transmission-next-vibemod
