import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import * as actions from '../actions';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
}));

// Mock relative imports
vi.mock('../actions', () => ({
  signIn: vi.fn(),
  googleAuthAction: vi.fn(),
}));

vi.mock('../store', () => ({
  useAuthStore: () => ({ setLoading: vi.fn(), isLoading: false }),
}));

vi.mock('../types', () => ({
  getAuthErrorMessage: (code: string) => code,
  firebaseUserToAuthUser: vi.fn(),
}));

// Mock motion components
vi.mock('@/components/ui/motion', () => ({
  StaggeredEnter: ({ children }: any) => <div>{children}</div>,
  StaggeredItem: ({ children }: any) => <div>{children}</div>,
}));

// Mock UI components if necessary (simplifies tree)
vi.mock('@/components/ui', () => ({
    Button: (props: any) => <button {...props}>{props.children}</button>,
    Input: (props: any) => <input {...props} />,
    PasswordInput: (props: any) => <input type="password" {...props} />,
    Checkbox: (props: any) => <input type="checkbox" {...props} />,
}));

vi.mock('@/components/ui/icons', () => ({
  GoogleIcon: () => <span />,
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

describe('LoginForm', () => {
  it('should display inline validation error when signIn fails', async () => {
    const user = userEvent.setup();
    
    // Mock signIn to return error
    (actions.signIn as any).mockResolvedValue({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid input',
        details: { field: 'email' },
      },
    });

    render(<LoginForm />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');

    // Submit
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(actions.signIn).toHaveBeenCalled();

    // Expect inline error
    await waitFor(() => {
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });
  });
});
