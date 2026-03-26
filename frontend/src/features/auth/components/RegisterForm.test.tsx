import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { RegisterForm } from './RegisterForm';
import * as actions from '../actions';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock relative imports
vi.mock('../actions', () => ({
  signUp: vi.fn(),
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

// Mock UI components
vi.mock('@/components/ui', () => ({
    Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => <button {...props}>{props.children}</button>,
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
    PasswordInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="password" {...props} />,
    Checkbox: ({ label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode; id?: string }) => (
        <div>
            <label htmlFor={id}>{label}</label>
            <input type="checkbox" id={id} {...props} />
        </div>
    ),
}));

vi.mock('@/components/ui/icons', () => ({
  GoogleIcon: () => null,
}));

describe('RegisterForm', () => {
  it('should display inline validation error when signUp fails', async () => {
    // Mock signUp to return error
    vi.mocked(actions.signUp).mockResolvedValue({
      success: false,
      error: {
        code: 'validation_error',
        message: 'Invalid input',
        details: { field: 'email' },
      },
    });

    render(<RegisterForm />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByLabelText(/terms/i)); // Checkbox

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(actions.signUp).toHaveBeenCalled();

    // Expect inline error
    expect(await screen.findByText('Invalid input')).toBeInTheDocument();
  });
});
