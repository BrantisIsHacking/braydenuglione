import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

/** Low ink dividers (the camera sees over them) and the scarlet dado strip along the walls. */
export function Dividers() {
  return (
    <>
      <ShapeBatch shape="box" color="ink" items={[bx(-3.5, 0.45, -13, 0.2, 0.9, 6), bx(3.5, 0.45, -13, 0.2, 0.9, 6)]} />
      <ShapeBatch
        shape="box"
        color="scarlet"
        items={[bx(0, 0.9, -15.97, 22, 0.3, 0.06), bx(-10.97, 0.9, -8, 0.06, 0.3, 16), bx(10.97, 0.9, -8, 0.06, 0.3, 16)]}
      />
    </>
  );
}
