import * as React from 'react'

import { cn } from '@/lib/utils'

type ProgressProps = React.ComponentPropsWithoutRef<'div'> & {
  value?: number
  indicatorClassName?: string
  style?: (React.CSSProperties & { '--progress-background'?: string }) | undefined
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, style, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value))

    return (
      <div
        ref={ref}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
        style={style}
        {...props}
      >
        <div
          className={cn('h-full bg-primary transition-all', indicatorClassName)}
          style={{
            width: `${clamped}%`,
            backgroundColor: 'var(--progress-background, hsl(var(--primary)))',
          }}
        />
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export { Progress }
