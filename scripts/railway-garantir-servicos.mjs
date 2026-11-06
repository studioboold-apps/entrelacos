#!/usr/bin/env node
// Prepara o projeto do Railway antes do deploy, pela API publica (GraphQL), com
// o mesmo token de PROJETO que o `railway up` do CI usa (RAILWAY_TOKEN).
//
// O que faz, sem nunca apagar nada e sem repetir o que ja esta feito:
//   1. cria o servico `painel` se ele ainda nao existir;
//   2. grava no `painel` as variaveis de build e de rede (Dockerfile, porta,
//      repasse de /v1 pela rede privada) e o healthcheck em /health;
//   3. garante um dominio do Railway para o painel e tenta o painel.paternar.com.br
//      (o plano pode recusar um segundo dominio proprio: isso vira aviso, nao erro);
//   4. acrescenta em WEB_ORIGINS da `api` as origens que faltam, sem tirar nenhuma.
//
// As variaveis sao gravadas com `skipDeploys`: quem publica e' o `railway up`
// dos passos seguintes, que ja leva o valor novo.
//
// Sai com erro so quando algo essencial falha (token, API fora). Se o painel nao
// puder ser preparado, a api e a web seguem, e o passo do painel e' pulado: o
// resultado vai em GITHUB_OUTPUT como `painel=1` ou `painel=0`.
//
// Nenhum valor secreto e' impresso: das variaveis da api so WEB_ORIGINS e' lida.

import { appendFileSync } from 'node:fs';

const ENDPOINT = 'https://backboard.railway.com/graphql/v2';
const PANEL = 'painel';
const API = 'api';
const PORT = 8080;
const API_PORT = Number(process.env.API_PORT || 3000);
const PUBLIC_DOMAIN = 'paternar.com.br';
const PANEL_DOMAIN = `painel.${PUBLIC_DOMAIN}`;
const FIXED_ORIGINS = [
  `https://${PUBLIC_DOMAIN}`,
  `https://${PANEL_DOMAIN}`,
  'https://entrelacos.up.railway.app',
];

const token = process.env.RAILWAY_TOKEN;

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Project-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors) {
    const msg = body.errors?.map((e) => e.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body.data;
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

export function mergeOrigins(current, wanted) {
  const list = (current || '').split(',').map((s) => s.trim()).filter(Boolean);
  const missing = wanted.filter((o) => !list.includes(o));
  return { value: [...list, ...missing].join(','), missing };
}

async function listServices(projectId) {
  const data = await gql(
    `query ($id: String!) { project(id: $id) { services { edges { node { id name } } } } }`,
    { id: projectId },
  );
  return data.project.services.edges.map((e) => e.node);
}

async function upsert(ids, serviceId, name, value) {
  await gql(
    `mutation ($input: VariableUpsertInput!) { variableUpsert(input: $input) }`,
    { input: { ...ids, serviceId, name, value, skipDeploys: true } },
  );
}

async function preparePanel(ids, services) {
  let panel = services.find((s) => s.name === PANEL);
  if (!panel) {
    console.log(`-> criando o servico '${PANEL}'`);
    const data = await gql(
      `mutation ($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }`,
      { input: { projectId: ids.projectId, name: PANEL } },
    );
    panel = data.serviceCreate;
  } else {
    console.log(`-> servico '${PANEL}' ja existe`);
  }

  const vars = {
    RAILWAY_DOCKERFILE_PATH: 'apps/painel-paternar/Dockerfile',
    API_ORIGIN: `http://\${{${API}.RAILWAY_PRIVATE_DOMAIN}}:${API_PORT}`,
    WEB_PORT: String(PORT),
    PORT: String(PORT),
  };
  for (const [name, value] of Object.entries(vars)) await upsert(ids, panel.id, name, value);
  console.log(`-> variaveis do painel: ${Object.keys(vars).join(', ')}`);

  try {
    await gql(
      `mutation ($sid: String!, $eid: String, $input: ServiceInstanceUpdateInput!) {
         serviceInstanceUpdate(serviceId: $sid, environmentId: $eid, input: $input) }`,
      { sid: panel.id, eid: ids.environmentId, input: { healthcheckPath: '/health', restartPolicyType: 'ON_FAILURE' } },
    );
  } catch (err) {
    console.log(`::warning::healthcheck do painel nao gravado: ${err.message}`);
  }

  const domains = await gql(
    `query ($p: String!, $e: String!, $s: String!) {
       domains(projectId: $p, environmentId: $e, serviceId: $s) {
         serviceDomains { domain } customDomains { domain } } }`,
    { p: ids.projectId, e: ids.environmentId, s: panel.id },
  );
  let railwayDomain = domains.domains.serviceDomains[0]?.domain;
  if (!railwayDomain) {
    const data = await gql(
      `mutation ($input: ServiceDomainCreateInput!) { serviceDomainCreate(input: $input) { domain } }`,
      { input: { environmentId: ids.environmentId, serviceId: panel.id, targetPort: PORT } },
    );
    railwayDomain = data.serviceDomainCreate.domain;
  }
  console.log(`-> painel no Railway: https://${railwayDomain}`);

  if (!domains.domains.customDomains.some((d) => d.domain === PANEL_DOMAIN)) {
    try {
      await gql(
        `mutation ($input: CustomDomainCreateInput!) { customDomainCreate(input: $input) { id } }`,
        { input: { projectId: ids.projectId, environmentId: ids.environmentId, serviceId: panel.id, domain: PANEL_DOMAIN, targetPort: PORT } },
      );
      console.log(`-> dominio ${PANEL_DOMAIN} criado: falta o CNAME no Cloudflare`);
    } catch (err) {
      console.log(`::warning::${PANEL_DOMAIN} nao foi criado (${err.message}). O painel segue em https://${railwayDomain}`);
    }
  }
  return railwayDomain;
}

async function main() {
  if (!token) throw new Error('RAILWAY_TOKEN ausente');
  const { projectToken: ids } = await gql(`query { projectToken { projectId environmentId } }`);
  const services = await listServices(ids.projectId);
  const api = services.find((s) => s.name === API);
  if (!api) throw new Error(`servico '${API}' nao encontrado`);

  let panelDomain = null;
  try {
    panelDomain = await preparePanel(ids, services);
    output('painel', '1');
  } catch (err) {
    console.log(`::error::painel nao preparado: ${err.message}`);
    output('painel', '0');
  }

  const vars = await gql(
    `query ($p: String!, $e: String!, $s: String!) { variables(projectId: $p, environmentId: $e, serviceId: $s) }`,
    { p: ids.projectId, e: ids.environmentId, s: api.id },
  );
  const wanted = panelDomain ? [...FIXED_ORIGINS, `https://${panelDomain}`] : FIXED_ORIGINS;
  const { value, missing } = mergeOrigins(vars.variables.WEB_ORIGINS, wanted);
  if (missing.length) {
    await upsert(ids, api.id, 'WEB_ORIGINS', value);
    console.log(`-> WEB_ORIGINS da api ganhou: ${missing.join(', ')}`);
  } else {
    console.log('-> WEB_ORIGINS da api ja tem todas as origens');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`::error::${err.message}`);
    process.exit(1);
  });
}
