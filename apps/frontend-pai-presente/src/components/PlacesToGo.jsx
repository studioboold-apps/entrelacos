/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 *
 * "Lugares para ir" na Home: o feed do `recommendation-module`, com a cidade
 * do pai quando ele informou. Sem nada para mostrar, a secao some.
 */

import React, { useMemo } from 'react';
import { RecommendationFeed, RecommendationsProvider, createFetchRecommendationsApi } from '@adatechnology/recommendations-ui';

import { apiBaseUrl, fetchWithSession } from '@/api/http';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/lib/i18n';

const HOME_PLACEMENT = 'home';

const placesApi = createFetchRecommendationsApi({ baseUrl: `${apiBaseUrl()}/v1`, fetch: fetchWithSession });

export default function PlacesToGo({ className }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const city = user?.city || undefined;

  const labels = useMemo(
    () => ({
      sponsored: t('home.placesToGo.sponsored'),
      curated: t('home.placesToGo.curated'),
      open: t('home.placesToGo.open'),
    }),
    [t],
  );

  return (
    <RecommendationsProvider api={placesApi} labels={labels}>
      <RecommendationFeed
        className={className}
        placement={HOME_PLACEMENT}
        city={city}
        heading={<h2 className="text-lg font-semibold text-zinc-100">{t('home.placesToGo.title')}</h2>}
      />
    </RecommendationsProvider>
  );
}
