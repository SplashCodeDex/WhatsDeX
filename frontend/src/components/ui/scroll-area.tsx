"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  showFades = false,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & { showFades?: boolean }) {
  const [scrollState, setScrollState] = React.useState({
    isAtTop: true,
    isAtBottom: false,
    hasScroll: false,
  })

  const viewportRef = React.useRef<HTMLDivElement>(null)

  const checkScroll = React.useCallback(() => {
    const element = viewportRef.current
    if (element) {
      const { scrollTop, scrollHeight, clientHeight } = element
      const hasScroll = scrollHeight > clientHeight
      const isAtTop = scrollTop <= 4
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 4

      setScrollState({ isAtTop, isAtBottom, hasScroll })
    }
  }, [])

  React.useEffect(() => {
    const element = viewportRef.current
    if (element) {
      checkScroll()
      window.addEventListener("resize", checkScroll)
      return () => window.removeEventListener("resize", checkScroll)
    }
    return undefined
  }, [checkScroll, children])

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        onScroll={checkScroll}
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
        style={{
          maskImage: showFades && scrollState.hasScroll ? `
            linear-gradient(to bottom,
              transparent 0%,
              black ${scrollState.isAtTop ? '0%' : '8%'},
              black ${scrollState.isAtBottom ? '100%' : '92%'},
              transparent 100%
            )
          ` : 'none',
          WebkitMaskImage: showFades && scrollState.hasScroll ? `
            linear-gradient(to bottom,
              transparent 0%,
              black ${scrollState.isAtTop ? '0%' : '8%'},
              black ${scrollState.isAtBottom ? '100%' : '92%'},
              transparent 100%
            )
          ` : 'none',
          transition: 'mask-image 0.3s ease, -webkit-mask-image 0.3s ease'
        }}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar className={cn(showFades && "opacity-0")} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
