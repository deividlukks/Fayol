import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionForm } from '../../../src/components/forms/transaction-form';

describe('TransactionForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    expect(screen.getByPlaceholderText(/compra no supermercado/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByPlaceholderText(/compra no supermercado/i);
    const amountInput = screen.getByPlaceholderText('0.00');
    const submitButton = screen.getByRole('button', { name: /salvar transação/i });

    fireEvent.change(descriptionInput, { target: { value: 'Test transaction' } });
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<TransactionForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /salvar transação/i });
    expect(submitButton).toBeDisabled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should populate form with initial data', () => {
    const initialData = {
      description: 'Initial description',
      amount: 50,
      type: 'income' as const,
    };

    render(<TransactionForm onSubmit={mockOnSubmit} initialData={initialData} />);

    const descriptionInput = screen.getByDisplayValue('Initial description') as HTMLInputElement;
    const amountInput = screen.getByDisplayValue('50') as HTMLInputElement;

    expect(descriptionInput.value).toBe('Initial description');
    expect(amountInput.value).toBe('50');
  });

  it('should render categories select when provided', () => {
    const categories = [
      { id: '1', name: 'Food' },
      { id: '2', name: 'Transport' },
    ];

    render(<TransactionForm onSubmit={mockOnSubmit} categories={categories} />);

    expect(screen.getByText(/categoria/i)).toBeInTheDocument();
  });

  it('should not render categories select when empty', () => {
    render(<TransactionForm onSubmit={mockOnSubmit} categories={[]} />);

    expect(screen.queryByText(/categoria/i)).not.toBeInTheDocument();
  });

  it('should render accounts select when provided', () => {
    const accounts = [
      { id: '1', name: 'Main Account' },
      { id: '2', name: 'Savings' },
    ];

    render(<TransactionForm onSubmit={mockOnSubmit} accounts={accounts} />);

    expect(screen.getByText(/conta/i)).toBeInTheDocument();
  });

  it('should not render accounts select when empty', () => {
    render(<TransactionForm onSubmit={mockOnSubmit} accounts={[]} />);

    expect(screen.queryByText(/conta/i)).not.toBeInTheDocument();
  });
});
