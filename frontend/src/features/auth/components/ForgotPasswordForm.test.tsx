import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { ForgotPasswordForm } from './ForgotPasswordForm';
import * as actions from '../actions';

// Mock dependencies
vi.mock('../actions', () => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock('@/components/ui', () => ({
    Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => <button {...props}>{props.children}</button>,
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    motion: {
        div: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
    }
}));

describe('ForgotPasswordForm', () => {
  it('should use useActionState pattern (passing prevState and formData)', async () => {
    // Setup mock to return a failure so we stay on the page
    vi.mocked(actions.requestPasswordReset).mockResolvedValue({
        success: false,
        error: {
            code: 'validation_error',
            message: 'Invalid email',
        }
    });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitBtn);

    // This expectation ensures we are using useActionState which passes (prevState, formData)
    // The legacy implementation only passes (formData), so this should fail.
    await waitFor(() => {
        expect(actions.requestPasswordReset).toHaveBeenCalledWith(
            null, 
            expect.any(FormData)
        );
    });
  });
});
