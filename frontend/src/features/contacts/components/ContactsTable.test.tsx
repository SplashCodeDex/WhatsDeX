import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactsTable } from './ContactsTable';
import * as contactsHooks from '../hooks/useContacts';
import { Contact } from '../types';

// Mock the hooks
vi.mock('../hooks/useContacts');

const mockContacts: Contact[] = [
  {
    id: '1',
    phoneNumber: '+1234567890',
    name: 'John Doe',
    email: 'john@example.com',
    tags: ['customer', 'vip'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    phoneNumber: '+0987654321',
    name: 'Jane Smith',
    email: 'jane@example.com',
    tags: ['lead'],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    phoneNumber: '+1122334455',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    tags: ['customer'],
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ContactsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    expect(screen.getAllByRole('generic').some(el => el.classList.contains('animate-pulse'))).toBe(true);
  });

  it('renders error state', () => {
    const error = new Error('Failed to fetch');
    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/Failed to load contacts/i)).toBeInTheDocument();
  });

  it('renders contacts table with data', async () => {
    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: mockContacts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('filters contacts by search query', async () => {
    const user = userEvent.setup();
    
    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: mockContacts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/Search contacts/i);
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('filters contacts by tag', async () => {
    const user = userEvent.setup();
    
    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: mockContacts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    const tagButton = screen.getByText('vip');
    await user.click(tagButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('handles contact selection', async () => {
    const user = userEvent.setup();
    
    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: mockContacts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    const checkboxes = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('.w-5.h-5')
    );
    
    await user.click(checkboxes[1]); // Click first contact checkbox
    
    await waitFor(() => {
      expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    });
  });

  it('exports contacts to CSV', async () => {
    const user = userEvent.setup();
    const mockCreateElement = vi.spyOn(document, 'createElement');
    const mockClick = vi.fn();
    
    mockCreateElement.mockReturnValue({
      click: mockClick,
      href: '',
      download: '',
      style: {},
    } as any);

    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: mockContacts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    const exportButton = screen.getByText(/Export CSV/i);
    await user.click(exportButton);

    expect(mockClick).toHaveBeenCalled();
  });

  it('handles pagination', async () => {
    const user = userEvent.setup();
    const manyContacts = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      phoneNumber: `+123456789${i}`,
      name: `Contact ${i + 1}`,
      email: `contact${i + 1}@example.com`,
      tags: ['customer'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }));
    
    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: manyContacts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
    
    const nextButton = screen.getByLabelText(/Next page/i);
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 3/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no contacts', () => {
    vi.mocked(contactsHooks.useContacts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(contactsHooks.useDeleteContact).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<ContactsTable />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/No contacts found/i)).toBeInTheDocument();
  });
});
