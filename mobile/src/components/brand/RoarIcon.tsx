import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
  filled?: boolean
}

export function RoarIcon({ size = 22, color = '#ffffff', filled = false }: Props) {
  // Cor interna das features (olhos, focinho, boca) quando preenchido
  const inner = '#06060f'

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Cabeça + orelhas */}
      <Path
        d="M50 8 L68 16 L84 10 L88 28 L80 42 L86 63 L70 84 L50 94 L30 84 L14 63 L20 42 L12 28 L16 10 L32 16 Z"
        stroke={color}
        strokeWidth={filled ? 0 : 6}
        strokeLinejoin="round"
        fill={filled ? color : 'transparent'}
      />
      {/* Olho esquerdo */}
      <Path
        d="M32 42 L45 48 L34 53"
        stroke={filled ? inner : color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Olho direito */}
      <Path
        d="M68 42 L55 48 L66 53"
        stroke={filled ? inner : color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Focinho */}
      <Path
        d="M41 63 L50 58 L59 63 L54 72 L46 72 Z"
        stroke={filled ? inner : color}
        strokeWidth={5}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Boca */}
      <Path
        d="M43 78 Q50 84 57 78"
        stroke={filled ? inner : color}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  )
}
