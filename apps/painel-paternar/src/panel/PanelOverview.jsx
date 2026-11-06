/**
 * Paternar — painel da equipe
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { PANEL_TEXT } from './panel-text';
import { usePanelRequest } from './usePanelRequest';

const STATS = [
  { key: 'users', label: PANEL_TEXT.overview.users },
  { key: 'usersOnboarded', label: PANEL_TEXT.overview.onboarded },
  { key: 'usersLast7Days', label: PANEL_TEXT.overview.last7 },
  { key: 'usersLast30Days', label: PANEL_TEXT.overview.last30 },
  { key: 'children', label: PANEL_TEXT.overview.children },
  { key: 'communityPosts', label: PANEL_TEXT.overview.posts },
];

const shortDay = (day) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

export default function PanelOverview({ client }) {
  const { data, error, loading } = usePanelRequest(client, '/overview');

  if (loading) return <p className="text-sm text-zinc-400">{PANEL_TEXT.loading}</p>;
  if (error) return <p className="text-sm text-red-600">{error.message}</p>;
  const overview = data?.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.key} className="rounded-2xl border border-zinc-800 bg-white p-4">
            <p className="text-xs text-zinc-400">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-100">{Number(overview?.[stat.key] ?? 0).toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border border-zinc-800 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">{PANEL_TEXT.overview.signups}</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview?.signupsByDay ?? []}>
              <XAxis dataKey="day" tickFormatter={shortDay} fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} width={28} />
              <Tooltip labelFormatter={shortDay} formatter={(value) => [value, PANEL_TEXT.overview.users]} />
              <Bar dataKey="total" fill="#F28800" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
