/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
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
import Listes from './pages/Listes';
import Liste from './pages/Liste';
import PremierMinistre from './pages/PremierMinistre';
import Paris from './pages/Paris';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Learn from './pages/Learn';
import Methodologie from './pages/Methodologie';
import ReglesDuJeu from './pages/ReglesDuJeu';
import Historique from './pages/Historique';
import Actu from './pages/Actu';
import Quiz from './pages/Quiz';
import Ligues from './pages/Ligues';
import __Layout from './Layout.jsx';

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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};