import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const tags = Array.from({ length: 50 }).map(
    (_, i, a) => `v1.2.0-beta.${a.length - i}`
)

export function ScrollAreaDemo() {
    return (
        <ScrollArea className="h-72 w-48 rounded-md border bg-card/50 backdrop-blur-sm">
            <div className="p-4">
                <h4 className="mb-4 text-sm leading-none font-medium text-foreground">Tags</h4>
                {tags.map((tag) => (
                    <React.Fragment key={tag}>
                        <div className="text-sm text-foreground/80">{tag}</div>
                        <Separator className="my-2 opacity-50" />
                    </React.Fragment>
                ))}
            </div>
        </ScrollArea>
    )
}
