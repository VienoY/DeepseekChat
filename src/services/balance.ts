import { useEffect } from 'react'
import { create } from 'zustand'
import { fetchBalance } from './api/client.js'
import type { UserBalance } from './api/types.js'
import { useSettings } from './settings.js'

/** 定时刷新余额的间隔 */
export const BALANCE_REFRESH_INTERVAL = 60_000
/** 窗口重新可见或获得焦点时按此最小间隔节流，避免频繁切换窗口反复请求 */
const MIN_REFRESH_INTERVAL = 10_000

export type BalanceStatus = 'idle' | 'loading' | 'ready' | 'failed'

type BalanceState = {
  status: BalanceStatus
  /** 最近一次成功获取的余额；刷新失败时保留，界面继续显示上次的金额 */
  balance: UserBalance | null
  /** 最近一次失败原因 */
  cause: unknown
  /** 最近一次成功获取的时间戳 */
  fetchedAt: number | null
}

/** 顶部徽标与设置里的余额行共用一个状态，避免两处重复查询 */
export const useBalance = create<BalanceState>(() => ({
  status: 'idle',
  balance: null,
  cause: null,
  fetchedAt: null,
}))

let inFlight: AbortController | null = null

/**
 * 查询当前 API Key 的余额：并发时中止上一次请求；
 * 非强制刷新时，若刚查询过就跳过（定时器与焦点事件会同时触发）。
 */
export const refreshBalance = async ({ force = false }: { force?: boolean } = {}): Promise<void> => {
  const apiKey = useSettings.getState().apiKey
  if (!apiKey) {
    inFlight?.abort()
    inFlight = null
    useBalance.setState({ status: 'idle', balance: null, cause: null, fetchedAt: null })
    return
  }
  const { status, fetchedAt } = useBalance.getState()
  if (!force && status === 'ready' && fetchedAt !== null && Date.now() - fetchedAt < MIN_REFRESH_INTERVAL) {
    return
  }
  inFlight?.abort()
  const controller = new AbortController()
  inFlight = controller
  useBalance.setState((state) => ({ status: 'loading', cause: state.cause }))
  try {
    const balance = await fetchBalance(apiKey, controller.signal)
    if (!controller.signal.aborted) {
      inFlight = null
      useBalance.setState({ status: 'ready', balance, cause: null, fetchedAt: Date.now() })
    }
  } catch (cause) {
    if (!controller.signal.aborted) {
      inFlight = null
      useBalance.setState({ status: 'failed', cause })
    }
  }
}

/** 应用打开期间定时刷新，换 API Key 后立即查询；页面不可见时不发请求 */
export const useBalancePolling = () => {
  const apiKey = useSettings((state) => state.apiKey)
  useEffect(() => {
    if (!apiKey) {
      void refreshBalance()
      return
    }
    void refreshBalance({ force: true })
    const tick = () => {
      if (document.visibilityState === 'visible') {
        void refreshBalance()
      }
    }
    const timer = setInterval(tick, BALANCE_REFRESH_INTERVAL)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [apiKey])
}
