import React, { useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { PieChart, ShieldCheck, BarChart2, Layers, Zap } from 'lucide-react';
import RectoVersoCard from '@/components/knesset/RectoVersoCard';
import { MIN_SIEGES_AU_SEUIL } from '@/lib/knesset';

/**
 * LE DECK DU JOUR — trois faits du jour, trois cartes à retourner.
 *
 * La Home n'en portait qu'UNE, et toujours la même : la projection. Un seul
 * retournement possible, donc un seul « ah, il y a un dos » — le geste ne
 * devenait jamais une habitude. Un deck en propose trois, tirées de trois
 * matières différentes (la projection, le mouvement, le désaccord des
 * instituts), et le geste devient la façon de lire la page.
 *
 * ⚠️ Chaque carte est bâtie sur des données RÉELLES ou n'existe pas. Aucune
 * carte de remplissage : si le mouvement n'est pas calculable (pas de Knesset
 * sortante en base), la carte disparaît, le deck en montre deux.
 *
 * ⚠️ Le lien fait → pari n'est jamais inventé. Le dos d'une carte n'affiche des
 * cotes que si un marché ouvert porte RÉELLEMENT sur son sujet :
 *   · carte « projection » → le marché « qui sera en tête au prochain sondage »
 *     (même sujet : le classement des listes) ;
 *   · carte « mouvement »  → un marché dont une issue désigne cette liste-là
 *     (`match_value` = son identifiant, fourni par l'API) ;
 *   · carte « seuil »      → un marché dont la QUESTION nomme cette liste.
 * Sans correspondance, le dos propose les gestes du produit, pas un pari
 * rapproché à la louche.
 *
 * ⚠️ Et aucune carte ne redit ce qu'un autre bloc de la Home dit déjà. La
 * troisième portait sur le désaccord entre instituts — c'est-à-dire, mot pour
 * mot, le bloc « Consensus des sondages » qui vit un demi-écran plus bas. Elle
 * porte maintenant sur le seuil de 3,25 %, qui n'apparaît nulle part ailleurs.
 */

const jourCourt = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function DeckDuJour({
  listesAvecSieges = [],
  verdict,
  sondagesProjection = [],
  marches = [],
  className = '',
}) {
  const parisUrl = createPageUrl('Paris');

  const cartes = useMemo(() => {
    const out = [];
    const credites = listesAvecSieges.filter(l => l._seats > 0).sort((a, b) => b._seats - a._seats);

    // Le marché « qui sera en tête » — celui dont le sujet EST la projection.
    const marcheRang = marches.find(m => m.type === 'rang' && (m.issues || []).length > 0);
    const cotesDuRang = marcheRang
      ? marcheRang.issues.slice(0, 2).map(i => ({ id: i.id, kicker: 'En tête', label: i.label, cote: i.cote, to: parisUrl }))
      : [];

    // ── 1. La projection du jour ────────────────────────────────────────────
    if (credites.length && sondagesProjection.length) {
      const dernier = sondagesProjection[0];
      out.push({
        cle: 'projection',
        badge: 'Projection · fait vérifié',
        title: `Moyenne des ${sondagesProjection.length} derniers sondages`,
        fact: verdict,
        nums: credites.slice(0, 2).map(l => ({ n: l._seats, label: l.name_fr })),
        source: `Sièges au ${jourCourt(dernier.poll_date)} · seuil de 3,25 % appliqué, total ramené à 120`,
        jeuKicker: 'Cette projection se joue',
        jeuTitre: marcheRang?.question,
        cotes: cotesDuRang,
        actions: [
          { icon: PieChart, label: 'Compose ta Knesset', hint: 'Répartis les 120 sièges à ta façon', to: createPageUrl('MaRepartition') },
        ],
      });
    }

    // ── 2. Le plus gros mouvement depuis la Knesset sortante ────────────────
    // Une projection seule ne dit rien : « Likoud 22 » n'informe que si l'on
    // sait qu'il en a 32. La carte isole l'écart le plus spectaculaire.
    const mouvements = listesAvecSieges
      .filter(l => l.current_knesset_seats != null)
      .map(l => ({ ...l, delta: l._seats - l.current_knesset_seats }))
      .filter(l => l.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const mouv = mouvements[0];

    if (mouv) {
      const perd = mouv.delta < 0;
      const sortant = mouv.current_knesset_seats;
      const projete = mouv._seats;
      const phrase = projete === 0
        ? `Sortie de la Knesset : la moyenne des sondages la place sous le seuil de 3,25 %, et sous le seuil on n'a aucun siège.`
        : perd
          ? `Elle en avait ${sortant} dans la Knesset sortante. La moyenne des sondages ne lui en laisse plus que ${projete}.`
          : `Elle en avait ${sortant} dans la Knesset sortante. La moyenne des sondages lui en donne ${projete}.`;

      // Un marché qui désigne CETTE liste (et pas une autre) : l'API renseigne
      // `match_value` avec l'identifiant de la liste sur les marchés « rang ».
      const marcheLie = marches.find(m => (m.issues || []).some(i => i.match_value === mouv.id));
      const cotesLiees = marcheLie
        ? marcheLie.issues.slice(0, 2).map(i => ({ id: i.id, kicker: 'En tête', label: i.label, cote: i.cote, to: parisUrl }))
        : [];

      out.push({
        cle: 'mouvement',
        badge: 'Mouvement · fait vérifié',
        title: `${mouv.name_fr} : ${mouv.delta > 0 ? '+' : ''}${mouv.delta}`,
        fact: phrase,
        nums: [
          { n: sortant, label: 'sortants' },
          { n: projete, label: 'projetés' },
        ],
        source: 'Sortants : 25ᵉ Knesset · projection : moyenne des derniers sondages',
        jeuKicker: 'Ce mouvement se joue',
        jeuTitre: marcheLie?.question || 'Tu y crois, toi, à ce mouvement ?',
        cotes: cotesLiees,
        actions: [
          // Les guillemets ne sont pas décoratifs : « la fiche de Unité
          // nationale » ne s'écrit pas, et l'élision (« d'Unité ») dépend du
          // nom du parti, qui vient de la base. Les guillemets suppriment le
          // problème pour tous les noms d'un coup.
          { icon: Layers, label: `La fiche « ${mouv.name_fr} »`, hint: 'Programme, chef de file, historique', to: `${createPageUrl('Liste')}?slug=${mouv.slug}` },
          { icon: PieChart, label: 'Donne-lui le score que tu veux', hint: 'Dans ton pronostic à 120 sièges', to: createPageUrl('MaRepartition') },
        ],
      });
    }

    // ── 3. Qui joue sa survie au seuil ? ────────────────────────────────────
    //
    // Cette carte parlait du DÉSACCORD ENTRE INSTITUTS. Elle disait exactement
    // ce que le bloc « Consensus des sondages » dit un demi-écran plus bas, avec
    // les mêmes chiffres et presque les mêmes mots : deux fois le même fait sur
    // la même page, ce n'est pas de l'insistance, c'est du remplissage — et ça
    // donne l'impression que la Home tourne en rond sur les sondages.
    //
    // Le seuil, lui, n'apparaît nulle part ailleurs alors que c'est la règle la
    // plus brutale du scrutin israélien : 3,25 %, soit 4 sièges. En dessous, une
    // liste ne perd pas des sièges, elle disparaît. C'est le fait le plus tendu
    // de la journée, et il a un marché ouvert qui porte dessus.
    const auSeuil = credites.length ? credites[credites.length - 1] : null;

    if (auSeuil && auSeuil._seats <= MIN_SIEGES_AU_SEUIL + 2) {
      // Un marché qui NOMME cette liste dans sa question. Le rapprochement est
      // vérifiable à l'œil (« Le Sionisme religieux franchira-t-il le seuil ? »),
      // il n'est pas déduit d'une proximité de sujet — la règle du site est
      // qu'un pari ne se rattache jamais à un fait par ressemblance.
      const marcheSeuil = marches.find(m => typeof m.question === 'string' && m.question.includes(auSeuil.name_fr));
      const cotesSeuil = marcheSeuil
        ? marcheSeuil.issues.slice(0, 2).map(i => ({ id: i.id, kicker: 'Franchit le seuil', label: i.label, cote: i.cote, to: parisUrl }))
        : [];

      out.push({
        cle: 'seuil',
        badge: 'Seuil · fait vérifié',
        title: `${auSeuil.name_fr} joue sa survie`,
        fact: `Le seuil de 3,25 % vaut ${MIN_SIEGES_AU_SEUIL} sièges. En dessous, une liste n’en perd pas : elle sort de la Knesset avec zéro.`,
        nums: [
          { n: MIN_SIEGES_AU_SEUIL, label: 'le seuil' },
          { n: auSeuil._seats, label: 'sa projection' },
        ],
        source: 'Seuil électoral national, relevé à 3,25 % en 2014',
        jeuKicker: 'Ce seuil se joue',
        jeuTitre: marcheSeuil?.question || 'Elle passe, ou elle tombe ?',
        cotes: cotesSeuil,
        // Deux actions, pas trois. Avec la question du marché (qui tient sur
        // trois lignes) et ses deux cotes, une troisième faisait déborder le dos
        // de 53 px — mesuré. La hauteur d'une carte est fixe par construction :
        // c'est au contenu de tenir dedans, pas à la carte de s'étirer.
        actions: [
          { icon: Layers, label: `La fiche « ${auSeuil.name_fr} »`, hint: 'Programme, chef de file, historique', to: `${createPageUrl('Liste')}?slug=${auSeuil.slug}` },
          { icon: BarChart2, label: 'Pourquoi un seuil ?', hint: 'Ce que 3,25 % change à une coalition', to: createPageUrl('Learn') },
        ],
      });
    }

    return out;
  }, [listesAvecSieges, verdict, sondagesProjection, marches, parisUrl]);

  if (!cartes.length) return null;

  return (
    <section className={className} aria-label="Le deck du jour">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1 inline-flex items-center gap-1.5" style={{ color: 'var(--p-gold-text)' }}>
              <Zap className="w-3.5 h-3.5" /> Le jour se joue
            </p>
            <h2 className="p-title text-xl md:text-2xl">
              {cartes.length} faits vérifiés. <span className="p-gradient-gold">Retourne-les.</span>
            </h2>
          </div>
          <p className="text-[11px] max-w-[15rem] text-right hidden sm:block" style={{ color: 'var(--p-text-40)' }}>
            Chaque carte montre un fait sourcé au recto — et ce qu’il permet de jouer au dos.
          </p>
        </div>

        {/* Mobile : rail qui défile, la carte suivante dépasse (on sait qu'il y
            en a d'autres). Desktop : les trois côte à côte. */}
        <div className="p-scroll-x flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-3
                        md:grid md:gap-4 md:overflow-visible md:mx-0 md:px-0"
          style={{ gridTemplateColumns: `repeat(${cartes.length}, minmax(0,1fr))` }}>
          {cartes.map((c) => (
            <div key={c.cle} className="snap-center flex-shrink-0 w-[85vw] max-w-[340px] md:w-auto md:max-w-none">
              <RectoVersoCard
                badge={c.badge}
                title={c.title}
                fact={c.fact}
                nums={c.nums}
                source={c.source}
                jeuKicker={c.jeuKicker}
                jeuTitre={c.jeuTitre}
                cotes={c.cotes}
                actions={c.actions}
                /* Hauteur fixe et commune : les trois cartes s'alignent, et
                   surtout le recto et le verso d'une même carte font la même
                   taille — sinon la page sauterait à chaque retournement. 400
                   est la mesure du cas le plus chargé (trois actions au dos),
                   pas un chiffre rond choisi au jugé. */
                hauteur={400}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
