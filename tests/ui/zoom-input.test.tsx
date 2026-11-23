import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useRef } from 'react';
import { createWorldStore, type WorldStore } from '../../src/world/store';
import { useZoomInput } from '../../src/world/useZoomInput';
import { liveInput } from '../../src/world/liveInput';

function Host({ store }: { store: WorldStore }) {
  const ref = useRef<HTMLDivElement>(null);
  useZoomInput(ref, store);
  return <div ref={ref} data-testid="host" />;
}
const wheel = (el: Element, deltaY: number) => {
  const e = new WheelEvent('wheel', { deltaY, cancelable: true, bubbles: true });
  el.dispatchEvent(e);
  return e.defaultPrevented;
};

let store: WorldStore;
beforeEach(() => {
  store = createWorldStore(null);
  liveInput.zoomRequest.at = -Infinity;
});

describe('useZoomInput', () => {
  it('wheel zooms out when idle', () => {
    const { getByTestId } = render(<Host store={store} />);
    expect(wheel(getByTestId('host'), 100)).toBe(true);
    expect(store.getState().zoomIndex).toBe(2);
  });
  it('is inert (no preventDefault, no zoom) while a panel or the map is open or a transition runs', () => {
    const { getByTestId } = render(<Host store={store} />);
    store.getState().openPanel('books');
    expect(wheel(getByTestId('host'), 100)).toBe(false);
    store.getState().closePanel();
    store.getState().openMap();
    expect(wheel(getByTestId('host'), 100)).toBe(false);
    store.getState().closeMap();
    store.getState().go({ scene: { kind: 'world' }, pose: null, panelId: null });
    expect(wheel(getByTestId('host'), 100)).toBe(false);
    expect(store.getState().zoomIndex).toBe(1);
  });
});
