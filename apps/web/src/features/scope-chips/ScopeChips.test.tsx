import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ScopeChips } from './ScopeChips';

describe('ScopeChips', () => {
  it('marks the region of the selected state as pressed', () => {
    render(<ScopeChips selection={{ kind: 'state', code: 'BA' }} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Nordeste' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Brasil' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('selects a scope', async () => {
    const onSelect = vi.fn();
    render(<ScopeChips selection={{ kind: 'country' }} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Exterior' }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'abroad' });
  });
});
