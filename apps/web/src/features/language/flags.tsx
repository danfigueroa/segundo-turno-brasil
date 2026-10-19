import type { ReactNode } from 'react';
import type { FlagCode } from '../../i18n/locales';

/** Three bands, horizontal or vertical, as on most of the flags. */
function Bands({ colors, vertical }: { colors: readonly string[]; vertical?: boolean }) {
  const size = 1 / colors.length;
  return colors.map((color, i) =>
    vertical ? (
      <rect key={i} x={i * size * 3} y="0" width={size * 3} height="2" fill={color} />
    ) : (
      <rect key={i} x="0" y={i * size * 2} width="3" height={size * 2} fill={color} />
    ),
  );
}

/** Simplified flags, small enough to inline: Windows draws no flag emoji. */
const FLAGS: Readonly<Record<FlagCode, ReactNode>> = {
  BR: (
    <>
      <rect width="3" height="2" fill="#009c3b" />
      <polygon points="1.5,0.25 2.75,1 1.5,1.75 0.25,1" fill="#ffdf00" />
      <circle cx="1.5" cy="1" r="0.42" fill="#002776" />
    </>
  ),
  US: (
    <>
      <Bands colors={['#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234']} />
      <rect width="1.3" height="1.14" fill="#3c3b6e" />
    </>
  ),
  ES: (
    <>
      <rect width="3" height="2" fill="#aa151b" />
      <rect y="0.5" width="3" height="1" fill="#f1bf00" />
    </>
  ),
  FR: <Bands colors={['#002395', '#fff', '#ed2939']} vertical />,
  IT: <Bands colors={['#009246', '#fff', '#ce2b37']} vertical />,
  DE: <Bands colors={['#000', '#dd0000', '#ffce00']} />,
  JP: (
    <>
      <rect width="3" height="2" fill="#fff" />
      <circle cx="1.5" cy="1" r="0.6" fill="#bc002d" />
    </>
  ),
};

export function Flag({ code, className }: { code: FlagCode; className?: string | undefined }) {
  return (
    <svg className={className} viewBox="0 0 3 2" aria-hidden="true" focusable="false">
      {FLAGS[code]}
    </svg>
  );
}
