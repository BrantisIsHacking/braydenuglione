import { describe, it, expect, vi, beforeEach } from 'vitest';

const generic = { default: () => null, sceneGeometry: () => ({}) };
const worldMod = { default: () => null, sceneGeometry: () => ({}) };
vi.mock('../../src/world/interiors/generic/Interior', () => generic);
vi.mock('../../src/world/world/WorldScene', () => worldMod);

async function fresh() {
  vi.resetModules();
  return import('../../src/world/interiors/registry');
}

describe('scene registry', () => {
  beforeEach(() => vi.resetModules());

  it('every bespoke building (gym included) has a loader and every loader is bespoke', async () => {
    const r = await fresh();
    const { buildings } = await import('../../src/content');
    expect(Object.keys(r.interiorLoaders).sort()).toEqual(buildings.filter((b) => b.bespoke).map((b) => b.id).sort());
  });

  it('loads the generic interior and the world, memoised per key', async () => {
    const r = await fresh();
    const a = r.loadScene({ kind: 'interior', id: 'library' });
    expect(await a).toMatchObject({ default: generic.default });
    expect(r.loadScene({ kind: 'interior', id: 'library' })).toBe(a);
    expect(await r.loadScene({ kind: 'world' })).toMatchObject({ default: worldMod.default });
  });

  it('a rejected load is evicted; prefetch never produces an unhandled rejection', async () => {
    const r = await fresh();
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const loader = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(generic);
    r.interiorLoaders.gym = loader;
    expect(() => r.prefetchScene({ kind: 'interior', id: 'gym' })).not.toThrow();
    await new Promise((res) => setTimeout(res, 20));
    expect(unhandled).not.toHaveBeenCalled();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(await r.loadScene({ kind: 'interior', id: 'gym' })).toBe(generic);
    expect(loader).toHaveBeenCalledTimes(2);
    process.off('unhandledRejection', unhandled);
  });
});
