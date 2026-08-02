"use client"

import * as React from "react"
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, FolderCog, MoreHorizontal, PlayCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LocationInput } from "@/components/location-input"
import { rpc } from "@/lib/rpc-client"
import type { Torrent, TorrentId } from "@/lib/rpc-types"

interface AdvancedTorrentMenuProps {
  ids: TorrentId[]
  torrent?: Torrent
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function AdvancedTorrentMenu({ ids, torrent, onSuccess, trigger }: AdvancedTorrentMenuProps) {
  const [pathOpen, setPathOpen] = React.useState(false)
  const [savePath, setSavePath] = React.useState(torrent?.downloadDir ?? "")
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (pathOpen) setSavePath(torrent?.downloadDir ?? "")
  }, [pathOpen, torrent])

  const run = async (work: () => Promise<unknown>, message: string) => {
    try {
      await work()
      toast.success(message)
      onSuccess?.()
    } catch (error) {
      toast.error("操作失败", { description: error instanceof Error ? error.message : "Transmission 拒绝了此操作" })
    }
  }

  const saveLocation = async () => {
    if (!savePath.trim()) return toast.error("数据位置不能为空")
    setBusy(true)
    try {
      await rpc.setTorrentLocation(ids, savePath.trim(), true)
      toast.success("任务数据位置已更新")
      setPathOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error("位置更新失败", { description: error instanceof Error ? error.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" title="高级任务操作"><MoreHorizontal className="h-4 w-4" /></Button>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Transmission 任务控制</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => void run(() => rpc.setForceStart(ids, true), "已立即启动并忽略队列")}> <PlayCircle />立即启动</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>队列位置</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => void run(() => rpc.changeQueuePriority(ids, "top"), "已移至队列顶部")}><ArrowUpToLine />置顶</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void run(() => rpc.changeQueuePriority(ids, "up"), "已在队列中上移")}><ArrowUp />上移</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void run(() => rpc.changeQueuePriority(ids, "down"), "已在队列中下移")}><ArrowDown />下移</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void run(() => rpc.changeQueuePriority(ids, "bottom"), "已移至队列底部")}><ArrowDownToLine />置底</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPathOpen(true)}><FolderCog />移动任务数据</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pathOpen} onOpenChange={setPathOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>移动任务数据</DialogTitle>
            <DialogDescription>将所选任务的数据移动到 Transmission 容器可以访问的新路径。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">新数据位置</label>
            <LocationInput value={savePath} onChange={setSavePath} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPathOpen(false)}>取消</Button>
            <Button disabled={busy} onClick={() => void saveLocation()}>{busy ? "正在移动…" : "移动数据"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
