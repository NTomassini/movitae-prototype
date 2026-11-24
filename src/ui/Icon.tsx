import { icons, type IconName } from './icons';

type Props = { name: IconName; size?: number; label?: string; className?: string };

/** Icona della libreria Figma. Decorativa salvo `label`. */
export function Icon({ name, size = 24, label, className }: Props) {
  const def = icons[name];
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={def.viewBox}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: def.body }}
    />
  );
}
