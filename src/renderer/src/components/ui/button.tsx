import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@renderer/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-extrabold tracking-wide uppercase transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground yuno-pressable yuno-pressable-active hover:brightness-105',
        destructive:
          'bg-destructive text-white shadow-[0_4px_0_0_#9e1020] hover:brightness-105 active:translate-y-0.5 active:shadow-none focus-visible:ring-destructive/30',
        outline:
          'border-2 border-primary bg-white text-primary shadow-sm hover:bg-secondary hover:text-secondary-foreground',
        secondary:
          'bg-secondary text-secondary-foreground border-2 border-transparent shadow-sm hover:brightness-95',
        ghost:
          'rounded-xl font-semibold normal-case tracking-normal text-foreground shadow-none hover:bg-muted',
        link: 'rounded-none p-0 font-semibold normal-case tracking-normal text-primary shadow-none underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-11 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 rounded-xl px-4 text-xs has-[>svg]:px-3',
        lg: 'h-12 rounded-full px-8 text-base has-[>svg]:px-6',
        icon: 'size-10 rounded-xl font-normal shadow-none active:!translate-y-0'
      }
    },
    compoundVariants: [
      {
        variant: 'default',
        size: 'icon',
        class: '!shadow-none active:!translate-y-0'
      },
      { variant: 'destructive', size: 'icon', class: '!shadow-none' },
      { variant: 'outline', size: 'icon', class: 'border-border' }
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }): React.JSX.Element {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
