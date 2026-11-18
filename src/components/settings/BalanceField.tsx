import clsx from 'clsx'
import { IconRefreshOutline16 } from '../base/icons.js'
import { IconButton } from '../base/IconButton.js'
import { refreshBalance, useBalance } from '../../services/balance.js'
import { useSettings } from '../../services/settings.js'
import { describeBalance, totalText } from '../balance/format.js'
import { useTranslate } from '../../i18n/index.js'
import styles from './Settings.module.css'

/** 充值页，与余额不足提示里的入口一致 */
const TOP_UP_URL = 'https://platform.deepseek.com/top_up'

/**
 * 设置里的账户余额明细：与顶部徽标共用同一份数据，这里额外显示赠送 / 充值构成，
 * 并提供立即刷新（不受定时刷新的间隔限制）。
 */
export const BalanceField = () => {
  const t = useTranslate()
  const apiKey = useSettings((state) => state.apiKey)
  const status = useBalance((state) => state.status)
  const balance = useBalance((state) => state.balance)
  const cause = useBalance((state) => state.cause)

  // 还没填 Key 时由上方输入框引导，不显示余额行
  if (!apiKey) {
    return null
  }

  const { text, alert } = describeBalance({ status, balance, cause }, t)
  const insufficient = balance !== null && !balance.is_available

  return (
    <div className={clsx(styles.cell, styles.row)}>
      <div className={styles.text}>
        <div className={styles.label}>{t('settingsBalance')}</div>
        <div className={clsx(styles.description, alert && styles.error)}>
          {text}
          {insufficient ? (
            <>
              {' '}
              <a
                className={styles.balanceTopUp}
                href={TOP_UP_URL}
                target="_blank"
                rel="noreferrer"
              >
                {t('topUp')}
              </a>
            </>
          ) : null}
        </div>
      </div>
      <div className={styles.balanceValue}>
        <span className={styles.balanceAmount}>{balance ? totalText(balance) : '—'}</span>
        <IconButton
          className={status === 'loading' ? styles.balanceSpinning : undefined}
          icon={<IconRefreshOutline16 />}
          tooltip={t('settingsBalanceRefresh')}
          disabled={status === 'loading'}
          onClick={() => void refreshBalance({ force: true })}
        />
      </div>
    </div>
  )
}
