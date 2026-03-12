import { Variants } from 'framer-motion';

/**
 * DeXMart Standard Bouncy Physics
 * Optimized for premium, responsive-feeling UI elements.
 */
export const BOUNCY_SPRING = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20
};

export const BOUNCY_BEZIER = [0.34, 1.56, 0.64, 1];
export const BOUNCY_BEZIER_STRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * Creates "Rolling" variants for list items (used in Header & Sidebar).
 * 
 * @param totalItems Number of items for reverse delay calculation
 * @param itemWidth The width the item should take when visible
 * @returns Framer Motion Variants
 */
export const createRollingVariants = (totalItems: number, itemWidth: string = '40px'): Variants => ({
    hidden: (i: number) => ({
        width: 0,
        opacity: 0,
        scale: 0.8,
        rotate: -45,
        marginRight: 0,
        overflow: 'hidden',
        transition: {
            ...BOUNCY_SPRING,
            delay: (totalItems - 1 - i) * 0.05
        }
    }),
    visible: (i: number) => ({
        width: itemWidth,
        opacity: 1,
        scale: 1,
        rotate: 0,
        marginRight: '8px',
        transition: {
            ...BOUNCY_SPRING,
            delay: i * 0.05
        }
    })
});

/**
 * Variants for the container itself (stretching/shrinking)
 */
export const bouncyCollapseVariants: Variants = {
    collapsed: {
        transition: BOUNCY_SPRING
    },
    expanded: {
        transition: BOUNCY_SPRING
    }
};
