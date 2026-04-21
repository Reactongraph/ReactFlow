import React from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'outline'
type Size    = 'sm' | 'md' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: React.ReactNode
}

const variantCls: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
  ghost:   'text-slate-400 hover:text-slate-100 hover:bg-white/10',
  danger:  'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100',
}

const sizeCls: Record<Size, string> = {
  sm:   'h-7 px-2.5 text-xs gap-1.5',
  md:   'h-8 px-3 text-sm gap-2',
  icon: 'h-8 w-8 justify-center',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={[
        'inline-flex items-center rounded-md font-medium transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantCls[variant],
        sizeCls[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
