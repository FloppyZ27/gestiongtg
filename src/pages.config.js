import Dashboard from './pages/Dashboard';
import AjouterActe from './pages/AjouterActe';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "AjouterActe": AjouterActe,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};