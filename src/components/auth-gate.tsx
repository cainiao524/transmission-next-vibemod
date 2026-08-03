import * as React from "react"
import { DownloadCloud, LoaderCircle, LockKeyhole } from "lucide-react"
import { rpc, TRANSMISSION_AUTH_LOGOUT_EVENT } from "@/lib/rpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeProvider } from "@/components/theme-provider"
import { isBrowserAutofilled, isPrivateNetworkHost } from "@/lib/network"

const AUTO_LOGIN_SUPPRESSED_KEY = "transmission_auto_login_suppressed"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<"checking" | "guest" | "authenticated">("checking")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const usernameInputRef = React.useRef<HTMLInputElement>(null)
  const passwordInputRef = React.useRef<HTMLInputElement>(null)
  const automaticLoginStarted = React.useRef(false)
  const privateNetwork = isPrivateNetworkHost(window.location.hostname)

  React.useEffect(() => {
    let active = true
    const handleLogout = () => {
      if (!active) return
      sessionStorage.setItem(AUTO_LOGIN_SUPPRESSED_KEY, "1")
      automaticLoginStarted.current = false
      setPassword("")
      setError("")
      setStatus("guest")
    }
    window.addEventListener(TRANSMISSION_AUTH_LOGOUT_EVENT, handleLogout)
    rpc.checkAuthentication().then((authenticated) => {
      if (active) setStatus(authenticated ? "authenticated" : "guest")
    })
    return () => {
      active = false
      window.removeEventListener(TRANSMISSION_AUTH_LOGOUT_EVENT, handleLogout)
    }
  }, [])

  const authenticate = React.useCallback(async (nextUsername: string, nextPassword: string) => {
    if (!nextUsername || !nextPassword) return
    setSubmitting(true)
    setError("")
    try {
      await rpc.login(nextUsername, nextPassword)
      sessionStorage.removeItem(AUTO_LOGIN_SUPPRESSED_KEY)
      setStatus("authenticated")
    } catch {
      automaticLoginStarted.current = false
      setError("登录失败，请检查地址、用户名和密码。")
    } finally {
      setSubmitting(false)
    }
  }, [])

  React.useEffect(() => {
    if (status !== "guest" || !privateNetwork || sessionStorage.getItem(AUTO_LOGIN_SUPPRESSED_KEY)) return

    let checks = 0
    const timer = window.setInterval(() => {
      checks += 1
      const usernameInput = usernameInputRef.current
      const passwordInput = passwordInputRef.current
      if (!usernameInput || !passwordInput || automaticLoginStarted.current) return

      const hasBrowserCredentials = usernameInput.value && passwordInput.value
        && (isBrowserAutofilled(usernameInput) || isBrowserAutofilled(passwordInput))
      if (hasBrowserCredentials) {
        automaticLoginStarted.current = true
        setUsername(usernameInput.value)
        setPassword(passwordInput.value)
        window.clearInterval(timer)
        void authenticate(usernameInput.value, passwordInput.value)
      } else if (checks >= 30) {
        window.clearInterval(timer)
      }
    }, 200)

    return () => window.clearInterval(timer)
  }, [authenticate, privateNetwork, status])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    await authenticate(username, password)
  }

  if (status === "authenticated") return children

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] overflow-hidden">
        <div className="hidden lg:flex min-w-0 relative overflow-hidden bg-primary text-primary-foreground p-10 xl:p-12 flex-col justify-between">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_10%,white_0,transparent_38%),radial-gradient(circle_at_85%_80%,white_0,transparent_32%)]" />
          <div className="relative flex items-center gap-3 text-xl font-semibold">
            <div className="h-11 w-11 rounded-2xl bg-white/15 grid place-items-center backdrop-blur"><DownloadCloud /></div>
            Transmission VibeMod
          </div>
          <div className="relative max-w-xl">
            <p className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.08] break-words">更专注、更清晰的下载管理界面。</p>
            <p className="mt-6 text-lg text-primary-foreground/70">直接连接 Transmission RPC，适配桌面与移动设备。</p>
          </div>
          <p className="relative text-sm text-primary-foreground/55">适用于 Transmission 4.0 及以上版本</p>
        </div>

        <div className="min-w-0 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-3 mb-12 text-lg font-semibold">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center"><DownloadCloud className="h-5 w-5" /></div>
              Transmission VibeMod
            </div>
            {status === "checking" ? (
              <div className="flex items-center gap-3 text-muted-foreground"><LoaderCircle className="animate-spin" />正在连接 Transmission…</div>
            ) : (
              <form onSubmit={submit} autoComplete="on" className="space-y-6">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-6"><LockKeyhole /></div>
                  <h1 className="text-3xl font-semibold tracking-tight">登录</h1>
                  <p className="mt-2 text-sm text-muted-foreground">使用 Transmission RPC 的账户凭据。</p>
                </div>
                <div className="space-y-3">
                  <Input ref={usernameInputRef} name="username" autoFocus={!privateNetwork} autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="用户名" className="h-12 rounded-xl bg-muted/40 border-none" />
                  <Input ref={passwordInputRef} name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码" className="h-12 rounded-xl bg-muted/40 border-none" />
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <Button type="submit" disabled={submitting || !username || !password} className="w-full h-12 rounded-xl font-semibold">
                  {submitting ? <LoaderCircle className="animate-spin" /> : "连接并登录"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
