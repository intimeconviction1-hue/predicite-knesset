import { Scale, Vote, Percent, Shuffle, BarChart3, AlertCircle } from 'lucide-react';

/**
 * « Comment on vote à la Knesset » — contenu seul. L'accordéon et le rendu des
 * blocs vivent dans ModuleExplicatif.jsx.
 *
 * Les cinq rubriques portaient des couleurs Tailwind par défaut choisies au cas
 * par cas (#4A7FD4, emerald-400, #6D28D9 violet, #F47090 rose) : ni le violet ni
 * le rose n'existent dans « Le Marbre & le Jeu ». Sur les pages Règles et
 * Méthodologie — précisément celles qu'un nouveau visiteur ouvre pour juger du
 * sérieux du produit — l'identité se diluait dans du Tailwind générique.
 * Les cinq catégories tiennent sur des tokens déjà nommés : bleu, or, vert,
 * le cyan des explicatifs (--p-teal-text, dont c'est le rôle écrit), et rouge.
 */
const ENTETE = {
  icon: Scale,
  title: 'Comment on vote à la Knesset',
  subtitle: 'Le mécanisme du scrutin, pour pronostiquer avec de vraies bases',
  degrade: 'linear-gradient(135deg,var(--p-blue-deep),var(--p-blue))',
};

const REGLES = [
  {
    id: 'scrutin',
    icon: Vote,
    title: 'Un bulletin, une liste',
    teinte: '--p-blue',
    encre: '--p-blue',
    content: [
      { type: 'text', value: "En Israël, on ne vote pas pour une personne mais pour une liste entière : un parti, ou une alliance de partis présentant une liste commune. Il n'y a ni circonscriptions ni vote uninominal — tout le pays forme une seule circonscription nationale. C'est ce qu'on appelle une représentation proportionnelle intégrale (« pure ») : la répartition des 120 sièges suit directement le pourcentage national de voix de chaque liste, sans découpage géographique intermédiaire." },
      { type: 'highlight', label: 'Pourquoi une seule circonscription nationale ?', value: "Ce choix remonte aux institutions pré-étatiques du Yishouv : dans une société d'immigration très diverse (courants religieux, laïcs, socialistes, révisionnistes, communautés arabes...), le but était de garantir une voix à chaque sensibilité politique, plutôt que de risquer d'en écraser certaines par un découpage en circonscriptions locales. Contrepartie assumée : un Parlement très fragmenté, où aucune liste n'a jamais eu seule la majorité — d'où la nécessité systématique d'une coalition." },
      { type: 'highlight', label: 'Différence clé', value: "Contrairement au scrutin français, il n'y a pas de duel entre deux personnes au second tour : un seul tour, et le résultat se traduit directement en sièges à la Knesset." },
    ],
  },
  {
    id: 'seuil',
    icon: Percent,
    title: 'Le seuil électoral (3,25 %)',
    teinte: '--p-gold',
    encre: '--p-gold-text',
    content: [
      { type: 'text', value: "Une liste doit obtenir au moins 3,25 % des suffrages exprimés au niveau national pour entrer à la Knesset. En dessous, elle n'obtient aucun siège, même si des dizaines de milliers d'électeurs ont voté pour elle — leurs voix sont redistribuées entre les listes qui ont franchi le seuil." },
      { type: 'threshold-bar', threshold: 3.25, examples: [
        { label: 'Liste sous le seuil', pct: 1.8, pass: false },
        { label: 'Liste tout juste au-dessus', pct: 3.6, pass: true },
        { label: 'Grande liste', pct: 19, pass: true },
      ] },
      { type: 'stat', label: 'Seuil actuel', value: '3,25 % des suffrages exprimés' },
      { type: 'text', value: "C'est souvent le vrai point de bascule d'une élection : une petite liste qui frôle le seuil peut faire perdre — ou gagner — plusieurs sièges à tout un bloc. C'est le cas du Sionisme religieux de Bezalel Smotrich, qui oscille autour de ce seuil dans les sondages de cette campagne." },
    ],
  },
  {
    id: 'repartition',
    icon: BarChart3,
    title: 'La répartition des 120 sièges',
    teinte: '--p-green',
    encre: '--p-green-text',
    content: [
      { type: 'text', value: "Les 120 sièges sont répartis à la proportionnelle entre toutes les listes ayant franchi le seuil, selon la méthode Bader-Ofer (une variante de la méthode d'Hondt). Plus une liste a de voix, plus le rendement en sièges par voix est favorable — un effet qui avantage légèrement les grandes listes par rapport aux petites." },
      { type: 'seats-bar', total: 120, majority: 61 },
      { type: 'stat', label: 'Majorité', value: '61 sièges sur 120' },
      { type: 'text', value: "Aucune liste n'a jamais obtenu seule la majorité absolue depuis la création de l'État. Le résultat du soir du scrutin n'est donc qu'une étape : il fixe le rapport de force, pas le gouvernement." },
    ],
  },
  {
    id: 'excedents',
    icon: Shuffle,
    title: "Les accords d'excédents de voix",
    teinte: '--p-teal-text',
    encre: '--p-teal-text',
    content: [
      { type: 'text', value: "Avant l'élection, deux listes peuvent signer un accord d'excédents (« hescem odafim ») : leurs restes de voix inutilisés dans le calcul sont mis en commun, ce qui peut faire basculer un siège de justesse vers l'une des deux plutôt que de le perdre." },
      { type: 'highlight', label: 'Pourquoi ça compte pour un pronostic', value: "Deux listes idéologiquement proches ont presque toujours intérêt à signer un tel accord. Un pronostic fin regarde qui s'allie avec qui sur ce point précis, pas seulement les intentions de vote brutes." },
    ],
  },
  {
    id: 'depot',
    icon: AlertCircle,
    title: 'Le dépôt des listes',
    teinte: '--p-red',
    encre: '--p-red',
    content: [
      { type: 'text', value: "La composition définitive des listes (candidats, ordre, éventuelles fusions de dernière minute) n'est arrêtée que quelques semaines avant le scrutin, une fois le délai légal de dépôt passé auprès de la commission électorale centrale. Jusque-là, des alliances annoncées peuvent encore se défaire." },
      { type: 'highlight', label: 'À garder en tête', value: "Une liste suivie aujourd'hui dans les sondages peut fusionner, se scinder ou changer de nom d'ici le 27 octobre 2026. Les pronostics restent ouverts à modification jusqu'à la deadline officielle de l'app." },
    ],
  },
];

export default { entete: ENTETE, regles: REGLES };
