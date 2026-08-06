// LA projection de référence du site — une seule, pour toutes les pages.
//
// Pourquoi ce fichier existe. Chaque page calculait la sienne, et elles ne
// tombaient pas d'accord. Le 2026-08-06, sur les mêmes données :
//
//     liste                Home / Listes / MaRepartition   Forme ta coalition
//     Likoud                            22                          25
//     Otzma Yehudit                      9                           8
//     Shas                               7                           8
//     Hadash-Ta'al                       6                           5
//     Yisrael Beytenou                  11                          10
//
// Six listes sur onze. Les trois premières lisaient le DERNIER sondage brut ;
// « Forme ta coalition » moyennait les cinq derniers, appliquait le seuil et
// ramenait à 120. Deux méthodes défendables, mais pas sur le même site le même
// jour : un joueur qui compare deux pages y voit une erreur, et il a raison.
//
// La moyenne l'emporte, pour trois raisons :
//   1. le dernier sondage seul fait bouger le plateau d'un jour à l'autre selon
//      l'institut publié la veille — injouable ;
//   2. un sondage brut peut créditer une liste de 2 sièges, ce que le scrutin ne
//      peut pas produire et ce que /MaRepartition refuse au joueur ;
//   3. la moyenne se dit en une ligne de provenance, vérifiable.
//
// Ce qui NE passe PAS par ici, et c'est voulu : SondagesTrend et
// ConsensusSondages. Leur sujet est le sondage individuel — l'un montre la
// dispersion dans le temps, l'autre le désaccord entre instituts. Les moyenner
// reviendrait à effacer ce qu'ils servent à montrer.

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/client';
import { repartirSieges, MIN_SIEGES_AU_SEUIL, TOTAL_SIEGES } from '@/lib/knesset';

// Nombre de sondages moyennés. Cinq couvre environ une semaine de publications
// en pleine campagne : assez pour lisser l'effet d'institut, assez court pour
// qu'un vrai mouvement se voie en quelques jours.
export const NB_SONDAGES_PLATEAU = 5;

/**
 * Le plateau de référence : moyenne des N derniers sondages, seuil appliqué,
 * total ramené à 120.
 *
 * @param {Array} listes  les listes ACTIVES (une liste inactive n'est pas en lice)
 * @returns {{
 *   sondages: Array, dernier: Object|null, pret: boolean,
 *   siegesParListe: Map<string, number>,   // id → sièges, 0 si sous le seuil
 *   projection: Array,                     // listes créditées, triées, avec .seats
 *   pourHemicycle: Array,                  // [{liste_id, seats}] pour <Hemicycle>
 *   provenance: string|null,
 * }}
 */
export function useProjection(listes = []) {
  const { data: sondages = [] } = useQuery({
    queryKey: ['projection-sondages', NB_SONDAGES_PLATEAU],
    queryFn: () => base44.entities.SondageSieges.list('-poll_date', NB_SONDAGES_PLATEAU),
  });

  return useMemo(() => {
    const dernier = sondages[0] || null;
    if (!sondages.length || !listes.length) {
      return { sondages, dernier, pret: false, siegesParListe: new Map(), projection: [], pourHemicycle: [], provenance: null };
    }

    // Un parti absent d'un sondage y compte 0 : dans un sondage sièges
    // israélien, ne pas être crédité, c'est être sous le seuil — pas une donnée
    // manquante. Les listes inactives présentes dans les vieux sondages ne sont
    // pas dans `listes`, elles disparaissent donc naturellement du plateau.
    const somme = new Map();
    for (const s of sondages) {
      for (const x of s.seats_by_liste || []) somme.set(x.liste_id, (somme.get(x.liste_id) || 0) + x.seats);
    }

    const projection = repartirSieges(listes.map(l => ({
      id: l.id, slug: l.slug, name: l.name_fr, color: l.color || '#6B7280',
      exact: (somme.get(l.id) || 0) / sondages.length,
    })));

    const siegesParListe = new Map(listes.map(l => [l.id, 0]));
    for (const p of projection) siegesParListe.set(p.id, p.seats);

    const jour = (d) => new Date(d).toLocaleDateString('fr-FR');
    const source = sondages.length > 1
      ? `moyenne des ${sondages.length} derniers sondages (${jour(sondages[sondages.length - 1].poll_date)} — ${jour(dernier.poll_date)})`
      : `sondage ${dernier.institute} du ${jour(dernier.poll_date)}`;

    return {
      sondages,
      dernier,
      pret: true,
      siegesParListe,
      projection,
      pourHemicycle: projection.map(p => ({ liste_id: p.id, seats: p.seats })),
      // Le traitement est annoncé autant que la source : ces sièges sont
      // calculés, pas relevés, et le lecteur doit pouvoir le savoir sans lire
      // le code.
      provenance: `Sièges : ${source}, seuil de 3,25 % appliqué (moins de ${MIN_SIEGES_AU_SEUIL} sièges = 0), total ramené à ${TOTAL_SIEGES} au prorata.`,
    };
  }, [sondages, listes]);
}
