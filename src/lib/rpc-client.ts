/** Transmission RPC v17 client with a UI-friendly compatibility layer. */
import type {
  ApplicationPreferences,
  FreeSpaceResponse,
  Session,
  SessionStats,
  Torrent,
  TorrentAddArgs,
  TorrentAddResponse,
  TorrentFilePriority,
  TorrentGetResponse,
  TorrentId,
  TorrentSetArgs,
  Tracker,
  TrackerStat,
} from "./rpc-types"

type JsonRecord = Record<string, unknown>

interface RpcEnvelope<T> {
  result: string
  arguments: T
  tag?: number
}

const CORE_FIELDS = [
  "id", "name", "status", "hashString", "totalSize", "percentDone", "rateDownload", "rateUpload",
  "eta", "addedDate", "doneDate", "activityDate", "downloadDir", "error", "errorString", "uploadedEver",
  "downloadedEver", "uploadRatio", "queuePosition", "isFinished", "isPrivate", "isStalled", "peersConnected",
  "peersSendingToUs", "peersGettingFromUs", "bandwidthPriority", "downloadLimit", "downloadLimited", "uploadLimit",
  "uploadLimited", "honorsSessionLimits", "seedRatioLimit", "seedRatioMode", "seedIdleLimit", "seedIdleMode",
] as const

const OPTIONAL_FIELDS = new Set([
  ...CORE_FIELDS,
  "labels", "trackers", "trackerStats", "files", "fileStats", "peers", "comment", "creator", "dateCreated",
  "trackerList", "secondsDownloading", "secondsSeeding", "peer-limit", "pieceCount", "pieceSize", "haveValid",
  "haveUnchecked", "desiredAvailable", "leftUntilDone", "metadataPercentComplete",
])

const WRITABLE_SESSION_FIELDS = new Set([
  "alt-speed-down", "alt-speed-enabled", "alt-speed-up", "alt-speed-time-begin", "alt-speed-time-enabled",
  "alt-speed-time-end", "alt-speed-time-day", "download-dir", "download-queue-enabled", "download-queue-size",
  "encryption", "peer-limit-global", "peer-limit-per-torrent", "peer-port", "peer-port-random-on-start",
  "port-forwarding-enabled", "rename-partial-files", "seed-queue-enabled", "seed-queue-size", "speed-limit-down",
  "speed-limit-down-enabled", "speed-limit-up", "speed-limit-up-enabled", "start-added-torrents",
  "trash-original-torrent-files", "dht-enabled", "pex-enabled", "lpd-enabled", "utp-enabled", "blocklist-enabled",
  "blocklist-url", "incomplete-dir", "incomplete-dir-enabled",
])

function numberValue(record: JsonRecord, key: string, fallback = 0): number {
  const value = Number(record[key] ?? fallback)
  return Number.isFinite(value) ? value : fallback
}

function booleanValue(record: JsonRecord, key: string, fallback = false): boolean {
  return typeof record[key] === "boolean" ? record[key] as boolean : fallback
}

function stringValue(record: JsonRecord, key: string, fallback = ""): string {
  return typeof record[key] === "string" ? record[key] as string : fallback
}

function trackerHost(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url.split("/")[0] ?? url
  }
}

function mapTracker(raw: JsonRecord): Tracker {
  const announce = stringValue(raw, "announce")
  return {
    id: numberValue(raw, "id"),
    tier: numberValue(raw, "tier"),
    announce,
    scrape: stringValue(raw, "scrape"),
    sitename: stringValue(raw, "sitename", trackerHost(announce)),
  }
}

function mapTrackerStat(raw: JsonRecord): TrackerStat {
  const announce = stringValue(raw, "announce")
  return {
    announce,
    host: stringValue(raw, "host", trackerHost(announce)),
    seederCount: numberValue(raw, "seederCount"),
    leecherCount: numberValue(raw, "leecherCount"),
    lastAnnounceSucceeded: booleanValue(raw, "lastAnnounceSucceeded"),
    lastAnnounceResult: stringValue(raw, "lastAnnounceResult"),
    isBackup: booleanValue(raw, "isBackup"),
  }
}

