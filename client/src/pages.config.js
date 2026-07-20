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
import AdminSync from './pages/AdminSync';
import Listes from './pages/Listes';
import Liste from './pages/Liste';
import PremierMinistre from './pages/PremierMinistre';
import ElectionNight from './pages/ElectionNight';
import FinalRecap from './pages/FinalRecap';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Leagues from './pages/Leagues';
import Learn from './pages/Learn';
import Methodologie from './pages/Methodologie';
import PollMap from './pages/PollMap';
import Predictions from './pages/Predictions';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import Surveys from './pages/Surveys';
import Voter from './pages/Voter';
import ReglesDuJeu from './pages/ReglesDuJeu';
import __Layout from './Layout.jsx';

// NB : Cities/City/ScrutinMunicipal/ScrutinPLM (édition municipales 2026)
// sont conservées sur disque mais retirées du routage — cf. fichiers .bak.jsx.txt
// et README-KNESSET.md pour le détail du pivot.

export const PAGES = {
    "AdminSync": AdminSync,
    "Listes": Listes,
    "Liste": Liste,
    "PremierMinistre": PremierMinistre,
    "ElectionNight": ElectionNight,
    "FinalRecap": FinalRecap,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Leagues": Leagues,
    "Learn": Learn,
    "Methodologie": Methodologie,
    "PollMap": PollMap,
    "Predictions": Predictions,
    "Profile": Profile,
    "Quiz": Quiz,
    "Surveys": Surveys,
    "Voter": Voter,
    "ReglesDuJeu": ReglesDuJeu,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};