import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Container from '../Container';

describe('Container Component', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Container>Container Content</Container>);
      expect(screen.getByText('Container Content')).toBeInTheDocument();
    });

    it('renders complex children', () => {
      render(
        <Container>
          <h1 data-testid="title">Title</h1>
          <p data-testid="content">Content</p>
        </Container>
      );
      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies default container classes', () => {
      render(<Container data-testid="container">Content</Container>);
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-screen-xl');
      expect(container).toHaveClass('mx-auto');
      expect(container).toHaveClass('px-4');
    });

    it('applies custom className', () => {
      render(
        <Container className="custom-class" data-testid="container">
          Content
        </Container>
      );
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(
        <Container className="custom-class" data-testid="container">
          Content
        </Container>
      );
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-screen-xl');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('HTML Attributes Passthrough', () => {
    it('passes through data attributes', () => {
      render(<Container data-testid="test-container">Content</Container>);
      expect(screen.getByTestId('test-container')).toBeInTheDocument();
    });

    it('passes through id attribute', () => {
      render(<Container id="my-container">Content</Container>);
      expect(document.getElementById('my-container')).toBeInTheDocument();
    });
  });
});