function mapTorrent(raw: JsonRecord): Torrent {
  const files = Array.isArray(raw.files) ? raw.files as JsonRecord[] : []
  const fileStats = Array.isArray(raw.fileStats) ? raw.fileStats as JsonRecord[] : []
  const pieceSize = numberValue(raw, "pieceSize")
  const haveBytes = numberValue(raw, "haveValid") + numberValue(raw, "haveUnchecked")
  const left = numberValue(raw, "leftUntilDone")
  const desired = numberValue(raw, "desiredAvailable")
  const trackers = Array.isArray(raw.trackers) ? (raw.trackers as JsonRecord[]).map(mapTracker) : []
  const trackerStats = Array.isArray(raw.trackerStats) ? (raw.trackerStats as JsonRecord[]).map(mapTrackerStat) : []

  return {
    id: stringValue(raw, "hashString", String(raw.id ?? "")),
    name: stringValue(raw, "name"),
    status: numberValue(raw, "status") as Torrent["status"],
    hashString: stringValue(raw, "hashString"),
    totalSize: numberValue(raw, "totalSize"),
    percentDone: numberValue(raw, "percentDone"),
    rateDownload: numberValue(raw, "rateDownload"),
    rateUpload: numberValue(raw, "rateUpload"),
    eta: numberValue(raw, "eta", -1),
    addedDate: numberValue(raw, "addedDate"),
    doneDate: numberValue(raw, "doneDate"),
    editDate: numberValue(raw, "activityDate"),
    downloadDir: stringValue(raw, "downloadDir"),
    error: numberValue(raw, "error"),
    errorString: stringValue(raw, "errorString"),
    uploadedEver: numberValue(raw, "uploadedEver"),
    downloadedEver: numberValue(raw, "downloadedEver"),
    uploadRatio: numberValue(raw, "uploadRatio"),
    labels: Array.isArray(raw.labels) ? raw.labels.map(String) : [],
    queuePosition: numberValue(raw, "queuePosition"),
    isFinished: booleanValue(raw, "isFinished", numberValue(raw, "percentDone") >= 1),
    isPrivate: booleanValue(raw, "isPrivate"),
    isStalled: booleanValue(raw, "isStalled"),
    trackers,
    trackerStats,
    files: files.map((file, index) => {
      const stats = fileStats[index] ?? {}
      const wanted = booleanValue(stats, "wanted", true)
      const priority = numberValue(stats, "priority")
      return {
        index,
        name: stringValue(file, "name"),
        length: numberValue(file, "length"),
        bytesCompleted: numberValue(stats, "bytesCompleted", numberValue(file, "bytesCompleted")),
        priority: (!wanted ? 0 : priority > 0 ? 6 : 1) as TorrentFilePriority,
      }
    }),
    peers: Array.isArray(raw.peers) ? raw.peers as Torrent["peers"] : [],
    peersConnected: numberValue(raw, "peersConnected"),
    peersSendingToUs: numberValue(raw, "peersSendingToUs"),
    peersGettingFromUs: numberValue(raw, "peersGettingFromUs"),
    comment: stringValue(raw, "comment"),
    creator: stringValue(raw, "creator"),
    dateCreated: numberValue(raw, "dateCreated"),
    bandwidthPriority: numberValue(raw, "bandwidthPriority"),
    downloadLimit: numberValue(raw, "downloadLimit"),
    downloadLimited: booleanValue(raw, "downloadLimited"),
    uploadLimit: numberValue(raw, "uploadLimit"),
    uploadLimited: booleanValue(raw, "uploadLimited"),
    honorsSessionLimits: booleanValue(raw, "honorsSessionLimits", true),
    seedRatioLimit: numberValue(raw, "seedRatioLimit"),
    seedRatioMode: numberValue(raw, "seedRatioMode"),
    seedIdleLimit: numberValue(raw, "seedIdleLimit"),
    seedIdleMode: numberValue(raw, "seedIdleMode"),
    trackerList: stringValue(raw, "trackerList", trackers.map((tracker) => tracker.announce).join("\n")),
    forceStart: false,
    sequentialDownload: false,
    firstLastPiecePriority: false,
    superSeeding: false,
    autoManagement: false,
    downloadPath: "",
    seedingTimeLimit: 0,
    seedingTimeMode: 0,
    inactiveSeedingTimeLimit: numberValue(raw, "seedIdleLimit"),
    inactiveSeedingTimeMode: numberValue(raw, "seedIdleMode"),
    shareLimitAction: "Stop",
    timeElapsed: numberValue(raw, "secondsDownloading") + numberValue(raw, "secondsSeeding"),
    seedingTime: numberValue(raw, "secondsSeeding"),
    connectionsLimit: numberValue(raw, "peer-limit"),
    downloadedSession: numberValue(raw, "downloadedEver"),
    uploadedSession: numberValue(raw, "uploadedEver"),
    averageDownloadSpeed: 0,
    averageUploadSpeed: 0,
    wastedSize: 0,
    seedsTotal: numberValue(raw, "peersSendingToUs"),
    peersTotal: numberValue(raw, "peersConnected"),
    popularity: 0,
    availability: left <= 0 ? 1 : Math.min(1, desired / left),
    nextAnnounce: 0,
    piecesCount: numberValue(raw, "pieceCount"),
    piecesHave: pieceSize > 0 ? Math.floor(haveBytes / pieceSize) : 0,
    pieceSize,
    lastSeenComplete: numberValue(raw, "activityDate"),
  }
}

