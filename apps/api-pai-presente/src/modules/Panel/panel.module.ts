/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 *
 * O painel da equipe. Tudo vem do SDK da casa, e este arquivo so compoe:
 *
 * - `user-module`: quem ENTRA no painel (e-mail e senha da equipe, com papel);
 * - `customer-module`: os ANUNCIANTES, com categoria no catalogo de campos;
 * - `recommendation-module`: a administracao das recomendacoes, campanhas e numeros;
 * - `panel.routes`: o que so o Entrelacos sabe responder (cadastros de pais).
 *
 * A sessao da equipe e' outra, com outro segredo e outro cookie: token de pai
 * nao abre o painel, e o painel nao enxerga a sessao de pai.
 */

import { createCustomerRoutes, type CustomerModule } from '@adatechnology/customer-module';
import type { AuthContext, AuthContextResolverPort, ModuleRouteTable } from '@adatechnology/module-http';
import { createModuleFetchRouter, type ModuleFetchRouter } from '@adatechnology/module-http/fetch';
import { createRecommendationRoutes, type RecommendationModule } from '@adatechnology/recommendation-module';
import { USER_ERROR_CODE } from '@adatechnology/user-contracts';
import { createUserModule, createUserRoutes, type UserModule } from '@adatechnology/user-module';

import type { Database } from '../../database/client';
import type { Logger } from '../shared/logger/logger';
import {
  ADVERTISER_CATEGORY_FIELD,
  PANEL_BASE_PATH,
  PANEL_COMPANY_ID,
  PANEL_ROLES,
  SCOPES_BY_ROLE,
  type PanelRole,
} from './panel.constant';
import { createPanelRepository } from './panel.repository';
import { buildPanelRoutes } from './panel.routes';

export type BuildPanelModuleParams = {
  readonly database: Database;
  /** Os mesmos que servem o feed dos pais: uma instancia, dois publicos. */
  readonly customers: CustomerModule;
  readonly recommendations: RecommendationModule;
  readonly jwtSecret: string;
  readonly firstAdmin?: { readonly email: string; readonly password: string };
  readonly logger?: Logger;
};

export type PanelModule = {
  readonly router: ModuleFetchRouter;
  readonly users: UserModule;
  /** Cria o primeiro acesso e a categoria de anunciante, se ainda nao existirem. */
  bootstrap(): Promise<void>;
};

const BEARER_PREFIX = 'bearer ';
const EMAIL_ALREADY_EXISTS_CODE = USER_ERROR_CODE.EMAIL_ALREADY_EXISTS;

function isPanelRole(role: string): role is PanelRole {
  return Object.values(PANEL_ROLES).includes(role as PanelRole);
}

/**
 * Papel desconhecido nao vira escopo nenhum: quem tem token valido com papel
 * inventado entra, mas nao ve nada. Melhor que tratar papel novo como admin.
 */
export function scopesForRole(role: string): readonly string[] {
  return isPanelRole(role) ? SCOPES_BY_ROLE[role] : [];
}

export function createPanelAuthResolver(users: Pick<UserModule, 'verifyAccessToken'>): AuthContextResolverPort {
  return {
    async resolve({ headers }): Promise<AuthContext | undefined> {
      const header = headers['authorization'] ?? '';
      if (!header.toLowerCase().startsWith(BEARER_PREFIX)) return undefined;
      const claims = await users.verifyAccessToken(header.slice(BEARER_PREFIX.length).trim());
      if (!claims) return undefined;
      return { companyId: PANEL_COMPANY_ID, userId: claims.sub, scopes: scopesForRole(claims.role) };
    },
  };
}

export async function buildPanelModule(params: BuildPanelModuleParams): Promise<PanelModule> {
  // Os modulos tipam o banco pelo drizzle 1.x deles; o app esta no 0.4x. A API
  // usada (select/insert/update/onConflict) e' a mesma nas duas linhas.
  const db = params.database as never;

  const users = await createUserModule({
    db,
    config: {
      tenancy: { mode: 'single', defaultCompanyId: PANEL_COMPANY_ID },
      accessToken: { secret: params.jwtSecret, issuer: 'entrelacos-panel', audience: 'entrelacos-panel' },
    },
  });

  const { customers, recommendations } = params;

  const routes: ModuleRouteTable = [
    ...createUserRoutes({ module: users }),
    ...createCustomerRoutes({ module: customers }),
    ...createRecommendationRoutes({ module: recommendations, features: { feed: false, admin: true } }),
    ...buildPanelRoutes(createPanelRepository(params.database)),
  ];

  const router = createModuleFetchRouter({
    routes,
    basePath: PANEL_BASE_PATH,
    authResolver: createPanelAuthResolver(users),
  });

  async function bootstrap(): Promise<void> {
    if (params.firstAdmin && params.firstAdmin.email && params.firstAdmin.password) {
      try {
        await users.useCases.createUser.execute({
          email: params.firstAdmin.email,
          name: 'Administrador',
          password: params.firstAdmin.password,
          role: PANEL_ROLES.ADMIN,
        });
        params.logger?.info('painel: primeiro acesso criado', { email: params.firstAdmin.email });
      } catch (error) {
        // Ja existe: e' o caso de todo boot depois do primeiro. A senha nunca e' trocada aqui.
        if ((error as { code?: unknown }).code !== EMAIL_ALREADY_EXISTS_CODE) throw error;
      }
    }

    const settings = await customers.useCases.getSettings.execute({});
    if (!settings.fieldCatalog.some((field) => field.name === ADVERTISER_CATEGORY_FIELD.name)) {
      await customers.useCases.updateSettings.execute({
        input: {
          maskPhoneInList: settings.maskPhoneInList,
          documentCatalog: settings.documentCatalog,
          fieldCatalog: [...settings.fieldCatalog, ADVERTISER_CATEGORY_FIELD],
        } as never,
      });
    }
  }

  return { router, users, bootstrap };
}
