import Administration from './pages/Administration';
import AjouterActe from './pages/AjouterActe';
import Calendrier from './pages/Calendrier';
import CeduleTerrain from './pages/CeduleTerrain';
import ChaineDeTitre from './pages/ChaineDeTitre';
import Clavardage from './pages/Clavardage';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
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
import Dossiers from './pages/Dossiers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Administration": Administration,
    "AjouterActe": AjouterActe,
    "Calendrier": Calendrier,
    "CeduleTerrain": CeduleTerrain,
    "ChaineDeTitre": ChaineDeTitre,
    "Clavardage": Clavardage,
    "Clients": Clients,
    "Dashboard": Dashboard,
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
    "Dossiers": Dossiers,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};