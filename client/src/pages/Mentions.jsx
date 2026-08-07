import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Server, Database, Cookie, UserCheck, AlertTriangle } from 'lucide-react';
import CinematicHero from '@/components/knesset/CinematicHero';
import { createPageUrl } from '@/utils';
import { EDITEUR, EDITEUR_RENSEIGNE, HEBERGEUR } from '@/lib/editeur';

// Mentions légales et confidentialité — la page sans laquelle on ne diffuse pas.
//
// Deux obligations distinctes, réunies ici parce que le site est petit et qu'un
// visiteur qui cherche « qui est derrière ça » et un visiteur qui cherche « que
// faites-vous de mon adresse » cliquent au même endroit :
//   • les mentions légales (LCEN art. 6) : qui édite, qui héberge ;
//   • l'information des personnes (RGPD art. 13) : quoi, pourquoi, combien de
//     temps, quels droits.
//
// Le contenu n'est pas un modèle recopié : chaque ligne décrit ce que le code
// fait réellement, et se vérifie dans server/db/schema.sql et server/routes/.
// Quand le code changera, cette page devra changer avec lui — c'est le prix
// d'une page honnête, et la raison des renvois précis ci-dessous.

const COLLECTE = [
  {
    quoi: 'Ton adresse e-mail',
    pourquoi: "Elle est l'identifiant du compte : c'est elle qui relie tes pronostics, tes paris et tes points à toi et pas à quelqu'un d'autre.",
    note: "Elle n'est jamais affichée aux autres joueurs, ni renvoyée par l'API pour le compte d'un tiers.",
  },
  {
    quoi: 'Un pseudonyme d\'affichage',
    pourquoi: 'C\'est ce que voient les autres dans les classements et les ligues.',
    note: "À défaut de nom choisi, il est fabriqué à partir d'une empreinte de l'adresse (« Joueur a1b2 ») — jamais à partir de la partie qui précède l'arobase, ce qui reviendrait à réexposer l'adresse.",
  },
  {
    quoi: 'Ce que tu joues',
    pourquoi: 'Répartition des 120 sièges, pronostic de Premier ministre, mises, réponses au quiz et aux mini-jeux, ligues rejointes, points et badges.',
    note: 'C\'est le contenu du jeu : sans lui il n\'y a ni score ni classement.',
  },
  {
    quoi: 'Un cookie de session',
    pourquoi: 'Il garde ta connexion ouverte pendant 30 jours.',
    note: "Strictement nécessaire au fonctionnement du site : à ce titre il ne demande pas de consentement préalable, et il ne sert à rien d'autre qu'à te reconnaître.",
  },
];

function Section({ icon: Icon, color, titre, children, delai = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.4, delay: delai }}
      className="p-card p-6 md:p-8"
      style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + '18', border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h2 className="p-title text-xl" style={{ color: 'var(--p-text)' }}>{titre}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

const P = ({ children }) => (
  <p className="p-body text-sm max-w-prose" style={{ color: 'var(--p-text-60)' }}>{children}</p>
);

