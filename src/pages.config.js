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
import Administration from './pages/Administration';
import AjouterActe from './pages/AjouterActe';
import Calendrier from './pages/Calendrier';
import ChaineDeTitre from './pages/ChaineDeTitre';
import Clavardage from './pages/Clavardage';
import Clients from './pages/Clients';
import CommunicationClients from './pages/CommunicationClients';
import Dashboard from './pages/Dashboard';
import Dossiers from './pages/Dossiers';
import EditerActe from './pages/EditerActe';
import GestionDeMandat from './pages/GestionDeMandat';
import GestionEquipeTerrain from './pages/GestionEquipeTerrain';
import Home from './pages/Home';
import Lots from './pages/Lots';
import Notaires from './pages/Notaires';
import PriseDeMandat from './pages/PriseDeMandat';
import Profil from './pages/Profil';
import Recherches from './pages/Recherches';
import RetoursAppel from './pages/RetoursAppel';
import SharePoint from './pages/SharePoint';
import TableauDeBord from './pages/TableauDeBord';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Administration": Administration,
    "AjouterActe": AjouterActe,
    "Calendrier": Calendrier,
    "ChaineDeTitre": ChaineDeTitre,
    "Clavardage": Clavardage,
    "Clients": Clients,
    "CommunicationClients": CommunicationClients,
    "Dashboard": Dashboard,
    "Dossiers": Dossiers,
    "EditerActe": EditerActe,
    "GestionDeMandat": GestionDeMandat,
    "GestionEquipeTerrain": GestionEquipeTerrain,
    "Home": Home,
    "Lots": Lots,
    "Notaires": Notaires,
    "PriseDeMandat": PriseDeMandat,
    "Profil": Profil,
    "Recherches": Recherches,
    "RetoursAppel": RetoursAppel,
    "SharePoint": SharePoint,
    "TableauDeBord": TableauDeBord,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};