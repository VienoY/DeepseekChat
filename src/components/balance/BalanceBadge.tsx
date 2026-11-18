import clsx from 'clsx'
import { useTranslate } from '../../i18n/index.js'
import { useBalance } from '../../services/balance.js'
import { useSettings } from '../../services/settings.js'
import { Tooltip } from '../base/Tooltip.js'
import { describeBalance, totalText } from './format.js'
import styles from './BalanceBadge.module.css'

/** 充值页，与余额不足提示里的入口一致 */
const TOP_UP_URL = 'https://platform.deepseek.com/top_up'

/**
 * 顶部常驻的余额徽标：显示当前 API Key 的总额，悬停看赠送 / 充值明细，
 * 点击在新窗口打开开放平台充值页；金额随定时刷新更新。
 */
export const BalanceBadge = ({ className }: { className?: string }) => {
  const t = useTranslate()
  const apiKey = useSettings((state) => state.apiKey)
  const status = useBalance((state) => state.status)
  const balance = useBalance((state) => state.balance)
  const cause = useBalance((state) => state.cause)

  // 没有 API Key 时由设置弹窗引导填写，顶部不占位
  if (!apiKey) {
    return null
  }

  const { text, alert, stale } = describeBalance({ status, balance, cause }, t)
  const amount = balance ? totalText(balance) : '—'

  return (
    <Tooltip content={text} align="end">
      <a
        className={clsx(
          styles.badge,
          alert && styles.alert,
          stale && styles.stale,
          status === 'loading' && styles.loading,
          className
        )}
        href={TOP_UP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={t('balanceBadgeLabel')}
      >
        <span className={styles.amount}>{amount}</span>
      </a>
    </Tooltip>
  )
}
