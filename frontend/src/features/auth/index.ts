/**
 * Auth Feature Module
 *
 * Handles all authentication-related functionality including:
 * - Login/Register forms
 * - Session management
 * - Social authentication
 * - Password reset
 */

// Server Actions
export { signIn, signUp, googleAuthAction, signOut, requestPasswordReset, resetPassword, getSession } from './actions';

// Components
export { LoginForm, ForgotPasswordForm, ResetPasswordForm, InteractiveAuthProgressBar, RegisterForm, AnimatedAuthHero, AuthTransitionLayout } from './components';

// Hooks
export { useAuth } from './hooks';

// Store
export { useAuthStore } from './store';

// Schemas
export {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    type LoginInput,
    type RegisterInput,
    type ForgotPasswordInput,
    type ResetPasswordInput,
} from './schemas';

// Types
export type {
    AuthUser,
    Session,
    AuthState,
} from './types';

export { getAuthErrorMessage, firebaseUserToAuthUser } from './types';
export * from './utils';
