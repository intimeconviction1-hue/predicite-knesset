import { useEffect, useRef } from 'react';

/**
 * Compte une vue de page, sans cookie ni identifiant.
 *
 * Ce que le serveur reçoit : un nom de page, et éventuellement la provenance
 * déclarée par le lien partagé qui a amené le visiteur. Rien d'autre — voir
 * server/routes/audience.js.
 *
 * ── L'attribution n'est envoyée qu'UNE fois ──
 * `?via=boussole` dit d'où vient le visiteur, pas ce qu'il fait ensuite. Si on
 * le renvoyait à chaque navigation interne, quelqu'un arrivé par la carte de la
 * Boussole puis promené sur huit pages compterait huit fois pour « boussole ».
 * Les cartes les plus intéressantes — celles qui amènent des gens qui restent —
 * paraîtraient alors les plus efficaces à proportion de l'intérêt du site, et
 * plus du tout à proportion de leur propre pouvoir d'attraction. Le drapeau est
 * donc au niveau du module : il vit le temps d'un chargement de page, c'est-à-dire
 * exactement le temps d'une arrivée.
 */
let attributionEnvoyee = false;

export function useMesureAudience(nomDePage) {
  const derniere = useRef(null);

  useEffect(() => {
    if (!nomDePage) return;
    // Le serveur local écrit dans la base de PRODUCTION : le .env pointe Neon.
    // Mesurer depuis un poste de travail gonflerait donc les chiffres réels de
    // rechargements de développement, et la pollution serait irrattrapable —
    // rien, dans la table, ne distingue une vue locale d'une vraie.
    //
    // La garde porte sur l'HÔTE, pas seulement sur le mode de build. `PROD` dit
    // comment le fichier a été compilé, pas où il s'exécute : le README
    // documente `npm run build` puis `NODE_ENV=production npm start` en local
    // pour vérifier une page avant de pousser, et ce cas-là a un build de
    // production. Tester les deux couvre `npm run dev` comme cette vérification.
    const { hostname } = window.location;
    if (!import.meta.env.PROD) return;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return;
    // React exécute deux fois les effets en mode strict, et un changement de
    // paramètre de requête ne change pas la page : dans les deux cas ce serait
    // la même vue comptée deux fois.
    if (derniere.current === nomDePage) return;
    derniere.current = nomDePage;

    let via = '';
    if (!attributionEnvoyee) {
      attributionEnvoyee = true;
      via = new URLSearchParams(window.location.search).get('via') || '';
    }

    // `keepalive` pour que la mesure parte même si le visiteur quitte la page
    // dans la seconde — c'est précisément la visite qu'on risquerait de perdre,
    // et pas la moins instructive. L'échec est silencieux : un bloqueur de
    // requêtes ou un réseau coupé ne doit rien produire dans la console de
    // quelqu'un qui joue.
    fetch('/api/audience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: nomDePage, via }),
      keepalive: true,
    }).catch(() => {});
  }, [nomDePage]);
}

export default useMesureAudience;
