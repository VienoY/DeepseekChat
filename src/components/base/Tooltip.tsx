import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../../app/viewport.js'
import { useAnchoredPosition, useDelayedOpen, type Align } from './anchored.js'
import styles from './Tooltip.module.css'

export type TooltipPlacement = 'top' | 'bottom'

const ENTER_DELAY = 100

/**
 * 悬停 100ms 后出现，离开立即消失，移动端不显示。
 * 触发元素外包一层 display: contents，不影响布局。
 */
export const Tooltip = ({
  content,
  placement = 'top',
  align = 'center',
  children,
}: {
  content: ReactNode
  placement?: TooltipPlacement
  /** 相对触发元素的水平对齐；贴住右边缘的元素用 end，提示才不会溢出视口 */
  align?: Align
  children: ReactNode
}) => {
  const isMobile = useIsMobile()
  const { open, setOpen, schedule, cancel } = useDelayedOpen()
  const { anchorRef, floatingRef, position } = useAnchoredPosition<HTMLSpanElement, HTMLDivElement>(
    open,
    { side: placement, align, measureFirstChild: true, measureKey: content }
  )

  useEffect(() => () => cancel(), [cancel])

  // 滚动时收起提示。
  useEffect(() => {
    if (!open) {
      return
    }
    const onScroll = () => setOpen(false)
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open, setOpen])

  const visible = open && !isMobile && Boolean(content)

  return (
    <>
      <span
        ref={anchorRef}
        className={styles.trigger}
        onMouseEnter={() => schedule(true, ENTER_DELAY)}
        onMouseLeave={() => schedule(false, 0)}
      >
        {children}
      </span>
      {visible
        ? createPortal(
            <div
              ref={floatingRef}
              role="tooltip"
              className={styles.tooltip}
              style={position ?? { top: 0, left: 0, visibility: 'hidden' }}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  )
}
