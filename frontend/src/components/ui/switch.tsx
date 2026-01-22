"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
    const isChecked = props.checked || props.defaultChecked;

    return (
        <SwitchPrimitives.Root
            className={cn(
                "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary/20 data-[state=unchecked]:bg-white/5 backdrop-blur-md shadow-lg relative overflow-hidden",
                className
            )}
            {...props}
            ref={ref}
        >
            {/* Animated background glow */}
            <AnimatePresence>
                {props.checked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-primary/20 blur-md pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <SwitchPrimitives.Thumb asChild>
                <motion.span
                    initial={false}
                    animate={{
                        x: props.checked ? 20 : 0,
                        backgroundColor: props.checked ? "var(--color-primary)" : "#ffffff",
                        boxShadow: props.checked
                            ? "0 0 10px var(--color-primary)"
                            : "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                    }}
                    className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full ring-0 z-10 mx-0.5",
                    )}
                />
            </SwitchPrimitives.Thumb>
        </SwitchPrimitives.Root>
    )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
