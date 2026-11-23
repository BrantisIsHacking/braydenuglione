export const PLAYER_GLB_URL = '/models/player.glb'
export const PLAYER_GLB_MAX_BYTES = 400_000 // spike: 285 KB raw / 120 KB gzip
export const CLIP_IDLE = 'Idle_Loop'
export const CLIP_RUN = 'Jog_Fwd_Loop'
export const CLIP_SHOOT = 'Spell_Simple_Shoot'
export const KEEP_CLIPS = [
  'Idle_Loop',
  'Walk_Loop',
  'Jog_Fwd_Loop',
  'Sprint_Loop',
  'Jump_Start',
  'Jump_Loop',
  'Jump_Land',
  'Spell_Simple_Shoot',
] as const
export type AvatarRole = 'jersey' | 'shorts' | 'keep'
export const MATERIAL_ROLES: Record<'Skin' | 'Jersey' | 'Shorts' | 'Hair' | 'Eyes', AvatarRole> = {
  Skin: 'keep',
  Jersey: 'jersey',
  Shorts: 'shorts',
  Hair: 'keep',
  Eyes: 'keep',
}
export const BONE_HEAD = 'Head'
export const BONE_CHEST = 'spine_03'
export const BONE_FOOT_L = 'foot_l'
export const BONE_FOOT_R = 'foot_r'
export const AVATAR_HEIGHT_M = 1.85
export const AVATAR_YAW_OFFSET = Math.PI / 2 // verify facing +x at heading 0 in Task 8
