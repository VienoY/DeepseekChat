import { ApiError } from '../../services/api/client.js'
import { classifyApiError } from '../../services/api/errors.js'
import type { BalanceInfo, UserBalance } from '../../services/api/types.js'
import type { BalanceStatus } from '../../services/balance.js'
import type { useTranslate } from '../../i18n/index.js'

type Translate = ReturnType<typeof useTranslate>

/** 余额是服务端给的十进制字符串，只补币种符号，避免浮点换算改变展示值 */
export const formatAmount = (currency: string, amount: string): string =>
  currency === 'USD' ? `$${amount}` : `¥${amount}`

export const totalText = (balance: UserBalance): string =>
  balance.balance_infos.length === 0
    ? '—'
    : balance.balance_infos
        .map((info) => formatAmount(info.currency, info.total_balance))
        .join(' / ')

export const breakdownText = (info: BalanceInfo, t: Translate): string =>
  t('settingsBalanceBreakdown', {
    granted: formatAmount(info.currency, info.granted_balance),
    toppedUp: formatAmount(info.currency, info.topped_up_balance),
  })

/** 鉴权失败和网络异常本身已经说明问题，不再套「余额查询失败」的前缀 */
export const failureText = (cause: unknown, t: Translate): string => {
  switch (classifyApiError(cause)) {
    case 'unauthorized':
      return t('apiKeyInvalid')
    case 'network':
      return t('commonNetworkErrorToast')
    default:
      return t('settingsBalanceFailed', {
        message:
          cause instanceof ApiError && cause.localMessage
            ? t(cause.localMessage.key, cause.localMessage.params)
            : cause instanceof Error && cause.message
              ? cause.message
              : t('unknownError'),
      })
  }
}

/**
 * 余额的说明文案：成功时是赠送 / 充值明细，不足时提示无法调用接口，失败时给原因。
 * alert 为 true 时用错误色展示；stale 表示金额是上一次成功获取的旧值。
 */
export const describeBalance = (
  state: { status: BalanceStatus; balance: UserBalance | null; cause: unknown },
  t: Translate
): { text: string; alert: boolean; stale: boolean } => {
  const { status, balance, cause } = state
  const stale = status === 'failed' && balance !== null
  if (balance === null) {
    return {
      text:
        status === 'failed'
          ? failureText(cause, t)
          : status === 'idle' || status === 'loading'
            ? t('settingsBalanceLoading')
            : t('settingsBalanceEmpty'),
      alert: status === 'failed',
      stale: false,
    }
  }
  if (!balance.is_available) {
    return { text: t('settingsBalanceInsufficient'), alert: true, stale }
  }
  const [info] = balance.balance_infos
  return {
    text: info ? breakdownText(info, t) : t('settingsBalanceEmpty'),
    alert: false,
    stale,
  }
}
