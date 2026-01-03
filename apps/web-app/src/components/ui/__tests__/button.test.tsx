import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('deve renderizar com texto corretamente', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('deve aplicar variant primary por padrão', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('deve aplicar variant secondary', () => {
    render(<Button variant="secondary">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-slate-100');
  });

  it('deve aplicar variant outline', () => {
    render(<Button variant="outline">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-slate-300');
  });

  it('deve aplicar variant ghost', () => {
    render(<Button variant="ghost">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-slate-100');
  });

  it('deve aplicar variant danger', () => {
    render(<Button variant="danger">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-500');
  });

  it('deve aplicar size md por padrão', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10');
  });

  it('deve aplicar size sm', () => {
    render(<Button size="sm">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8');
    expect(button).toHaveClass('text-xs');
  });

  it('deve aplicar size lg', () => {
    render(<Button size="lg">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-12');
    expect(button).toHaveClass('text-lg');
  });

  it('deve aplicar size icon', () => {
    render(<Button size="icon">✓</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('w-10');
  });

  it('deve aceitar className customizado', () => {
    render(<Button className="custom-class">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('deve chamar onClick quando clicado', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve desabilitar quando disabled=true', () => {
    render(<Button disabled>Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('deve desabilitar quando isLoading=true', () => {
    render(<Button isLoading>Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });

  it('deve mostrar loader quando isLoading=true', () => {
    const { container } = render(<Button isLoading>Button</Button>);

    // Verifica se o ícone de loading existe
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('não deve chamar onClick quando disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Button
      </Button>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('não deve chamar onClick quando isLoading', () => {
    const handleClick = jest.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Button
      </Button>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('deve passar props HTML adicionais para o button', () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );
    const button = screen.getByTestId('submit-btn');

    expect(button).toHaveAttribute('type', 'submit');
  });

  it('deve aplicar ref corretamente', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Button</Button>);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
  });

  it('deve ter classes de transição e foco', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('transition-colors');
    expect(button).toHaveClass('focus-visible:outline-none');
    expect(button).toHaveClass('focus-visible:ring-2');
  });

  it('deve ter displayName definido', () => {
    expect(Button.displayName).toBe('Button');
  });

  it('deve renderizar children com isLoading', () => {
    render(<Button isLoading>Loading...</Button>);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('deve combinar múltiplas variants e sizes', () => {
    render(
      <Button variant="danger" size="lg">
        Large Danger
      </Button>
    );
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-red-500');
    expect(button).toHaveClass('h-12');
  });

  it('deve aplicar todas as classes base', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('inline-flex');
    expect(button).toHaveClass('items-center');
    expect(button).toHaveClass('justify-center');
    expect(button).toHaveClass('rounded-lg');
    expect(button).toHaveClass('font-medium');
  });
});
