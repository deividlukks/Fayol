import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../src/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply displayName', () => {
      expect(Card.displayName).toBe('Card');
    });

    it('should render with custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('should apply default styles', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-white');
    });

    it('should forward ref', () => {
      const ref = jest.fn();
      render(<Card ref={ref}>Content</Card>);
      expect(ref).toHaveBeenCalled();
    });

    it('should forward HTML attributes', () => {
      render(<Card data-testid="test-card" id="card-1">Content</Card>);
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('id', 'card-1');
    });
  });

  describe('CardHeader', () => {
    it('should render children', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should apply displayName', () => {
      expect(CardHeader.displayName).toBe('CardHeader');
    });

    it('should render with custom className', () => {
      render(<CardHeader className="custom-class" data-testid="header">Content</CardHeader>);
      expect(screen.getByTestId('header')).toHaveClass('custom-class');
    });

    it('should apply default styles', () => {
      render(<CardHeader data-testid="header">Content</CardHeader>);
      expect(screen.getByTestId('header')).toHaveClass('flex', 'flex-col', 'p-6');
    });

    it('should forward ref', () => {
      const ref = jest.fn();
      render(<CardHeader ref={ref}>Content</CardHeader>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardTitle', () => {
    it('should render children', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should apply displayName', () => {
      expect(CardTitle.displayName).toBe('CardTitle');
    });

    it('should render as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title.tagName).toBe('H3');
    });

    it('should apply default styles', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId('title')).toHaveClass('text-2xl', 'font-semibold');
    });

    it('should render with custom className', () => {
      render(<CardTitle className="custom-class" data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId('title')).toHaveClass('custom-class');
    });

    it('should forward ref', () => {
      const ref = jest.fn();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardDescription', () => {
    it('should render children', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('should apply displayName', () => {
      expect(CardDescription.displayName).toBe('CardDescription');
    });

    it('should render as p element', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description.tagName).toBe('P');
    });

    it('should apply default styles', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId('desc')).toHaveClass('text-sm', 'text-slate-500');
    });

    it('should render with custom className', () => {
      render(<CardDescription className="custom-class" data-testid="desc">Desc</CardDescription>);
      expect(screen.getByTestId('desc')).toHaveClass('custom-class');
    });

    it('should forward ref', () => {
      const ref = jest.fn();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardContent', () => {
    it('should render children', () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should apply displayName', () => {
      expect(CardContent.displayName).toBe('CardContent');
    });

    it('should apply default styles', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId('content')).toHaveClass('p-6', 'pt-0');
    });

    it('should render with custom className', () => {
      render(<CardContent className="custom-class" data-testid="content">Content</CardContent>);
      expect(screen.getByTestId('content')).toHaveClass('custom-class');
    });

    it('should forward ref', () => {
      const ref = jest.fn();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardFooter', () => {
    it('should render children', () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should apply displayName', () => {
      expect(CardFooter.displayName).toBe('CardFooter');
    });

    it('should apply default styles', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId('footer')).toHaveClass('flex', 'items-center', 'p-6');
    });

    it('should render with custom className', () => {
      render(<CardFooter className="custom-class" data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId('footer')).toHaveClass('custom-class');
    });

    it('should forward ref', () => {
      const ref = jest.fn();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Complete Card structure', () => {
    it('should render all card components together', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
      expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });

    it('should maintain proper structure', () => {
      const { container } = render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');

      expect(card).toContainElement(header);
      expect(header).toContainElement(title);
    });
  });
});
