import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MediaBoard, MediaBoundary } from '../../src/world/kit/MediaBoard';

function Boom(): JSX.Element {
  throw new Error('texture 404');
}

describe('MediaBoard', () => {
  it('refuses anything outside same-origin /media/', () => {
    const bad = { src: 'https://example.com/x.webp', alt: '' };
    expect(() => MediaBoard({ media: bad, width: 2, position: [0, 0, 0] })).toThrow('MediaBoard: same-origin /media/ only');
    expect(() => MediaBoard({ media: { src: '//evil/x.webp', alt: '' }, width: 2, position: [0, 0, 0] })).toThrow('MediaBoard: same-origin /media/ only');
  });
  it('accepts a /media/ source', () => {
    expect(() => MediaBoard({ media: { src: '/media/x.webp', alt: '' }, width: 2, position: [0, 0, 0] })).not.toThrow();
  });
  it('the boundary shows its fallback when the loader throws and does not rethrow', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MediaBoundary fallback={<p>plain frame</p>}>
        <Boom />
      </MediaBoundary>,
    );
    expect(screen.getByText('plain frame')).toBeInTheDocument();
    spy.mockRestore();
  });
});
