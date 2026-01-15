import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Frontend Sanity Check', () => {
  it('should render a heading', () => {
    render(<h1>Hello World</h1>);
    const heading = screen.getByText('Hello World');
    expect(heading).toBeInTheDocument();
  });
});
