import { render } from '@testing-library/react';
import { LineChart } from '../../../src/components/charts/line-chart';

describe('LineChart', () => {
  const mockData = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 120 },
    { label: 'Apr', value: 180 },
  ];

  it('should render chart with data', () => {
    const { container } = render(<LineChart data={mockData} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render all data points', () => {
    const { container } = render(<LineChart data={mockData} />);

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(mockData.length);
  });

  it('should apply custom height', () => {
    const { container } = render(<LineChart data={mockData} height={300} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('height', '300');
  });

  it('should use default height when not provided', () => {
    const { container } = render(<LineChart data={mockData} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('height', '200');
  });

  it('should render with custom color', () => {
    const { container } = render(<LineChart data={mockData} color="#ff0000" />);

    const paths = container.querySelectorAll('path');
    const linePath = Array.from(paths).find(p => p.getAttribute('stroke') === '#ff0000');
    expect(linePath).toBeTruthy();
  });

  it('should handle empty data gracefully', () => {
    const { container } = render(<LineChart data={[]} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render grid when showGrid is true', () => {
    const { container } = render(<LineChart data={mockData} showGrid={true} />);

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('should not render grid when showGrid is false', () => {
    const { container } = render(<LineChart data={mockData} showGrid={false} />);

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(0);
  });

  it('should show labels', () => {
    const { container } = render(<LineChart data={mockData} />);

    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThan(0);
  });

  it('should hide dots when showDots is false', () => {
    const { container } = render(<LineChart data={mockData} showDots={false} />);

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(0);
  });
});
