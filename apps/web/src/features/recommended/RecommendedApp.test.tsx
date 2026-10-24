import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecommendedApp } from './RecommendedApp';

describe('RecommendedApp', () => {
  it('links to the app in a new tab', () => {
    render(<RecommendedApp />);
    const link = screen.getByRole('link', { name: 'Conhecer o WeRacha' });
    expect(link).toHaveAttribute('href', 'https://weracha.app');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('complementary', { name: 'WeRacha' })).toBeInTheDocument();
  });
});
