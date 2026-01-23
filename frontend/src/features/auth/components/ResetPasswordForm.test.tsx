import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';
import * as actions from '../actions';

// Mock dependencies
vi.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: (key: string) => key === 'oobCode' ? 'fake-code' : null
    }),
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../actions', () => ({
  resetPassword: vi.fn(),
}));

vi.mock('@/components/ui', () => ({
    Button: (props: any) => <button {...props}>{props.children}</button>,
    PasswordInput: (props: any) => <input type="password" {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children }: any) => <a>{children}</a>,
}));

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: any) => children,
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>,
    }
}));

describe('ResetPasswordForm', () => {
  it('should use useActionState pattern (passing prevState and formData)', async () => {
    // Setup mock
    (actions.resetPassword as any).mockResolvedValue({
        success: false,
        error: {
            code: 'validation_error',
            message: 'Password mismatch',
        }
    });

    render(<ResetPasswordForm />);

    const passInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitBtn);

    // Expecting (prevState, formData) signature which useActionState provides
    await waitFor(() => {
        expect(actions.resetPassword).toHaveBeenCalledWith(
            null,
            expect.any(FormData)
        );
    });
  });
});
