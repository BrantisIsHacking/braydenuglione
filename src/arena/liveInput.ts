export const liveInput: { pressed: Set<string>; joy: { x: number; y: number } } = {
  pressed: new Set<string>(),
  joy: { x: 0, y: 0 },
};

export function resetLiveInput(): void {
  liveInput.pressed.clear();
  liveInput.joy.x = 0;
  liveInput.joy.y = 0;
}
