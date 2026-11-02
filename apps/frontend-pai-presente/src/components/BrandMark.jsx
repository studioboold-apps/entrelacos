/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import { SYMBOL_LEFT_PATH, SYMBOL_RIGHT_PATH, SYMBOL_VIEWBOX } from '@/components/brand-art';
import { cn } from '@/lib/utils';

/**
 * O simbolo da marca (dois elos que formam um coracao), com o desenho oficial
 * do designer. Cada elo e' um caminho proprio, para poder se mover sozinho; o
 * entrelacado ja vem recortado no desenho.
 *
 * `motion`:
 * - `enter`: os elos entram um de cada lado, se encaixam e o coracao bate (abertura);
 * - `loop`:  os elos se afastam e voltam a se encaixar, sem parar (carregando);
 * - `none`:  parado.
 *
 * `--splash-elapsed` (negativo) continua a animacao de onde a abertura estatica
 * do `index.html` parou, quando o React assume a tela.
 */
export const BRAND_CREAM = '#F7F5EF';
export const BRAND_ORANGE = '#F18700';
export const BRAND_NAVY = '#2F3052';

const MOTION_STYLES = `
  @keyframes brand-from-left { from { transform: translateX(-48px); opacity: 0 } to { transform: none; opacity: 1 } }
  @keyframes brand-from-right { from { transform: translateX(48px); opacity: 0 } to { transform: none; opacity: 1 } }
  @keyframes brand-beat { 0%, 100% { transform: scale(1) } 40% { transform: scale(1.1) } 70% { transform: scale(0.97) } }
  @keyframes brand-loop-left { 0%, 100% { transform: none } 45%, 55% { transform: translateX(-14px) } }
  @keyframes brand-loop-right { 0%, 100% { transform: none } 45%, 55% { transform: translateX(14px) } }
  .brand-enter .brand-left { animation: brand-from-left 520ms cubic-bezier(.2,.8,.2,1) var(--splash-elapsed, 0ms) both }
  .brand-enter .brand-right { animation: brand-from-right 520ms cubic-bezier(.2,.8,.2,1) var(--splash-elapsed, 0ms) both }
  .brand-enter .brand-heart { transform-origin: 100px 68px; animation: brand-beat 600ms ease-in-out calc(560ms + var(--splash-elapsed, 0ms)) both }
  .brand-loop .brand-left { animation: brand-loop-left 1400ms ease-in-out infinite }
  .brand-loop .brand-right { animation: brand-loop-right 1400ms ease-in-out infinite }
  @media (prefers-reduced-motion: reduce) {
    .brand-enter *, .brand-loop * { animation: none !important }
  }
`;

export default function BrandMark({ motion = 'none', cream = BRAND_CREAM, className }) {
  return (
    <svg
      viewBox={SYMBOL_VIEWBOX}
      aria-hidden="true"
      overflow="visible"
      className={cn('overflow-visible', motion === 'enter' && 'brand-enter', motion === 'loop' && 'brand-loop', className)}
    >
      {motion !== 'none' && <style>{MOTION_STYLES}</style>}
      <g className="brand-heart">
        <path className="brand-right" fill={BRAND_ORANGE} d={SYMBOL_RIGHT_PATH} />
        <path className="brand-left" fill={cream} d={SYMBOL_LEFT_PATH} />
      </g>
    </svg>
  );
}
