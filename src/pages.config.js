import Dashboard from './pages/Dashboard';
import AjouterActe from './pages/AjouterActe';
import EditerActe from './pages/EditerActe';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "AjouterActe": AjouterActe,
    "EditerActe": EditerActe,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};