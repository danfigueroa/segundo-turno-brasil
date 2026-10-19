import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/context';
import { DEFAULT_I18N } from '../../i18n/i18n';
import { useI18n } from '../../i18n/i18n-context';
import { LanguagePicker } from './LanguagePicker';

function Title() {
  return <h1>{useI18n().m.site.subtitle}</h1>;
}

function renderPicker() {
  render(
    <I18nProvider initial={DEFAULT_I18N}>
      <Title />
      <LanguagePicker />
    </I18nProvider>,
  );
}

describe('LanguagePicker', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  it('names the language on screen', () => {
    renderPicker();
    expect(screen.getByRole('button', { name: 'Idioma: Português' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('lists every language in its own name', async () => {
    renderPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Idioma: Português' }));
    const options = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(options).toEqual([
      'Português',
      'English',
      'Español',
      'Français',
      'Italiano',
      'Deutsch',
      '日本語',
    ]);
    expect(screen.getByRole('button', { name: 'Português' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('switches the whole site and remembers the pick', async () => {
    renderPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Idioma: Português' }));
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', { name: '2026 presidential election' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Language: English' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(localStorage.getItem('stb:locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('closes on Escape', async () => {
    renderPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Idioma: Português' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
