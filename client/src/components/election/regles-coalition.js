import { Crown, Clock, Users2, RefreshCcw, Info } from 'lucide-react';

/**
 * « Comment se forme un gouvernement » — contenu seul. L'accordéon et le rendu
 * des blocs vivent dans ModuleExplicatif.jsx.
 *
 * Même bascule de palette que regles-knesset.js : le violet et le rose sortaient
 * de Tailwind, pas de l'identité.
 *
 * Le dégradé d'en-tête finissait sur --p-gold, où le titre blanc (18 px / 700,
 * donc PAS du « grand texte » au sens WCAG, qui commence à 18,66 px en gras) ne
 * faisait que 2,10:1 — mesuré dans le navigateur. Il va maintenant de l'encre à
 * l'or foncé : 15:1 puis 6,04:1, lisible sur toute sa longueur. L'or clair reste
 * ce qu'il est, une couleur de décor, jamais un fond de texte blanc.
 */
const ENTETE = {
  icon: Crown,
  title: 'Comment se forme un gouvernement',
  subtitle: 'Ce qui se joue après le soir du scrutin, avant de pronostiquer le Premier ministre',
  degrade: 'linear-gradient(135deg,var(--p-ink),var(--p-gold-text))',
};

const REGLES = [
  {
    id: 'pas_direct',
    icon: Info,
    title: "Pas d'élection directe du Premier ministre",
    teinte: '--p-blue',
    encre: '--p-blue',
    content: [
      { type: 'text', value: "Contrairement à un président français ou américain, le Premier ministre israélien n'est jamais élu directement par les citoyens. Un système d'élection directe du chef du gouvernement a existé de 1996 à 2001, avant d'être abandonné : depuis, c'est toujours la composition de la Knesset qui détermine qui gouverne." },
      { type: 'highlight', label: 'Conséquence pour le pronostic', value: "Le soir du 27 octobre 2026, on connaît les sièges. On ne connaît pas encore le Premier ministre — ça se joue dans les semaines qui suivent." },
    ],
  },
  {
    id: 'nomination',
    icon: Users2,
    title: 'Le mandat de formation',
    teinte: '--p-gold',
    encre: '--p-gold-text',
    content: [
      { type: 'text', value: "Après le scrutin, le Président de l'État consulte les chefs de listes élues, puis charge le dirigeant qui lui semble avoir les meilleures chances de réunir une majorité (61 sièges sur 120) de former un gouvernement. Ce n'est pas automatiquement le chef de la liste arrivée en tête." },
      { type: 'text', value: "Le mandataire dispose d'un délai légal (28 jours, prolongeable de 14 jours supplémentaires) pour négocier une coalition. S'il échoue, le Président peut confier le mandat à quelqu'un d'autre, ou la Knesset peut désigner elle-même un candidat avec le soutien d'au moins 61 députés." },
    ],
  },
  {
    id: 'coalition',
    icon: Users2,
    title: 'Pourquoi il faut toujours une coalition',
    teinte: '--p-green',
    encre: '--p-green-text',
    content: [
      { type: 'text', value: "Aucune liste n'a jamais obtenu seule 61 sièges. Le futur Premier ministre doit donc assembler plusieurs listes autour d'un accord de coalition — répartition des ministères, lignes politiques communes, parfois rotation du poste de Premier ministre entre deux chefs de liste." },
      { type: 'highlight', label: 'À surveiller dans les sondages', value: "Les instituts publient régulièrement une lecture par bloc (« bloc de la coalition sortante » contre « bloc de l'opposition ») en plus des sièges par liste — c'est souvent plus parlant que le détail liste par liste pour anticiper qui gouvernera." },
    ],
  },
  {
    id: 'delai',
    icon: Clock,
    title: 'Un processus qui peut traîner',
    teinte: '--p-teal-text',
    encre: '--p-teal-text',
    content: [
      { type: 'text', value: "Entre le scrutin et l'investiture d'un gouvernement, plusieurs semaines — parfois plusieurs mois — peuvent s'écouler. Le pronostic « Premier ministre » de PrédiCité ne se dénoue donc pas le soir de l'élection, mais seulement au moment de l'investiture effective." },
    ],
  },
  {
    id: 'transition',
    icon: RefreshCcw,
    title: 'Le gouvernement démissionnaire ne compte pas',
    teinte: '--p-red',
    encre: '--p-red',
    content: [
      { type: 'text', value: "Entre la dissolution de la Knesset et l'investiture d'un nouveau gouvernement, l'exécutif sortant expédie les affaires courantes. Un Premier ministre « de transition » ne compte pas pour la résolution du pronostic : seule l'investiture formelle, avec vote de confiance de la Knesset, valide un résultat." },
    ],
  },
];

export default { entete: ENTETE, regles: REGLES };
