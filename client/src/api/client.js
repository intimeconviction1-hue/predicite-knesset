/**
 * Client API maison, pensé pour être un remplacement quasi transparent du
 * SDK @base44/sdk : les pages appellent toujours base44.entities.X.filter(...),
 * base44.auth.me(), base44.functions.invoke(...), etc. Seule l'implémentation
 * change — elle parle maintenant à notre propre serveur Express (server/),
 * pas à une plateforme hébergée.
 */

async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include', // envoie le cookie de session
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* réponse vide */ }

  if (!res.ok) {
    const err = new Error(data?.error || `Erreur ${res.status}`);
    err.status = res.status;
    err.response = { status: res.status, data };
    if (data?.deadline_utc) err.deadline_utc = data.deadline_utc;
    throw err;
  }
  return data;
}

function buildQuery(params) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') usp.set(k, v);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

function makeEntity(name) {
  return {
    filter: (query = {}) => request('GET', `/api/entities/${name}${buildQuery(query)}`),
    list: (sort, limit) => request('GET', `/api/entities/${name}${buildQuery({ _sort: sort, _limit: limit })}`),
    create: (payload) => request('POST', `/api/entities/${name}`, payload),
    update: (id, payload) => request('PUT', `/api/entities/${name}/${id}`, payload),
    delete: (id) => request('DELETE', `/api/entities/${name}/${id}`),
  };
}

const ENTITY_NAMES = [
  'Liste', 'SondageSieges', 'ResultatSieges', 'PronosticSieges',
  'CandidatPM', 'PronosticPM', 'CampaignSettings', 'UserProgress', 'Badge',
  'KnessetHistorique', 'QuizQuestion', 'QuizReponse',
];

const entities = Object.fromEntries(ENTITY_NAMES.map(n => [n, makeEntity(n)]));

export const base44 = {
  entities,

  auth: {
    me: () => request('GET', '/api/auth/me'),
    // admin_key n'est envoyée que par le formulaire de connexion admin ; elle
    // n'est jamais stockée côté client, seulement transmise à la connexion.
    login: (email, full_name, admin_key) =>
      request('POST', '/api/auth/login', { email, full_name, admin_key }),
    logout: () => request('POST', '/api/auth/logout'),
    redirectToLogin: (returnTo) => {
      const target = returnTo || window.location.href;
      window.location.href = `/login?return_to=${encodeURIComponent(target)}`;
    },
  },

  functions: {
    invoke: (name, body = {}) => request('POST', `/api/functions/${name}`, body),
  },

  paris: {
    marches: () => request('GET', '/api/paris'),
  },
  actu: {
    list: () => request('GET', '/api/actu'),
  },
};
