import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import * as actions from '../actions';

// Mock dependencies
vi.mock('../actions', () => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock('@/components/ui', () => ({
    Button: (props: any) => <button {...props}>{props.children}</button>,
    Input: (props: any) => <input {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children }: any) => <a>{children}</a>,
}));

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: any) => <div>{children}</div>,
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>,
    }
}));

describe('ForgotPasswordForm', () => {
  it('should use useActionState pattern (passing prevState and formData)', async () => {
    // Setup mock to return a failure so we stay on the page
    (actions.requestPasswordReset as any).mockResolvedValue({
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
