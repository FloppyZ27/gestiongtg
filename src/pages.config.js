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
import Clavardage from './pages/Clavardage';
import Layout from './Layout.jsx';


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
    "Clavardage": Clavardage,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};