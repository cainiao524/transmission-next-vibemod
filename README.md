<p align="center">
  <img src="public/favicon.svg" width="88" height="88" alt="Transmission VibeMod" />
</p>

<h1 align="center">Transmission VibeMod</h1>

<p align="center">面向 Transmission 4.x 的现代化响应式网页界面</p>

<p align="center">
  <a href="https://github.com/cainiao524/tranemission-next-vibemod/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/cainiao524/tranemission-next-vibemod/build.yml?branch=main&label=%E6%9E%84%E5%BB%BA" alt="构建状态" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/cainiao524/tranemission-next-vibemod" alt="许可证" /></a>
  <img src="https://img.shields.io/badge/Transmission-4.x-d76b2b" alt="Transmission 兼容版本" />
</p>

## 项目说明

Transmission VibeMod 使用 React、Vite、Tailwind CSS 与 shadcn/ui 构建，通过 Transmission RPC v17 管理任务。项目参考了 [qbittorrent-next-ui](https://github.com/cainiao524/qbittorrent-next-ui) 的视觉与交互，但通信层已改为 `/transmission/rpc`，不是 qBittorrent Web API。

当前版本支持任务列表、添加磁力链接与种子文件、拖放快速添加、开始与暂停、删除、校验、重新汇报、队列排序、移动数据位置、标签、Tracker、Peer、文件树、文件优先级、批量与范围选择、键盘快捷键、速度历史图表及会话设置。

## 使用发行版安装

从 [Releases](https://github.com/cainiao524/tranemission-next-vibemod/releases/latest) 下载 `tranemission-next-vibemod.zip`，解压到网页服务器目录。静态页面必须与 Transmission RPC 位于同源反向代理后，不能只用浏览器直接打开 `index.html`。

仓库提供了 nginx 示例：

```text
tranemission-next-vibemod/
├─ docker-compose.yml
├─ nginx.conf
└─ webui/
   ├─ index.html
   └─ assets/
```

下载并启动：

```bash
mkdir -p tranemission-next-vibemod/webui
cd tranemission-next-vibemod
curl -L https://github.com/cainiao524/tranemission-next-vibemod/releases/latest/download/tranemission-next-vibemod.zip -o webui.zip
unzip webui.zip -d webui
curl -L https://raw.githubusercontent.com/cainiao524/tranemission-next-vibemod/main/docker-compose.yml -o docker-compose.yml
curl -L https://raw.githubusercontent.com/cainiao524/tranemission-next-vibemod/main/nginx.conf -o nginx.conf
docker compose up -d
```

默认网页端口为 `40984`。请在 `nginx.conf` 中把 `proxy_pass` 的地址改成 Transmission RPC 的真实地址，例如：

```nginx
proxy_pass http://192.168.50.149:9091/transmission/rpc;
```

如果需要其他网页端口，可以执行：

```bash
WEBUI_PORT=8088 docker compose up -d
```

## NAS 安装示例

本项目的测试部署目录为：

```text
/vol1/1000/Docker/Compose/tranemission-next-vibemod
```

部署完成后访问：

```text
http://NAS地址:40984
```

使用 Transmission RPC 的用户名和密码登录；如果服务端未启用认证，页面会自动进入。

## 从源码构建

需要 Node.js 22 和 pnpm 10：

```bash
git clone https://github.com/cainiao524/tranemission-next-vibemod.git
cd tranemission-next-vibemod
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

构建结果位于 `dist/`。开发服务器默认把 `/transmission` 代理到 `http://127.0.0.1:9091`。Transmission 位于其他地址时：

```bash
VITE_TRANSMISSION_PROXY_TARGET=http://192.168.50.149:9091 pnpm dev
```

前端 RPC 路径也可以在构建时通过 `VITE_TRANSMISSION_RPC_URL` 修改，默认值为 `/transmission/rpc`。

## 说明

Transmission RPC 不提供 qBittorrent 的种子创建器、导出原始 `.torrent`、超级做种、自动种子管理、顺序下载与首尾区块优先接口，因此本项目不会显示无法实际执行的相关按钮。

## 许可证

[MIT](LICENSE)
