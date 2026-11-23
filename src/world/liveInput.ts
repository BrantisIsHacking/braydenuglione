export const liveInput: { pressed: Set<string>; joy: { x: number; y: number }; zoomRequest: { at: number } } = {
  pressed: new Set<string>(),
  joy: { x: 0, y: 0 },
  /** Timestamp (ms) of the last wheel zoom step; throttles wheel to one step per 150 ms. */
  zoomRequest: { at: 0 },
};

export function resetLiveInput(): void {
  liveInput.pressed.clear();
  liveInput.joy.x = 0;
  liveInput.joy.y = 0;
  liveInput.zoomRequest.at = 0;
}
