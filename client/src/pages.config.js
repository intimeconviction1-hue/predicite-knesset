/**
 * pages.config.js - Page routing configuration
 *
 * (Ex-fichier généré par Base44 — plus rien ne le régénère, il s'édite
 * normalement. Les pages sont en React.lazy, voir le commentaire plus bas.)
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';
import Home from './pages/Home';
import __Layout from './Layout.jsx';

// 2026-08-04 — chargement paresseux. Les 21 pages étaient importées
// statiquement : ~560 Ko de source (écran admin compris) chargés au premier
// octet pour tout visiteur, sans un seul React.lazy dans le client. Ce fichier
// se disait « AUTO-GENERATED » mais plus rien ne le régénère depuis la sortie
// de Base44 — il est éditable comme le reste du repo.
// Home reste STATIQUE : c'est la page d'atterrissage, elle ne doit pas attendre
// un chunk. Le Layout aussi : il enveloppe toutes les pages.
const Listes = lazy(() => import('./pages/Listes'));
const Liste = lazy(() => import('./pages/Liste'));
const PremierMinistre = lazy(() => import('./pages/PremierMinistre'));
const Paris = lazy(() => import('./pages/Paris'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Learn = lazy(() => import('./pages/Learn'));
const Methodologie = lazy(() => import('./pages/Methodologie'));
const ReglesDuJeu = lazy(() => import('./pages/ReglesDuJeu'));
const Historique = lazy(() => import('./pages/Historique'));
const Actu = lazy(() => import('./pages/Actu'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Ligues = lazy(() => import('./pages/Ligues'));
const Voter = lazy(() => import('./pages/Voter'));
const SensDuVent = lazy(() => import('./pages/SensDuVent'));
const FormeCoalition = lazy(() => import('./pages/FormeCoalition'));
const Boussole = lazy(() => import('./pages/Boussole'));
const VraiOuFake = lazy(() => import('./pages/VraiOuFake'));
const MaRepartition = lazy(() => import('./pages/MaRepartition'));
const Mentions = lazy(() => import('./pages/Mentions'));
const AdminResultats = lazy(() => import('./pages/AdminResultats'));

// NB : AdminSync, ElectionNight, FinalRecap, Leagues, PollMap, Predictions,
// Profile, Quiz, Surveys, Voter, Cities, City, ScrutinMunicipal, ScrutinPLM
// (édition municipales 2026) ont été supprimées — elles appelaient des
// entités qui n'existent plus dans le nouveau schéma (City, RealPoll,
// Prediction, ElectionResult, PollSource, League, Quiz, LearningMoment...).
// Toujours récupérables dans l'historique git si besoin de les réadapter —
// voir docs/HISTORIQUE-PIVOT-BASE44.md.

export const PAGES = {
    "Listes": Listes,
    "Liste": Liste,
    "PremierMinistre": PremierMinistre,
    "Paris": Paris,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Learn": Learn,
    "Methodologie": Methodologie,
    "ReglesDuJeu": ReglesDuJeu,
    "Historique": Historique,
    "Actu": Actu,
    "Quiz": Quiz,
    "Ligues": Ligues,
    "Voter": Voter,
    "SensDuVent": SensDuVent,
    "FormeCoalition": FormeCoalition,
    "Boussole": Boussole,
    "VraiOuFake": VraiOuFake,
    "MaRepartition": MaRepartition,
    "Mentions": Mentions,
    // Écran admin du soir du scrutin — volontairement absent de la navigation,
    // accessible par /AdminResultats et réservé aux admins côté serveur.
    "AdminResultats": AdminResultats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};