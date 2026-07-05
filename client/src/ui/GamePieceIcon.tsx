import type { Role } from '@wolf/shared';

interface PieceIconProps {
  /** Rendered size in pixels. Defaults to filling the parent (100%). */
  size?: number | string;
  className?: string;
  title?: string;
}

/**
 * Hand-drawn SVG wolf head. Uses its own palette (slate) so it reads clearly
 * against the wooden board and stays distinct from the sheep.
 */
export function WolfIcon({ size = '100%', className, title = 'Wolf' }: PieceIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* ears */}
      <path d="M13 7 L31 24 L14 29 Z" fill="#5b6472" />
      <path d="M51 7 L33 24 L50 29 Z" fill="#5b6472" />
      <path d="M18 13 L28 23 L19 26 Z" fill="#363d49" />
      <path d="M46 13 L36 23 L45 26 Z" fill="#363d49" />
      {/* head */}
      <path
        d="M11 25 C13 19 22 17 32 17 C42 17 51 19 53 25 L50 39 C48 48 41 56 32 56 C23 56 16 48 14 39 Z"
        fill="#727b88"
      />
      {/* muzzle */}
      <path
        d="M23 38 C23 33 28 31 32 31 C36 31 41 33 41 38 L38 48 C37 52 34 54 32 54 C30 54 27 52 26 48 Z"
        fill="#b7bec8"
      />
      {/* eyes */}
      <path d="M18 32 L29 30 L26 37 Z" fill="#1f2733" />
      <path d="M46 32 L35 30 L38 37 Z" fill="#1f2733" />
      {/* nose */}
      <path d="M28 40 L36 40 L32 45 Z" fill="#1f2733" />
    </svg>
  );
}

/**
 * Hand-drawn SVG sheep head: a fluffy wool cloud with a dark face. Uses a
 * cream/charcoal palette so it contrasts with both the board and the wolf.
 */
export function SheepIcon({ size = '100%', className, title = 'Sheep' }: PieceIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* wool */}
      <g fill="#eef1f5">
        <circle cx="20" cy="25" r="9" />
        <circle cx="32" cy="19" r="10" />
        <circle cx="44" cy="25" r="9" />
        <circle cx="14" cy="35" r="8" />
        <circle cx="50" cy="35" r="8" />
        <circle cx="23" cy="40" r="10" />
        <circle cx="41" cy="40" r="10" />
        <circle cx="32" cy="33" r="12" />
      </g>
      {/* ears */}
      <ellipse cx="20" cy="41" rx="5" ry="7.5" fill="#3c4250" transform="rotate(-28 20 41)" />
      <ellipse cx="44" cy="41" rx="5" ry="7.5" fill="#3c4250" transform="rotate(28 44 41)" />
      {/* face */}
      <ellipse cx="32" cy="43" rx="11" ry="12" fill="#464c5c" />
      {/* forehead wool tuft over the top of the face */}
      <circle cx="32" cy="33" r="8.5" fill="#eef1f5" />
      {/* muzzle */}
      <ellipse cx="32" cy="49" rx="5" ry="4" fill="#5a6172" />
      {/* eyes */}
      <circle cx="28" cy="42" r="2" fill="#eef1f5" />
      <circle cx="36" cy="42" r="2" fill="#eef1f5" />
    </svg>
  );
}

/** Convenience: render the icon for a given role. */
export function RoleIcon({ role, ...rest }: PieceIconProps & { role: Role }) {
  return role === 'wolf' ? <WolfIcon {...rest} /> : <SheepIcon {...rest} />;
}
