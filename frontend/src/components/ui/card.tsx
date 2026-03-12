import * as React from "react";
import { motion, HTMLMotionProps, TargetAndTransition } from "framer-motion";
import { cn } from "@/lib/utils";
import { BOUNCY_HOVER, BOUNCY_TAP } from "@/lib/animations";



const Card = React.forwardRef<
    HTMLDivElement,
    HTMLMotionProps<"div"> & { hoverable?: boolean }
>(({ className, hoverable, ...props }, ref) => (
    <motion.div
        ref={ref}
        whileHover={hoverable ? (BOUNCY_HOVER as TargetAndTransition) : {}}
        whileTap={hoverable ? (BOUNCY_TAP as TargetAndTransition) : {}}
        className={cn(

            "rounded-xl border border-border/50 bg-card/80 text-card-foreground shadow-sm backdrop-blur-sm transition-shadow",
            hoverable && "hover:shadow-lg hover:border-primary/20",
            className
        )}
        {...props}
    />
));
Card.displayName = "Card";


const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
