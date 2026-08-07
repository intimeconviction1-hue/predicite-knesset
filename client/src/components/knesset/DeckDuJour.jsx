import React, { useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { PieChart, ShieldCheck, BarChart2, HelpCircle, Layers, Zap } from 'lucide-react';
import RectoVersoCard from '@/components/knesset/RectoVersoCard';

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
 *     (`match_value` = son identifiant, fourni par l'API).
 * Sans correspondance, le dos propose les gestes du produit, pas un pari
 * rapproché à la louche.
 */

const jourCourt = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function DeckDuJour({
  listesAvecSieges = [],
  verdict,
  sondagesProjection = [],
  sondages = [],
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

    // ── 3. Les instituts s'accordent-ils ? ──────────────────────────────────
    // Même lecture que le bloc « Consensus » plus bas dans la page, mais sous
    // sa forme jouable : le désaccord entre instituts est un fait, et savoir le
    // repérer est exactement ce qu'entraîne « Vrai ou Fake ».
    const listeById = new Map(listesAvecSieges.map(l => [l.id, l]));
    const meneurs = sondages.slice(0, 6).map(s => {
      const top = (s.seats_by_liste || []).slice().sort((a, b) => b.seats - a.seats)[0];
      const leader = top && listeById.get(top.liste_id);
      return leader ? { leader, media: s.publisher_media || s.institute } : null;
    }).filter(Boolean);

    if (meneurs.length >= 2) {
      const compte = new Map();
      for (const m of meneurs) compte.set(m.leader, (compte.get(m.leader) || 0) + 1);
      const classement = [...compte.entries()].sort((a, b) => b[1] - a[1]);
      const accord = classement.length === 1;

      out.push({
        cle: 'instituts',
        badge: 'Instituts · fait vérifié',
        title: accord
          ? `${classement[0][0].name_fr} en tête partout`
          : 'Les instituts ne s’accordent pas',
        // Deux contraintes sur cette phrase, apprises en la mesurant :
        //  · elle ne récite PAS les chiffres que les `nums` affichent juste
        //    dessous (« 4 Likoud · 2 Yashar ») — c'était dit deux fois, et sa
        //    longueur variait avec le nom des partis, jusqu'à faire déborder
        //    une carte dont la hauteur est fixe ;
        //  · elle ne redit pas non plus « c'est normal, effets d'institut » :
        //    le bloc Consensus, quelques centimètres plus haut sur la Home,
        //    emploie déjà ces mots-là. Elle porte la LEÇON, qui est justement
        //    ce que le dos propose d'aller apprendre.
        fact: accord
          ? `Un accord aussi net est rare en campagne israélienne. Il ne vaut pas garantie pour autant.`
          : `Le même jour, deux sondages peuvent désigner deux vainqueurs différents. Savoir lire cet écart, c’est tout l’enjeu.`,
        nums: classement.slice(0, 2).map(([l, n]) => ({ n, label: l.name_fr })),
        source: `${meneurs.length} derniers sondages sièges · ${[...new Set(meneurs.map(m => m.media))].slice(0, 3).join(', ')}`,
        jeuKicker: 'Ce désaccord s’apprend',
        jeuTitre: 'Sauras-tu repérer le sondage qui ment ?',
        cotes: [],
        actions: [
          { icon: ShieldCheck, label: 'Vrai ou Fake ?', hint: 'Démêle le vrai chiffre du chiffre tordu', to: createPageUrl('VraiOuFake') },
          { icon: BarChart2, label: 'Comment on lit un sondage', hint: 'Marge d’erreur, effet d’institut, seuil', to: createPageUrl('Methodologie') },
          // Pas « 10 questions » : le quiz n'a pas de longueur fixe (six thèmes,
          // trois niveaux, tirage dans la base). Annoncer un nombre rond serait
          // une promesse que la page ne tient pas.
          { icon: HelpCircle, label: 'Le quiz de la campagne', hint: 'Six thèmes, trois niveaux — les points comptent', to: createPageUrl('Quiz') },
        ],
      });
    }

    return out;
  }, [listesAvecSieges, verdict, sondagesProjection, sondages, marches, parisUrl]);

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
