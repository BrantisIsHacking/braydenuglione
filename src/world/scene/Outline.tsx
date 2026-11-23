import { Outlines } from '@react-three/drei';
import { theme } from '../look/theme';

export function Outline() {
  return <Outlines color={theme.outline.color} thickness={theme.outline.thickness} />;
}
