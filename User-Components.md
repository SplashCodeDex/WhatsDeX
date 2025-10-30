# Shadcn Skeleton

URL: /ui/skeleton
React skeleton for loading placeholders and shimmer effects that improve perceived performance. Built with TypeScript and Tailwind CSS for Next.js.

---

title: Shadcn Skeleton
description: React skeleton for loading placeholders and shimmer effects that improve perceived performance. Built with TypeScript and Tailwind CSS for Next.js.
icon: Square
component: true

---

<Callout title="Skeleton loading weird?">
  [Join our Discord community](https://discord.com/invite/Z9NVtNE7bj) for help from other developers.
</Callout>

<br />

You know that awkward moment when your page loads and everything just pops in randomly? Skeletons fix that. They're like placeholders that match your actual content layout, so users see something sensible while stuff loads instead of a blank screen or jumpy layout shifts. This shadcn/ui skeleton brings professional loading states to your React applications.

### Skeleton showcase

Clean placeholder for profile data:

<Preview path="ui/skeleton-demo" />

Just gray boxes that pulse softly, sized and positioned to match your real content. This free open source component keeps users engaged during loading states without making them stare at generic spinners. Styled with Tailwind CSS to match your design system instead of using fixed placeholder dimensions.

```bash
npx shadcn@latest add skeleton
```

## Why skeletons actually beat loading spinners

Here's the thing—skeletons feel faster even when they're not. Think about how Facebook and LinkedIn show content placeholders while feeds load, or how YouTube displays video thumbnail skeletons. Users see structure immediately instead of staring at spinning circles that provide zero context about what's loading.

Skeletons eliminate the jarring experience of content suddenly appearing and pushing other elements around. They set clear expectations about what users will see, reduce loading anxiety, and create that polished app experience users expect from professional applications. No more layout shifts or mysterious loading states.

This free shadcn skeleton handles the complex parts—smooth animations, flexible sizing, proper accessibility—while you focus on creating loading states that actually enhance user experience. Whether you're building product catalogs, social feeds, or data dashboards in your Next.js applications, skeletons that match real content keep users engaged in your JavaScript projects.

## Common skeleton patterns you'll actually use

### Product and article cards

Grid layouts with proper spacing:

<Preview path="ui/skeleton-card" />

### Dynamic user feeds

Social content and activity streams:

<Preview path="ui/skeleton-list" />

### Profile and user information

Avatar, name, and details placeholders:

<Preview path="ui/skeleton-demo" />

### Data tables and lists

Structured information with consistent columns:

<Preview path="ui/skeleton-demo" />

### Image galleries and media

Visual content with proper aspect ratios:

<Preview path="ui/skeleton-demo" />

## Features

This free open source skeleton component includes everything you need:

- **TypeScript-first** - Full type safety with loading state management
- **Tailwind CSS powered** - Flexible sizing with utility classes, not fixed dimensions
- **Subtle animations** - Gentle pulse effect that feels professional, not distracting
- **Shape flexibility** - Round avatars, rectangular cards, linear text placeholders
- **Layout preservation** - Prevents content jumping and layout shifts during loading
- **Performance focused** - Lightweight component that doesn't impact load times
- **Accessibility ready** - Screen reader friendly with proper loading announcements
- **Mobile optimized** - Responsive placeholders that work across all screen sizes

## API Reference

### Core Component

| Component  | Purpose             | Key Props                                 |
| ---------- | ------------------- | ----------------------------------------- |
| `Skeleton` | Loading placeholder | `className` for custom sizing and styling |

### Common Sizing Patterns

| Pattern       | Tailwind Classes                 | Use Case                       |
| ------------- | -------------------------------- | ------------------------------ |
| **Avatar**    | `h-12 w-12 rounded-full`         | Profile pictures, user avatars |
| **Text line** | `h-4 w-[250px]`                  | Headlines, paragraph lines     |
| **Button**    | `h-9 w-28 rounded-md`            | Action buttons, CTAs           |
| **Card**      | `h-[125px] w-[250px] rounded-xl` | Content cards, previews        |

### Layout Strategies

| Strategy        | Implementation                      | Best For                    |
| --------------- | ----------------------------------- | --------------------------- |
| **Exact match** | Mirror real content dimensions      | Single item loading         |
| **Grid layout** | Skeleton grid matching final layout | Product catalogs, galleries |
| **Progressive** | Show visible skeletons first        | Long lists, infinite scroll |

## Production tips

**Match your actual content dimensions precisely.** This free shadcn/ui skeleton component adapts to any size, but effective skeletons mirror real content layout exactly. This TypeScript component provides the placeholder—you provide dimensions that eliminate layout shift when actual content loads in your Next.js applications.

**Use appropriate shapes for different content types.** Round skeletons for avatars, rectangular for images, linear for text lines. This open source shadcn skeleton takes any Tailwind CSS classes—choose shapes that set accurate expectations about the content users will see.

**Don't overdo the pulse animation.** The subtle default animation keeps skeletons feeling alive without being distracting. This JavaScript component handles animation timing automatically—avoid custom animations that draw attention away from the loading process itself.

**Test with various content lengths and screen sizes.** Short and long text, different image sizes, mobile and desktop layouts. The Tailwind CSS styled component is responsive, but your skeleton dimensions should work across all the content variations users might encounter.

**Show skeletons progressively for better perceived performance.** Display placeholders for visible content first, then below-the-fold content as users scroll. This component renders instantly—use loading strategies that prioritize what users see immediately.

## Integration with other components

Skeletons naturally work with [Card](/ui/card) components for content placeholders and [Avatar](/ui/avatar) components for profile loading states in your React applications. Use them within [DataTable](/ui/data-table) components while data fetches from APIs.

For navigation interfaces, combine skeletons with [Button](/ui/button) placeholders or [Badge](/ui/badge) components for status loading. This open source pattern creates comprehensive loading experiences that match your final interface design.

When building feeds and lists, pair skeletons with [ScrollArea](/ui/scroll-area) components for long content or [Separator](/ui/separator) components to organize loading sections. [Sheet](/ui/sheet) and [Dialog](/ui/dialog) components can show skeleton content while modal data loads.

For form interfaces, use skeletons with [Input](/ui/input) and [Select](/ui/select) components to show loading form fields. Your JavaScript application can compose these shadcn components while maintaining consistent loading experiences across different content types and interaction patterns.

## Questions you might have

<Accordions type="single">
  <Accordion id="skeleton-vs-spinner" title="When should I use Skeleton vs loading spinners?">
    Use skeletons when you know the structure of loading content—cards, lists, forms. Use spinners for unknown-duration processes like file uploads or server processing. The shadcn skeleton shows content structure—spinners just indicate activity without context.
  </Accordion>

  <Accordion id="skeleton-dimensions" title="How do I determine the right skeleton dimensions?">
    Measure your actual content and match those exact dimensions. Use browser dev tools to check element sizes, then apply the same width and height classes to your skeletons. The free shadcn component prevents layout shift when real content replaces placeholders.
  </Accordion>

  <Accordion id="skeleton-animation" title="Can I customize or disable skeleton animations?">
    The component includes a subtle pulse animation by default. You can disable it with CSS or customize timing through Tailwind classes. The TypeScript component focuses on the placeholder structure—animation is handled through styling.
  </Accordion>

  <Accordion id="skeleton-mobile-behavior" title="How do skeletons work on mobile devices?">
    Skeletons are fully responsive and work naturally on mobile. Consider mobile content sizes and touch targets when designing skeleton dimensions. The open source component adapts to any screen size through responsive Tailwind classes.
  </Accordion>

  <Accordion id="skeleton-accessibility" title="Are skeletons accessible to screen readers?">
    Skeletons are primarily visual placeholders, but they can include ARIA labels for screen readers when needed. The component doesn't interfere with accessibility—your loading announcements and content structure handle screen reader experience.
  </Accordion>

  <Accordion id="skeleton-performance" title="Do skeletons impact page performance?">
    Skeletons are extremely lightweight and actually improve perceived performance by showing structure immediately. The React component adds minimal overhead while eliminating the jarring experience of content suddenly appearing and shifting layouts.
  </Accordion>

  <Accordion id="skeleton-content-types" title="What content types work best with skeletons?">
    Skeletons work best for structured content—user profiles, product cards, articles, data tables. They're less effective for dynamic content where structure varies significantly. The shadcn component works for any predictable layout structure.
  </Accordion>

  <Accordion id="skeleton-loading-strategy" title="How should I implement progressive skeleton loading?">
    Show skeletons for visible content first, then render additional placeholders as users scroll. This creates better perceived performance than loading all skeletons simultaneously. The JavaScript component renders instantly—your loading strategy determines the user experience.
  </Accordion>
</Accordions>

import { cn } from "@/lib/utils"
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
return (

<div
data-slot="skeleton"
className={cn("bg-accent animate-pulse rounded-md", className)}
{...props}
/>
)
}
export { Skeleton }
