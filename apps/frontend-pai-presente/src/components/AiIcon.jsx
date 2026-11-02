/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';

import { AI_ICON_PATHS, AI_ICON_VIEWBOX } from '@/components/brand-art';

/**
 * O icone oficial de IA da marca (duas estrelinhas). Usa a cor do texto, como
 * os icones do lucide, entao `text-*` e `w-*`/`h-*` funcionam igual.
 */
export default function AiIcon({ className, ...props }) {
  return (
    <svg viewBox={AI_ICON_VIEWBOX} fill="currentColor" aria-hidden="true" className={className} {...props}>
      {AI_ICON_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
