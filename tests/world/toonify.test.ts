import { describe, it, expect } from 'vitest';
import { BoxGeometry, Bone, Group, Mesh, MeshStandardMaterial, MeshToonMaterial, Skeleton, SkinnedMesh } from 'three';
import { toonify } from '../../src/world/scene/avatar/toonify';
import { gradientMap, materials } from '../../src/world/scene/materials';

const mk = (name: string, color = '#ffffff') => new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name, color }));

describe('toonify', () => {
  it('swaps materials by role', () => {
    const g = new Group();
    const jersey = mk('Jersey'), shorts = mk('Shorts'), skin = mk('Skin', '#c88a5c'), mystery = mk('Mystery');
    g.add(jersey, shorts, skin, mystery);
    toonify(g, materials);
    expect(jersey.material).toBe(materials.jersey);
    expect(shorts.material).toBe(materials.shorts);
    const s = skin.material as unknown as MeshToonMaterial;
    expect(s).toBeInstanceOf(MeshToonMaterial);
    expect(s.color.getHexString()).toBe('c88a5c');
    expect(s.gradientMap).toBe(gradientMap);
    expect(mystery.material).toBeInstanceOf(MeshToonMaterial);
  });
  it('keeps the skeleton on skinned meshes', () => {
    const bone = new Bone();
    const sm = new SkinnedMesh(new BoxGeometry(), new MeshStandardMaterial({ name: 'Skin' }));
    const sk = new Skeleton([bone]);
    sm.add(bone);
    sm.bind(sk);
    const g = new Group();
    g.add(sm);
    toonify(g, materials);
    expect(sm.skeleton).toBe(sk);
    expect(sm.material).toBeInstanceOf(MeshToonMaterial);
  });
});

describe('toonify idempotence', () => {
  it('re-running keeps shared jersey/shorts and does not replace created toon materials', () => {
    const g = new Group();
    const jersey = mk('Jersey'), shorts = mk('Shorts'), hair = mk('Hair', '#050302');
    g.add(jersey, shorts, hair);
    toonify(g, materials);
    const h1 = hair.material;
    toonify(g, materials);
    expect(jersey.material).toBe(materials.jersey);
    expect(shorts.material).toBe(materials.shorts);
    expect(hair.material).toBe(h1);
    expect((h1 as unknown as MeshToonMaterial).color.getHexString()).not.toBe('050302');
  });
  it('a clone toonified separately leaves the source untouched', () => {
    const src = new Group();
    const j = mk('Jersey');
    src.add(j, mk('Skin', '#c88a5c'));
    const a = src.clone(), b = src.clone();
    toonify(a, materials);
    toonify(b, materials);
    expect((src.children[0] as Mesh).material).toBe(j.material);
    expect((src.children[0] as Mesh).material).not.toBe(materials.jersey);
    expect((a.children[1] as Mesh).material).not.toBe((b.children[1] as Mesh).material);
  });
});
