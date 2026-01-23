import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import * as actions from '../actions';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock relative imports
vi.mock('../actions', () => ({
  signIn: vi.fn(),
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
  StaggeredEnter: ({ children }: any) => children,
  StaggeredItem: ({ children }: any) => children,
}));

// Mock UI components if necessary (simplifies tree)
vi.mock('@/components/ui', () => ({
    Button: (props: any) => <button {...props}>{props.children}</button>,
    Input: (props: any) => <input {...props} />,
    PasswordInput: (props: any) => <input type="password" {...props} />,
    Checkbox: (props: any) => <input type="checkbox" {...props} />,
}));

vi.mock('@/components/ui/icons', () => ({
  GoogleIcon: () => null,
}));

describe('LoginForm', () => {
  it('should display inline validation error when signIn fails', async () => {
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
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(actions.signIn).toHaveBeenCalled();

    // Expect inline error
    expect(await screen.findByText('Invalid input')).toBeInTheDocument();
  });
});
