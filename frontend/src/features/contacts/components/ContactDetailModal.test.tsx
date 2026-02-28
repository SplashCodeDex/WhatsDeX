import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactDetailModal } from './ContactDetailModal';
import { Contact } from '../types';

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
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ContactDetailModal', () => {
  it('does not render when closed', () => {
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={null} 
        isOpen={false} 
        onClose={onClose} 
      />
    );
    
    expect(screen.queryByText('Contact Details')).not.toBeInTheDocument();
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
    
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
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
    
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Important client')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={mockContact} 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles contact without metadata', () => {
    const contactWithoutMetadata: Contact = {
      ...mockContact,
      attributes: undefined,
    };
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={contactWithoutMetadata} 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
  });

  it('handles contact without tags', () => {
    const contactWithoutTags: Contact = {
      ...mockContact,
      tags: [],
    };
    const onClose = vi.fn();
    
    render(
      <ContactDetailModal 
        contact={contactWithoutTags} 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.queryByText('customer')).not.toBeInTheDocument();
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
    
    // Should display formatted date
    expect(screen.getByText(/Jan 1, 2024/i)).toBeInTheDocument();
  });
});
