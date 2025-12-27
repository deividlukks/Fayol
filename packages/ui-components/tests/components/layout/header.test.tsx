import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../../src/components/layout/header';

describe('Header', () => {
  it('should render header with title', () => {
    render(<Header title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render menu button when onMenuClick is provided', () => {
    const mockOnMenuClick = jest.fn();
    render(<Header title="Test" onMenuClick={mockOnMenuClick} />);

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('should call onMenuClick when menu button is clicked', () => {
    const mockOnMenuClick = jest.fn();
    render(<Header title="Test" onMenuClick={mockOnMenuClick} />);

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(menuButton);

    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });

  it('should render notifications button by default', () => {
    render(<Header title="Test" />);

    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    expect(notificationButton).toBeInTheDocument();
  });

  it('should show notification count when provided', () => {
    render(<Header title="Test" notificationCount={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not show notification count when zero', () => {
    render(<Header title="Test" notificationCount={0} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should show 9+ for notification count greater than 9', () => {
    render(<Header title="Test" notificationCount={15} />);

    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('should render user menu button by default', () => {
    render(<Header title="Test" />);

    const userButton = screen.getByRole('button', { name: /user menu/i });
    expect(userButton).toBeInTheDocument();
  });

  it('should hide notifications when showNotifications is false', () => {
    render(<Header title="Test" showNotifications={false} />);

    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
  });

  it('should hide user button when showUser is false', () => {
    render(<Header title="Test" showUser={false} />);

    expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Header title="Test" className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should call onNotificationClick when notifications button is clicked', () => {
    const mockOnNotificationClick = jest.fn();
    render(<Header title="Test" onNotificationClick={mockOnNotificationClick} />);

    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(notificationButton);

    expect(mockOnNotificationClick).toHaveBeenCalledTimes(1);
  });

  it('should call onUserClick when user button is clicked', () => {
    const mockOnUserClick = jest.fn();
    render(<Header title="Test" onUserClick={mockOnUserClick} />);

    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);

    expect(mockOnUserClick).toHaveBeenCalledTimes(1);
  });
});
