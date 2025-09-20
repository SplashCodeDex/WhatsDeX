# Shared UI Components

This directory contains centralized UI components using shadcn/ui patterns with Radix primitives and Tailwind CSS. Components are designed for reuse across admin, gui, and web projects.

## Available Components
- **Basic**: button.tsx, badge.tsx, input.tsx, label.tsx
- **Layout**: card.tsx, dialog.tsx, tabs.tsx
- **Data**: table.tsx (includes DataTable with TanStack React Table for sorting/pagination/filtering)
- **Navigation**: dropdown-menu.tsx (with submenus, checkboxes, radio items)
- **Custom**: GlassButton.tsx, GlassCard.tsx, Skeleton.tsx (loading states)

## Usage
Import from `@components/ui/ComponentName` (aliases configured in tsconfig.json).

Example:
```tsx
import { Button } from '@components/ui/button';
import { Card, CardContent } from '@components/ui/card';

function Example() {
  return (
    <Card>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Dependencies
- class-variance-authority (cva for variants)
- clsx, tw-merge (cn utility in lib/utils.ts)
- @radix-ui/react-* (primitives for dialog, dropdown-menu, etc.)
- @tanstack/react-table (for DataTable)
- lucide-react (icons)
- framer-motion (animations in some components)

## Structure
- Each component is forwardRef with cn for Tailwind classes
- Barrel exports in index.ts (if needed)
- utils.ts provides cn function for class merging

## Best Practices
- Use variants for styling (default, destructive, outline, etc.)
- Extend with asChild for Slot compatibility
- Add to tsconfig paths for @components alias across projects

Centralization reduces duplication and ensures consistent styling via shared Tailwind config.