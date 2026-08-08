"use client"
import { useState, useCallback, useEffect } from "react"
import { rpc } from "@/lib/rpc-client"
import { useAppSettings } from "@/lib/app-settings-context"
import { getRequiredRpcFields } from "@/lib/columns"
import type { Torrent, SessionStats } from "@/lib/rpc-types"

const TORRENT_DISPLAY_FIELDS = [
  "id", "name", "status", "hashString", "totalSize", "size", "percentDone",
  "rateDownload", "rateUpload", "eta", "downloadDir", "error", "errorString",
  "uploadedEver", "downloadedEver", "uploadRatio", "labels", "queuePosition",
  "isFinished", "isPrivate", "isStalled", "peersConnected", "peersSendingToUs",
  "peersGettingFromUs", "category", "forceStart", "sequentialDownload",
  "firstLastPiecePriority", "superSeeding", "autoManagement", "downloadPath",
  "timeElapsed", "seedingTime", "wastedSize", "averageDownloadSpeed", "averageUploadSpeed",
] as const

function torrentsEqual(current: Torrent[], next: Torrent[]): boolean {
  if (current.length !== next.length) return false
  for (let index = 0; index < next.length; index++) {
    const left = current[index]
    const right = next[index]
    for (const field of TORRENT_DISPLAY_FIELDS) {
      const same = field === "labels"
        ? JSON.stringify(left[field]) === JSON.stringify(right[field])
        : left[field] === right[field]
      if (!same) return false
    }
  }
  return true
}

export function useTorrentData(
  viewMode: "list" | "grid",
  visibleColumns: string[]
) {
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [freeSpace, setFreeSpace] = useState<{ path: string; "size-bytes": number; total_size: number } | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const { refreshInterval, autoRefresh } = useAppSettings()

  const fetchData = useCallback(async () => {
    try {
      const torrentFields = getRequiredRpcFields(visibleColumns, viewMode)
      const [torrentsData, statsData, sessionData] = await Promise.all([
        rpc.getTorrents(torrentFields),
        rpc.getStats(),
        rpc.getSession()
      ])

      setTorrents((current) => torrentsEqual(current, torrentsData.torrents) ? current : torrentsData.torrents)

      let freeData = null

      if (sessionData["download-dir"]) {
        try {
          freeData = await rpc.freeSpace(sessionData["download-dir"])
        } catch (e) {
          console.error("Failed to fetch free space:", e)
        }
      }

      setStats((current) => {
        if (current && JSON.stringify(current) === JSON.stringify(statsData)) return current
        return statsData
      })
      setFreeSpace((current) => {
        if (JSON.stringify(current) === JSON.stringify(freeData)) return current
        return freeData
      })
      setIsInitialLoading(false)
    } catch (err) {
      console.error("Failed to fetch Transmission data:", err)
      setIsInitialLoading(false)
    }
  }, [viewMode, visibleColumns])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    if (!autoRefresh) return

    const timer = setInterval(fetchData, refreshInterval)
    return () => clearInterval(timer)
  }, [fetchData, refreshInterval, autoRefresh])

  return { torrents, stats, freeSpace, isInitialLoading, fetchData }
}
