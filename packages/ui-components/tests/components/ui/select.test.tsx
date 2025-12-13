import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../../../src/components/ui/select';

describe('Select', () => {
  const options = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ];

  describe('Rendering', () => {
    it('should render select element', () => {
      render(<Select />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Select label="Country" id="country" />);
      expect(screen.getByLabelText('Country')).toBeInTheDocument();
    });

    it('should render without label', () => {
      render(<Select />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should apply displayName', () => {
      expect(Select.displayName).toBe('Select');
    });

    it('should render with custom className', () => {
      render(<Select className="custom-class" data-testid="select" />);
      expect(screen.getByTestId('select')).toHaveClass('custom-class');
    });
  });

  describe('Label association', () => {
    it('should associate label with select via id', () => {
      render(<Select label="Category" id="category" />);
      const label = screen.getByText('Category');
      const select = screen.getByLabelText('Category');
      expect(label).toHaveAttribute('for', 'category');
      expect(select).toHaveAttribute('id', 'category');
    });
  });

  describe('Options rendering', () => {
    it('should render options from options prop', () => {
      render(<Select options={options} />);
      const select = screen.getByRole('combobox');

      expect(select.querySelectorAll('option')).toHaveLength(3);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should render children options', () => {
      render(
        <Select>
          <option value="1">Child Option 1</option>
          <option value="2">Child Option 2</option>
        </Select>
      );

      expect(screen.getByText('Child Option 1')).toBeInTheDocument();
      expect(screen.getByText('Child Option 2')).toBeInTheDocument();
    });

    it('should render placeholder option when provided', () => {
      render(<Select placeholder="Select an option" />);
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should set placeholder option as disabled and hidden', () => {
      render(<Select placeholder="Select an option" data-testid="select" />);
      const select = screen.getByTestId('select') as HTMLSelectElement;
      const placeholderOption = select.querySelector('option[value=""]');

      expect(placeholderOption).toHaveAttribute('disabled');
      expect(placeholderOption).toHaveAttribute('hidden');
    });
  });

  describe('Error state', () => {
    it('should display error message', () => {
      render(<Select error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply error styles when error prop is provided', () => {
      render(<Select error="Error" data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toHaveClass('border-red-500');
    });

    it('should not display error message when error is not provided', () => {
      render(<Select />);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Select disabled data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Select disabled data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toHaveClass('disabled:opacity-50');
    });
  });

  describe('User interactions', () => {
    it('should handle onChange event', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Select options={options} onChange={handleChange} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'opt2');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update selected value', async () => {
      const user = userEvent.setup();
      render(<Select options={options} data-testid="select" />);
      const select = screen.getByTestId('select') as HTMLSelectElement;

      await user.selectOptions(select, 'opt2');
      expect(select.value).toBe('opt2');
    });

    it('should handle onFocus event', () => {
      const handleFocus = jest.fn();
      render(<Select onFocus={handleFocus} />);
      const select = screen.getByRole('combobox');
      fireEvent.focus(select);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle onBlur event', () => {
      const handleBlur = jest.fn();
      render(<Select onBlur={handleBlur} />);
      const select = screen.getByRole('combobox');
      fireEvent.blur(select);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Value control', () => {
    it('should accept controlled value', () => {
      render(<Select value="opt2" onChange={() => {}} options={options} data-testid="select" />);
      const select = screen.getByTestId('select') as HTMLSelectElement;
      expect(select.value).toBe('opt2');
    });

    it('should accept defaultValue', () => {
      render(<Select defaultValue="opt2" options={options} data-testid="select" />);
      const select = screen.getByTestId('select') as HTMLSelectElement;
      expect(select.value).toBe('opt2');
    });

    it('should show placeholder styles when value is empty', () => {
      render(<Select value="" onChange={() => {}} placeholder="Select" data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toHaveClass('text-slate-400');
    });

    it('should show regular styles when value is not empty', () => {
      render(<Select value="opt1" onChange={() => {}} options={options} data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toHaveClass('text-slate-900');
    });
  });

  describe('Required attribute', () => {
    it('should have required attribute when required prop is true', () => {
      render(<Select required data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toBeRequired();
    });
  });

  describe('Props forwarding', () => {
    it('should forward ref to select element', () => {
      const ref = jest.fn();
      render(<Select ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    it('should forward aria attributes', () => {
      render(<Select aria-label="Test select" />);
      const select = screen.getByLabelText('Test select');
      expect(select).toBeInTheDocument();
    });

    it('should forward data attributes', () => {
      render(<Select data-testid="custom-select" />);
      const select = screen.getByTestId('custom-select');
      expect(select).toBeInTheDocument();
    });
  });

  describe('Dropdown icon', () => {
    it('should render dropdown icon', () => {
      const { container } = render(<Select data-testid="select" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon with correct classes', () => {
      const { container } = render(<Select data-testid="select" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-4', 'w-4', 'fill-current');
    });
  });
});
