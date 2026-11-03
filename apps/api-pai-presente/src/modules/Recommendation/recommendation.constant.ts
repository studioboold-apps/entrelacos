/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { RecommendationModuleConfig } from '@adatechnology/recommendation-contracts';

import { ADVERTISER_CATEGORY_FIELD } from '../Panel/panel.constant';

export const RECOMMENDATION_PLACEMENTS = {
  HOME: 'home',
} as const;

/**
 * O que o Entrelacos recomenda. Comeca por LUGAR (o pedido do produto); evento
 * entra junto porque e' o mesmo card com data.
 */
export const RECOMMENDATION_CONFIG: RecommendationModuleConfig = {
  tenancy: { mode: 'single' },
  timeZone: 'America/Sao_Paulo',
  maxSponsoredPerFeed: 1,
  defaultFeedLimit: 6,
  kinds: [
    {
      name: 'place',
      label: 'Lugar para ir',
      fields: [
        {
          name: 'category',
          label: 'Categoria',
          type: 'select',
          required: true,
          options: ADVERTISER_CATEGORY_FIELD.options.map((option) => ({ ...option })),
        },
        { name: 'free', label: 'Entrada gratuita', type: 'boolean', required: false },
        { name: 'address', label: 'Endereço', type: 'text', required: false },
        { name: 'hours', label: 'Horário', type: 'text', required: false },
      ],
    },
    {
      name: 'event',
      label: 'Evento',
      fields: [
        { name: 'date', label: 'Data e horário', type: 'text', required: true },
        { name: 'address', label: 'Endereço', type: 'text', required: false },
        { name: 'free', label: 'Entrada gratuita', type: 'boolean', required: false },
      ],
    },
  ],
  plans: [
    { name: 'featured', label: 'Destaque', weight: 10 },
    { name: 'recommended', label: 'Recomendado', weight: 1 },
  ],
  placements: [{ name: RECOMMENDATION_PLACEMENTS.HOME, label: 'Início — Lugares para ir', maxSponsored: 1 }],
};

/** Rastreio de impressao/clique: generoso para quem rola a tela, curto para robo. */
export const RECOMMENDATION_EVENTS_RATE_LIMIT = { maxRequests: 120, windowSeconds: 60 } as const;
