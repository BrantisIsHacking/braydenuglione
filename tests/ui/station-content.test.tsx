import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StationContent, formatRange } from '../../src/ui/StationContent';
import type { Station } from '../../src/content/types';

const tranquility: Station = {
  id: 'tranquility-base', building: 'workshop', category: 'project', kind: 'standard',
  title: 'Tranquility Base', org: 'Hackathon', role: 'Developer', start: '2025-10', end: '2025-10',
  oneLiner: 'A lunar base planner.', body: 'Body text here.', bullets: ['One', 'Two'],
  stat: { value: '3', label: 'views' }, tech: ['React', 'Three.js'],
  links: [
    { label: 'Devpost', url: 'https://devpost.com/software/x' },
    { label: 'GitHub', url: 'https://github.com/x/y' },
  ],
  media: [
    { src: '/media/tranquility-base/moon-view.webp', alt: 'Moon surface view of the base' },
    { src: '/media/tranquility-base/pole-view.webp', alt: 'Polar view of the base' },
    { src: '/media/tranquility-base/standing-view.webp', alt: 'Standing view inside the base' },
  ],
  credits: 'Built with Rohan Sharma, Tanish Banota, and Hasan Ali',
  shotCaption: 'x',
};

describe('StationContent', () => {
  it('renders heading, credits, images, safe links', () => {
    render(<StationContent station={tranquility} headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Tranquility Base' })).toBeTruthy();
    expect(screen.getByText(/Built with Rohan Sharma, Tanish Banota, and Hasan Ali/)).toBeTruthy();
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
    imgs.forEach((i) => expect(i.getAttribute('alt')).toBeTruthy());
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
    links.forEach((a) => {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    });
  });
  it('supports heading level 3', () => {
    render(<StationContent station={tranquility} headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeTruthy();
  });
  it('omits absent optional parts cleanly', () => {
    const bare: Station = { ...tranquility, stat: null, links: [], media: [], credits: undefined, bullets: [], tech: [] };
    const { container } = render(<StationContent station={bare} headingLevel={2} />);
    expect(screen.queryByRole('list')).toBeNull();
    expect(container.querySelector('figure')).toBeNull();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });
  it('renders terminal block', () => {
    const t: Station = { ...tranquility, kind: 'terminal', media: [], terminal: { command: 'run', rows: [{ label: 'acc', value: '91%' }], note: 'hi' } };
    render(<StationContent station={t} headingLevel={2} />);
    expect(screen.getByText('91%')).toBeTruthy();
  });
  it('formats ranges', () => {
    expect(formatRange('2026-05', 'present')).toBe('May 2026 – Present');
    expect(formatRange('2024-06', '2024-06')).toBe('Jun 2024');
    expect(formatRange('2024-06', '2025-01')).toBe('Jun 2024 – Jan 2025');
  });
});
