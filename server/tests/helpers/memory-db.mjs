/**
 * Implémentation en mémoire de la couche db, pour tester le scoring sans
 * Postgres. Elle reproduit le contrat que consomment les fonctions serveur —
 * filtre par égalité stricte, tri « -champ » descendant, id généré à la
 * création — et rien de plus.
 *
 * Volontairement séparée de db/index.js : les tests ne doivent jamais pouvoir
 * atteindre une vraie base, celle de production étant la seule configurée dans
 * server/.env.
 */
import { randomUUID } from 'node:crypto';

/**
 * @param {object} [seed]     lignes initiales, par nom d'entité
 * @param {object} [contraintes]  contraintes d'unicité à reproduire, sous la forme
 *   { NomEntite: ['colonne', ...] }. Sans elles, `createEntity` accepterait des
 *   doublons que Postgres refuse, et un test « rejouer ne recrédite pas » pourrait
 *   passer au vert sur un code qui, en production, remonte une violation de
 *   contrainte au joueur. Le mock doit refuser ce que la vraie base refuse.
 */
export function createMemoryDb(seed = {}, contraintes = {}) {
  const tables = new Map();
  let clock = 0;

  const tableOf = (name) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name);
  };

  // L'horodatage est un compteur, pas une horloge : deux lignes créées dans la
  // même milliseconde doivent rester ordonnables de façon déterministe.
  const nextStamp = () => String(++clock).padStart(6, '0');

  for (const [name, rows] of Object.entries(seed)) {
    tableOf(name).push(...rows.map(r => ({ id: r.id || randomUUID(), created_at: nextStamp(), ...r })));
  }

  const matches = (row, query) =>
    Object.entries(query).every(([k, v]) => {
      if (typeof v === 'boolean') return !!row[k] === v;
      return row[k] === v;
    });

  const clone = (row) => JSON.parse(JSON.stringify(row));

  function applySort(rows, sort) {
    if (!sort) return rows;
    const desc = sort.startsWith('-');
    const col = desc ? sort.slice(1) : sort;
    return [...rows].sort((a, b) => {
      const av = a[col], bv = b[col];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return desc ? -cmp : cmp;
    });
  }

  const db = {
    async filterEntity(name, query = {}) {
      return tableOf(name).filter(r => matches(r, query)).map(clone);
    },
    async listEntity(name, { sort, limit, offset } = {}) {
      const rows = applySort(tableOf(name), sort);
      const debut = Number(offset) || 0;
      const fin = limit ? debut + Number(limit) : undefined;
      return rows.slice(debut, fin).map(clone);
    },
    async createEntity(name, payload, { ignoreConflict = false } = {}) {
      const cles = contraintes[name];
      if (cles) {
        const cible = Object.fromEntries(cles.map(c => [c, payload[c]]));
        const doublon = tableOf(name).find(r => matches(r, cible));
        if (doublon) {
          // Deux comportements distincts, comme en base : ON CONFLICT DO NOTHING
          // renvoie « rien inséré », un INSERT sec lève 23505. Confondre les deux
          // masquerait exactement le bug qu'on cherche à empêcher.
          if (ignoreConflict) return null;
          const e = new Error(`duplicate key value violates unique constraint on ${name}`);
          e.code = '23505';
          throw e;
        }
      }
      const row = { id: payload.id || randomUUID(), created_at: nextStamp(), ...payload };
      tableOf(name).push(row);
      return clone(row);
    },
    async updateEntity(name, id, patch) {
      const row = tableOf(name).find(r => r.id === id);
      if (!row) return null;
      Object.assign(row, patch);
      return clone(row);
    },
    // Accès direct, pour les assertions des tests.
    _rows(name) {
      return tableOf(name).map(clone);
    },
  };

  return db;
}
