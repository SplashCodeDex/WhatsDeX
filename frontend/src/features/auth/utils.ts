/**
 * Auth utilities
 * Server-side helpers for authentication features
 */

export interface Particle {
    id: number;
    left: string;
    delay: number;
    duration: number;
    size: number;
}

export function generateParticles(): Particle[] {
    return Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 4,
        size: 2 + Math.random() * 3,
    }));
}