class TransmissionRPC {
  private baseUrl = import.meta.env.VITE_TRANSMISSION_RPC_URL || "/transmission/rpc"
  private sessionId: string | null = null
  private authHeader: string | null = sessionStorage.getItem("transmission_basic_auth")

  private async request<T = JsonRecord>(method: string, args?: JsonRecord, retry = true): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (this.sessionId) headers["X-Transmission-Session-Id"] = this.sessionId
    if (this.authHeader) headers.Authorization = this.authHeader
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({ method, arguments: args, tag: Math.floor(Math.random() * 100000) }),
    })
    if (response.status === 409 && retry) {
      this.sessionId = response.headers.get("X-Transmission-Session-Id")
      if (this.sessionId) return this.request<T>(method, args, false)
    }
    if (!response.ok) throw new Error(`Transmission RPC ${response.status}: ${response.statusText}`)
    const data = await response.json() as RpcEnvelope<T>
    if (data.result !== "success") throw new Error(`Transmission RPC：${data.result}`)
    return data.arguments
  }

  async checkAuthentication(): Promise<boolean> {
    try {
      await this.getSession()
      return true
    } catch {
      return false
    }
  }

  async login(username: string, password: string): Promise<void> {
    const previous = this.authHeader
    this.authHeader = `Basic ${btoa(`${username}:${password}`)}`
    this.sessionId = null
    try {
      await this.getSession()
      sessionStorage.setItem("transmission_basic_auth", this.authHeader)
    } catch (error) {
      this.authHeader = previous
      throw error
    }
  }

  async logout(): Promise<void> {
    this.authHeader = null
    this.sessionId = null
    sessionStorage.removeItem("transmission_basic_auth")
  }

  async getTorrents(fields: string[], ids?: TorrentId[]): Promise<TorrentGetResponse> {
    const requested = new Set<string>(CORE_FIELDS)
    fields.forEach((field) => {
      if (OPTIONAL_FIELDS.has(field)) requested.add(field)
      if (field === "editDate") requested.add("activityDate")
      if (field === "files") requested.add("fileStats")
      if (["timeElapsed", "averageDownloadSpeed", "averageUploadSpeed"].includes(field)) requested.add("secondsDownloading")
      if (["timeElapsed", "seedingTime"].includes(field)) requested.add("secondsSeeding")
      if (field === "connectionsLimit") requested.add("peer-limit")
      if (["piecesCount", "piecesHave"].includes(field)) ["pieceCount", "pieceSize", "haveValid", "haveUnchecked"].forEach((item) => requested.add(item))
      if (field === "availability") ["desiredAvailable", "leftUntilDone"].forEach((item) => requested.add(item))
    })
    const args: JsonRecord = { fields: [...requested] }
    if (ids?.length) args.ids = ids
    const response = await this.request<{ torrents: JsonRecord[] }>("torrent-get", args)
    return { torrents: response.torrents.map(mapTorrent) }
  }

  async getSession(): Promise<Session> {
    return this.request<Session>("session-get")
  }

  async getApplicationPreferences(): Promise<ApplicationPreferences> {
    return { ...await this.getSession() } as unknown as ApplicationPreferences
  }

  async setApplicationPreferences(preferences: Partial<ApplicationPreferences>): Promise<void> {
    const values = Object.fromEntries(Object.entries(preferences).filter(([key]) => WRITABLE_SESSION_FIELDS.has(key)))
    if (Object.keys(values).length) await this.request("session-set", values)
  }

  async setSession(args: Partial<Session>) {
    const values = Object.fromEntries(Object.entries(args).filter(([key]) => WRITABLE_SESSION_FIELDS.has(key)))
    if (Object.keys(values).length) await this.request("session-set", values)
    return {}
  }

  async getStats(): Promise<SessionStats> {
    return this.request<SessionStats>("session-stats")
  }

  async startTorrents(ids?: TorrentId[]) { return this.request("torrent-start", ids?.length ? { ids } : {}) }
  async stopTorrents(ids?: TorrentId[]) { return this.request("torrent-stop", ids?.length ? { ids } : {}) }
  async removeTorrents(ids: TorrentId[], deleteData = false) { return this.request("torrent-remove", { ids, "delete-local-data": deleteData }) }

  async addTorrent(args: TorrentAddArgs): Promise<TorrentAddResponse> {
    const addArgs: JsonRecord = {}
    if (args.filename) addArgs.filename = args.filename
    if (args.metainfo) addArgs.metainfo = args.metainfo
    if (args["download-dir"]) addArgs["download-dir"] = args["download-dir"]
    if (args.paused !== undefined) addArgs.paused = args.paused
    if (args.tags?.length) addArgs.labels = args.tags
    const result = await this.request<TorrentAddResponse>("torrent-add", addArgs)
    const added = result["torrent-added"] ?? result["torrent-duplicate"]
    const id = added?.hashString || (added?.id ? String(added.id) : undefined)
    if (id) {
      const setArgs: TorrentSetArgs = {
        labels: args.tags,
        downloadLimit: args.dlLimit ? Math.round(args.dlLimit / 1024) : undefined,
        downloadLimited: Boolean(args.dlLimit),
        uploadLimit: args.upLimit ? Math.round(args.upLimit / 1024) : undefined,
        uploadLimited: Boolean(args.upLimit),
        seedRatioLimit: args.ratioLimit,
        seedRatioMode: args.ratioLimit === undefined ? undefined : 1,
        seedIdleLimit: args.inactiveSeedingTimeLimit,
        seedIdleMode: args.inactiveSeedingTimeLimit === undefined ? undefined : 1,
      }
      await this.setTorrent([id], setArgs)
      if (args.addToTopOfQueue) await this.changeQueuePriority([id], "top")
      if (args.forced) await this.setForceStart([id], true)
    }
    return result
  }

  async getTorrentCategories(): Promise<Array<{ name: string; savePath: string }>> { return [] }
  async getTorrentTags(): Promise<string[]> {
    const data = await this.getTorrents(["labels"])
    return [...new Set(data.torrents.flatMap((torrent) => torrent.labels ?? []))].sort((a, b) => a.localeCompare(b))
  }

  async setForceStart(ids: TorrentId[], value: boolean) { return this.request(value ? "torrent-start-now" : "torrent-start", { ids }) }
  async toggleSequentialDownload(ids: TorrentId[]) { void ids; throw new Error("Transmission 当前版本不支持顺序下载开关") }
  async toggleFirstLastPiecePriority(ids: TorrentId[]) { void ids; throw new Error("Transmission 不支持首尾区块优先开关") }
  async setSuperSeeding(ids: TorrentId[], value: boolean) { void ids; void value; throw new Error("Transmission 不支持超级做种") }
  async setAutoManagement(ids: TorrentId[], value: boolean) { void ids; void value; throw new Error("Transmission 不支持自动种子管理") }

  async changeQueuePriority(ids: TorrentId[], direction: "top" | "up" | "down" | "bottom") {
    return this.request(`queue-move-${direction}`, { ids })
  }

  async setTorrentSavePath(ids: TorrentId[], path: string) { return this.setTorrentLocation(ids, path, true) }
  async setTorrentDownloadPath(_ids: TorrentId[], path: string) {
    if (path) throw new Error("Transmission 只支持统一的数据位置，请使用保存路径")
    return {}
  }

  async setTorrent(ids: TorrentId[], args: TorrentSetArgs) {
    const values: JsonRecord = { ids }
    const directKeys: Array<keyof TorrentSetArgs> = [
      "bandwidthPriority", "downloadLimit", "downloadLimited", "uploadLimit", "uploadLimited", "honorsSessionLimits",
      "seedRatioLimit", "seedRatioMode", "seedIdleLimit", "seedIdleMode", "trackerList", "labels",
    ]
    directKeys.forEach((key) => { if (args[key] !== undefined) values[key] = args[key] })
    if (args.inactiveSeedingTimeLimit !== undefined) values.seedIdleLimit = args.inactiveSeedingTimeLimit
    if (args.inactiveSeedingTimeMode !== undefined) values.seedIdleMode = args.inactiveSeedingTimeMode
    return this.request("torrent-set", values)
  }

  async setFilePriority(id: TorrentId, fileIds: number[], priority: TorrentFilePriority) {
    if (!fileIds.length) return {}
    const values: JsonRecord = { ids: [id] }
    if (priority === 0) values["files-unwanted"] = fileIds
    else {
      values["files-wanted"] = fileIds
      values[priority >= 6 ? "priority-high" : "priority-normal"] = fileIds
    }
    return this.request("torrent-set", values)
  }

  async setTorrentLocation(ids: TorrentId[], location: string, move = true) { return this.request("torrent-set-location", { ids, location, move }) }
  async renameTorrentPath(id: TorrentId, path: string, name: string) { return this.request("torrent-rename-path", { ids: [id], path, name }) }
  async freeSpace(path: string): Promise<FreeSpaceResponse> { return this.request<FreeSpaceResponse>("free-space", { path }) }
  async portTest(): Promise<{ "port-is-open": boolean }> { return this.request("port-test") }
  async verifyTorrents(ids?: TorrentId[]) { return this.request("torrent-verify", ids?.length ? { ids } : {}) }
  async reannounceTorrents(ids?: TorrentId[]) { return this.request("torrent-reannounce", ids?.length ? { ids } : {}) }
}

export const rpc = new TransmissionRPC()
