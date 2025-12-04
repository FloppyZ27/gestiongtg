import Dashboard from './pages/Dashboard';
import AjouterActe from './pages/AjouterActe';
import EditerActe from './pages/EditerActe';
import ChaineDeTitre from './pages/ChaineDeTitre';
import Notaires from './pages/Notaires';
import Clients from './pages/Clients';
import Profil from './pages/Profil';
import Calendrier from './pages/Calendrier';
import TableauDeBord from './pages/TableauDeBord';
import Dossiers from './pages/Dossiers';
import Lots from './pages/Lots';
import CeduleTerrain from './pages/CeduleTerrain';
import PriseDeMandat from './pages/PriseDeMandat';
import Clavardage from './pages/Clavardage';
import GestionDeMandat from './pages/GestionDeMandat';
import Administration from './pages/Administration';
import GestionEquipeTerrain from './pages/GestionEquipeTerrain';
import Recherches from './pages/Recherches';
import RetoursAppel from './pages/RetoursAppel';
import SharePoint from './pages/SharePoint';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "AjouterActe": AjouterActe,
    "EditerActe": EditerActe,
    "ChaineDeTitre": ChaineDeTitre,
    "Notaires": Notaires,
    "Clients": Clients,
    "Profil": Profil,
    "Calendrier": Calendrier,
    "TableauDeBord": TableauDeBord,
    "Dossiers": Dossiers,
    "Lots": Lots,
    "CeduleTerrain": CeduleTerrain,
    "PriseDeMandat": PriseDeMandat,
    "Clavardage": Clavardage,
    "GestionDeMandat": GestionDeMandat,
    "Administration": Administration,
    "GestionEquipeTerrain": GestionEquipeTerrain,
    "Recherches": Recherches,
    "RetoursAppel": RetoursAppel,
    "SharePoint": SharePoint,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};