export default function Mentions() {
  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <CinematicHero
        size="sm"
        photos={['/images/knesset-parvis.jpg']}
        position="center 40%"
        kicker="Mentions légales · Données personnelles"
        title="Qui édite ce site, et ce qu'il sait de toi"
        subtitle="Tout ce qui suit décrit ce que le code fait réellement. Rien n'y est recopié d'un modèle."
      />

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">

        <Section icon={Scale} color="#4A7FD4" titre="Éditeur du site">
          {EDITEUR_RENSEIGNE ? (
            <>
              <P><strong style={{ color: 'var(--p-text)' }}>{EDITEUR.nom}</strong> — {EDITEUR.statut}.</P>
              <P>Directeur de la publication : {EDITEUR.directeurPublication}.</P>
              <P>
                Contact :{' '}
                <a href={`mailto:${EDITEUR.contact}`} className="underline"
                  style={{ color: 'var(--p-blue)' }}>{EDITEUR.contact}</a>
              </P>
            </>
          ) : (
            // Ce bloc disparaît dès que client/src/lib/editeur.js est rempli. Il
            // dit la vérité en attendant : nommer un éditeur fictif serait une
            // fausse mention légale, ce qui est pire qu'une mention manquante.
            <div className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'var(--p-gold-faint)', border: '1px solid var(--p-gold-border)' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--p-gold-text)' }} />
              <p className="p-body text-sm" style={{ color: 'var(--p-text-60)' }}>
                L'identité de l'éditeur n'est pas encore publiée. Le site n'est pas
                ouvertement diffusé à ce jour ; elle le sera avant qu'il le soit.
              </p>
            </div>
          )}
          <P>
            PrédiCité est un jeu de pronostics gratuit, sans mise d'argent et sans
            gain. Il n'est affilié à aucun parti, à aucune liste et à aucune
            institution israélienne ou française.
          </P>
        </Section>

        <Section icon={Server} color="var(--p-green-text)" titre="Hébergement" delai={0.05}>
          <P>
            Le site est hébergé par <strong style={{ color: 'var(--p-text)' }}>{HEBERGEUR.application.nom}</strong>{' '}
            ({HEBERGEUR.application.lieu}) —{' '}
            <a href={HEBERGEUR.application.site} target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: 'var(--p-blue)' }}>{HEBERGEUR.application.site}</a>.
          </P>
          <P>
            Les données de jeu sont stockées dans une base gérée par{' '}
            <strong style={{ color: 'var(--p-text)' }}>{HEBERGEUR.base.nom}</strong> ({HEBERGEUR.base.lieu}) —{' '}
            <a href={HEBERGEUR.base.site} target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: 'var(--p-blue)' }}>{HEBERGEUR.base.site}</a>.
          </P>
          <P>
            Ces deux prestataires étant établis aux États-Unis, tes données y sont
            transférées. Nous le disons plutôt que de l'omettre : c'est une
            conséquence directe du choix d'hébergement, pas un détail technique.
          </P>
        </Section>

        <Section icon={Database} color="#B57F1A" titre="Ce que le site collecte" delai={0.1}>
          <P>
            Uniquement ce dont le jeu a besoin. Rien n'est collecté « au cas où »,
            et il n'existe aucune revente, aucun partage à des fins commerciales et
            aucun profilage publicitaire.
          </P>
          <div className="space-y-3 pt-1">
            {COLLECTE.map(({ quoi, pourquoi, note }) => (
              <div key={quoi} className="rounded-xl p-4"
                style={{ background: 'var(--p-bg)', border: '0.5px solid var(--p-border)' }}>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--p-text)' }}>{quoi}</p>
                <p className="p-body text-sm" style={{ color: 'var(--p-text-60)' }}>{pourquoi}</p>
                <p className="p-body text-[13px] mt-1.5" style={{ color: 'var(--p-text-40)' }}>{note}</p>
              </div>
            ))}
          </div>
          <P>
            <strong style={{ color: 'var(--p-text)' }}>Ce qui n'est pas collecté :</strong>{' '}
            aucune donnée bancaire (le site est gratuit et n'a pas de moyen de
            paiement), aucune géolocalisation, aucun contact importé, aucun
            historique de navigation hors du site.
          </P>
          <P>
            Tes réponses à la Boussole (les {''}
            <Link to={createPageUrl('Boussole')} className="underline" style={{ color: 'var(--p-blue)' }}>
              affirmations politiques
            </Link>
            ) sont traitées dans ton navigateur pour afficher ton résultat et ne
            sont pas enregistrées sur le serveur — une opinion politique est une
            donnée sensible, et la meilleure façon de la protéger est de ne pas la
            stocker.
          </P>
        </Section>

        <Section icon={Cookie} color="#7A5F1A" titre="Cookies et mesure d'audience" delai={0.15}>
          <P>
            Un seul cookie : celui de ta session, décrit plus haut. Il est
            strictement nécessaire, donc exempté de consentement — c'est pourquoi
            aucun bandeau ne t'accueille à l'arrivée.
          </P>
          <P>
            La fréquentation du site est mesurée sans cookie, sans identifiant et
            sans prestataire tiers : seul un compteur de pages vues est tenu,
            agrégé, sans adresse IP conservée. Rien ne permet d'y reconstituer un
            parcours individuel. Aucun outil du type Google Analytics, aucun pixel
            de réseau social, aucun traceur publicitaire n'est présent sur ce site.
          </P>
        </Section>

        <Section icon={UserCheck} color="var(--p-green-text)" titre="Durées et droits" delai={0.2}>
          <P>
            <strong style={{ color: 'var(--p-text)' }}>Combien de temps.</strong>{' '}
            Les comptes et les données de jeu sont conservés le temps de la saison
            électorale et de son bilan, soit jusqu'à fin 2027 au plus tard, après
            quoi la base est effacée. Avant cette échéance, la suppression se fait
            sur demande — il n'existe pas de purge automatique, et l'annoncer
            serait promettre un mécanisme qui n'est pas écrit.
          </P>
          <P>
            <strong style={{ color: 'var(--p-text)' }}>Tes droits.</strong>{' '}
            Tu peux demander l'accès à tes données, leur rectification, leur
            effacement, leur portabilité, ou t'opposer à leur traitement. La
            suppression d'un compte entraîne celle des pronostics, mises, réponses
            et appartenances aux ligues qui lui sont rattachés.
          </P>
          <P>
            {EDITEUR_RENSEIGNE ? (
              <>Ces demandes s'exercent par courriel à{' '}
                <a href={`mailto:${EDITEUR.contact}`} className="underline" style={{ color: 'var(--p-blue)' }}>
                  {EDITEUR.contact}
                </a>.</>
            ) : (
              <>L'adresse par laquelle exercer ces droits sera publiée en même temps
                que l'identité de l'éditeur, avant l'ouverture du site.</>
            )}{' '}
            En cas de désaccord, tu peux saisir la CNIL —{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: 'var(--p-blue)' }}>cnil.fr</a>.
          </P>
        </Section>

        <Section icon={Scale} color="var(--p-text-40)" titre="Contenus et sources" delai={0.25}>
          <P>
            Les sondages, résultats et éléments factuels affichés proviennent de
            sources identifiées et datées, listées sur la page{' '}
            <Link to={createPageUrl('Methodologie')} className="underline" style={{ color: 'var(--p-blue)' }}>
              Sources &amp; méthodologie
            </Link>. Aucune donnée n'est inventée ni extrapolée.
          </P>
          <P>
            Les logos de listes et les photographies sont utilisés à des fins
            d'information ; leur provenance et leurs licences respectives sont
            documentées dans le dépôt du projet. Toute demande de retrait ou de
            correction sera traitée à l'adresse de contact ci-dessus.
          </P>
        </Section>

      </div>
    </div>
  );
}
