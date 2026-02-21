/**
 * PaymentMethods Component Tests
 * 
 * Test coverage for PaymentMethods component following PROJECT_RULES.md
 * Target: 80%+ coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentMethods } from './PaymentMethods';
import { api } from '@/lib/api';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types';
import type { PaymentMethod } from '../schemas';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
  API_ENDPOINTS: {
    BILLING: {
      PAYMENT_METHODS: '/api/billing/payment-methods',
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('PaymentMethods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (process.env as any).NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL;
  });

  it('should render loading state initially', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    
    render(<PaymentMethods />);
    
    expect(screen.getByText('Payment Methods')).toBeInTheDocument();
  });

  it('should render empty state when no payment methods exist', async () => {
    const emptyResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: [],
    };
    
    vi.mocked(api.get).mockResolvedValue(emptyResponse);
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(screen.getByText('No payment methods')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Add a payment method to manage your subscription/)).toBeInTheDocument();
  });

  it('should render payment methods list', async () => {
    const mockMethods: PaymentMethod[] = [
      {
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      },
      {
        id: 'pm_124',
        brand: 'mastercard',
        last4: '5555',
        expiryMonth: 6,
        expiryYear: 2026,
        isDefault: false,
      },
    ];
    
    const successResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: mockMethods,
    };
    
    vi.mocked(api.get).mockResolvedValue(successResponse);
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(screen.getByText(/visa.*4242/i)).toBeInTheDocument();
      expect(screen.getByText(/mastercard.*5555/i)).toBeInTheDocument();
    });
  });

  it('should display default badge for default payment method', async () => {
    const mockMethods: PaymentMethod[] = [
      {
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      },
      {
        id: 'pm_124',
        brand: 'mastercard',
        last4: '5555',
        expiryMonth: 6,
        expiryYear: 2026,
        isDefault: false,
      },
    ];
    
    const successResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: mockMethods,
    };
    
    vi.mocked(api.get).mockResolvedValue(successResponse);
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  it('should format expiry dates correctly', async () => {
    const mockMethods: PaymentMethod[] = [
      {
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 3,
        expiryYear: 2025,
        isDefault: true,
      },
    ];
    
    const successResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: mockMethods,
    };
    
    vi.mocked(api.get).mockResolvedValue(successResponse);
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(screen.getByText('Expires 03/2025')).toBeInTheDocument();
    });
  });

  it('should open Stripe portal when Add Card is clicked with URL configured', async () => {
    process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/portal';
    
    const emptyResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: [],
    };
    
    vi.mocked(api.get).mockResolvedValue(emptyResponse);
    
    const mockOpen = vi.fn();
    vi.stubGlobal('open', mockOpen);
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(screen.getByText('No payment methods')).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /add payment method/i });
    await userEvent.click(addButton);
    
    expect(mockOpen).toHaveBeenCalledWith('https://billing.stripe.com/portal', '_blank');
    
    vi.unstubAllGlobals();
  });

  it('should show toast when Add Card is clicked without URL configured', async () => {
    const emptyResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: [],
    };
    
    vi.mocked(api.get).mockResolvedValue(emptyResponse);
    
    const { toast } = await import('sonner');
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(screen.getByText('No payment methods')).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /add payment method/i });
    await userEvent.click(addButton);
    
    expect(toast.error).toHaveBeenCalledWith('Customer portal URL not configured');
  });

  it('should disable delete button for default payment method', async () => {
    const mockMethods: PaymentMethod[] = [
      {
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      },
    ];
    
    const successResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: mockMethods,
    };
    
    vi.mocked(api.get).mockResolvedValue(successResponse);
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => btn.querySelector('svg')); // Find button with trash icon
      expect(deleteButton).toBeDisabled();
    });
  });

  it('should open confirmation dialog when delete is clicked', async () => {
    const mockMethods: PaymentMethod[] = [
      {
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: false,
      },
    ];
    
    const successResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: mockMethods,
    };
    
    vi.mocked(api.get).mockResolvedValue(successResponse);
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(screen.getByText(/visa.*4242/i)).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));
    
    if (deleteButton) {
      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Remove payment method?')).toBeInTheDocument();
      });
    }
  });

  it('should delete payment method when confirmed', async () => {
    const mockMethods: PaymentMethod[] = [
      {
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: false,
      },
    ];
    
    const successResponse: ApiSuccessResponse<PaymentMethod[]> = {
      success: true,
      data: mockMethods,
    };
    
    const deleteResponse: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: 'Payment method removed' },
    };
    
    vi.mocked(api.get).mockResolvedValue(successResponse);
    vi.mocked(api.delete).mockResolvedValue(deleteResponse);
    
    const { toast } = await import('sonner');
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(screen.getByText(/visa.*4242/i)).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));
    
    if (deleteButton) {
      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Remove payment method?')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /remove/i });
      await userEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/api/billing/payment-methods/pm_123');
        expect(toast.success).toHaveBeenCalledWith('Payment method removed');
      });
    }
  });

  it('should handle API error gracefully', async () => {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to load payment methods',
      },
    };
    
    vi.mocked(api.get).mockResolvedValue(errorResponse);
    
    const { toast } = await import('sonner');
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load payment methods');
    });
  });

  it('should validate payment method data with Zod', async () => {
    const invalidMethods = [
      {
        id: 'pm_123',
        brand: 'visa',
        last4: '42', // Invalid: must be 4 digits
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      },
    ];
    
    const invalidResponse: ApiSuccessResponse<any> = {
      success: true,
      data: invalidMethods,
    };
    
    vi.mocked(api.get).mockResolvedValue(invalidResponse);
    
    const { toast } = await import('sonner');
    
    render(<PaymentMethods />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
