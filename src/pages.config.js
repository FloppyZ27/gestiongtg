import Dashboard from './pages/Dashboard';
import AjouterActe from './pages/AjouterActe';
import EditerActe from './pages/EditerActe';
import ChaineDeTitre from './pages/ChaineDeTitre';
import Notaires from './pages/Notaires';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "AjouterActe": AjouterActe,
    "EditerActe": EditerActe,
    "ChaineDeTitre": ChaineDeTitre,
    "Notaires": Notaires,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};