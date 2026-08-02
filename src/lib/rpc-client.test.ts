import { beforeEach, describe, expect, test, vi } from "vitest"

const success = (args: object = {}) => new Response(JSON.stringify({ result: "success", arguments: args }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
})

describe("Transmission RPC 适配层", () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
    vi.stubGlobal("fetch", vi.fn())
  })

  test("遇到 409 时读取会话编号并重试", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, {
        status: 409,
        headers: { "X-Transmission-Session-Id": "rpc-session" },
      }))
      .mockResolvedValueOnce(success({ version: "4.0.6" }))

    const { rpc } = await import("./rpc-client")
    const session = await rpc.getSession()

    expect(session.version).toBe("4.0.6")
    expect(fetch).toHaveBeenCalledTimes(2)
    const secondRequest = vi.mocked(fetch).mock.calls[1][1] as RequestInit
    expect(secondRequest.headers).toMatchObject({ "X-Transmission-Session-Id": "rpc-session" })
  })

  test("登录使用基本认证并保存凭据", async () => {
    vi.mocked(fetch).mockResolvedValue(success({ version: "4.0.6" }))
    const { rpc } = await import("./rpc-client")

    await rpc.login("user", "pass")

    const request = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(request.headers).toMatchObject({ Authorization: `Basic ${btoa("user:pass")}` })
    expect(sessionStorage.getItem("transmission_basic_auth")).toBe(`Basic ${btoa("user:pass")}`)
  })

  test("合并文件与文件状态并转换优先级", async () => {
    vi.mocked(fetch).mockResolvedValue(success({
      torrents: [{
        id: 9,
        name: "示例",
        hashString: "abc",
        status: 4,
        totalSize: 30,
        percentDone: 0.5,
        files: [{ name: "目录/a.bin", length: 10 }, { name: "目录/b.bin", length: 20 }],
        fileStats: [{ bytesCompleted: 5, wanted: true, priority: 1 }, { bytesCompleted: 0, wanted: false, priority: 0 }],
      }],
    }))
    const { rpc } = await import("./rpc-client")

    const result = await rpc.getTorrents(["files"])

    expect(result.torrents[0].id).toBe("abc")
    expect(result.torrents[0].files).toEqual([
      { index: 0, name: "目录/a.bin", length: 10, bytesCompleted: 5, priority: 6 },
      { index: 1, name: "目录/b.bin", length: 20, bytesCompleted: 0, priority: 0 },
    ])
  })

  test("文件不下载优先级映射到 files-unwanted", async () => {
    vi.mocked(fetch).mockResolvedValue(success())
    const { rpc } = await import("./rpc-client")

    await rpc.setFilePriority("9", [1, 3], 0)

    const request = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(JSON.parse(request.body as string)).toMatchObject({
      method: "torrent-set",
      arguments: { ids: ["9"], "files-unwanted": [1, 3] },
    })
  })

  test("队列移动调用 Transmission 对应方法", async () => {
    vi.mocked(fetch).mockResolvedValue(success())
    const { rpc } = await import("./rpc-client")

    await rpc.changeQueuePriority(["9"], "top")

    const request = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(JSON.parse(request.body as string)).toMatchObject({ method: "queue-move-top", arguments: { ids: ["9"] } })
  })
})
