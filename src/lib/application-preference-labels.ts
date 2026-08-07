interface PreferenceOptionTranslation {
  value: string | number
  zh: string
  en: string
}

export interface PreferenceOption {
  value: string | number
  label: string
}

const PREFERENCE_OPTIONS: Record<string, readonly PreferenceOptionTranslation[]> = {
  encryption: [
    { value: "preferred", zh: "首选加密（允许明文）", en: "Prefer encryption (allow plaintext)" },
    { value: "required", zh: "强制加密", en: "Require encryption" },
    { value: "tolerated", zh: "禁止加密", en: "Disallow encryption" },
  ],
  "alt-speed-time-day": [
    { value: 127, zh: "每天", en: "Every day" },
    { value: 1, zh: "周日", en: "Sunday" },
    { value: 2, zh: "周一", en: "Monday" },
    { value: 4, zh: "周二", en: "Tuesday" },
    { value: 8, zh: "周三", en: "Wednesday" },
    { value: 16, zh: "周四", en: "Thursday" },
    { value: 32, zh: "周五", en: "Friday" },
    { value: 64, zh: "周六", en: "Saturday" },
  ],
}

const ZH_PREFERENCE_LABELS: Record<string, string> = {
  "start-added-torrents": "添加种子后自动开始",
  "trash-original-torrent-files": "添加种子后删除原始 .torrent 文件",
  "rename-partial-files": "为未完成文件添加 .part 后缀",
  "incomplete-dir-enabled": "启用未完成文件目录",
  "incomplete-dir": "未完成文件保存目录",
  "download-dir": "默认下载目录",
  "download-queue-enabled": "启用下载队列",
  "download-queue-size": "最大同时下载数",
  "seed-queue-enabled": "启用做种队列",
  "seed-queue-size": "最大同时做种数",
  "speed-limit-down": "下载速度限制 (KB/s)",
  "speed-limit-down-enabled": "启用下载速度限制",
  "speed-limit-up": "上传速度限制 (KB/s)",
  "speed-limit-up-enabled": "启用上传速度限制",
  "alt-speed-down": "备用下载速度限制 (KB/s)",
  "alt-speed-up": "备用上传速度限制 (KB/s)",
  "alt-speed-enabled": "启用备用速度限制",
  "alt-speed-time-enabled": "启用备用速度时间表",
  "alt-speed-time-begin": "备用速度开始时间（从 0:00 起分钟数）",
  "alt-speed-time-end": "备用速度结束时间（从 0:00 起分钟数）",
  "alt-speed-time-day": "备用速度生效日",
  "peer-port": "监听端口",
  "peer-port-random-on-start": "启动时随机选择端口",
  "port-forwarding-enabled": "启用端口转发 (UPnP / NAT-PMP)",
  "peer-limit-global": "全局最大连接数",
  "peer-limit-per-torrent": "每个种子最大连接数",
  encryption: "加密模式",
  "peer-congestion-algorithm": "拥塞控制算法",
  "peer-id-ttl-hours": "Peer ID 保留时间（小时）",
  "peer-socket-tos": "对等连接服务类型 (TOS)",
  "dht-enabled": "启用 DHT",
  "pex-enabled": "启用 PEX（对等交换）",
  "lpd-enabled": "启用本地对等发现 (LPD)",
  "utp-enabled": "启用 µTP",
  "blocklist-enabled": "启用 IP 黑名单",
  "blocklist-url": "IP 黑名单地址",
  "script-torrent-done-enabled": "种子完成时运行脚本",
  "script-torrent-done-filename": "完成时执行的脚本路径",
  "cache-size-mb": "磁盘缓存大小 (MB)",
  "queue-stalled-enabled": "启用停滞检测",
  "queue-stalled-minutes": "停滞判定时间（分钟）",
  "rpc-version": "RPC 版本",
  "rpc-version-minimum": "最低 RPC 版本",
  version: "Transmission 版本",
  "download-dir-free-space": "下载目录剩余空间",
}

const EN_PREFERENCE_LABELS: Record<string, string> = {
  "start-added-torrents": "Start added torrents automatically",
  "trash-original-torrent-files": "Delete the original .torrent after adding",
  "rename-partial-files": "Append .part to incomplete files",
  "incomplete-dir-enabled": "Enable incomplete file directory",
  "incomplete-dir": "Incomplete file directory",
  "download-dir": "Default download directory",
  "download-queue-enabled": "Enable download queue",
  "download-queue-size": "Maximum active downloads",
  "seed-queue-enabled": "Enable seed queue",
  "seed-queue-size": "Maximum active seeds",
  "speed-limit-down": "Download speed limit (KB/s)",
  "speed-limit-down-enabled": "Enable download speed limit",
  "speed-limit-up": "Upload speed limit (KB/s)",
  "speed-limit-up-enabled": "Enable upload speed limit",
  "alt-speed-down": "Alternative download speed limit (KB/s)",
  "alt-speed-up": "Alternative upload speed limit (KB/s)",
  "alt-speed-enabled": "Enable alternative speed limits",
  "alt-speed-time-enabled": "Enable alternative speed schedule",
  "alt-speed-time-begin": "Alternative speed start time (minutes from 0:00)",
  "alt-speed-time-end": "Alternative speed end time (minutes from 0:00)",
  "alt-speed-time-day": "Alternative speed schedule days",
  "peer-port": "Listening port",
  "peer-port-random-on-start": "Pick a random port on start",
  "port-forwarding-enabled": "Enable port forwarding (UPnP / NAT-PMP)",
  "peer-limit-global": "Global peer limit",
  "peer-limit-per-torrent": "Peer limit per torrent",
  encryption: "Encryption mode",
  "peer-congestion-algorithm": "Congestion control algorithm",
  "peer-id-ttl-hours": "Peer ID TTL (hours)",
  "peer-socket-tos": "Peer socket TOS",
  "dht-enabled": "Enable DHT",
  "pex-enabled": "Enable PEX (peer exchange)",
  "lpd-enabled": "Enable local peer discovery (LPD)",
  "utp-enabled": "Enable µTP",
  "blocklist-enabled": "Enable IP blocklist",
  "blocklist-url": "IP blocklist URL",
  "script-torrent-done-enabled": "Run script when torrent completes",
  "script-torrent-done-filename": "Script path to run on completion",
  "cache-size-mb": "Disk cache size (MB)",
  "queue-stalled-enabled": "Enable stalled detection",
  "queue-stalled-minutes": "Stalled threshold (minutes)",
  "rpc-version": "RPC version",
  "rpc-version-minimum": "Minimum RPC version",
  version: "Transmission version",
  "download-dir-free-space": "Download directory free space",
}
export function getPreferenceLabel(key: string, locale: "en" | "zh"): string {
  const table = locale === "zh" ? ZH_PREFERENCE_LABELS : EN_PREFERENCE_LABELS
  return table[key] ?? key
}

export function getPreferenceOptions(
  key: string,
  locale: "en" | "zh",
): readonly PreferenceOption[] | undefined {
  return PREFERENCE_OPTIONS[key]?.map((option) => ({
    value: option.value,
    label: locale === "zh" ? option.zh : option.en,
  }))
}
