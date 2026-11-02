/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import {
  WORDMARK_ENTRE_PATHS,
  WORDMARK_LACOS_PATHS,
  WORDMARK_TAGLINE_PATHS,
  WORDMARK_VIEWBOX,
} from '@/components/brand-art';
import { BRAND_CREAM, BRAND_NAVY, BRAND_ORANGE } from '@/components/BrandMark';
import { cn } from '@/lib/utils';

const TAGLINE_GRAY = '#ACABA8';

/**
 * "Entre" + "laços" em laranja, com PAI PRESENTE embaixo: o desenho oficial do
 * logotipo (em curvas, entao nao depende da fonte da marca estar carregada).
 * Fica escondido do leitor de tela: quem usa poe o nome num titulo `sr-only`.
 * `tone` diz o fundo: `dark` (marinho) ou `light`.
 */
export default function BrandWordmark({ tone = 'light', size = 'md', className }) {
  const entreColor = tone === 'dark' ? BRAND_CREAM : BRAND_NAVY;
  return (
    <svg
      aria-hidden="true"
      viewBox={WORDMARK_VIEWBOX}
      className={cn('block', size === 'lg' ? 'h-16 w-[226px]' : 'h-12 w-[170px]', className)}
    >
      {WORDMARK_ENTRE_PATHS.map((d) => (
        <path key={d} fill={entreColor} d={d} />
      ))}
      {WORDMARK_LACOS_PATHS.map((d) => (
        <path key={d} fill={BRAND_ORANGE} d={d} />
      ))}
      {WORDMARK_TAGLINE_PATHS.map((d) => (
        <path key={d} fill={TAGLINE_GRAY} d={d} />
      ))}
    </svg>
  );
}
