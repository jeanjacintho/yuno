import { useEffect, useRef, useState } from 'react'

type LazyImageProps = Omit<React.ComponentProps<'img'>, 'src'> & {
  src: string
}

export function LazyImage({ src, alt = '', className, onError, ...props }: LazyImageProps) {
  const ref = useRef<HTMLImageElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <img
      ref={ref}
      alt={alt}
      className={className}
      src={visible ? src : undefined}
      onError={onError}
      {...props}
    />
  )
}
