import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ContactDetailModal } from './ContactDetailModal';
import { Contact } from '../types';

// Mock hooks
vi.mock('../hooks/useContacts', () => ({
    useUpdateContact: () => ({
        mutateAsync: vi.fn(),
        isPending: false
    })
}));

// Mock Radix UI Dialog to be visible in tests
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
}));

const mockContact: Contact = {
  id: '1',
  phone: '+1234567890',
  name: 'John Doe',
  email: 'john@example.com',
  tags: ['customer', 'vip'],
  attributes: {
    company: 'Acme Corp',
    notes: 'Important client',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ContactDetailModal', () => {
  beforeEach(() => {
      vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={mockContact} 
        isOpen={false} 
        onClose={onClose} 
      />
    );
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('renders contact details when open', () => {
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={mockContact} 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getAllByText('+1234567890')).toHaveLength(2);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={mockContact} 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    expect(screen.getByText('customer')).toBeInTheDocument();
    expect(screen.getByText('vip')).toBeInTheDocument();
  });

  it('displays metadata when available', () => {
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={mockContact} 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    expect(screen.getByText('company:')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('notes:')).toBeInTheDocument();
    expect(screen.getByText('Important client')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={mockContact} 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    // Should display relative date (less than a minute ago etc)
    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });
});
