import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
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
  StaggeredEnter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StaggeredItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock UI components if necessary (simplifies tree)
vi.mock('@/components/ui', () => ({
    Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => <button {...props}>{props.children}</button>,
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
    PasswordInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="password" {...props} />,
    Checkbox: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="checkbox" {...props} />,
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
    vi.mocked(actions.signIn).mockResolvedValue({
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
