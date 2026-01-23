# HTML & CSS Style Guide (2026 Edition)

> **Stack**: Tailwind CSS v4 | Framer Motion | Lucide Icons

## 1. Tailwind CSS v4 Philosophy
We adhere to the "CSS-First" configuration model of Tailwind v4. We do NOT use `tailwind.config.js`.

### Configuration
All theme tokens are defined in `@/app/globals.css` using the `@theme` directive and native CSS variables.

```css
@import "tailwindcss";

@theme {
  /* Colors - Use OKLCH for 2026 gamut support */
  --color-primary-500: oklch(58% 0.14 155);
  --color-primary-600: oklch(50% 0.12 155);
  
  /* Layout */
  --container-2xl: 88rem;
  
  /* Animations */
  --animate-fade-in: fade-in 0.2s ease-out;
}
```

### Usage Rule
- **Utility First**: Always use utility classes (`flex`, `p-4`, `text-primary-500`).
- **No arbitrary values**: Avoid `w-[350px]`. If a value is reused, define it in `@theme`.
- **Sorting**: Classes must be sorted (enforced by Prettier plugin).

## 2. Layout Patterns

### Container Strategy
Use a consistent max-width wrapper for all page content:
```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {children}
</div>
```

### Grid vs Flex
- Use **Grid** for 2D layouts (cards, dashboard widgets).
- Use **Flex** for 1D layouts (navbars, row items, stacks).

## 3. Dark Mode
- We use the `class` strategy (toggling a `.dark` class on HTML).
- **Rule**: Every color token must have a dark mode equivalent defined in CSS variables or handled via utility prefixes (`dark:bg-gray-900`).

## 4. Animation (Framer Motion)
- **Do not** use CSS `@keyframes` for complex interactions.
- **Do** use Framer Motion for exit animations, layout transitions, and gestures.
- **Constraint**: All animations must respect `prefers-reduced-motion`.

## 5. Accessibility (A11y)
- **Focus States**: All interactive elements MUST have a visible focus ring (`focus-visible:ring-2`).
- **Contrast**: Text color must pass WCAG AA standards.
- **Hidden Content**: Use `sr-only` for text needed by screen readers but hidden visually.