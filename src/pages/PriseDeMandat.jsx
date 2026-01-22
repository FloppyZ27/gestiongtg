import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FileCheck, User, X, UserPlus, Calendar, Eye, Check, Grid3x3, Send, Package, FileText, FilePlus, ChevronDown, ChevronUp, MapPin, MessageSquare, FileQuestion, FolderOpen, XCircle, Briefcase, Loader2, Upload, File, ExternalLink, Clock, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import ClientDetailView from "../components/clients/ClientDetailView";
import AddressInput from "../components/shared/AddressInput";
import CommentairesSection from "../components/dossiers/CommentairesSection";
import CommentairesSectionLot from "../components/lots/CommentairesSectionLot";
import ClientFormDialog from "../components/clients/ClientFormDialog";
import MandatTabs from "../components/dossiers/MandatTabs";
import ClientStepForm from "../components/mandat/ClientStepForm";
import AddressStepForm from "../components/mandat/AddressStepForm";
import MandatStepForm from "../components/mandat/MandatStepForm";
import TarificationStepForm from "../components/mandat/TarificationStepForm";
import ProfessionnelStepForm from "../components/mandat/ProfessionnelStepForm";
import DocumentsStepForm from "../components/mandat/DocumentsStepForm";
import DocumentsStepFormLot from "../components/lots/DocumentsStepFormLot";
import LotInfoStepForm from "../components/lots/LotInfoStepForm";
import TypesOperationStepForm from "../components/lots/TypesOperationStepForm";
import DossierInfoStepForm from "../components/mandat/DossierInfoStepForm";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

const CADASTRE_CODES = {
  "010010": "Île-du-Havre-Aubert", "010020": "Île-d'Entrée", "010030": "Île-du-Cap-aux-Meules", "010040": "Île-du-Havre-aux-Maisons", "010050": "Grosse-Île", "010060": "Île-Brion", "010070": "Île-Coffin", "010080": "Île-au-Loup", "010090": "Île-du-Corps-Mort", "010100": "Rochers-aux-Oiseaux", "020010": "Île-Bonaventure", "020020": "Canton de Percé", "020040": "Municipalité de Grande-Rivière", "020060": "Municipalité de Pabos", "020080": "Canton de Newport", "020100": "Canton de Raudin", "020110": "Canton de Pellegrin", "020120": "Canton de Rameau", "020140": "Canton de Malbaie", "020160": "Canton de Douglas", "020180": "Canton de York", "020200": "Village de Gaspé", "020210": "Canton de Baie-de-Gaspé-Sud", "020220": "Canton de Larocque", "020230": "Canton de Galt", "020240": "Canton de Baie-de-Gaspé-Nord", "020260": "Canton de Cap-des-Rosiers", "020280": "Canton de Fox", "020300": "Canton de Sydenham", "020310": "Canton de Cloridorme", "020320": "Seigneurie de la Grande-Vallée-des-Monts-Notre-Dame", "020340": "Canton de Port-Daniel", "020360": "Canton de Hope", "020380": "Canton de Cox", "020400": "Canton de Garin", "020410": "Canton de Hamilton", "020420": "Canton de New Richmond", "020430": "Canton de Marcil", "020440": "Canton de Robidoux", "020460": "Canton de Maria", "020480": "Canton de Carleton", "020500": "Municipalité de Shoolbred", "020510": "Canton de Dugal", "020520": "Canton de Mann", "020540": "Canton de Ristigouche", "020560": "Canton de Matapédia", "020580": "Canton de Patapédia", "020600": "Canton de Biencourt", "020610": "Canton de Laroche", "020620": "Canton de Varin", "020640": "Canton de Flynn", "020660": "Canton de Ouimet", "020680": "Canton de Massé", "020700": "Paroisse de Sainte-Angèle-de-Mérici", "020710": "Canton de Fleuriau", "020720": "Canton de Neigette", "020740": "Canton de Macpès", "020760": "Canton de Duquesne", "020780": "Canton de Chénier", "020800": "Canton de Bédard", "020810": "Paroisse de Saint-Mathieu", "020820": "Paroisse de Saint-Simon", "020840": "Paroisse de Saint-Fabien", "020860": "Paroisse de Sainte-Cécile-du-Bic", "020880": "Paroisse de Notre-Dame-du-Sacré-Coeur", "020900": "Ville de Saint-Germain-de-Rimouski", "020910": "Paroisse de Saint-Germain-de-Rimouski", "020920": "Paroisse de Saint-Anaclet", "020940": "Paroisse de Sainte-Luce", "020960": "Paroisse de Saint-Donat", "020980": "Paroisse de Saint-Joseph-de-Lepage", "021000": "Paroisse de Sainte-Flavie", "021010": "Canton d'Assemetquagan", "021020": "Canton de Milnikek", "021040": "Canton de Jetté", "021060": "Canton de Matalik", "021080": "Canton de Casupscull", "021100": "Canton de La Vérendrye", "021110": "Canton de Casault", "021120": "Canton de Lepage", "021140": "Canton de Humqui", "021160": "Canton de Pinault", "021180": "Canton de Nemtayé", "021200": "Paroisse de Saint-Benoît-Joseph-Labre", "021210": "Canton de Blais", "021220": "Canton de Langis", "021240": "Paroisse de Saint-Pierre-du-Lac", "021260": "Canton d'Awantjish", "021280": "Augmentation du canton d'Awantjish", "021300": "Paroisse de Sainte-Marie-de-Sayabec", "021310": "Canton de Matane", "021320": "Augmentation du canton de MacNider", "021340": "Canton de MacNider", "021360": "Canton de Cabot", "021380": "Paroisse de Saint-Octave-de-Métis", "021390": "Canton de Faribault", "021400": "Paroisse de Notre-Dame-de-L'Assomption-de-MacNider", "021410": "Paroisse de Saint-Ulric", "021420": "Paroisse de Saint-Jérôme-de-Matane", "021440": "Canton de Tessier", "021460": "Canton de Saint-Denis", "021480": "Paroisse de Sainte-Félicité", "021500": "Canton de Cherbourg", "021510": "Canton de Dalibaire", "021520": "Canton de Romieu", "021530": "Canton de La Potardière", "021540": "Canton de Cap-Chat", "021560": "Fief de Sainte-Anne-des-Monts", "021580": "Canton de Tourelle", "021600": "Canton de Christie", "021610": "Canton de Boisbuisson", "021620": "Canton de Duchesnay", "021630": "Canton de La Rivière", "021640": "Municipalité de Saint-Maxime-du-Mont-Louis", "021650": "Canton de Bonnécamp", "021660": "Canton de Taschereau", "021680": "Canton de Denoue", "021700": "Canton de Holland", "021710": "Canton d'Asselin", "021720": "Canton de Baillargeon", "021730": "Canton d'Angers", "021740": "Canton de Lemieux", "021750": "Brochu", "021760": "Canton de Lesseps", "021770": "Canton de Champou", "021780": "Canton de Flahault", "030010": "Canton de Botsford", "030020": "Canton de Robinson", "030030": "Canton de Packington", "030040": "Canton de Cabano", "030050": "Canton d'Estcourt", "030060": "Canton de Pohénégamook", "030070": "Canton d'Armand", "030080": "Paroisse de Saint-Louis-du-Ha!Ha!", "030090": "Seigneurie de Madawaska", "030100": "Paroisse de Notre-Dame-du-Lac-Témiscouata", "030110": "Paroisse de Sainte-Rose-du-Dégelé", "030120": "Canton de Rouillard", "030140": "Canton d'Auclair", "030160": "Canton de Robitaille", "030180": "Canton de Raudot", "030200": "Canton de Hocquart", "030210": "Canton de Demers", "030220": "Canton de Whitworth", "030230": "Paroisse de Saint-Antonin", "030240": "Paroisse de Saint-Modeste", "030250": "Canton de Viger", "030260": "Canton de Denonville", "030270": "Canton de Bégon", "030280": "Paroisse de Sainte-Françoise", "030290": "Paroisse de Notre-Dame-des-Neiges-des-Trois-Pistoles", "030300": "Paroisse de Saint-Éloi", "030310": "Paroisse de Saint-Jean-Baptiste-de-l'Île-Verte", "030320": "Paroisse de Saint-Arsène", "030330": "Paroisse de Notre-Dame-des-Sept-Douleurs", "030340": "Paroisse de Cacouna", "030350": "Village de Cacouna", "030360": "Paroisse de Saint-Patrice-de-la-Rivière-du-Loup", "030370": "Ville de Fraserville", "030380": "Paroisse de Notre-Dame-du-Portage", "030390": "Canton de Chapais", "030400": "Canton de Painchaud", "030410": "Canton d'Ixworth", "030420": "Paroisse de Saint-Onésime", "030430": "Paroisse de Sainte-Anne-de-la-Pocatière", "030440": "Paroisse de Saint-Pacôme", "030450": "Paroisse de Notre-Dame-du-Mont-Carmel", "030460": "Canton de Woodbridge", "030470": "Canton de Chabot", "030480": "Canton de Parke", "030490": "Canton de Bungay", "030500": "Paroisse de Sainte-Hélène", "030510": "Paroisse de Saint-Pascal", "030520": "Paroisse de Saint-Philippe-de-Néri", "030530": "Paroisse de Rivière-Ouelle", "030540": "Paroisse de Saint-Denis", "030550": "Paroisse de Saint-Louis-de-Kamouraska", "030560": "Village de Saint-Louis-de-Kamouraska", "030570": "Paroisse de Saint-André", "030580": "Paroisse de Saint-Alexandre", "030590": "Paroisse de Notre-Dame-du-Portage", "030610": "Île-aux-Lièvres", "030620": "Canton de Leverrier", "030630": "Canton de Casgrain", "030640": "Canton d'Arago", "030650": "Canton de Beaubien", "030660": "Canton de Garneau", "030670": "Canton de Dionne", "030680": "Canton de Lafontaine", "030690": "Canton de Fournier", "030700": "Canton de Lessard", "030710": "Paroisse de Saint-Cyrille", "030720": "Canton de Bourdages", "030730": "Paroisse de Saint-Eugène", "030740": "Paroisse de Saint-Aubert", "030750": "Canton d'Ashford", "030760": "Paroisse de Sainte-Louise", "030770": "Paroisse de Saint-Roch-des-Aulnets", "030780": "Paroisse de Saint-Jean-Port-Joli", "030790": "Paroisse de L'Islet", "030800": "Canton de Panet", "030810": "Canton de Rolette", "030820": "Canton de Talon", "030830": "Canton de Patton", "030840": "Canton de Montminy", "030850": "Canton d'Armagh", "030860": "Canton d'Ashburton", "030870": "Paroisse de Cap-Saint-Ignace", "030880": "Paroisse de Saint-Thomas", "030890": "Village de Montmagny", "030900": "Paroisse de Saint-Pierre", "030910": "Paroisse de Saint-François-de-la-Rivière-du-Sud", "030920": "Paroisse de Berthier", "030930": "Paroisse de Saint-Antoine-de-l'Île-aux-Grues", "030940": "Canton de Daaquam", "030950": "Canton de Bellechasse", "030960": "Canton de Langevin", "030970": "Canton de Ware", "030980": "Canton de Roux", "030990": "Canton de Mailloux", "031000": "Canton de Buckland", "031020": "Paroisse de Saint-Malachie", "031040": "Paroisse de Saint-Lazare", "031050": "Paroisse de Saint-Raphaël", "031060": "Paroisse de Saint-Gervais", "031070": "Paroisse de Sainte-Claire", "031080": "Paroisse de Saint-Anselme", "031090": "Paroisse de Saint-Charles", "031100": "Paroisse de Saint-Michel", "031110": "Paroisse de Saint-Vallier", "031120": "Paroisse de Saint-Étienne-de-Beaumont", "031130": "Canton de Metgermette-Nord", "031140": "Canton de Watford", "031150": "Canton de Cranbourne", "031160": "Paroisse de Saint-Léon-de-Standon", "031170": "Paroisse de Saint-Édouard-de-Frampton", "031180": "Paroisse de Sainte-Marguerite", "031190": "Paroisse de Sainte-Hénédine", "031210": "Paroisse de Saint-Isidore", "031230": "Paroisse de Saint-Bernard", "031240": "Paroisse de Saint-Lambert", "031250": "Paroisse de Saint-Henri-de-Lauzon", "031260": "Paroisse de Saint-Jean-Chrysostome", "031270": "Paroisse de Saint-Étienne-de-Lauzon", "031280": "Paroisse de Saint-Nicolas", "031290": "Paroisse de Saint-Romuald-d'Etchemin", "031300": "Paroisse de Saint-Télesphore", "031310": "Paroisse de Saint-David-de-L'Auberivière", "031320": "Paroisse de Notre-Dame-de-la-Victoire", "031330": "Ville de Lévis (quartier Lauzon)", "031340": "Village de Bienville", "031350": "Village de Lauzon", "031360": "Paroisse de Saint-Joseph", "031370": "Village de Lauzon (partie est)", "031380": "Ville de Lévis (quartier Notre-Dame)", "031390": "Ville de Lévis (quartier Saint-Laurent)", "040010": "Canton de Woburn", "040020": "Canton de Chesham", "040030": "Canton de Clinton", "040040": "Canton de Louise", "040050": "Canton de Ditchfield", "040060": "Canton de Marston", "040070": "Village de Mégantic", "040080": "Village d'Agnès", "040090": "Canton de Spalding", "040100": "Canton de Whitton", "040110": "Canton de Hampden", "040120": "Canton de Lingwick", "040130": "Canton de Winslow", "040140": "Canton d'Aylmer", "040150": "Canton de Gayhurst", "040160": "Canton de Risborough", "040170": "Canton de Marlow", "040180": "Canton de Dorset", "040190": "Canton Shenley", "040200": "Canton de Forsyth", "040210": "Canton de Lambton", "040220": "Canton de Price", "040230": "Canton d'Adstock", "040240": "Paroisse de Saint-Éphrem-de-Tring", "040250": "Canton d'Emberton", "040260": "Canton d'Auckland", "040270": "Canton de Clifton", "040280": "Canton d'Eaton", "040290": "Canton de Newport", "040300": "Canton de Ditton", "040310": "Ville de Scotstown", "040320": "Canton de Bury", "040330": "Canton de Westbury", "040340": "Canton de Hereford", "040350": "Canton de Barford", "040360": "Village de Dixville", "040370": "Village de Coaticook", "040380": "Canton de Barnston", "040390": "Village de Rock Island", "040400": "Village de Beebe Plain", "040410": "Village de Stanstead Plain", "040420": "Canton de Stanstead", "040430": "Canton de Hatley", "040440": "Canton de Magog", "040450": "Ville de Magog", "040460": "Canton de Potton", "040470": "Canton de Sutton", "040480": "Canton de Bolton", "040490": "Canton de Brome", "040500": "Canton de Farnham", "040510": "Paroisse de Saint-Armand-Est", "040520": "Village de Frelighsburg", "040530": "Paroisse de Saint-Armand-Ouest", "040540": "Village de Philipsburg", "040550": "Paroisse de Saint-Georges-de-Clarenceville", "040560": "Paroisse de Saint-Thomas", "040580": "Paroisse de Notre-Dame-des-Anges-de-Stanbridge", "040590": "Canton de Stanbridge", "040600": "Canton de Dunham", "040610": "Village de Dunham", "040620": "Village de Sweetsburg", "040630": "Village de Cowansville", "040640": "Paroisse de Saint-Romuald-de-Farnham-Ouest", "040650": "Ville de Farnham", "040720": "Paroisse de L'Ange-Gardien", "040730": "Village de Canrobert", "040740": "Paroisse de Saint-Paul-d'Abbotsford", "040750": "Paroisse de Saint-Césaire", "040760": "Village de Saint-Césaire", "040770": "Paroisse de Saint-Damase", "040780": "Paroisse de Sainte-Angèle", "040790": "Paroisse de Sainte-Marie-de-Monnoir", "040800": "Village de Marieville", "040810": "Paroisse de Notre-Dame-de-Bonsecours", "040820": "Village de Richelieu", "040830": "Paroisse de Saint-Mathias", "040840": "Paroisse de Saint-Hilaire", "040850": "Paroisse de Saint-Jean-Baptiste", "040860": "Paroisse de Sainte-Madeleine", "040870": "Paroisse de Saint-Charles", "040880": "Paroisse de La Présentation", "040890": "Paroisse de Notre-Dame-de-Saint-Hyacinthe", "040900": "Paroisse de Saint-Hyacinthe-le-Confesseur", "040910": "Cité de Saint-Hyacinthe", "040920": "Paroisse de Saint-Barnabé", "040930": "Paroisse de Saint-Jude", "040940": "Paroisse de Saint-Denis", "040950": "Paroisse de Saint-Ours", "040960": "Paroisse de Saint-Pie", "040970": "Paroisse de Saint-Dominique", "040980": "Paroisse de Sainte-Rosalie", "040990": "Paroisse de Saint-Liboire", "041000": "Paroisse de Saint-Éphrem-d'Upton", "041010": "Village de Saint-Éphrem-d'Upton", "041020": "Paroisse de Saint-André-d'Acton", "041030": "Village d'Acton Vale", "041040": "Pointe-d'Acton", "041050": "Paroisse de Saint-Théodore-d'Acton", "041060": "Canton de Wickham", "041070": "Canton de Grantham", "041080": "Paroisse de Sainte-Hélène", "041090": "Paroisse de Saint-Simon", "041100": "Paroisse de Saint-Hughes", "041110": "Canton de Stukely", "041120": "Canton de Shefford", "041130": "Village de Waterloo", "041170": "Canton de Granby", "041180": "Village de Granby", "041200": "Paroisse de Sainte-Cécile-de-Milton", "041210": "Paroisse de Saint-Valérien-de-Milton", "041220": "Paroisse de Sainte-Pudentienne", "041230": "Village de Sainte-Pudentienne", "041240": "Canton de Roxton", "041250": "Village de Roxton Falls", "041260": "Canton d'Ely", "041270": "Canton de Compton", "041280": "Village de Compton", "041290": "Village de Waterville", "041300": "Canton d'Ascot", "041310": "Village de Lennoxville", "041330": "Canton d'Orford", "041340": "Canton de Stoke", "041350": "Canton de Brompton", "041360": "Canton de Melbourne", "041370": "Village de Kingsbury", "041380": "Village de New Rockland", "041390": "Canton de Windsor", "041400": "Village de Windsor Mills", "041410": "Canton de Shipton", "041420": "Canton de Tingwick", "041430": "Village d'Asbestos", "041440": "Village de Danville", "041450": "Canton de Cleveland", "041460": "Ville de Richmond", "041470": "Village de Melbourne", "041480": "Canton de Durham", "041490": "Canton de Dudswell", "041500": "Village de Marbleton", "041510": "Canton de Saint-Camille", "041520": "Canton de Wotton", "041530": "Canton de Ham", "041540": "Canton de Ham-Sud", "041550": "Canton de Weedon", "041560": "Village de Weedon-Centre", "041570": "Village du Lac-Weedon", "041580": "Canton de Stratford", "041590": "Village de Beaulac", "041600": "Canton de Garthby", "041610": "Canton de Wolfestown", "041620": "Canton de Coleraine", "041630": "Canton d'Ireland", "041640": "Village de Kingsville", "041650": "Canton de Thetford", "041660": "Canton de Leeds", "041680": "Canton de Linière", "041700": "Canton de Jersey", "041710": "Paroisse de Saint-Georges", "041720": "Paroisse de Saint-François", "041730": "Canton de Broughton", "041740": "Paroisse de Saint-Frédéric", "041750": "Paroisse de Saint-Joseph", "041770": "Paroisse de Saint-Séverin", "041780": "Paroisse de Saint-Elzéar", "041790": "Paroisse de Sainte-Marie", "041800": "Canton de Halifax", "041810": "Canton d'Inverness", "041820": "Municipalité de Somerset-Sud", "041830": "Village de Plessisville", "041840": "Augmentation du canton de Somerset", "041850": "Municipalité de Somerset-Nord", "041860": "Canton de Nelson", "041870": "Paroisse de Saint-Sylvestre", "041880": "Paroisse de Saint-Patrice-de-Beaurivage", "041890": "Paroisse de Sainte-Hélène", "041900": "Paroisse de Saint-Paul", "041910": "Paroisse de Saint-Christophe", "041920": "Paroisse de Saint-Norbert", "041930": "Village d'Arthabaskaville", "041940": "Canton de Warwick", "041950": "Canton de Kingsey", "041960": "Canton de Simpson", "041970": "Canton de Horton", "041980": "Paroisse de Saint-Léonard", "041990": "Paroisse de Sainte-Eulalie", "042000": "Canton de Bulstrode", "042010": "Village de Princeville", "042020": "Canton de Stanfold", "042030": "Canton de Blandford", "042040": "Paroisse de Sainte-Gertrude", "042050": "Canton de Maddington", "042060": "Canton d'Upton", "042070": "Paroisse de Saint-Guillaume-d'Upton", "042080": "Paroisse de Saint-Bonaventure", "042090": "Canton de Wendover", "042100": "Paroisse de Saint-Marcel", "042110": "Paroisse de Saint-Louis", "042120": "Paroisse de Saint-Aimé", "042130": "Paroisse de Saint-Robert", "042140": "Paroisse de Sainte-Victoire", "042150": "Ville de Saint-Ours", "042160": "Paroisse de Saint-Roch", "042170": "Paroisse de Saint-Joseph", "042180": "Paroisse de Saint-Pierre-de-Sorel", "042190": "Ville de Sorel", "042200": "Paroisse de Sainte-Anne", "042220": "Paroisse de Saint-David", "042230": "Paroisse de Saint-Pie-de-Guire", "042240": "Paroisse de Saint-Michel", "042250": "Village de Saint-Michel", "042260": "Paroisse de Saint-François-du-Lac", "042270": "Paroisse de Saint-Thomas-de-Pierreville", "042280": "Paroisse de Saint-Zéphirin-de-Courval", "042290": "Paroisse de Saint-Antoine-de-la-Baie-du-Febvre", "042300": "Paroisse de Sainte-Monique", "042310": "Paroisse de Sainte-Brigitte", "042320": "Paroisse de Sainte-Perpétue", "042330": "Paroisse de Saint-Wenceslas", "042340": "Paroisse de Saint-Célestin", "042350": "Paroisse de Saint-Jean-Baptiste-de-Nicolet", "042370": "Paroisse de Saint-Grégoire", "042380": "Village de Larochelle", "042390": "Paroisse de Sainte-Angèle-de-Laval", "042400": "Paroisse de Notre-Dame-de-la-Nativité-de-Bécancour", "042410": "Paroisse de Saint-Édouard-de-Gentilly", "042420": "Paroisse de Sainte-Marie-de-Blandford", "042430": "Paroisse de Saint-Pierre-les-Becquets", "042450": "Paroisse de Saint-Narcisse", "042460": "Paroisse de Saint-Gilles", "042470": "Paroisse de Sainte-Agathe", "042480": "Paroisse de Saint-Agapit", "042490": "Paroisse de Saint-Apollinaire", "042500": "Paroisse de Saint-Flavien", "042510": "Paroisse de Saint-Édouard", "042520": "Paroisse de Sainte-Emmélie", "042530": "Paroisse de Saint-Jean-Deschaillons", "042540": "Village de Leclercville", "042550": "Paroisse de Saint-Louis-de-Lotbinière", "042560": "Paroisse de Sainte-Croix", "042570": "Paroisse de Saint-Antoine", "042580": "Paroisse de Sainte-Victoire", "042590": "Ville de Sherbrooke (quartier centre)", "042600": "Ville de Sherbrooke (quartier nord)", "042610": "Ville de Sherbrooke (quartier sud)", "042620": "Ville de Sherbrooke (quartier est)", "042630": "Ville de Drummondville (quartier ouest)", "042640": "Ville de Drummondville (quartier est)", "042650": "Ville de Drummondville (quartier sud)", "042660": "Ville de Drummondville (quartier nord)", "042670": "Paroisse de Saint-Victor-de-Tring", "042680": "Augmentation du canton de Bulstrode", "042690": "Sherbrooke", "042700": "Coaticook", "042710": "Bromont", "042720": "Canton de Metgermette-Sud", "050010": "Paroisse de Lacolle", "050020": "Paroisse de Saint-Valentin", "050030": "Paroisse de Saint-Jean", "050040": "Ville de Saint-Jean", "050050": "Paroisse de Sainte-Marguerite-de-Blairfindie", "050060": "Paroisse de Saint-Luc", "050070": "Paroisse de Saint-Cyprien", "050080": "Village de Napierville", "050090": "Paroisse de Saint-Patrice-de-Sherrington", "050100": "Paroisse de Saint-Édouard", "050110": "Paroisse de Saint-Michel-Archange", "050120": "Paroisse de Saint-Rémi", "050130": "Village de Saint-Rémi", "050140": "Canton de Hemmingford", "050150": "Village de Hemmingford", "050160": "Canton de Havelock", "050170": "Canton de Franklin", "050180": "Canton de Hinchinbrook", "050190": "Canton d'Elgin", "050200": "Village de Huntingdon", "050210": "Canton de Godmanchester", "050220": "Canton de Dundee", "050230": "Paroisse de Saint-Jean-Chrysostome", "050240": "Paroisse de Saint-Antoine-Abbé", "050250": "Paroisse de Saint-Malachie", "050260": "Paroisse de Saint-Urbain-Premier", "050270": "Paroisse de Sainte-Martine", "050280": "Paroisse de Sainte-Philomène", "050290": "Paroisse de Saint-Joachim-de-Châteauguay", "050300": "Paroisse de Saint-Clément", "050310": "Ville de Beauharnois", "050320": "Paroisse de Saint-Étienne", "050330": "Paroisse de Saint-Louis-de-Gonzague", "050340": "Paroisse de Saint-Stanislas-de-Kostka", "050350": "Paroisse de Sainte-Cécile", "050360": "Ville de Salaberry-de-Valleyfield", "050370": "Paroisse de Saint-Timothée", "050380": "Paroisse de Saint-Jacques-le-Mineur", "050390": "Paroisse de Saint-Philippe", "050400": "Paroisse de Saint-Constant", "050410": "Paroisse de Saint-Isidore", "050420": "Seigneurie de Sault-Saint-Louis", "050430": "Paroisse de Laprairie de La Madeleine", "050440": "Village de Laprairie", "050450": "Paroisse de Saint-Joseph-de-Chambly", "050460": "Village du Canton-de-Chambly", "050470": "Village du Bassin-de-Chambly", "050480": "Paroisse de Saint-Bruno", "050490": "Paroisse de Saint-Hubert", "050500": "Paroisse de Saint-Antoine-de-Longueuil", "050510": "Village de Longueuil", "050520": "Paroisse de Sainte-Famille-de-Boucherville", "050530": "Village de Boucherville", "050540": "Paroisse de Saint-Mathieu-de-Beloeil", "050550": "Paroisse de Saint-Marc", "050560": "Paroisse de Sainte-Julie", "050570": "Paroisse de Varennes", "050580": "Village de Varennes", "050590": "Paroisse de Verchères", "050600": "Paroisse de Saint-Antoine", "050610": "Paroisse de Contrecoeur", "050620": "Paroisse de Pointe-aux-Trembles", "050630": "Paroisse de Rivière-des-Prairies", "050640": "Paroisse de Longue-Pointe", "050650": "Village de Hochelaga", "050660": "Village de la Côte-de-la-Visitation", "050670": "Paroisse de Sault-au-Récollet", "050680": "Village de Côte-Saint-Louis", "050690": "Village de Saint-Jean-Baptiste", "050700": "Cité de Montréal (quartier Sainte-Marie)", "050710": "Municipalité de la paroisse de Montréal", "050720": "Village de Côte-des-Neiges", "050730": "Paroisse de Lachine", "050740": "Ville de Lachine", "050750": "Paroisse de Saint-Laurent", "050760": "Paroisse de Pointe-Claire", "050770": "Village de Pointe-Claire", "050780": "Paroisse de Sainte-Anne", "050790": "Paroisse de Sainte-Geneviève", "050800": "Village de Sainte-Geneviève", "050810": "Paroisse de l'Île-Bizard", "050820": "Village de Soulanges", "050830": "Paroisse de Saint-Joseph-des-Cèdres", "050840": "Paroisse de Saint-Ignace-du-Coteau-du-Lac", "050850": "Village de Coteau-Landing", "050870": "Paroisse de Saint-Zotique", "050880": "Paroisse de Saint-Télesphore", "050890": "Paroisse de Saint-Polycarpe", "050900": "Paroisse de Saint-Clet", "050910": "Paroisse de Sainte-Jeanne-de-l'Île-Perrot", "050920": "Village de Saint-Michel-de-Vaudreuil", "050930": "Village de Como", "050940": "Paroisse de Saint-Michel-de-Vaudreuil", "050950": "Paroisse de Saint-Lazare", "050960": "Paroisse de Sainte-Marthe", "050970": "Paroisse de Sainte-Justine-de-Newton", "050980": "Paroisse de Très-Saint-Rédempteur", "050990": "Paroisse de Sainte-Madeleine-de-Rigaud", "051000": "Village de Rigaud", "051010": "Village de Pointe-Fortune", "051020": "Village de Saint-Eustache", "051030": "Paroisse de Saint-Eustache", "051040": "Paroisse de Saint-Joseph-du-Lac", "051050": "Paroisse de L'Annonciation-du-Lac-des-Deux-Montagnes", "051060": "Paroisse de Saint-Placide", "051070": "Paroisse de Saint-Hermas", "051080": "Paroisse de Saint-Benoît", "051090": "Paroisse de Saint-Augustin", "051100": "Paroisse de Sainte-Scholastique", "051110": "Village de Sainte-Scholastique", "051120": "Paroisse de Sainte-Monique", "051130": "Paroisse de Saint-Jérôme", "051140": "Paroisse de Saint-Canut", "051150": "Paroisse de Saint-Colomban", "051160": "Paroisse de Sainte-Dorothée", "051170": "Paroisse de Saint-Martin", "051180": "Paroisse de Sainte-Rose", "051190": "Village de Sainte-Rose", "051200": "Paroisse de Saint-Vincent-de-Paul", "051210": "Paroisse de Saint-François-de-Sales", "051220": "Paroisse de Saint-Sulpice", "051230": "Paroisse de L'Assomption", "051240": "Village de L'Assomption", "051250": "Paroisse de Notre-Dame-de-L'Assomption-de-Repentigny", "051260": "Paroisse de Saint-Paul-l'Ermite", "051270": "Paroisse de Lachenaie", "051280": "Paroisse de Saint-Henri-de-Mascouche", "051290": "Paroisse de Sainte-Anne-des-Plaines", "051300": "Paroisse de Saint-Lin", "051310": "Paroisse de Saint-Roch-de-l'Achigan", "051320": "Paroisse de L'Épiphanie", "051330": "Ville de Terrebonne", "051340": "Paroisse de Saint-Louis-de-Terrebonne", "051350": "Paroisse de Sainte-Thérèse-de-Blainville", "051360": "Village de Sainte-Thérèse", "051370": "Paroisse de Saint-Janvier", "051380": "Paroisse de Sainte-Sophie", "051390": "Village de New Glasgow", "051400": "Village de Saint-Jérôme", "051410": "Paroisse de Saint-Sauveur", "051420": "Paroisse de Saint-Hippolyte", "051430": "Paroisse de Sainte-Marguerite", "051440": "Paroisse de Sainte-Adèle-d'Abercrombie", "051450": "Paroisse de Sainte-Agathe-des-Monts", "051460": "Canton de Doncaster", "051470": "Canton d'Archambault", "051480": "Canton de Wolfe", "051490": "Canton de De Salaberry", "051500": "Canton de Grandison", "051520": "Cité de Montréal (quartier Saint-Jacques)", "051530": "Cité de Montréal (quartier Saint-Louis)", "051540": "Cité de Montréal (quartier Saint-Laurent)", "051550": "Cité de Montréal (quartier Saint-Antoine)", "051560": "Cité de Montréal (quartier Sainte-Anne)", "051570": "Cité de Montréal (quartier Est)", "051580": "Cité de Montréal (quartier Centre)", "051590": "Cité de Montréal (quartier Ouest)", "051600": "Mirabel", "051610": "Canton d'Amherst", "051620": "L'Assomption", "051630": "Paroisse de Sainte-Brigide", "051640": "Paroisse de Saint-Grégoire", "051650": "Paroisse de Saint-Athanase", "051660": "Ville d'Iberville", "051670": "Paroisse de Saint-Alexandre", "051680": "Paroisse de Saint-Sébastien", "051690": "Paroisse de Saint-Georges-d'Henryville", "060010": "Paroisse de Saint Andrews", "060020": "Paroisse de Saint-Jérusalem", "060040": "Canton de Chatham", "060060": "Canton de Grenville", "060080": "Village de Grenville", "060100": "Augmentation du canton de Grenville", "060110": "Canton de Harrington", "060120": "Canton de Wentworth", "060140": "Canton de Gore", "060160": "Municipalité des Mille-Isles", "060180": "Canton de Morin", "060200": "Canton de Howard", "060210": "Canton de Montcalm", "060220": "Canton d'Arundel", "060240": "Canton de Buckingham", "060260": "Village de Buckingham", "060280": "Canton de Lochaber", "060300": "Village de Thurso", "060310": "Paroisse de Sainte-Angélique", "060320": "Paroisse de Notre-Dame-de-Bonsecours", "060340": "Paroisse de Saint-André-Avellin", "060360": "Canton de Ripon", "060380": "Canton de Mulgrave", "060400": "Canton de Derry", "060410": "Canton de Portland", "060420": "Canton de Bowman", "060440": "Canton de Villeneuve", "060460": "Canton de Hartwell", "060480": "Canton de Suffolk", "060500": "Canton de Ponsonby", "060510": "Canton d'Amherst", "060520": "Canton d'Addington", "060540": "Canton de Preston", "060560": "Canton de Hull", "060580": "Cité de Hull", "060600": "Village de Pointe-Gatineau", "060610": "Canton de Templeton", "060620": "Village d'Aylmer", "060640": "Canton d'Eardley", "060660": "Canton de Masham", "060680": "Canton de Wakefield", "060700": "Canton de Denholm", "060710": "Canton de Low", "060720": "Canton d'Aylwin", "060740": "Canton de Hincks", "060760": "Canton de Blake", "060780": "Canton de Northfield", "060800": "Canton de Wright", "060810": "Village de Gracefield", "060820": "Canton de Bouchette", "060840": "Canton de Cameron", "060860": "Canton de Kensington", "060880": "Canton de Maniwaki", "060910": "Canton d'Egan", "060920": "Canton d'Aumond", "060940": "Canton de Sicotte", "060960": "Canton de Lytton", "060970": "Canton de By", "060980": "Canton de Baskatong", "060990": "Canton de Mitchell", "061000": "Canton de Bigelow", "061010": "Canton de Wells", "061020": "Canton de McGill", "061040": "Canton de Gagnon", "061060": "Canton de Labelle", "061080": "Canton de Clyde", "061100": "Canton de Joly", "061110": "Village de Labelle", "061120": "Canton de La Minerve", "061140": "Canton de Lesage", "061160": "Canton de Dudley", "061180": "Canton de Wabassee", "061200": "Canton de Bouthillier", "061210": "Canton de Kiamika", "061220": "Canton de Montigny", "061240": "Canton de Loranger", "061260": "Village de Nominingue", "061280": "Canton de Marchand", "061300": "Village de L'Annonciation", "061310": "Canton de Lynch", "061320": "Canton de Mousseau", "061340": "Canton de Turgeon", "061360": "Canton de Boyer", "061380": "Canton de Campbell", "061400": "Village de Val-Barrette", "061410": "Village de Mont-Laurier", "061420": "Canton de Robertson", "061440": "Canton de Pope", "061460": "Canton de Wurtele", "061470": "Canton d'Archambault", "061480": "Village de Ferme-Neuve", "061500": "Canton de Rochon", "061510": "Canton de Moreau", "061520": "Canton de Pérodeau", "061530": "Canton de Fontbrune", "061540": "Canton de Décarie", "061560": "Canton de Gravel", "061580": "Canton de Major", "061600": "Paroisse de Sainte-Marie-Salomé", "061610": "Paroisse de Saint-Jacques-de-l'Achigan", "061620": "Paroisse de Saint-Liguori", "061640": "Paroisse de Saint-Alexis", "061660": "Paroisse de Saint-Esprit", "061680": "Paroisse de Sainte-Julienne", "061700": "Canton de Kilkenny", "061710": "Canton de Rawdon", "061720": "Canton de Wexford", "061740": "Canton de Chertsey", "061760": "Canton de Chilton", "061780": "Canton de Lussier", "061790": "Canton de Rolland", "061800": "Canton de Nantel", "061810": "Paroisse de Saint-Paul", "061820": "Paroisse de Saint-Thomas", "061840": "Ville de Joliette", "061860": "Paroisse de Saint-Charles-Borromée", "061880": "Paroisse de Sainte-Élizabeth", "061900": "Paroisse de Saint-Félix-de-Valois", "061910": "Paroisse de Sainte-Mélanie", "061920": "Paroisse de Saint-Ambroise-de-Kildare", "061940": "Paroisse de Saint-Alphonse-de-Rodriguez", "061960": "Paroisse de Sainte-Béatrix", "061980": "Paroisse de Saint-Jean-de-Matha", "062000": "Paroisse de Sainte-Emmélie-de-l'Énergie", "062010": "Canton de Joliette", "062020": "Canton de Cathcart", "062040": "Canton de Cartier", "062050": "Canton de Gamelin", "062060": "Canton de Tracy", "062070": "Canton de D'Aillon", "062080": "Canton de Gouin", "062100": "Paroisse de Saint-Antoine-de-Lavaltrie", "062110": "Paroisse de Saint-Joseph-de-Lanoraie", "062120": "Paroisse de Berthier", "062140": "Ville de Berthier", "062160": "Paroisse de La Visitation (Île-Dupas)", "062180": "Paroisse de Saint-Barthélemy", "062200": "Paroisse de Saint-Cuthbert", "062210": "Paroisse de Saint-Norbert", "062220": "Paroisse de Saint-Gabriel-de-Brandon", "062260": "Paroisse de Saint-Didace", "062280": "Paroisse de Saint-Damien-de-Brandon", "062300": "Canton de Gauthier", "062310": "Canton de Courcelles", "062320": "Canton de Provost", "062330": "Canton de Dupont", "062340": "Canton de Brassard", "062360": "Paroisse de Saint-Joseph-de-Maskinongé", "062380": "Paroisse de Saint-Antoine-de-la-Rivière-du-Loup", "062400": "Ville de Louiseville", "062410": "Paroisse de Saint-Léon-le-Grand", "062420": "Paroisse de Sainte-Ursule", "062440": "Paroisse de Saint-Justin", "062480": "Paroisse de Saint-Paulin", "062500": "Paroisse de Saint-Sévère", "062510": "Canton de Hunterstown", "062520": "Canton de De Calonne", "062530": "Canton de Légaré", "062540": "Canton de Chapleau", "062550": "Canton de Houde", "062560": "Canton d'Angoulême", "062570": "Bassin de la Rivière-du-Lièvre", "062580": "Canton de Masson", "062600": "Canton de Laviolette", "062610": "Cité de Trois-Rivières", "062620": "Paroisse de Trois-Rivières", "062640": "Paroisse de La Visitation-de-la-Pointe-du-Lac", "062660": "Paroisse de Sainte-Anne-d'Yamachiche", "062680": "Paroisse de Saint-Étienne", "062700": "Paroisse de Cap-de-la-Madeleine", "062710": "Paroisse de La Visitation-de-Champlain", "062720": "Paroisse de Saint-Maurice", "062740": "Village de Fermont", "062760": "Paroisse de Notre-Dame-du-Mont-Carmel", "062780": "Paroisse de Saint-Narcisse", "062800": "Paroisse de Saint-Luc", "062810": "Paroisse de Sainte-Geneviève-de-Batiscan", "062820": "Paroisse de Saint-François-Xavier-de-Batiscan", "062840": "Paroisse de Sainte-Anne-de-la-Pérade", "062860": "Paroisse de Saint-Prosper", "062880": "Paroisse de Saint-Stanislas", "062900": "Paroisse de Saint-Tite", "062910": "Paroisse de Saint-Barnabé", "062920": "Paroisse de Saint-Élie", "062940": "Paroisse de Saint-Boniface", "062960": "Paroisse de Saint-Mathieu", "062980": "Paroisse de Sainte-Flore", "063010": "Canton de Radnor", "063020": "Paroisse de Saint-Jacques-des-Piles", "063040": "Paroisse de Sainte-Thècle", "063060": "Canton de Lejeune", "063080": "Canton de Belleau", "063100": "Canton de Desaulniers", "063110": "Seigneurie de Batiscan", "063120": "Canton de Mékinac", "063140": "Canton de Boucher", "063150": "Canton de Laliberté", "063160": "Canton de Polette", "063180": "Canton de Hackett", "063200": "Canton de Carignan", "063210": "Canton de Turcotte", "063220": "Canton de Vallières", "063230": "Canton de Weymontachingue", "063240": "Canton de Malhiot", "063260": "Canton de Laurier", "063280": "Canton de Bourgeoys", "063300": "Canton de Langelier", "063310": "Canton de Dumoulin", "063320": "Canton de Lavallée", "063330": "Canton de Dansereau", "063340": "Canton de Dessane", "063350": "Canton de Tourouvre", "063360": "Canton de Dandurand", "063370": "Canton de Cadieux", "063380": "Canton de Lamy", "063390": "Canton de Cloutier", "063400": "Village de Parent", "063410": "Canton de Payment", "063420": "Bassin de la Rivière-Gatineau", "063430": "Canton de Charest", "063440": "Canton de Bonin", "063450": "Canton de Routhier", "063460": "Canton de Bickerdike", "063470": "Canton de Gendron", "063480": "Canton de Laure", "063490": "Canton de Lescarbot", "063500": "Canton de Rhodes", "063510": "Canton de Trudel", "063520": "Canton de Biard", "063530": "Canton de Chasseur", "063540": "Canton d'Adams", "063550": "Canton de Letondal", "063560": "Canton de Papineau", "063570": "Saint-Georges", "063580": "Seigneurie du Cap-de-la-Madeleine", "063590": "Mont-Laurier", "063600": "Canton de Lafitau", "063610": "Canton de Pau", "063620": "Canton de Brunet", "063630": "Canton de Bardy", "063640": "Canton de Créquy", "063650": "Canton de Pothier", "063660": "Canton de Bureau", "063670": "Canton de Briand", "063680": "Canton de Lavigne", "063690": "Canton de Rhéaume", "063700": "Canton de Hamel", "063710": "Canton de Borgia", "070010": "Village de Quyon", "070020": "Canton d'Onslow", "070040": "Canton de Bristol", "070060": "Canton de Clarendon", "070080": "Village de Shawville", "070100": "Village de Portage-du-Fort", "070110": "Village de Bryson", "070120": "Village de Campbell's Bay", "070140": "Canton de Grand-Calumet", "070160": "Canton de Litchfield", "070180": "Canton de Thorne", "070200": "Canton d'Aldfield", "070210": "Canton de Cawood", "070220": "Canton de Leslie", "070240": "Canton de Mansfield", "070260": "Village de Fort-Coulonge", "070280": "Canton de Waltham", "070300": "Canton de l'Île-des-Allumettes", "070310": "Village de Chapeau", "070320": "Canton de Chichester", "070330": "Canton d'Artois", "070340": "Canton de Sheen", "070360": "Canton de Bryson", "070380": "Canton de Pontefract", "070400": "Canton de Huddersfield", "070410": "Canton de Clapham", "070420": "Canton d'Alleyn", "070440": "Canton de Dorion", "070460": "Canton de Church", "070480": "Canton de Normandie", "070500": "Canton d'Aberdeen", "070510": "Village de Rapides-des-Joachims", "070520": "Canton d'Aberford", "070530": "Canton de Booth", "070540": "Canton de Yéo", "070560": "Canton de Hamon", "070580": "Canton de Lajoie", "070600": "Canton de Membré", "070610": "Canton d'Eddy", "070620": "Canton d'Edwards", "070640": "Canton de Boisclerc", "070660": "Canton de Campeau", "070680": "Canton de Gendreau", "070700": "Canton de Reclus", "070710": "Canton de Mazenod", "070720": "Canton de Fabre", "070730": "Canton de Shehyn", "070740": "Canton de Laperrière", "070750": "Canton de Mercier", "070760": "Canton de Duhamel", "070770": "Canton de Bruchési", "070780": "Village de Ville-Marie", "070790": "Canton de Tabaret", "070800": "Canton de Laverlochère", "070810": "Canton de Gaboury", "070820": "Canton de Guillet", "070840": "Canton de Devlin", "070860": "Canton de Brodeur", "070880": "Canton de Latulipe", "070900": "Canton de Baby", "070910": "Canton de Guigues", "070920": "Canton de Nédelec", "070940": "Canton de Guérin", "070960": "Canton de Villars", "070980": "Canton de Bauneville", "071000": "Canton de Marrias", "071010": "Canton de Sabourin", "071020": "Canton de Laubanie", "071030": "Canton de Clérion", "071040": "Canton de Desroberts", "071060": "Canton de Beaumesnil", "071080": "Canton de Rémigny", "071100": "Canton de Montreuil", "071110": "Canton de Desandrouins", "071120": "Canton de Caire", "071130": "Canton de Landanet", "071140": "Canton de Vaudray", "071160": "Canton de Bellecombe", "071180": "Canton de Montbeillard", "071200": "Canton de Dufay", "071210": "Canton de Dasserat", "071220": "Canton de Beauchastel", "071240": "Canton de Rouyn", "071260": "Ville de Rouyn", "071280": "Ville de Noranda", "071310": "Canton de Joannès", "071320": "Canton de Bousquet", "071340": "Canton de La Pause", "071360": "Canton de Cléricy", "071380": "Canton de Dufresnoy", "071400": "Canton de Duprat", "071410": "Canton de Montbray", "071420": "Canton de Landry", "071440": "Canton de Faucher", "071460": "Canton de Villebon", "071480": "Canton de Pershing", "071500": "Canton de Vauquelin", "071510": "Canton de Louvicourt", "071520": "Canton de Bourlamaque", "071540": "Canton de Dubuisson", "071560": "Canton de Fournière", "071580": "Canton de Cadillac", "071600": "Canton de Malartic", "071610": "Canton de Vassan", "071620": "Canton de Senneville", "071640": "Canton de Pascalis", "071660": "Canton de Tiblemont", "071680": "Village de Doucet", "071700": "Canton de Boisseau", "071710": "Canton de Dollard", "071720": "Canton de Senneterre", "071730": "Canton de Faillon", "071740": "Village de Senneterre", "071760": "Canton de Courville", "071780": "Canton de Fiedmont", "071800": "Canton de Lacorne", "071810": "Canton de La Motte", "071820": "Canton de Preissac", "071840": "Canton de Hébécourt", "071860": "Canton de Duparquet", "071880": "Ville de Duparquet", "071900": "Canton de Destor", "071910": "Canton d'Aiguebelle", "071920": "Canton de Manneville", "071940": "Canton de Villemontel", "071960": "Canton de Figuery", "071980": "Village d'Amos", "072000": "Canton de Landrienne", "072010": "Canton de Barraute", "072020": "Canton de Carpentier", "072040": "Canton de Montgay", "072060": "Canton de Brassier", "072080": "Canton de Ducros", "072100": "Canton de Rochebaucourt", "072110": "Canton de La Morandière", "072120": "Canton de Duverny", "072140": "Canton de Dalquier", "072160": "Canton de Trécesson", "072180": "Canton de Launay", "072200": "Canton de Privat", "072210": "Village de Privat", "072220": "Canton de Poularies", "072240": "Canton de Palmarolle", "072260": "Canton de Roquemaure", "072280": "Canton de La Reine", "072300": "Village de Dupuy", "072310": "Canton de La Sarre", "072320": "Village de La Sarre", "072340": "Canton de Royal-Roussillon", "072360": "Village de Macamic", "072380": "Canton de Languedoc", "072400": "Canton de Guyenne", "072410": "Canton de Berry", "072420": "Canton de Béarn", "072440": "Canton de Castagnier", "072460": "Canton de Vassal", "072480": "Canton de Despinassy", "072500": "Canton de Bartouille", "072510": "Canton de Tonnancourt", "072520": "Canton de Laas", "072530": "Canton de Bernetz", "072540": "Canton de Miniac", "072560": "Canton de Desboues", "072580": "Canton de Disson", "072600": "Canton de Chazel", "072610": "Canton de Clermont", "072620": "Canton de Desméloizes", "072640": "Village de La Reine", "072660": "Canton de Perron", "072680": "Canton de Rousseau", "072700": "Canton de Lavergne", "072710": "Canton de Boivin", "072720": "Canton de Paradis", "072740": "Canton de Chaste", "072760": "Canton de Maizerets", "072770": "Canton de La Ribourde", "072780": "Canton de Quévillon", "072790": "Canton de Comtois", "072800": "Canton de Duplessis", "072810": "Canton de Lesueur", "072820": "Canton de Joutel", "072830": "Canton de Franquet", "072840": "Canton de Douay", "072850": "Canton de Currie", "072860": "Canton d'Isle-Dieu", "072870": "Canton de Bossé", "072880": "Canton de Galinée", "072900": "Canton de Daniel", "072910": "Canton de Livaudière", "072920": "Canton de Brouillan", "072930": "Canton de Boyvinet", "072940": "Canton de Gand", "072950": "Canton d'Atwater", "072960": "Canton de Poisson", "072970": "Canton de Laberge", "072980": "Canton de McLachlin", "072990": "Canton de Choquette", "073000": "Canton de Gosselin", "073010": "Canton de Sauvé", "073020": "Canton de Picquet", "073030": "Canton d'Urban", "073040": "Canton de Émard", "073050": "Canton de Buies", "073060": "Canton de Lozeau", "073070": "Canton de Jourdan", "073080": "Canton de Mazérac", "073090": "Canton de Basserode", "073100": "Canton de Glandelet", "073110": "Canton de Casa-Berardi", "073120": "Canton de Montpetit", "073130": "Canton de Jurie", "073140": "Canton de Baudin", "073150": "Canton de Pontleroy", "073160": "Canton de Esher", "073170": "Canton de Estrées", "073180": "Canton de Orvilliers", "073190": "Canton de Estrades", "073200": "Canton de Le Caron", "073220": "Canton de Grevet", "073230": "Canton de Mountain", "073240": "Canton de Vezza", "073250": "Canton de Pommeroy", "073260": "Canton de Malakoff", "073270": "Canton de Couturier", "073280": "Canton de Guay", "073290": "Canton de Bazin", "073300": "Canton de Sérigny", "073310": "Canton de Trévet", "073320": "Canton de Crusson", "073330": "Canton de Bourgmont", "073340": "Canton de Chassaigne", "073350": "Canton de Leau", "073360": "Canton de Le Breton", "073370": "Canton de Toussaint", "073380": "Canton de Cavelier", "073390": "Canton de Benoist", "080010": "Canton de Boilleau", "080020": "Canton de Périgny", "080040": "Canton de Dumas", "080050": "Canton de Labrosse", "080060": "Canton de Saint-Jean", "080080": "Canton de Hébert", "080100": "Canton d'Otis", "080110": "Canton de Ferland", "080120": "Paroisse de Saint-Alexis", "080130": "Paroisse de Saint-Alphonse", "080140": "Village de Grande-Baie", "080160": "Village de Bagotville", "080180": "Canton de Bagot", "080200": "Canton de Laterrière", "080210": "Paroisse de Chicoutimi", "080220": "Ville de Chicoutimi", "080240": "Canton de Chicoutimi", "080260": "Cité d'Arvida", "080280": "Canton de Jonquière", "080300": "Canton de Kénogami", "080310": "Canton de Labarre", "080320": "Canton de Taché", "080340": "Canton de Bourget", "080360": "Canton de Simard", "080380": "Canton de Tremblay", "080400": "Village de Sainte-Anne-de-Chicoutimi", "080410": "Canton de Harvey", "080420": "Canton de Saint-Germains", "080430": "Canton de Chardon", "080440": "Canton de Durocher", "080460": "Canton de Falardeau", "080470": "Canton de Gagné", "080480": "Canton de Bégin", "080500": "Canton de Labrecque", "080510": "Canton de Rouleau", "080520": "Canton d'Aulneau", "080540": "Bassin de la Rivière-Péribonca", "080560": "Bassin de la Rivière-Betsiamites", "080580": "Canton de Lidice", "080600": "Bassin de la Rivière-Manouane", "080610": "Canton de Mésy", "080620": "Village d'Hébertville", "080630": "Canton de Saint-Hilaire", "080640": "Canton de Caron", "080660": "Canton de Métabetchouan", "080700": "Canton de Signay", "080710": "Canton de De l'Île", "080720": "Canton de Taillon", "080740": "Canton de Garnier", "080760": "Canton de Crespieul", "080780": "Canton de Malherbe", "080800": "Augmentation du canton de Dequen", "080810": "Canton de Dablon", "080820": "Canton de Dequen", "080840": "Canton de Charlevoix", "080860": "Canton de Roberval", "080880": "Village de Roberval", "080900": "Canton de Ross", "080910": "Canton de Déchêne", "080920": "Canton de Ouiatchouan", "080940": "Canton d'Ashuapmouchouan", "080960": "Canton de Demeulles", "080980": "Canton de Parent", "081000": "Canton de Racine", "081010": "Canton de Dolbeau", "081020": "Canton de Dalmas", "081040": "Canton de Jogues", "081060": "Canton de Maltais", "081080": "Canton de Constantin", "081100": "Canton de Saint-Onge", "081110": "Canton de Milot", "081120": "Canton de Proulx", "081140": "Canton de Hudon", "081160": "Canton de La Trappe", "081180": "Canton de Pelletier", "081200": "Canton d'Albanel", "081210": "Canton de Normandin", "081240": "Canton de Dufferin", "081260": "Canton de Dumais", "081280": "Canton de Girard", "081300": "Canton de Beaudet", "081310": "Canton d'Antoine", "081320": "Canton de Hémon", "081340": "Canton de Bourbon", "081350": "Canton d'Argenson", "081360": "Canton de Ramezay", "081370": "Canton de McOuat", "081380": "Canton d'Ailleboust", "081390": "Canton de Condé", "081400": "Canton de Daubrée", "081410": "Canton de Lévy", "081420": "Canton d'Obalski", "081430": "Canton d'Aigremont", "081440": "Canton de McKenzie", "081450": "Canton de Scott", "081460": "Canton de Roy", "081470": "Canton de Queylus", "081480": "Canton de Richardson", "081490": "Canton de Ducharme", "081500": "Canton de Béland", "081510": "Canton de Charron", "081520": "Canton de D'Esglis", "081530": "Canton de Lorne", "081540": "Canton de Gauvin", "081550": "Canton de Bochart", "081560": "Canton de Paquet", "081570": "Bassin de la Rivière-Rupert", "081580": "Canton de Lucière", "081590": "Canton de De Lamarre", "081600": "Canton de Drapeau", "081610": "Canton de Laflamme", "081620": "Canton de Saussure", "081630": "Canton de Lartigue", "081640": "Canton de Quesnel", "081650": "Canton de Garreau", "081660": "Bassin de la Rivière-Shipshaw", "081670": "Bassin de la Rivière-Portneuf", "081680": "Ville de Roberval", "081690": "Ville de La Baie", "081700": "Canton de Chabanel", "081710": "Canton de Plessis", "081720": "Canton de Du Creux", "081730": "Canton de Rohault", "081740": "Canton de La Dauversière", "090010": "Paroisse de Saint-Irénée", "090020": "Paroisse de La Malbaie", "090040": "Village de Pointe-au-Pic", "090060": "Paroisse de Sainte-Agnès", "090080": "Canton de De Sales", "090100": "Canton de Chauveau", "090110": "Paroisse de Saint-Fidèle", "090120": "Paroisse de Saint-Siméon", "090140": "Canton de Callières", "090160": "Canton de Saguenay", "090180": "Canton de Sagard", "090200": "Paroisse de Saint-Louis-de-l'Île-aux-Coudres", "090210": "Paroisse de Saint-François-Xavier", "090220": "Paroisse de Baie-Saint-Paul", "090230": "Bassin du Lac-Kénogami", "090240": "Paroisse des Éboulements", "090260": "Paroisse de Saint-Hilarion", "090280": "Paroisse de Saint-Urbain", "090300": "Paroisse de L'Ange-Gardien", "090310": "Paroisse de Sainte-Brigitte-de-Laval", "090320": "Paroisse de Saint-Adolphe", "090330": "Canton de Cauchon", "090340": "Paroisse de Château-Richer", "090350": "Bassin de la Rivière-Jacques-Cartier", "090360": "Paroisse de Sainte-Anne", "090400": "Paroisse de Saint-Joachim", "090410": "Paroisse de Saint-Féréol", "090420": "Paroisse de Saint-Tite", "090440": "Seigneurie de la Côte-de-Beaupré", "090460": "Paroisse de Sainte-Pétronille", "090480": "Paroisse de Saint-Pierre", "090500": "Paroisse de Saint-Laurent", "090510": "Paroisse de Saint-Jean", "090520": "Paroisse de Sainte-Famille", "090540": "Paroisse de Saint-François", "090560": "Paroisse de Notre-Dame-de-Québec (La Banlieue)", "090580": "Paroisse de Saint-Sauveur", "090600": "Cité de Québec (quartier Montcalm)", "090610": "Paroisse de Notre-Dame-des-Anges", "090620": "Paroisse de Saint-Roch-Nord", "090640": "Paroisse de Saint-Colomb-de-Sillery", "090660": "Paroisse de Sainte-Foy", "090680": "Paroisse de Saint-Félix-du-Cap-Rouge", "090700": "Paroisse de L'Ancienne-Lorette", "090710": "Paroisse de Saint-Ambroise-de-la-Jeune-Lorette", "090720": "Paroisse de Charlesbourg", "090740": "Paroisse de Beauport", "090760": "Paroisse de Saint-Dunstan-du-Lac-Beauport", "090780": "Paroisse de Saint-Gabriel-de-Valcartier", "090800": "Paroisse de Saint-Edmond-de-Stoneham", "090860": "Paroisse de Saint-Augustin", "090880": "Paroisse de Pointe-aux-Trembles", "090900": "Paroisse des Écureuils", "090910": "Paroisse de Cap-Santé", "090920": "Paroisse de Sainte-Jeanne-de-Neuville", "090940": "Paroisse de Sainte-Catherine", "090960": "Paroisse de Saint-Basile", "090980": "Paroisse de Notre-Dame-de-Portneuf", "091000": "Paroisse de Deschambault", "091010": "Paroisse des Grondines", "091020": "Paroisse de Saint-Casimir", "091040": "Paroisse de Saint-Alban-d'Alton", "091060": "Paroisse de Saint-Ubalde", "091080": "Paroisse de Saint-Rémi", "091100": "Paroisse de Notre-Dame-des-Anges", "091110": "Paroisse de Saint-Raymond", "091120": "Canton de Colbert", "091130": "Canton de Tonti", "091140": "Canton de Bois", "091160": "Canton de La Salle", "091170": "Cité de Québec (quartier Saint-Roch)", "091180": "Cité de Québec (quartier Jacques-Cartier)", "091190": "Cité de Québec (quartier Saint-Pierre)", "091200": "Cité de Québec (quartier Saint-Jean)", "091210": "Cité de Québec (quartier du Palais)", "091220": "Cité de Québec (quartier Saint-Louis)", "091230": "Cité de Québec (quartier Champlain)", "091240": "Seigneurie de Perthuis", "091250": "Montauban", "091260": "Bassin de la Rivière-du-Gouffre", "091270": "Canton de Marmier", "091280": "Bassin de la Rivière-Malbaie", "100010": "Canton de l'Archipel-de-Washicoutai", "100020": "Canton de l'Archipel-de-Ouapitagone", "100040": "Canton de l'Archipel-de-Sainte-Marie", "100060": "Canton de l'Archipel-du-Petit-Mécatina", "100080": "Canton de l'Archipel-du-Gros-Mécatina", "100100": "Canton de l'Archipel-de-Kécarpoui", "100110": "Canton de l'Archipel-de-Saint-Augustin", "100120": "Canton de l'Archipel-de-Blanc-Sablon", "100140": "Canton de Brest", "100150": "Bassin de la Rivière-Hamilton", "100160": "Canton de Phélypeaux", "100170": "Bassin de la Rivière-Mécatina", "100180": "Canton de Bonne-Espérance", "100190": "Canton de l'Archipel-du-Vieux-Fort", "100200": "Canton de Chevalier", "100210": "Canton de Pontchartrain", "100220": "Canton de Marsal", "100240": "Canton de Brouague", "100260": "Canton de Bougainville", "100280": "Canton de Verrazzano", "100300": "Canton de Cook", "100310": "Canton de D'Audhebourg", "100320": "Canton de Boishébert", "100340": "Canton de Céry", "100360": "Canton de Saint-Vincent", "100380": "Canton de Bellecourt", "100400": "Canton de Baune", "100410": "Canton de Charnay", "100420": "Canton de Liénard", "100440": "Canton de Le Gardeur", "100460": "Canton de Peuvret", "100480": "Canton de La Gorgendière", "100500": "Canton de Lalande", "100510": "Canton de Bissot", "100520": "Canton de Musquaro", "100540": "Canton de Kégashka", "100560": "Canton de Duval", "100580": "Canton de Natashquan", "100600": "Canton de Goynish", "100610": "Canton de La Richardière", "100620": "Canton de Johan-Beetz", "100630": "Île d'Anticosti", "100640": "Canton de Des Herbiers", "100660": "Canton de Courtemanche", "100680": "Canton de Beaussier", "100700": "Municipalité de Havre-Saint-Pierre", "100710": "Seigneurie de Terre-Ferme-de-Mingan", "100720": "Municipalité de Rivière-au-Tonnerre", "100740": "Canton de Rochemonteix", "100760": "Canton de Moisie", "100780": "Canton de Letellier", "100800": "Canton d'Arnaud", "100810": "Territoire du Nouveau-Québec", "100820": "Bassin de la Rivière-Sainte-Marguerite", "100840": "Canton de Le Neuf", "100850": "Canton de Fléché", "100860": "Canton de Babel", "100880": "Canton de Grenier", "100900": "Canton de Fitzpatrick", "100910": "Canton de Cannon", "100920": "Canton de Royer", "100940": "Canton de De Monts", "100960": "Canton de Franquelin", "100980": "Canton de Bourdon", "101000": "Canton de Laflèche", "101010": "Canton de Manicouagan", "101020": "Canton de Ragueneau", "101030": "Canton d'Eudes", "101040": "Canton de Betsiamites", "101060": "Canton de Latour", "101070": "Canton de Virot", "101080": "Canton de Laval", "101100": "Seigneurie de Mille-Vaches", "101110": "Canton d'Iberville", "101120": "Canton d'Escoumins", "101140": "Canton de Bergeronnes", "101160": "Canton de Tadoussac", "101180": "Canton d'Albert", "101190": "Canton de Hesry", "101200": "Canton de Pontgravé", "101210": "Canton de Fagundez", "101220": "Canton de Godefroy", "101230": "Canton de Lislois", "101240": "Canton de Conan", "101250": "Canton de Normanville", "101260": "Canton de Chiasson", "101270": "Canton de Pinet", "101280": "Canton de Bergeron", "101290": "Canton de Tilly", "101300": "Canton de Noré", "101310": "Canton de Saint-Castin", "101320": "Canton de Hind", "101330": "Canton de Cabanac", "101340": "Canton de Gueslis", "101350": "Canton de Janssoone", "101360": "Canton de Le Courtois", "101370": "Canton de Forgues", "101380": "Bassin de la Rivière-Manicouagan", "101390": "Bassin de la Rivière-Pentecôte", "101400": "Bassin de la Rivière-aux-Rochers", "101410": "Canton de Basset", "101420": "Bassin de la Rivière-Aguanus", "101430": "Canton de Laussedat", "101440": "Bassin de la Rivière-Moisie", "101450": "Canton de Laclède", "101460": "Bassin de la Rivière-aux-Outardes", "101470": "Bassin de la Rivière-Magpie", "101480": "Canton de Villejouin", "101490": "Canton de Bedout", "101500": "Canton de Brien", "101510": "Canton de Costebelle", "101520": "Baie-Comeau", "101530": "Canton de Morency", "101540": "Canton de Valois", "101550": "Canton de Du Thet", "101580": "Radisson", "101590": "Canton de Parker", "101600": "Canton de Vigneau", "101610": "Canton de Puyjalon", "101620": "Canton de Ternet", "101630": "Canton de Godbout"
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
};

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const CADASTRES_PAR_CIRCONSCRIPTION = {
  "Lac-Saint-Jean-Est": [
    "Québec",
    "Canton de Caron",
    "Canton de de l'Île",
    "Canton de Garnier",
    "Village d'Héberville",
    "Canton d'Hébertville-Station",
    "Canton de Labarre",
    "Canton de Mésy",
    "Canton de Métabetchouan",
    "Canton de Signay",
    "Canton de Taillon"
  ],
  "Lac-Saint-Jean-Ouest": [
    "Québec",
    "Canton d'Albanel",
    "Canton de Charlevoix",
    "Canton de Dablon",
    "Canton de Dalmas",
    "Canton de Demeules",
    "Canton de Dequen",
    "Canton de Dolbeau",
    "Canton de Girard",
    "Canton de Jogues",
    "Canton de Malherbe",
    "Canton de Métabetchouan",
    "Canton de Milot",
    "Canton de Normandin",
    "Canton de Ouiatchouan",
    "Canton de Racine",
    "Canton de Roberval",
    "Canton de Saint-Hilaire"
  ],
  "Chicoutimi": [
    "Québec",
    "Cité d'Arvida",
    "Canton de Bagot",
    "Village de Bagotville",
    "Canton de Bégin",
    "Canton de Boileau",
    "Canton de Bourget",
    "Canton de Chicoutimi",
    "Paroisse de Chicoutimi",
    "Ville de Chicoutimi",
    "Canton de Dumas",
    "Canton de Durocher",
    "Canton de Falardeau",
    "Canton de Ferland",
    "Ville de Grande-Baie",
    "Canton de Harvey",
    "Canton de Hébert",
    "Canton de Jonquière",
    "Canton de Kénogami",
    "Canton de Labrecque",
    "Canton de Laterrière",
    "Canton d'Otis",
    "Canton de Périgny",
    "Canton de Rouleau",
    "Canton de Simard",
    "Paroisse de Saint-Alexis",
    "Paroisse de Saint-Alphonse",
    "Ville de Sainte-Anne-de-Chicoutimi",
    "Canton de Saint-Germains",
    "Canton de Saint-Jean",
    "Canton de Taché",
    "Canton de Tremblay"
  ]
};

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";

  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };

  return mapping[arpenteur] || "";
};

const PriseDeMandat = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    openNewDialog: () => {
      resetFullForm();
      setIsDialogOpen(true);
    }
  }));
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isNotaireSelectorOpen, setIsNotaireSelectorOpen] = useState(false);
  const [isCourtierSelectorOpen, setIsCourtierSelectorOpen] = useState(false);

  // Expose function to child components via window object
  React.useEffect(() => {
    window.openClientForEdit = (client) => {
      setEditingClientForForm(client);
      setClientTypeForForm(client.type_client);
      setIsClientFormDialogOpen(true);
    };
    return () => {
      delete window.openClientForEdit;
    };
  }, []);

  // Replaced individual new client dialog states with a single one controlling the ClientFormDialog
  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
  const [clientTypeForForm, setClientTypeForForm] = useState('Client'); // 'Client', 'Notaire', 'Courtier immobilier'
  const [editingClientForForm, setEditingClientForForm] = useState(null); // Holds client object for editing


  const [viewingClientDetails, setViewingClientDetails] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [notaireSearchTerm, setNotaireSearchTerm] = useState("");
  const [courtierSearchTerm, setCourtierSearchTerm] = useState("");
  const [activeTabMandat, setActiveTabMandat] = useState("0");

  const [isLotSelectorOpen, setIsLotSelectorOpen] = useState(false);
  const [currentMandatIndex, setCurrentMandatIndex] = useState(null);
  const [lotSearchTerm, setLotSearchTerm] = useState("");
  const [lotCirconscriptionFilter, setLotCirconscriptionFilter] = useState("all");
  const [lotCadastreFilter, setLotCadastreFilter] = useState("Québec");
  const [isNewLotDialogOpen, setIsNewLotDialogOpen] = useState(false);
  const [newLotForm, setNewLotForm] = useState({
    numero_lot: "",
    circonscription_fonciere: "",
    cadastre: "Québec",
    rang: "",
    types_operation: []
  });
  const [availableCadastresForNewLot, setAvailableCadastresForNewLot] = useState([]);
  const [commentairesTemporairesLot, setCommentairesTemporairesLot] = useState([]);
  const [sidebarTabLot, setSidebarTabLot] = useState("commentaires");
  const [editingLot, setEditingLot] = useState(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [initialLotForm, setInitialLotForm] = useState(null);
  const [lotInfoCollapsed, setLotInfoCollapsed] = useState(false);
  const [typesOperationCollapsed, setTypesOperationCollapsed] = useState(false);
  const [lotDocumentsCollapsed, setLotDocumentsCollapsed] = useState(false);
  const [isImportingD01, setIsImportingD01] = useState(false);
  const [isDragOverD01, setIsDragOverD01] = useState(false);
  const [sidebarCollapsedLot, setSidebarCollapsedLot] = useState(false);
  const [lotActionLogs, setLotActionLogs] = useState([]);
  const [isAddMinuteDialogOpen, setIsAddMinuteDialogOpen] = useState(false);
  const [currentMinuteMandatIndex, setCurrentMinuteMandatIndex] = useState(null);
  const [newMinuteForm, setNewMinuteForm] = useState({
    minute: "",
    date_minute: "",
    type_minute: "Initiale"
  });

  // NEW STATES FOR DOSSIER REFERENCE
  const [dossierReferenceId, setDossierReferenceId] = useState(null);
  const [dossierSearchForReference, setDossierSearchForReference] = useState("");
  // END NEW STATES

  // NEW STATE FOR TEMPORARY COMMENTS
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  // END NEW STATE

  const [filterArpenteur, setFilterArpenteur] = useState([]);
  const [filterStatut, setFilterStatut] = useState("all");
  const [activeListTab, setActiveListTab] = useState("nouveau");
  const [filterVille, setFilterVille] = useState([]);
  const [filterTypeMandat, setFilterTypeMandat] = useState([]);
  const [filterUrgence, setFilterUrgence] = useState([]);
  const [filterUtilisateurAssigne, setFilterUtilisateurAssigne] = useState("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [clientStepCollapsed, setClientStepCollapsed] = useState(false);
  const [addressStepCollapsed, setAddressStepCollapsed] = useState(false);
  const [mandatStepCollapsed, setMandatStepCollapsed] = useState(false);
  const [tarificationStepCollapsed, setTarificationStepCollapsed] = useState(true);
  const [professionnelStepCollapsed, setProfessionnelStepCollapsed] = useState(true);
  const [professionnelInfo, setProfessionnelInfo] = useState({ notaire: "", courtier: "", compagnie: "" });
  const [documentsStepCollapsed, setDocumentsStepCollapsed] = useState(true);
  const [showStatutChangeConfirm, setShowStatutChangeConfirm] = useState(false);
  const [pendingStatutChange, setPendingStatutChange] = useState(null);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [dossierInfoStepCollapsed, setDossierInfoStepCollapsed] = useState(false);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [commentsCollapsed, setCommentsCollapsed] = useState(false);
  const [isOuvrirDossierDialogOpen, setIsOuvrirDossierDialogOpen] = useState(false);
  const [nouveauDossierForm, setNouveauDossierForm] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    place_affaire: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    statut: "Ouvert",
    ttl: "Non",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: []
  });
  const [clientsTabExpanded, setClientsTabExpanded] = useState(false);
  const [notairesTabExpanded, setNotairesTabExpanded] = useState(false);
  const [courtiersTabExpanded, setCourtiersTabExpanded] = useState(false);
  const [isLotSelectorOpenDossier, setIsLotSelectorOpenDossier] = useState(false);
  const [lotTabExpanded, setLotTabExpanded] = useState(false);
  const [currentMandatIndexDossier, setCurrentMandatIndexDossier] = useState(null);
  const [activeTabMandatDossier, setActiveTabMandatDossier] = useState("0");
  const [commentairesTemporairesDossier, setCommentairesTemporairesDossier] = useState([]);
  const [infoDossierCollapsed, setInfoDossierCollapsed] = useState(false);
  const [activeContactTab, setActiveContactTab] = useState("clients");
  const [mapCollapsedDossier, setMapCollapsedDossier] = useState(true);
  const [commentsCollapsedDossier, setCommentsCollapsedDossier] = useState(false);
  const [sidebarTabDossier, setSidebarTabDossier] = useState("commentaires");
  const [historiqueDossier, setHistoriqueDossier] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarCollapsedDossier, setSidebarCollapsedDossier] = useState(false);
  const [contactsListCollapsed, setContactsListCollapsed] = useState(true);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState(null);
  const [currentMandatIndexForAddress, setCurrentMandatIndexForAddress] = useState(null);
  const [sameAddressForAllMandats, setSameAddressForAllMandats] = useState(true);
  const [sameLotsForAllMandats, setSameLotsForAllMandats] = useState(false);
  const [documentsCollapsed, setDocumentsCollapsed] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [dossierDocuments, setDossierDocuments] = useState([]);
  const [viewingPdfUrl, setViewingPdfUrl] = useState(null);
  const [viewingPdfName, setViewingPdfName] = useState("");
  const [sidebarTab, setSidebarTab] = useState("commentaires");
  const [historique, setHistorique] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelConfirmDossier, setShowCancelConfirmDossier] = useState(false);
  const [showArpenteurRequiredDialog, setShowArpenteurRequiredDialog] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showDeleteMandatConfirm, setShowDeleteMandatConfirm] = useState(false);
  const [mandatIndexToDelete, setMandatIndexToDelete] = useState(null);
  const [showMissingUserWarning, setShowMissingUserWarning] = useState(false);
  const [showConcordanceWarning, setShowConcordanceWarning] = useState(false);
  const [showD01ImportSuccess, setShowD01ImportSuccess] = useState(false);
  const [showDeleteConcordanceConfirm, setShowDeleteConcordanceConfirm] = useState(false);
  const [concordanceIndexToDelete, setConcordanceIndexToDelete] = useState(null);
  const [showCancelLotConfirm, setShowCancelLotConfirm] = useState(false);
  const [showLotExistsWarning, setShowLotExistsWarning] = useState(false);
  const [showLotMissingFieldsWarning, setShowLotMissingFieldsWarning] = useState(false);
  const [initialPriseMandatData, setInitialPriseMandatData] = useState(null);
  const [workAddress, setWorkAddress] = useState({
    numeros_civiques: [""],
    rue: "",
    ville: "",
    province: "QC",
    code_postal: ""
  });
  const [clientInfo, setClientInfo] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    type_telephone: "Cellulaire",
    courriel: ""
  });
  const [mandatsInfo, setMandatsInfo] = useState([{
    type_mandat: "",
    echeance_souhaitee: "",
    date_signature: "",
    date_debut_travaux: "",
    date_livraison: "",
    urgence_percue: "",
    prix_estime: 0,
    rabais: 0,
    taxes_incluses: false
  }]);

  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    date_fermeture: "",
    statut: "Nouveau mandat/Demande d'information",
    ttl: "Non",
    utilisateur_assigne: "",
    clients_ids: [],
    clients_texte: "",
    notaires_ids: [],
    notaires_texte: "",
    courtiers_ids: [],
    courtiers_texte: "",
    placeAffaire: "",
    mandats: [],
    description: ""
  });

  const queryClient = useQueryClient();

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
    initialData: [],
  });

  const { data: priseMandats = [], isLoading: isLoadingPriseMandats } = useQuery({
    queryKey: ['priseMandats'],
    queryFn: () => base44.entities.PriseMandat.list('-created_date'),
    initialData: [],
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list(),
    initialData: [],
  });

  const { data: entreeTemps = [] } = useQuery({
    queryKey: ['entreeTemps'],
    queryFn: () => base44.entities.EntreeTemps.list('-date'),
    initialData: [],
  });

  const { data: compteurs = [] } = useQuery({
    queryKey: ['compteursMandats'],
    queryFn: () => base44.entities.CompteurMandat.list('-date_creation'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fonction pour calculer le prochain numéro de dossier disponible
  const calculerProchainNumeroDossier = (arpenteur, excludePriseMandatId = null) => {
    const arpenteurDossiers = dossiers.filter(d => d.arpenteur_geometre === arpenteur && d.numero_dossier);
    const maxDossier = arpenteurDossiers.reduce((max, d) => {
      const num = parseInt(d.numero_dossier, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    
    const arpenteurPriseMandats = priseMandats.filter(p => 
      p.arpenteur_geometre === arpenteur && 
      p.statut === "Mandats à ouvrir" && 
      p.id !== excludePriseMandatId && 
      p.numero_dossier
    );
    const maxPriseMandat = arpenteurPriseMandats.reduce((max, p) => {
      const num = parseInt(p.numero_dossier, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    
    return (Math.max(maxDossier, maxPriseMandat) + 1).toString();
  };

  // Fonction pour vérifier si un numéro de dossier existe déjà pour un arpenteur
  const numeroDossierExiste = (arpenteur, numero, excludePriseMandatId = null) => {
    // Vérifier dans les dossiers existants
    const existeDansDossiers = dossiers.some(d => 
      d.arpenteur_geometre === arpenteur && d.numero_dossier === numero
    );
    
    // Vérifier dans les prises de mandat "Mandats à ouvrir"
    const existeDansPriseMandats = priseMandats.some(p => 
      p.arpenteur_geometre === arpenteur && 
      p.statut === "Mandats à ouvrir" && 
      p.numero_dossier === numero &&
      p.id !== excludePriseMandatId
    );
    
    return existeDansDossiers || existeDansPriseMandats;
  };

  // Détecter si un dossier_id est passé dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dossierIdFromUrl = urlParams.get('dossier_id');
    
    if (dossierIdFromUrl && dossiers.length > 0) {
      const dossier = dossiers.find(d => d.id === dossierIdFromUrl);
      if (dossier) {
        handleView(dossier);
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [dossiers]);

  const createPriseMandatMutation = useMutation({
    mutationFn: async (data) => {
      // Préparer les commentaires à inclure dans l'entité
      const commentsToSave = commentairesTemporaires.map(c => ({
        contenu: c.contenu,
        utilisateur_email: c.utilisateur_email,
        utilisateur_nom: c.utilisateur_nom,
        date: c.created_date || new Date().toISOString()
      }));

      const priseMandatData = {
        arpenteur_geometre: data.arpenteur_geometre,
        place_affaire: data.place_affaire,
        numero_dossier: data.numero_dossier,
        date_ouverture: data.date_ouverture,
        clients_ids: data.clients_ids,
        notaires_ids: data.notaires_ids,
        courtiers_ids: data.courtiers_ids,
        compagnies_ids: data.compagnies_ids,
        client_info: data.client_info,
        professionnel_info: data.professionnel_info,
        adresse_travaux: data.adresse_travaux,
        mandats: data.mandats,
        echeance_souhaitee: data.echeance_souhaitee,
        date_signature: data.date_signature,
        date_debut_travaux: data.date_debut_travaux,
        date_livraison: data.date_livraison,
        urgence_percue: data.urgence_percue,
        statut: data.statut,
        commentaires: commentsToSave,
        historique: data.historique
      };

      return await base44.entities.PriseMandat.create(priseMandatData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
      setIsDialogOpen(false);
      resetFullForm();
      setCommentairesTemporaires([]);
    },
  });

  const deletePriseMandatMutation = useMutation({
    mutationFn: (id) => base44.entities.PriseMandat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
    },
  });

  const [editingPriseMandat, setEditingPriseMandat] = useState(null);

  const handleEditPriseMandat = async (pm) => {
    // Vérifier si le mandat est verrouillé par quelqu'un d'autre
    if (pm.locked_by && pm.locked_by !== user?.email) {
      const lockedUser = users.find(u => u.email === pm.locked_by);
      setIsLocked(true);
      setLockedBy(lockedUser?.full_name || pm.locked_by);
    } else {
      setIsLocked(false);
      setLockedBy("");
      
      // Verrouiller le mandat pour l'utilisateur actuel
      await base44.entities.PriseMandat.update(pm.id, {
        ...pm,
        locked_by: user?.email,
        locked_at: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
    }
    
    setEditingPriseMandat(pm);
    setInitialPriseMandatData(JSON.parse(JSON.stringify(pm)));
    setHasFormChanges(false);
    
    // Charger l'historique si présent
    setHistorique(pm.historique || []);
    
    // Utiliser le numéro de dossier existant si disponible
    let numeroDossier = pm.numero_dossier || "";
    let dateOuverture = pm.date_ouverture || new Date().toISOString().split('T')[0];
    
    // Remplir le formulaire avec les données existantes
    setFormData({
      ...formData,
      arpenteur_geometre: pm.arpenteur_geometre || "",
      placeAffaire: pm.place_affaire || "",
      clients_ids: pm.clients_ids || [],
      notaires_ids: pm.notaires_ids || [],
      courtiers_ids: pm.courtiers_ids || [],
      compagnies_ids: pm.compagnies_ids || [],
      statut: pm.statut || "Nouveau mandat/Demande d'information",
      numero_dossier: numeroDossier,
      date_ouverture: dateOuverture
    });
    
    // Charger les infos professionnelles si présentes
    setProfessionnelInfo({
      notaire: "",
      courtier: "",
      compagnie: ""
    });
    
    setWorkAddress(pm.adresse_travaux || {
      numeros_civiques: [""],
      rue: "",
      ville: "",
      province: "QC",
      code_postal: "",
      numero_lot: ""
    });
    
    setClientInfo(pm.client_info || {
      prenom: "",
      nom: "",
      telephone: "",
      type_telephone: "Cellulaire",
      courriel: ""
    });
    
    setProfessionnelInfo(pm.professionnel_info || {
      notaire: "",
      courtier: "",
      compagnie: ""
    });
    
    // Reconstruire les mandatsInfo à partir des mandats stockés
    const mandatsFromDb = (pm.mandats || []).map(m => ({
      type_mandat: m.type_mandat || "",
      echeance_souhaitee: pm.echeance_souhaitee || "",
      date_signature: pm.date_signature || "",
      date_debut_travaux: pm.date_debut_travaux || "",
      date_livraison: pm.date_livraison || "",
      urgence_percue: pm.urgence_percue || "",
      prix_estime: m.prix_estime || 0,
      prix_premier_lot: m.prix_premier_lot || 0,
      prix_autres_lots: m.prix_autres_lots || 0,
      rabais: m.rabais || 0,
      taxes_incluses: m.taxes_incluses || false
    }));
    
    setMandatsInfo(mandatsFromDb.length > 0 ? mandatsFromDb : [{
      type_mandat: "",
      echeance_souhaitee: pm.echeance_souhaitee || "",
      date_signature: pm.date_signature || "",
      date_debut_travaux: pm.date_debut_travaux || "",
      date_livraison: pm.date_livraison || "",
      urgence_percue: pm.urgence_percue || "",
      prix_estime: 0,
      prix_premier_lot: 0,
      prix_autres_lots: 0,
      rabais: 0,
      taxes_incluses: false
    }]);
    
    setCommentairesTemporaires(pm.commentaires?.map((c, idx) => ({
      id: `temp-${idx}`,
      contenu: c.contenu,
      utilisateur_email: c.utilisateur_email,
      utilisateur_nom: c.utilisateur_nom,
      created_date: c.date
    })) || []);
    
    // Collapser toutes les sections en mode modification
    setClientStepCollapsed(true);
    setAddressStepCollapsed(true);
    setMandatStepCollapsed(true);
    setTarificationStepCollapsed(true);
    setDocumentsStepCollapsed(true);
    
    setIsDialogOpen(true);
  };

  const updatePriseMandatMutation = useMutation({
    mutationFn: async ({ id, data, autoSave = false }) => {
      const commentsToSave = commentairesTemporaires.map(c => ({
        contenu: c.contenu,
        utilisateur_email: c.utilisateur_email,
        utilisateur_nom: c.utilisateur_nom,
        date: c.created_date || new Date().toISOString()
      }));

      const priseMandatData = {
        arpenteur_geometre: data.arpenteur_geometre,
        place_affaire: data.place_affaire,
        numero_dossier: data.numero_dossier,
        date_ouverture: data.date_ouverture,
        clients_ids: data.clients_ids,
        notaires_ids: data.notaires_ids,
        courtiers_ids: data.courtiers_ids,
        compagnies_ids: data.compagnies_ids,
        client_info: data.client_info,
        professionnel_info: data.professionnel_info,
        adresse_travaux: data.adresse_travaux,
        mandats: data.mandats,
        echeance_souhaitee: data.echeance_souhaitee,
        date_signature: data.date_signature,
        date_debut_travaux: data.date_debut_travaux,
        date_livraison: data.date_livraison,
        urgence_percue: data.urgence_percue,
        statut: data.statut,
        commentaires: commentsToSave,
        historique: data.historique,
        locked_by: autoSave ? data.locked_by : null,
        locked_at: autoSave ? data.locked_at : null
      };

      return await base44.entities.PriseMandat.update(id, priseMandatData);
    },
    onSuccess: (updatedPriseMandat, variables) => {
      if (!variables.autoSave) {
        // Sauvegarde manuelle - fermer le dialog et rafraîchir
        queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
        setIsDialogOpen(false);
        resetFullForm();
        setCommentairesTemporaires([]);
        setEditingPriseMandat(null);
        setIsLocked(false);
        setLockedBy("");
        setHasFormChanges(false);
        setInitialPriseMandatData(null);
      } else {
        // Auto-save - NE PAS rafraîchir, juste mettre à jour les états locaux
        setEditingPriseMandat(updatedPriseMandat);
        setInitialPriseMandatData(JSON.parse(JSON.stringify(updatedPriseMandat)));
        setHasFormChanges(false);
      }
    },
  });

  // Détecter les changements et sauvegarder automatiquement
  useEffect(() => {
    if (initialPriseMandatData && editingPriseMandat && !isLocked) {
      const currentData = {
        arpenteur_geometre: formData.arpenteur_geometre,
        place_affaire: formData.placeAffaire,
        clients_ids: formData.clients_ids,
        notaires_ids: formData.notaires_ids,
        courtiers_ids: formData.courtiers_ids,
        compagnies_ids: formData.compagnies_ids,
        client_info: clientInfo,
        professionnel_info: professionnelInfo,
        adresse_travaux: workAddress,
        mandats: mandatsInfo,
        statut: formData.statut,
        numero_dossier: formData.numero_dossier,
        date_ouverture: formData.date_ouverture
      };
      
      const initialData = {
        arpenteur_geometre: initialPriseMandatData.arpenteur_geometre,
        place_affaire: initialPriseMandatData.place_affaire || "",
        clients_ids: initialPriseMandatData.clients_ids || [],
        notaires_ids: initialPriseMandatData.notaires_ids || [],
        courtiers_ids: initialPriseMandatData.courtiers_ids || [],
        compagnies_ids: initialPriseMandatData.compagnies_ids || [],
        client_info: initialPriseMandatData.client_info || {},
        professionnel_info: initialPriseMandatData.professionnel_info || {},
        adresse_travaux: initialPriseMandatData.adresse_travaux || {},
        mandats: (initialPriseMandatData.mandats || []).map(m => ({
          type_mandat: m.type_mandat || "",
          echeance_souhaitee: initialPriseMandatData.echeance_souhaitee || "",
          date_signature: initialPriseMandatData.date_signature || "",
          date_debut_travaux: initialPriseMandatData.date_debut_travaux || "",
          date_livraison: initialPriseMandatData.date_livraison || "",
          urgence_percue: initialPriseMandatData.urgence_percue || "",
          prix_estime: m.prix_estime || 0,
          prix_premier_lot: m.prix_premier_lot || 0,
          prix_autres_lots: m.prix_autres_lots || 0,
          rabais: m.rabais || 0,
          taxes_incluses: m.taxes_incluses || false
        })),
        statut: initialPriseMandatData.statut,
        numero_dossier: initialPriseMandatData.numero_dossier || "",
        date_ouverture: initialPriseMandatData.date_ouverture || ""
      };
      
      const hasChanges = JSON.stringify(currentData) !== JSON.stringify(initialData);
      setHasFormChanges(hasChanges);

      // Sauvegarder automatiquement si changements détectés
      if (hasChanges) {
        const timer = setTimeout(async () => {
          // Préparer les mandats
          const mandatsToSave = mandatsInfo
            .filter(m => m.type_mandat)
            .map(m => ({
              type_mandat: m.type_mandat,
              prix_estime: m.prix_estime || 0,
              prix_premier_lot: m.prix_premier_lot || 0,
              prix_autres_lots: m.prix_autres_lots || 0,
              rabais: m.rabais || 0,
              taxes_incluses: m.taxes_incluses || false
            }));

          const dataToSubmit = {
            arpenteur_geometre: formData.arpenteur_geometre,
            place_affaire: formData.placeAffaire,
            numero_dossier: formData.numero_dossier,
            date_ouverture: formData.date_ouverture,
            clients_ids: formData.clients_ids,
            notaires_ids: formData.notaires_ids || [],
            courtiers_ids: formData.courtiers_ids || [],
            compagnies_ids: formData.compagnies_ids || [],
            client_info: clientInfo,
            professionnel_info: professionnelInfo,
            adresse_travaux: workAddress,
            mandats: mandatsToSave,
            echeance_souhaitee: mandatsInfo[0]?.echeance_souhaitee || "",
            date_signature: mandatsInfo[0]?.date_signature || "",
            date_debut_travaux: mandatsInfo[0]?.date_debut_travaux || "",
            date_livraison: mandatsInfo[0]?.date_livraison || "",
            urgence_percue: mandatsInfo[0]?.urgence_percue || "",
            statut: formData.statut,
            locked_by: user?.email,
            locked_at: editingPriseMandat.locked_at
          };

          // Créer les entrées d'historique
          const newHistoriqueEntries = [];
          const now = new Date().toISOString();
          const userName = user?.full_name || "Utilisateur";
          const userEmail = user?.email || "";

          if (editingPriseMandat.statut !== formData.statut) {
            newHistoriqueEntries.push({
              action: "Changement de statut",
              details: `${editingPriseMandat.statut} → ${formData.statut}`,
              utilisateur_nom: userName,
              utilisateur_email: userEmail,
              date: now
            });
          }

          if (editingPriseMandat.arpenteur_geometre !== formData.arpenteur_geometre) {
            newHistoriqueEntries.push({
              action: "Changement d'arpenteur-géomètre",
              details: `${editingPriseMandat.arpenteur_geometre || 'Non défini'} → ${formData.arpenteur_geometre}`,
              utilisateur_nom: userName,
              utilisateur_email: userEmail,
              date: now
            });
          }

          const updatedHistorique = [...newHistoriqueEntries, ...historique];

          // Sauvegarder automatiquement
          try {
            await updatePriseMandatMutation.mutateAsync({ 
              id: editingPriseMandat.id, 
              data: { ...dataToSubmit, historique: updatedHistorique },
              autoSave: true
            });
          } catch (error) {
            console.error("Erreur sauvegarde auto:", error);
          }
        }, 500); // Délai de 500ms pour éviter trop de requêtes

        return () => clearTimeout(timer);
      }
    }
  }, [formData, clientInfo, professionnelInfo, workAddress, mandatsInfo, initialPriseMandatData, editingPriseMandat]);

  const createDossierMutation = useMutation({
    mutationFn: async ({ dossierData, commentairesToCreate = null }) => {
      const newDossier = await base44.entities.Dossier.create(dossierData);

      // Utiliser les commentaires passés en paramètre ou les commentaires temporaires par défaut
      const commentsToUse = commentairesToCreate !== null ? commentairesToCreate : commentairesTemporaires;
      
      // Créer les commentaires temporaires si présents
      if (commentsToUse.length > 0) {
        const commentairePromises = commentsToUse.map(comment =>
          base44.entities.CommentaireDossier.create({
            dossier_id: newDossier.id,
            contenu: comment.contenu,
            utilisateur_email: comment.utilisateur_email,
            utilisateur_nom: comment.utilisateur_nom
          })
        );
        await Promise.all(commentairePromises);
      }

      // Créer une notification si un utilisateur est assigné pour un retour d'appel
      if (dossierData.statut === "Retour d'appel" && dossierData.utilisateur_assigne) {
        const assignedUser = users.find(u => u.email === dossierData.utilisateur_assigne);
        if (assignedUser) {
          const clientsNames = getClientsNames(dossierData.clients_ids);
          await base44.entities.Notification.create({
            utilisateur_email: dossierData.utilisateur_assigne,
            titre: "Nouveau retour d'appel assigné",
            message: `Un retour d'appel vous a été assigné${clientsNames ? ` pour ${clientsNames}` : ''}.`,
            type: "retour_appel",
            dossier_id: newDossier.id,
            lue: false
          });
        }
      }

      // Créer un compteur SEULEMENT pour le statut "Nouveau mandat/Demande d'information" ou "Mandats à ouvrir"
      if (dossierData.statut === "Nouveau mandat/Demande d'information" || dossierData.statut === "Mandats à ouvrir") {
        const nbMandats = newDossier.mandats?.length || 1;
        const compteurPromises = [];
        for (let i = 0; i < nbMandats; i++) {
          compteurPromises.push(
            base44.entities.CompteurMandat.create({
              dossier_id: newDossier.id,
              arpenteur_geometre: dossierData.arpenteur_geometre,
              type_mandat: newDossier.mandats?.[i]?.type_mandat || "",
              date_creation: new Date().toISOString().split('T')[0]
            })
          );
        }
        await Promise.all(compteurPromises);
      }

      return newDossier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['compteursMandats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Invalidate notifications query
      setIsDialogOpen(false);
      resetForm();
      // Clear temporary comments after successful submission
      setCommentairesTemporaires([]);
    },
  });

  const updateDossierMutation = useMutation({
    mutationFn: async ({ id, dossierData }) => {
      const oldDossier = dossiers.find(d => d.id === id);
      const updatedDossier = await base44.entities.Dossier.update(id, dossierData);

      // Créer une notification si un nouvel utilisateur est assigné pour un retour d'appel
      if (dossierData.statut === "Retour d'appel" &&
          dossierData.utilisateur_assigne &&
          oldDossier?.utilisateur_assigne !== dossierData.utilisateur_assigne) {
        const assignedUser = users.find(u => u.email === dossierData.utilisateur_assigne);
        if (assignedUser) {
          const clientsNames = getClientsNames(dossierData.clients_ids);
          await base44.entities.Notification.create({
            utilisateur_email: dossierData.utilisateur_assigne,
            titre: "Nouveau retour d'appel assigné",
            message: `Un retour d'appel vous a été assigné${clientsNames ? ` pour ${clientsNames}` : ''}.`,
            type: "retour_appel",
            dossier_id: updatedDossier.id,
            lue: false
          });
        }
      }

      // Créer des notifications pour les utilisateurs nouvellement assignés aux mandats
      if (oldDossier && dossierData.mandats) {
        for (let i = 0; i < dossierData.mandats.length; i++) {
          const newMandat = dossierData.mandats[i];
          const oldMandat = oldDossier.mandats?.[i];
          
          // Si un utilisateur est assigné au mandat et qu'il est différent de l'ancien
          if (newMandat.utilisateur_assigne && 
              newMandat.utilisateur_assigne !== oldMandat?.utilisateur_assigne &&
              newMandat.type_mandat) {
            const clientsNames = getClientsNames(dossierData.clients_ids);
            const numeroDossier = dossierData.numero_dossier 
              ? `${getArpenteurInitials(dossierData.arpenteur_geometre)}${dossierData.numero_dossier}`
              : getArpenteurInitials(dossierData.arpenteur_geometre).slice(0, -1);
            
            await base44.entities.Notification.create({
              utilisateur_email: newMandat.utilisateur_assigne,
              titre: "Nouveau mandat assigné",
              message: `Un mandat "${newMandat.type_mandat}"${numeroDossier ? ` du dossier ${numeroDossier}` : ''}${clientsNames ? ` - ${clientsNames}` : ''} vous a été assigné.`,
              type: "dossier",
              dossier_id: id,
              lue: false
            });
          }
        }
      }

      // Créer compteur SEULEMENT si on passe au statut "Nouveau mandat/Demande d'information" ou "Mandats à ouvrir"
      // et que l'ancien statut n'était pas l'un de ceux-là
      const oldStatusIsCounted = oldDossier?.statut === "Nouveau mandat/Demande d'information" ||
                                oldDossier?.statut === "Demande d'information" ||
                                oldDossier?.statut === "Nouveau mandat" ||
                                oldDossier?.statut === "Mandats à ouvrir";
      const newStatusIsCounted = dossierData.statut === "Nouveau mandat/Demande d'information" ||
                                 dossierData.statut === "Mandats à ouvrir";

      if (newStatusIsCounted && !oldStatusIsCounted) {
        const nbMandats = updatedDossier.mandats?.length || 1;
        const compteurPromises = [];
        for (let i = 0; i < nbMandats; i++) {
          compteurPromises.push(
            base44.entities.CompteurMandat.create({
              dossier_id: updatedDossier.id,
              arpenteur_geometre: dossierData.arpenteur_geometre,
              type_mandat: updatedDossier.mandats?.[i]?.type_mandat || "",
              date_creation: new Date().toISOString().split('T')[0]
            })
          );
        }
        await Promise.all(compteurPromises);
      }

      return updatedDossier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['compteursMandats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Invalidate notifications query
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteDossierMutation = useMutation({
    mutationFn: (id) => base44.entities.Dossier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });

  // Client mutations removed as they will be handled within ClientFormDialog
  // const createClientMutation = useMutation(...)
  // const updateClientMutation = useMutation(...)

  const createLotMutation = useMutation({
    mutationFn: async (lotData) => {
      const newLot = await base44.entities.Lot.create(lotData);
      
      // Créer les commentaires temporaires si présents
      if (commentairesTemporairesLot.length > 0) {
        const commentairePromises = commentairesTemporairesLot.map(comment =>
          base44.entities.CommentaireLot.create({
            lot_id: newLot.id,
            contenu: comment.contenu,
            utilisateur_email: comment.utilisateur_email,
            utilisateur_nom: comment.utilisateur_nom
          })
        );
        await Promise.all(commentairePromises);
      }
      
      // Créer une entrée d'historique pour la création
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || "",
        utilisateur_nom: user?.full_name || "Système",
        action: "Création",
        entite: "Lot",
        entite_id: newLot.id,
        details: `Lot ${lotData.numero_lot} créé`
      });
      
      return newLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsNewLotDialogOpen(false);
      resetLotForm();
      setCommentairesTemporairesLot([]);
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: async ({ id, lotData }) => {
      // Récupérer l'ancien lot pour comparer
      const oldLot = lots.find(l => l.id === id);
      
      const updatedLot = await base44.entities.Lot.update(id, lotData);
      
      // Déterminer les changements
      const changes = [];
      if (oldLot) {
        if (oldLot.numero_lot !== lotData.numero_lot) {
          changes.push(`Numéro de lot: ${oldLot.numero_lot} → ${lotData.numero_lot}`);
        }
        if (oldLot.circonscription_fonciere !== lotData.circonscription_fonciere) {
          changes.push(`Circonscription: ${oldLot.circonscription_fonciere} → ${lotData.circonscription_fonciere}`);
        }
        if (oldLot.cadastre !== lotData.cadastre) {
          changes.push(`Cadastre: ${oldLot.cadastre || '-'} → ${lotData.cadastre || '-'}`);
        }
        if (oldLot.rang !== lotData.rang) {
          changes.push(`Rang: ${oldLot.rang || '-'} → ${lotData.rang || '-'}`);
        }
        
        // Comparer les types d'opération de manière détaillée
        const oldTypes = oldLot.types_operation || [];
        const newTypes = lotData.types_operation || [];
        
        // Détecter les ajouts
        if (newTypes.length > oldTypes.length) {
          const addedCount = newTypes.length - oldTypes.length;
          const lastAdded = newTypes[newTypes.length - 1];
          if (lastAdded) {
            changes.push(`Ajout type d'opération: ${lastAdded.type_operation || 'N/A'} (${lastAdded.date_bpd || 'sans date'})`);
          } else if (addedCount > 1) {
            changes.push(`${addedCount} types d'opération ajoutés`);
          }
        }
        
        // Détecter les suppressions
        if (newTypes.length < oldTypes.length) {
          const removedCount = oldTypes.length - newTypes.length;
          changes.push(`${removedCount} type(s) d'opération supprimé(s)`);
        }
        
        // Détecter les modifications (même nombre mais contenus différents)
        if (newTypes.length === oldTypes.length && newTypes.length > 0) {
          for (let i = 0; i < newTypes.length; i++) {
            const oldType = oldTypes[i];
            const newType = newTypes[i];
            
            if (oldType.type_operation !== newType.type_operation) {
              changes.push(`Type d'opération modifié: ${oldType.type_operation || 'N/A'} → ${newType.type_operation || 'N/A'}`);
            }
            if (oldType.date_bpd !== newType.date_bpd) {
              changes.push(`Date BPD modifiée: ${oldType.date_bpd || 'sans date'} → ${newType.date_bpd || 'sans date'}`);
            }
            
            // Comparer les concordances
            const oldConcordances = oldType.concordances_anterieures || [];
            const newConcordances = newType.concordances_anterieures || [];
            
            if (oldConcordances.length !== newConcordances.length) {
              changes.push(`Concordances modifiées: ${oldConcordances.length} → ${newConcordances.length}`);
            } else if (JSON.stringify(oldConcordances) !== JSON.stringify(newConcordances)) {
              changes.push(`Concordances modifiées pour ${newType.type_operation || 'type d\'opération'}`);
            }
          }
        }
      }
      
      const details = changes.length > 0 
        ? changes.join(' • ')
        : `Lot ${lotData.numero_lot} modifié`;
      
      // Créer une entrée dans l'historique
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || '',
        utilisateur_nom: user?.full_name || '',
        action: 'Modification',
        entite: 'Lot',
        entite_id: id,
        details
      });
      
      return updatedLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsNewLotDialogOpen(false);
      resetLotForm();
    },
  });

  const clientsReguliers = clients.filter(c => c.type_client === 'Client' || !c.type_client);
  const notaires = clients.filter(c => c.type_client === 'Notaire');
  const courtiers = clients.filter(c => c.type_client === 'Courtier immobilier');

  const getClientById = (id) => clients.find(c => c.id === id);
  const getLotById = (numeroLot) => lots.find(l => l.id === numeroLot); // Changed to id

  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
      parts.push(addr.numeros_civiques.filter(n => n).join(', '));
    }
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    if (addr.province) parts.push(addr.province);
    if (addr.code_postal) parts.push(addr.code_postal);
    return parts.filter(p => p).join(', ');
  };

  // Helper function to get client names - MOVED UP BEFORE USE
  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    const names = clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    });
    
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(" & ");
    return names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
  };

  // Helper function to get the first work address
  const getFirstAdresseTravaux = (mandats) => {
    if (!mandats || mandats.length === 0 || !mandats[0].adresse_travaux) return "-";
    return formatAdresse(mandats[0].adresse_travaux);
  };

  // Function to map old statuses to new combined status for form display
  const mapOldStatusToCombined = (status) => {
    if (status === "Demande d'information" || status === "Nouveau mandat") {
      return "Nouveau mandat/Demande d'information";
    }
    return status;
  };

  // NEW FUNCTION: Load data from reference dossier
  const loadDossierReference = (dossierId) => {
    const dossier = dossiers.find(d => d.id === dossierId);
    if (!dossier) return;

    setFormData({
      numero_dossier: dossier.numero_dossier || "",
      arpenteur_geometre: dossier.arpenteur_geometre || "",
      date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
      statut: "Retour d'appel",
      ttl: dossier.ttl || "Non",
      utilisateur_assigne: formData.utilisateur_assigne || "",
      clients_ids: dossier.clients_ids || [],
      clients_texte: dossier.clients_texte || "",
      notaires_ids: dossier.notaires_ids || [],
      notaires_texte: dossier.notaires_texte || "",
      courtiers_ids: dossier.courtiers_ids || [],
      courtiers_texte: dossier.courtiers_texte || "",
      mandats: dossier.mandats?.map(m => ({
        ...m,
        date_ouverture: m.date_ouverture || "",
        adresse_travaux: m.adresse_travaux
          ? (typeof m.adresse_travaux === 'string'
            ? {
                rue: m.adresse_travaux,
                numeros_civiques: [],
                ville: "",
                code_postal: "",
                province: ""
              }
            : m.adresse_travaux
          )
          : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
        lots: m.lots || [],
        prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0,
        rabais: m.rabais !== undefined ? m.rabais : 0,
        taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
        date_livraison: "",
        date_signature: "",
        date_debut_travaux: "",
        tache_actuelle: "",
        utilisateur_assigne: "" // New mandat level field, initialize empty for reference loading
      })) || [],
      description: dossier.description || ""
    });
    setActiveTabMandat("0");
    setDossierReferenceId(dossierId);
    setDossierSearchForReference("");
  };
  // END NEW FUNCTION

  // Filtrer les dossiers pour exclure le statut "Rejeté"
  const dossiersNonRejetes = dossiers.filter(d => d.statut !== "Rejeté");

  const retourAppelDossiers = dossiersNonRejetes.filter(d => d.statut === "Retour d'appel");
  const nouveauMandatDossiers = dossiersNonRejetes.filter(d => d.statut === "Nouveau mandat/Demande d'information" || d.statut === "Demande d'information" || d.statut === "Nouveau mandat");
  const mandatNonOctroyeDossiers = dossiersNonRejetes.filter(d => d.statut === "Mandat non octroyé");
  const soumissionDossiers = dossiersNonRejetes.filter(d => d.statut === "Soumission" || d.statut === "Mandats à ouvrir"); // Combined soumission and mandats à ouvrir

  // Calcul des périodes
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  // Périodes précédentes pour calculer le % de variation
  const startOfPreviousDay = new Date(startOfDay);
  startOfPreviousDay.setDate(startOfPreviousDay.getDate() - 1);

  const startOfPreviousWeek = new Date(startOfWeek);
  startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);

  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  endOfPreviousMonth.setHours(23, 59, 59, 999);

  const startOfPreviousYear = new Date(now.getFullYear() - 1, 0, 1);
  const endOfPreviousYear = new Date(now.getFullYear() - 1, 11, 31);
  endOfPreviousYear.setHours(23, 59, 59, 999);

  const getCountsByPeriodWithComparison = (list, dateKey) => {
    const byDay = list.filter(item => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfDay;
    }).length;

    const byWeek = list.filter(item => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfWeek;
    }).length;

    const byMonth = list.filter(item => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfMonth;
    }).length;

    const byYear = list.filter(item => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfYear;
    }).length;

    const previousDay = list.filter(item => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousDay && date < startOfDay;
    }).length;

    const previousWeek = list.filter(item => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousWeek && date < startOfWeek;
    }).length;

    const previousMonth = list.filter(item => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousMonth && date <= endOfPreviousMonth;
    }).length;

    const previousYear = list.filter(item => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousYear && date <= endOfPreviousYear;
    }).length;

    const calculatePercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      byDay,
      byWeek,
      byMonth,
      byYear,
      percentages: {
        day: calculatePercentage(byDay, previousDay),
        week: calculatePercentage(byWeek, previousWeek),
        month: calculatePercentage(byMonth, previousMonth),
        year: calculatePercentage(byYear, previousYear)
      }
    };
  };

  const getCountsByArpenteur = (dossiersList) => {
    const counts = {};
    ARPENTEURS.forEach(arp => {
      counts[arp] = dossiersList.filter(d => d.arpenteur_geometre === arp).length;
    });
    return counts;
  };

  const retourAppelStats = {
    total: retourAppelDossiers.length,
    ...getCountsByPeriodWithComparison(retourAppelDossiers, 'created_date'),
    byArpenteur: getCountsByArpenteur(retourAppelDossiers)
  };

  const nouveauMandatStats = getCountsByPeriodWithComparison(compteurs, 'date_creation');

  const soumissionStats = {
    total: soumissionDossiers.length,
    ...getCountsByPeriodWithComparison(soumissionDossiers, 'created_date'),
    byArpenteur: getCountsByArpenteur(soumissionDossiers)
  };

  // New filtering logic
  const applyFilters = (priseMandatsList) => {
    return priseMandatsList.filter(pm => {
      const searchLower = searchTerm.toLowerCase();
      const clientName = pm.client_info?.prenom || pm.client_info?.nom 
        ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim().toLowerCase()
        : getClientsNames(pm.clients_ids).toLowerCase();
      const matchesSearch = (
        pm.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
        clientName.includes(searchLower) ||
        formatAdresse(pm.adresse_travaux)?.toLowerCase().includes(searchLower) ||
        pm.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
      );

      const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(pm.arpenteur_geometre);
      const matchesVille = filterVille.length === 0 || filterVille.includes(pm.adresse_travaux?.ville);
      const matchesTypeMandat = filterTypeMandat.length === 0 || pm.mandats?.some(m => filterTypeMandat.includes(m.type_mandat));
      const matchesUrgence = filterUrgence.length === 0 || filterUrgence.includes(pm.urgence_percue);

      const pmDate = new Date(pm.created_date);
      const matchesDateStart = filterDateStart === "" || pmDate >= new Date(filterDateStart);
      const matchesDateEnd = filterDateEnd === "" || pmDate <= new Date(filterDateEnd + "T23:59:59");

      return matchesSearch && matchesArpenteur && matchesVille && matchesTypeMandat && matchesUrgence && matchesDateStart && matchesDateEnd;
    });
  };

  const filteredRetourAppel = applyFilters(retourAppelDossiers);
  const filteredMandatNonOctroye = applyFilters(mandatNonOctroyeDossiers);
  const filteredSoumission = applyFilters(soumissionDossiers); // Now includes "Mandats à ouvrir"
  const filteredNouveauMandat = applyFilters(nouveauMandatDossiers);

  // NEW: Filter dossiers for reference selector
  const filteredDossiersForReference = dossiers.filter(dossier => {
    const searchLower = dossierSearchForReference.toLowerCase();
    const fullNumber = (dossier.arpenteur_geometre ? getArpenteurInitials(dossier.arpenteur_geometre) : "") + (dossier.numero_dossier || "");
    const clientsNames = getClientsNames(dossier.clients_ids);
    return (
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      dossier.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
    );
  });
  // END NEW

  const filteredClientsForSelector = clientsReguliers.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    c.courriels?.some(courriel => courriel.courriel?.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
    c.telephones?.some(tel => tel.telephone?.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
    (c.adresses?.length > 0 && formatAdresse(c.adresses.find(a => a.actuelle || a.actuel))?.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  const filteredNotairesForSelector = notaires.filter(n =>
    `${n.prenom} ${n.nom}`.toLowerCase().includes(notaireSearchTerm.toLowerCase()) ||
    n.courriels?.some(courriel => courriel.courriel?.toLowerCase().includes(notaireSearchTerm.toLowerCase())) ||
    n.telephones?.some(tel => tel.telephone?.toLowerCase().includes(notaireSearchTerm.toLowerCase())) ||
    (n.adresses?.length > 0 && formatAdresse(n.adresses.find(a => a.actuelle || a.actuel))?.toLowerCase().includes(notaireSearchTerm.toLowerCase()))
  );

  const filteredCourtiersForSelector = courtiers.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(courtierSearchTerm.toLowerCase()) ||
    c.courriels?.some(courcourriel => courcourriel.courriel?.toLowerCase().includes(courtierSearchTerm.toLowerCase())) ||
    c.telephones?.some(tel => tel.telephone?.toLowerCase().includes(courtierSearchTerm.toLowerCase())) ||
    (c.adresses?.length > 0 && formatAdresse(c.adresses.find(a => a.actuelle || a.actel))?.toLowerCase().includes(courtierSearchTerm.toLowerCase()))
  );

  const filteredLotsForSelector = lots.filter(lot => {
    const matchesSearch = lot.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
      lot.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
      lot.circonscription_fonciere?.toLowerCase().includes(lotSearchTerm.toLowerCase());

    const matchesCirconscription = lotCirconscriptionFilter === "all" ||
      lot.circonscription_fonciere === lotCirconscriptionFilter;

    const matchesCadastre = lotCadastreFilter === "all" || lot.cadastre === lotCadastreFilter;

    return matchesSearch && matchesCirconscription && matchesCadastre;
  });

  const openLotSelector = (mandatIndex) => {
    setCurrentMandatIndex(mandatIndex);
    setIsLotSelectorOpen(true);
  };

  const addLotToCurrentMandat = (lotId) => {
    if (currentMandatIndex !== null) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === currentMandatIndex ? {
            ...m,
            lots: m.lots.includes(lotId) ? m.lots.filter(id => id !== lotId) : [...(m.lots || []), lotId]
          } : m
        )
      }));
    }
  };

  const addHistoriqueEntry = (action, details = "") => {
    const newEntry = {
      action,
      details,
      utilisateur_nom: user?.full_name || "Utilisateur",
      utilisateur_email: user?.email || "",
      date: new Date().toISOString()
    };
    setHistorique(prev => [newEntry, ...prev]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation: arpenteur requis
    if (!formData.arpenteur_geometre) {
      setShowArpenteurRequiredDialog(true);
      return;
    }

    // Validation: vérifier que le numéro de dossier n'existe pas déjà (si statut "Mandats à ouvrir")
    if (formData.statut === "Mandats à ouvrir" && formData.numero_dossier) {
      if (numeroDossierExiste(formData.arpenteur_geometre, formData.numero_dossier, editingPriseMandat?.id)) {
        alert(`Le numéro de dossier ${formData.numero_dossier} existe déjà pour ${formData.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
        return;
      }
    }

    // Préparer les mandats avec leur tarification
    const mandatsToSave = mandatsInfo
      .filter(m => m.type_mandat)
      .map(m => ({
        type_mandat: m.type_mandat,
        prix_estime: m.prix_estime || 0,
        prix_premier_lot: m.prix_premier_lot || 0,
        prix_autres_lots: m.prix_autres_lots || 0,
        rabais: m.rabais || 0,
        taxes_incluses: m.taxes_incluses || false
      }));

    const dataToSubmit = {
      arpenteur_geometre: formData.arpenteur_geometre,
      place_affaire: formData.placeAffaire,
      numero_dossier: formData.numero_dossier,
      date_ouverture: formData.date_ouverture,
      clients_ids: formData.clients_ids,
      notaires_ids: formData.notaires_ids || [],
      courtiers_ids: formData.courtiers_ids || [],
      compagnies_ids: formData.compagnies_ids || [],
      client_info: clientInfo,
      professionnel_info: professionnelInfo,
      adresse_travaux: workAddress,
      mandats: mandatsToSave,
      echeance_souhaitee: mandatsInfo[0]?.echeance_souhaitee || "",
      date_signature: mandatsInfo[0]?.date_signature || "",
      date_debut_travaux: mandatsInfo[0]?.date_debut_travaux || "",
      date_livraison: mandatsInfo[0]?.date_livraison || "",
      urgence_percue: mandatsInfo[0]?.urgence_percue || "",
      statut: formData.statut
    };

    if (editingPriseMandat) {
      // Détecter les changements et créer des entrées d'historique
      const newHistoriqueEntries = [];
      const now = new Date().toISOString();
      const userName = user?.full_name || "Utilisateur";
      const userEmail = user?.email || "";

      // Vérifier changement de statut
      if (editingPriseMandat.statut !== formData.statut) {
        newHistoriqueEntries.push({
          action: "Changement de statut",
          details: `${editingPriseMandat.statut} → ${formData.statut}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement d'arpenteur
      if (editingPriseMandat.arpenteur_geometre !== formData.arpenteur_geometre) {
        newHistoriqueEntries.push({
          action: "Changement d'arpenteur-géomètre",
          details: `${editingPriseMandat.arpenteur_geometre || 'Non défini'} → ${formData.arpenteur_geometre}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement d'urgence
      if (editingPriseMandat.urgence_percue !== (mandatsInfo[0]?.urgence_percue || "")) {
        newHistoriqueEntries.push({
          action: "Changement d'urgence",
          details: `${editingPriseMandat.urgence_percue || 'Non définie'} → ${mandatsInfo[0]?.urgence_percue || 'Non définie'}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de client info (déclaré avant pour réutilisation)
      const oldClientName = `${editingPriseMandat.client_info?.prenom || ''} ${editingPriseMandat.client_info?.nom || ''}`.trim();
      const newClientName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
      const oldAdresse = formatAdresse(editingPriseMandat.adresse_travaux);
      const newAdresse = formatAdresse(workAddress);
      if (oldClientName !== newClientName && newClientName) {
        newHistoriqueEntries.push({
          action: "Modification des informations client",
          details: oldClientName ? `${oldClientName} → ${newClientName}` : `Ajout: ${newClientName}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement d'adresse
      if (oldAdresse !== newAdresse && newAdresse) {
        newHistoriqueEntries.push({
          action: "Modification de l'adresse des travaux",
          details: oldAdresse ? `${oldAdresse} → ${newAdresse}` : `Ajout: ${newAdresse}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de types de mandats
      const oldMandatTypes = (editingPriseMandat.mandats || []).map(m => m.type_mandat).join(', ');
      const newMandatTypes = mandatsToSave.map(m => m.type_mandat).join(', ');
      if (oldMandatTypes !== newMandatTypes) {
        newHistoriqueEntries.push({
          action: "Modification des types de mandats",
          details: oldMandatTypes ? `${oldMandatTypes} → ${newMandatTypes}` : `Ajout: ${newMandatTypes}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de prix total
      const oldTotalPrix = (editingPriseMandat.mandats || []).reduce((sum, m) => sum + (m.prix_estime || 0) + (m.prix_premier_lot || 0) + (m.prix_autres_lots || 0), 0);
      const newTotalPrix = mandatsToSave.reduce((sum, m) => sum + (m.prix_estime || 0) + (m.prix_premier_lot || 0) + (m.prix_autres_lots || 0), 0);
      if (oldTotalPrix !== newTotalPrix) {
        newHistoriqueEntries.push({
          action: "Modification du prix estimé",
          details: `${oldTotalPrix.toFixed(2)} $ → ${newTotalPrix.toFixed(2)} $`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de rabais total
      const oldTotalRabais = (editingPriseMandat.mandats || []).reduce((sum, m) => sum + (m.rabais || 0), 0);
      const newTotalRabais = mandatsToSave.reduce((sum, m) => sum + (m.rabais || 0), 0);
      if (oldTotalRabais !== newTotalRabais) {
        newHistoriqueEntries.push({
          action: "Modification du rabais",
          details: `${oldTotalRabais.toFixed(2)} $ → ${newTotalRabais.toFixed(2)} $`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de date de livraison
      if (editingPriseMandat.date_livraison !== (mandatsInfo[0]?.date_livraison || "")) {
        const formatDate = (date) => date ? format(new Date(date), "dd MMM yyyy", { locale: fr }) : 'Non définie';
        newHistoriqueEntries.push({
          action: "Modification de la date de livraison",
          details: `${formatDate(editingPriseMandat.date_livraison)} → ${formatDate(mandatsInfo[0]?.date_livraison)}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de date de signature
      if (editingPriseMandat.date_signature !== (mandatsInfo[0]?.date_signature || "")) {
        const formatDate = (date) => date ? format(new Date(date), "dd MMM yyyy", { locale: fr }) : 'Non définie';
        newHistoriqueEntries.push({
          action: "Modification de la date de signature",
          details: `${formatDate(editingPriseMandat.date_signature)} → ${formatDate(mandatsInfo[0]?.date_signature)}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de date de début des travaux
      if (editingPriseMandat.date_debut_travaux !== (mandatsInfo[0]?.date_debut_travaux || "")) {
        const formatDate = (date) => date ? format(new Date(date), "dd MMM yyyy", { locale: fr }) : 'Non définie';
        newHistoriqueEntries.push({
          action: "Modification de la date de début des travaux",
          details: `${formatDate(editingPriseMandat.date_debut_travaux)} → ${formatDate(mandatsInfo[0]?.date_debut_travaux)}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement d'échéance souhaitée
      if (editingPriseMandat.echeance_souhaitee !== (mandatsInfo[0]?.echeance_souhaitee || "")) {
        newHistoriqueEntries.push({
          action: "Modification de l'échéance souhaitée",
          details: `${editingPriseMandat.echeance_souhaitee || 'Non définie'} → ${mandatsInfo[0]?.echeance_souhaitee || 'Non définie'}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de clients_ids
      const oldClientsIds = (editingPriseMandat.clients_ids || []).sort().join(',');
      const newClientsIds = (formData.clients_ids || []).sort().join(',');
      if (oldClientsIds !== newClientsIds) {
        const oldNames = getClientsNames(editingPriseMandat.clients_ids || []);
        const newNames = getClientsNames(formData.clients_ids || []);
        newHistoriqueEntries.push({
          action: "Modification des clients sélectionnés",
          details: oldNames !== '-' ? `${oldNames} → ${newNames}` : `Ajout: ${newNames}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      const updatedHistorique = [...newHistoriqueEntries, ...historique];
      
      updatePriseMandatMutation.mutate({ id: editingPriseMandat.id, data: { ...dataToSubmit, historique: updatedHistorique } });
    } else {
      // Création
      const creationDetails = [];
      creationDetails.push(`Arpenteur: ${formData.arpenteur_geometre}`);
      creationDetails.push(`Statut: ${formData.statut}`);
      const mandatTypes = mandatsToSave.map(m => m.type_mandat).filter(t => t);
      if (mandatTypes.length > 0) creationDetails.push(`Mandats: ${mandatTypes.join(', ')}`);
      const creationClientName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
      const creationAdresse = formatAdresse(workAddress);
      if (creationClientName) creationDetails.push(`Client: ${creationClientName}`);
      if (creationAdresse) creationDetails.push(`Adresse: ${creationAdresse}`);
      const totalPrix = mandatsToSave.reduce((sum, m) => sum + (m.prix_estime || 0) + (m.prix_premier_lot || 0) + (m.prix_autres_lots || 0), 0);
      if (totalPrix > 0) creationDetails.push(`Prix: ${totalPrix.toFixed(2)} $`);
      
      const creationHistorique = [{
        action: "Création de la prise de mandat",
        details: creationDetails.join(' | '),
        utilisateur_nom: user?.full_name || "Utilisateur",
        utilisateur_email: user?.email || "",
        date: new Date().toISOString()
      }];
      
      createPriseMandatMutation.mutate({ ...dataToSubmit, historique: creationHistorique });
    }
  };

  // handleNewClientSubmit removed, logic moved to ClientFormDialog

  // NEW FUNCTION
  const handleNewLotSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: vérifier que les champs obligatoires sont remplis
    if (!newLotForm.numero_lot || !newLotForm.circonscription_fonciere) {
      setShowLotMissingFieldsWarning(true);
      return;
    }
    
    // Vérifier si le lot existe déjà (même numéro de lot et même circonscription)
    // mais pas en édition (si on est en train de modifier le même lot, ce n'est pas un doublon)
    const lotExistant = lots.find(l => 
      l.numero_lot === newLotForm.numero_lot && 
      l.circonscription_fonciere === newLotForm.circonscription_fonciere &&
      l.id !== editingLot?.id
    );
    
    if (lotExistant) {
      setShowLotExistsWarning(true);
      return;
    }
    
    if (editingLot) {
      // Mode modification
      await updateLotMutation.mutateAsync({ id: editingLot.id, lotData: newLotForm });
      setIsNewLotDialogOpen(false);
      resetLotForm();
      setCommentairesTemporairesLot([]);
    } else {
      // Mode création
      const newLot = await createLotMutation.mutateAsync(newLotForm);
      
      
      // Ajouter automatiquement le lot créé au mandat actuel si on est dans le dialog "Ouvrir dossier"
      if (currentMandatIndexDossier !== null) {
        setNouveauDossierForm(prev => ({
          ...prev,
          mandats: prev.mandats.map((m, i) => i === currentMandatIndexDossier ? {
            ...m,
            lots: [...(m.lots || []), newLot.id]
          } : m)
        }));
      } else if (currentMandatIndex !== null) {
        // Si on est dans le formulaire principal (prise de mandat)
        setFormData(prev => ({
          ...prev,
          mandats: prev.mandats.map((m, i) => i === currentMandatIndex ? {
            ...m,
            lots: [...(m.lots || []), newLot.id]
          } : m)
        }));
      }
    }
  };

  // END NEW FUNCTION

  const resetForm = () => {
    setFormData({
      numero_dossier: "",
      arpenteur_geometre: "",
      placeAffaire: "",
      date_ouverture: new Date().toISOString().split('T')[0],
      date_fermeture: "",
      statut: "Nouveau mandat/Demande d'information",
      ttl: "Non",
      utilisateur_assigne: "",
      clients_ids: [],
      clients_texte: "",
      notaires_ids: [],
      notaires_texte: "",
      courtiers_ids: [],
      courtiers_texte: "",
      mandats: [],
      description: ""
    });
    setEditingDossier(null);
    setActiveTabMandat("0");
    setDossierReferenceId(null);
    setDossierSearchForReference("");
    setCommentairesTemporaires([]);
  };

  const resetFullForm = () => {
    // Reset du formData principal
    setFormData({
      numero_dossier: "",
      arpenteur_geometre: "",
      placeAffaire: "",
      date_ouverture: new Date().toISOString().split('T')[0],
      date_fermeture: "",
      statut: "Nouveau mandat/Demande d'information",
      ttl: "Non",
      utilisateur_assigne: "",
      clients_ids: [],
      clients_texte: "",
      notaires_ids: [],
      notaires_texte: "",
      courtiers_ids: [],
      courtiers_texte: "",
      mandats: [],
      description: ""
    });
    
    // Reset sidebar et historique
    setSidebarTab("commentaires");
    setHistorique([]);
    
    // Reset professionnel
    setProfessionnelStepCollapsed(true);
    setProfessionnelInfo({ notaire: "", courtier: "", compagnie: "" });
    
    // Reset de l'adresse de travail
    setWorkAddress({
      numeros_civiques: [""],
      rue: "",
      ville: "",
      province: "QC",
      code_postal: "",
      numero_lot: ""
    });
    
    // Reset des infos client
    setClientInfo({
      prenom: "",
      nom: "",
      telephone: "",
      type_telephone: "Cellulaire",
      courriel: ""
    });
    
    // Reset des mandats
    setMandatsInfo([{
      type_mandat: "",
      echeance_souhaitee: "",
      date_signature: "",
      date_debut_travaux: "",
      date_livraison: "",
      urgence_percue: "",
      prix_estime: 0,
      rabais: 0,
      taxes_incluses: false
    }]);
    
    // Reset des états de collapse
    setClientStepCollapsed(false);
    setAddressStepCollapsed(false);
    setMandatStepCollapsed(false);
    setTarificationStepCollapsed(true);
    setProfessionnelStepCollapsed(true);
    
    // Reset des autres états
    setEditingDossier(null);
    setActiveTabMandat("0");
    setDossierReferenceId(null);
    setDossierSearchForReference("");
    setCommentairesTemporaires([]);
    setEditingPriseMandat(null);
    setHasFormChanges(false);
    setInitialPriseMandatData(null);
  };

  // NEW FUNCTION
  const resetLotForm = () => {
    setNewLotForm({
      numero_lot: "",
      circonscription_fonciere: "",
      cadastre: "Québec",
      rang: "",
      types_operation: []
    });
    setAvailableCadastresForNewLot([]);
    setCommentairesTemporairesLot([]);
    setEditingLot(null);
    setInitialLotForm(null);
    setLotInfoCollapsed(false);
    setTypesOperationCollapsed(false);
    setLotDocumentsCollapsed(false);
    setLotActionLogs([]);
  };
  // END NEW FUNCTION

  const handleEdit = (entity) => { // Renamed from 'dossier' to 'entity'
    // Check if the entity is a client (based on type_client property presence)
    if (entity && entity.type_client) {
      // It's a client. Open client editing form using ClientFormDialog.
      setEditingClientForForm(entity);
      setClientTypeForForm(entity.type_client);
      setIsClientFormDialogOpen(true);

      // Close the selector dialog first
      setIsClientSelectorOpen(false);
      setIsNotaireSelectorOpen(false);
      setIsCourtierSelectorOpen(false);
      return; // Exit early as it's a client
    }

    // Original dossier editing logic
    setIsViewDialogOpen(false);
    setViewingDossier(null);
    setDossierReferenceId(null); // Clear reference ID when editing existing dossier

    setEditingDossier(entity); // Now 'entity' is a dossier
    setFormData({
      numero_dossier: entity.numero_dossier || "",
      arpenteur_geometre: entity.arpenteur_geometre || "",
      date_ouverture: entity.date_ouverture || new Date().toISOString().split('T')[0],
      date_fermeture: entity.date_fermeture || "",
      statut: mapOldStatusToCombined(entity.statut || "Retour d'appel"),
      ttl: entity.ttl || "Non",
      utilisateur_assigne: entity.utilisateur_assigne || "",
      clients_ids: entity.clients_ids || [],
      clients_texte: entity.clients_texte || "",
      notaires_ids: entity.notaires_ids || [],
      notaires_texte: entity.notaires_texte || "",
      courtiers_ids: entity.courtiers_ids || [],
      courtiers_texte: entity.courtiers_texte || "",
      mandats: entity.mandats?.map(m => ({
        ...m,
        date_ouverture: m.date_ouverture || "",
        minute: m.minute || "",
        date_minute: m.date_minute || "",
        type_minute: m.type_minute || "Initiale",
        minutes_list: m.minutes_list || [],
        adresse_travaux: m.adresse_travaux
          ? (typeof m.adresse_travaux === 'string'
            ? {
                rue: m.adresse_travaux,
                numeros_civiques: [],
                ville: "",
                code_postal: "",
                province: ""
              }
            : m.adresse_travaux
          )
          : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
        lots: m.lots || [],
        prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0,
        rabais: m.rabais !== undefined ? m.rabais : 0,
        taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
        date_livraison: m.date_livraison || "",
        date_signature: m.date_signature || "",
        date_debut_travaux: m.date_debut_travaux || "",
        factures: m.factures || [],
        tache_actuelle: m.tache_actuelle || "",
        utilisateur_assigne: m.utilisateur_assigne || "" // Add this field for mandat
      })) || [],
      description: entity.description || ""
    });
    setIsDialogOpen(true);
    setActiveTabMandat("0");
  };

  const handleView = (dossier) => {
    setViewingDossier(dossier);
    setIsViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    if (viewingDossier) {
      handleEdit(viewingDossier);
    }
  };

  const handleDelete = (id) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.`)) {
      deleteDossierMutation.mutate(id);
    }
  };

  const toggleClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(clientId)
        ? prev[field].filter(id => id !== clientId)
        : [...prev[field], clientId]
    }));
  };

  const removeClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(id => id !== clientId)
    }));
  };

  const addMandat = () => {
    const newIndex = formData.mandats.length;

    const firstMandat = formData.mandats[0];
    const defaultAdresse = firstMandat?.adresse_travaux
      ? JSON.parse(JSON.stringify(firstMandat.adresse_travaux))
      : {
        ville: "",
        numeros_civiques: [""],
        rue: "",
        code_postal: "",
        province: "QC"
      };
    const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : [];

    setFormData(prev => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "",
        date_ouverture: "",
        minute: "",
        date_minute: "",
        type_minute: "Initiale",
        minutes_list: [],
        adresse_travaux: defaultAdresse,
        lots: defaultLots,
        lots_texte: "",
        prix_estime: 0,
        rabais: 0,
        taxes_incluses: false,
        date_livraison: "",
        date_signature: "",
        date_debut_travaux: "",
        factures: [],
        tache_actuelle: "",
        utilisateur_assigne: "" // Initialize new field for mandat
      }]
    }));
    setActiveTabMandat(newIndex.toString());
  };

  const getMandatTabLabel = (mandat, index) => {
    return mandat.type_mandat || `Mandat ${index + 1}`;
  };

  const updateMandatAddress = (mandatIndex, newAddresses) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) =>
        i === mandatIndex ? { ...m, adresse_travaux: newAddresses[0] || { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" } } : m
      )
    }));
  };

  const updateMandat = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeMandat = (index) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.")) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.filter((_, i) => i !== index)
      }));
    }
  };

  const removeLotFromMandat = (mandatIndex, lotId) => {
    if (confirm(`Êtes-vous sûr de vouloir retirer le lot ${lotId} de ce mandat ?`)) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === mandatIndex ? { ...m, lots: m.lots.filter((id) => id !== lotId) } : m
        )
      }));
    }
  };

  const openAddMinuteDialog = (mandatIndex) => {
    setCurrentMinuteMandatIndex(mandatIndex);
    setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
    setIsAddMinuteDialogOpen(true);
  };

  const handleAddMinuteFromDialog = () => {
    if (currentMinuteMandatIndex !== null && newMinuteForm.minute && newMinuteForm.date_minute) {
      // Déterminer quel form utiliser (nouveau dossier ou mandat form)
      const arpenteur = isOuvrirDossierDialogOpen ? nouveauDossierForm.arpenteur_geometre : formData.arpenteur_geometre;
      
      // Vérifier si la minute existe déjà pour cet arpenteur
      const minuteExiste = dossiers.some(d => 
        d.arpenteur_geometre === arpenteur &&
        d.mandats?.some(m => 
          m.minutes_list?.some(min => min.minute === newMinuteForm.minute) ||
          m.minute === newMinuteForm.minute
        )
      );

      if (minuteExiste) {
        alert(`La minute ${newMinuteForm.minute} existe déjà pour ${arpenteur}. Veuillez choisir un autre numéro.`);
        return;
      }

      if (isOuvrirDossierDialogOpen) {
        // Ajouter à nouveauDossierForm
        const currentMinutes = nouveauDossierForm.mandats[currentMinuteMandatIndex].minutes_list || [];
        setNouveauDossierForm(prev => ({
          ...prev,
          mandats: prev.mandats.map((m, i) =>
            i === currentMinuteMandatIndex ? { ...m, minutes_list: [...currentMinutes, { ...newMinuteForm }] } : m
          )
        }));
      } else {
        // Ajouter à formData (ancien comportement)
        addMinuteToMandat(currentMinuteMandatIndex);
      }
      
      setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
      setIsAddMinuteDialogOpen(false);
      setCurrentMinuteMandatIndex(null);
    }
  };

  const addMinuteToMandat = (mandatIndex) => {
    if (newMinuteForm.minute && newMinuteForm.date_minute) {
      const currentMinutes = formData.mandats[mandatIndex].minutes_list || [];
      updateMandat(mandatIndex, 'minutes_list', [...currentMinutes, { ...newMinuteForm }]);
      setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
    }
  };

  const removeMinuteFromMandat = (mandatIndex, minuteIndex) => {
    const updatedMinutes = formData.mandats[mandatIndex].minutes_list.filter((_, idx) => idx !== minuteIndex);
    updateMandat(mandatIndex, 'minutes_list', updatedMinutes);
  };

  const voirFacture = (factureHTML) => {
    if (!factureHTML) {
      alert("Le HTML de la facture n'est pas disponible.");
      return;
    }
    const newWindow = window.open('', '_blank');
    newWindow.document.write(factureHTML);
    newWindow.document.close();
  };

  // removeClientField and toggleActuel removed, logic moved to ClientFormDialog

  // NEW FUNCTIONS
  const handleLotCirconscriptionChange = (value) => {
    setNewLotForm(prev => ({ ...prev, circonscription_fonciere: value, cadastre: prev.cadastre || "Québec" }));
    setAvailableCadastresForNewLot(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
  };

  const handleD01Import = async (file) => {
    setIsImportingD01(true);
    try {
      const fileContent = await file.text();
      const lines = fileContent.split('\n');
      const lotLine = lines.find(line => line.startsWith('LO'));
      const suLines = lines.filter(line => line.startsWith('SU'));
      
      let coLines = [];
      if (suLines.length >= 2) {
        const firstSuIndex = lines.indexOf(suLines[0]);
        const secondSuIndex = lines.indexOf(suLines[1]);
        coLines = lines.slice(firstSuIndex + 1, secondSuIndex).filter(line => line.startsWith('CO'));
      }
      
      const suLine = suLines[0];
      let extractedData = {};
      
      if (lotLine) {
        const lotParts = lotLine.split(';');
        extractedData.numero_lot = lotParts[1] || '';
      }
      
      if (suLine) {
        const suParts = suLine.split(';');
        extractedData.circonscription_fonciere = suParts[2] || '';
        const dateBpd = suParts[3] || '';
        if (dateBpd) {
          if (dateBpd.length === 8 && /^\d{8}$/.test(dateBpd)) {
            const year = dateBpd.substring(0, 4);
            const month = dateBpd.substring(4, 6);
            const day = dateBpd.substring(6, 8);
            extractedData.date_bpd = `${year}-${month}-${day}`;
          } else {
            extractedData.date_bpd = dateBpd;
          }
        }
      }
      
      extractedData.cadastre = 'Québec';
      const concordances_anterieures = [];
      
      if (coLines.length > 0) {
        coLines.forEach(coLine => {
          const coParts = coLine.split(';');
          const cadastreCode = coParts[1] || '';
          const cadastre = CADASTRE_CODES[cadastreCode] || cadastreCode || 'Québec';
          let rang = coParts[2] ? coParts[2].replace('R', 'Rang ') : '';
          if (rang.match(/^Rang 0(\d+)$/)) {
            rang = rang.replace(/^Rang 0/, 'Rang ');
          }
          const numeroLot = coParts[3] || '';
          const estPartie = coParts[4] === 'O';
          
          concordances_anterieures.push({
            circonscription_fonciere: extractedData.circonscription_fonciere,
            cadastre: cadastre,
            numero_lot: numeroLot,
            rang: rang,
            est_partie: estPartie
          });
        });
      }
      
      // Créer un type d'opération avec la date BPD et les concordances
      const typeOperation = {
        type_operation: "Remplacement",
        date_bpd: extractedData.date_bpd || '',
        concordances_anterieures: concordances_anterieures
      };
      
      // Mettre à jour les cadastres disponibles AVANT de set formData
      if (extractedData.circonscription_fonciere) {
        setAvailableCadastresForNewLot(CADASTRES_PAR_CIRCONSCRIPTION[extractedData.circonscription_fonciere] || []);
      }
      
      setNewLotForm(prev => ({
        ...prev,
        numero_lot: extractedData.numero_lot || prev.numero_lot,
        circonscription_fonciere: extractedData.circonscription_fonciere || prev.circonscription_fonciere,
        cadastre: 'Québec',
        types_operation: [typeOperation]
      }));
      
      setShowD01ImportSuccess(true);
    } catch (error) {
      console.error("Erreur import .d01:", error);
      alert("Erreur lors de l'importation du fichier .d01");
    } finally {
      setIsImportingD01(false);
    }
  };

  const handleD01FileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleD01Import(file);
    }
  };

  const handleD01DragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverD01(true);
  };

  const handleD01DragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverD01(false);
  };

  const handleD01Drop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverD01(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.d01')) {
      handleD01Import(file);
    } else {
      alert("Veuillez déposer un fichier .d01");
    }
  };
  // END NEW FUNCTIONS

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "";
  };

  const getStatutBadgeColor = (statut) => {
    const colors = {
      "Retour d'appel": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Message laissé/Sans réponse": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      "Demande d'information": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "Nouveau mandat": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Nouveau mandat/Demande d'information": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", // Added for combined status
      "Mandats à ouvrir": "bg-purple-500/20 text-purple-400 border-purple-500/30", // New status
      "Mandat non octroyé": "bg-red-500/20 text-red-400 border-red-500/30", // Changed to red for consistency with outline
      "Soumission": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      "Ouvert": "bg-green-500/20 text-green-400 border-green-500/30",
      "Fermé": "bg-slate-500/20 text-slate-400 border-slate-500/30"
    };
    // If the dossier is Mandats à ouvrir, it should appear with soumission color on the dashboard
    if (statut === "Mandats à ouvrir" && colors["Soumission"]) {
        return colors["Soumission"];
    }
    return colors[statut] || colors["Retour d'appel"];
  };

  // Sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortDossiers = (dossiersList) => {
    if (!sortField) return dossiersList;

    return [...dossiersList].sort((a, b) => {
      let aValue;
      let bValue;

      switch (sortField) {
        case 'numero_dossier': // Added case for numero_dossier
          aValue = (getArpenteurInitials(a.arpenteur_geometre) + (a.numero_dossier || '')).toLowerCase();
          bValue = (getArpenteurInitials(b.arpenteur_geometre) + (b.numero_dossier || '')).toLowerCase();
          break;
        case 'created_date':
          aValue = new Date(a.created_date || 0).getTime();
          bValue = new Date(b.created_date || 0).getTime();
          break;
        case 'clients':
          aValue = getClientsNames(a.clients_ids).toLowerCase();
          bValue = getClientsNames(b.clients_ids).toLowerCase();
          break;
        case 'adresse_travaux':
          aValue = getFirstAdresseTravaux(a.mandats).toLowerCase();
          bValue = getFirstAdresseTravaux(b.mandats).toLowerCase();
          break;
        case 'mandats':
          aValue = (a.mandats?.[0]?.type_mandat || '').toLowerCase();
          bValue = (b.mandats?.[0]?.type_mandat || '').toLowerCase();
          break;
        case 'utilisateur_assigne':
          aValue = (a.utilisateur_assigne || '').toLowerCase();
          bValue = (b.utilisateur_assigne || '').toLowerCase();
          break;
        case 'statut': // Retaining this for global filter and form, but removing from tables below.
          aValue = (a[sortField] || '').toString().toLowerCase();
          bValue = (b[sortField] || '').toString().toLowerCase();
          break;
        default:
          aValue = (a[sortField] || '').toString().toLowerCase();
          bValue = (b[sortField] || '').toString().toLowerCase();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : 1;
        return 0;
      }
    });
  };

  const sortedRetourAppel = sortDossiers(filteredRetourAppel);
  const sortedMandatNonOctroye = sortDossiers(filteredMandatNonOctroye);
  const sortedSoumission = sortDossiers(filteredSoumission);
  const sortedNouveauMandat = sortDossiers(filteredNouveauMandat);

  const allVilles = [...new Set(priseMandats.map(pm => pm.adresse_travaux?.ville).filter(v => v))].sort();

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={async (open) => {
            if (!open) {
              // Déverrouiller le mandat si on était en train de l'éditer
              if (editingPriseMandat && !isLocked) {
                await base44.entities.PriseMandat.update(editingPriseMandat.id, {
                  ...editingPriseMandat,
                  locked_by: null,
                  locked_at: null
                });
              }
              
              // Rafraîchir la liste à la fermeture
              queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
              
              setIsDialogOpen(false);
              resetFullForm();
              setIsLocked(false);
              setLockedBy("");
            } else {
              setIsDialogOpen(open);
            }
          }}>

            <DialogContent className={`backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50 ${isOuvrirDossierDialogOpen ? '!invisible' : ''}`}>
              <DialogHeader className="sr-only">
                <DialogTitle className="text-2xl">
                  {editingDossier ? "Modifier le dossier" : "Nouveau dossier"}
                </DialogTitle>
              </DialogHeader>

              <motion.div 
                className="flex flex-col h-[90vh]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-1 flex overflow-hidden">
                  {/* Main form content - 70% */}
                  <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  {/* Bandeau de verrouillage */}
                  {isLocked && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-red-400 font-semibold">Mandat verrouillé</p>
                        <p className="text-slate-300 text-sm">Ce mandat est en cours de modification par <span className="text-red-400 font-medium">{lockedBy}</span></p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {editingPriseMandat ? "Modifier le mandat" : "Nouveau mandat"}
                      </h2>
                      {formData.statut === "Mandats à ouvrir" && formData.arpenteur_geometre && formData.numero_dossier && (
                        <p className="text-emerald-400 text-lg font-semibold mt-1">
                          {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
                          {(clientInfo.prenom || clientInfo.nom || (formData.clients_ids.length > 0 && getClientsNames(formData.clients_ids) !== "-")) && (
                            <span> - {clientInfo.prenom || clientInfo.nom 
                              ? `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim()
                              : getClientsNames(formData.clients_ids)}</span>
                          )}
                        </p>
                      )}
                    </div>
                    {formData.statut === "Mandats à ouvrir" && (
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-2 border-purple-500 text-purple-300"
                        onClick={() => {
                          // Calculer le prochain numéro de dossier
                          const prochainNumero = calculerProchainNumeroDossier(formData.arpenteur_geometre, editingPriseMandat?.id);
                          
                          setNouveauDossierForm({
                            numero_dossier: prochainNumero,
                            arpenteur_geometre: formData.arpenteur_geometre,
                            place_affaire: formData.placeAffaire,
                            date_ouverture: new Date().toISOString().split('T')[0],
                            statut: "Ouvert",
                            ttl: "Non",
                            clients_ids: formData.clients_ids,
                            notaires_ids: formData.notaires_ids || [],
                            courtiers_ids: formData.courtiers_ids || [],
                            compagnies_ids: formData.compagnies_ids || [],
                            mandats: mandatsInfo.filter(m => m.type_mandat).map(m => ({
                              type_mandat: m.type_mandat,
                              adresse_travaux: workAddress,
                              prix_estime: m.prix_estime || 0,
                              prix_premier_lot: m.prix_premier_lot || 0,
                              prix_autres_lots: m.prix_autres_lots || 0,
                              rabais: m.rabais || 0,
                              taxes_incluses: m.taxes_incluses || false,
                              date_signature: m.date_signature || "",
                              date_debut_travaux: m.date_debut_travaux || "",
                              date_livraison: m.date_livraison || "",
                              lots: [],
                              tache_actuelle: "Ouverture",
                              utilisateur_assigne: "",
                              minute: "",
                              date_minute: "",
                              type_minute: "Initiale",
                              minutes_list: [],
                              terrain: {
                                date_limite_leve: "",
                                instruments_requis: "",
                                a_rendez_vous: false,
                                date_rendez_vous: "",
                                heure_rendez_vous: "",
                                donneur: "",
                                technicien: "",
                                dossier_simultane: "",
                                temps_prevu: "",
                                notes: ""
                              },
                              factures: [],
                              notes: ""
                            }))
                          });
                          // Créer un commentaire récapitulatif avec les infos MANUELLES du mandat
                          let commentaireInfoMandat = "<h2 style='font-size: 1.31em;'><strong>📋 Informations du mandat</strong></h2>\n\n";
                          
                          // Vérifier si un texte saisi correspond à un professionnel sélectionné
                          const selectedClientsNames = formData.clients_ids.map(id => {
                            const c = clients.find(cl => cl.id === id);
                            return c ? `${c.prenom} ${c.nom}`.trim() : '';
                          });
                          const selectedNotairesNames = (formData.notaires_ids || []).map(id => {
                            const n = notaires.find(nt => nt.id === id);
                            return n ? `${n.prenom} ${n.nom}`.trim() : '';
                          });
                          const selectedCourtiersNames = (formData.courtiers_ids || []).map(id => {
                            const ct = courtiers.find(cr => cr.id === id);
                            return ct ? `${ct.prenom} ${ct.nom}`.trim() : '';
                          });
                          const compagnies = clients.filter(c => c.type_client === 'Compagnie');
                          const selectedCompagniesNames = (formData.compagnies_ids || []).map(id => {
                            const cp = compagnies.find(cmp => cmp.id === id);
                            return cp ? `${cp.prenom} ${cp.nom}`.trim() : '';
                          });
                          
                          // Client saisi manuellement (si différent des sélectionnés)
                          const clientSaisiManuel = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
                          if ((clientInfo.prenom || clientInfo.nom || clientInfo.telephone || clientInfo.courriel) && 
                              !selectedClientsNames.includes(clientSaisiManuel)) {
                            commentaireInfoMandat += `<strong><u>Client</u></strong>\n`;
                            if (clientInfo.prenom || clientInfo.nom) {
                              commentaireInfoMandat += clientSaisiManuel + "\n";
                            }
                            if (clientInfo.telephone) commentaireInfoMandat += `Tél (${clientInfo.type_telephone || 'Cellulaire'}): ${clientInfo.telephone}\n`;
                            if (clientInfo.courriel) commentaireInfoMandat += `Email: ${clientInfo.courriel}\n`;
                            commentaireInfoMandat += "\n";
                          }
                          
                          // Notaire saisi manuellement (si différent des sélectionnés)
                          if (professionnelInfo.notaire && !selectedNotairesNames.includes(professionnelInfo.notaire.trim())) {
                            commentaireInfoMandat += `<strong><u>Notaire</u></strong>\n`;
                            commentaireInfoMandat += `${professionnelInfo.notaire}\n\n`;
                          }
                          
                          // Courtier saisi manuellement (si différent des sélectionnés)
                          if (professionnelInfo.courtier && !selectedCourtiersNames.includes(professionnelInfo.courtier.trim())) {
                            commentaireInfoMandat += `<strong><u>Courtier immobilier</u></strong>\n`;
                            commentaireInfoMandat += `${professionnelInfo.courtier}\n\n`;
                          }
                          
                          // Compagnie saisie manuellement (si différente des sélectionnées)
                          if (professionnelInfo.compagnie && !selectedCompagniesNames.includes(professionnelInfo.compagnie.trim())) {
                            commentaireInfoMandat += `<strong><u>Compagnie</u></strong>\n`;
                            commentaireInfoMandat += `${professionnelInfo.compagnie}\n\n`;
                          }
                          
                          // Lots (saisis manuellement)
                          if (workAddress.numero_lot && workAddress.numero_lot.trim()) {
                            const lotsArray = workAddress.numero_lot.split('\n').filter(l => l.trim());
                            if (lotsArray.length > 0) {
                              commentaireInfoMandat += `<strong><u>Lots</u></strong>\n`;
                              lotsArray.forEach(lot => {
                                commentaireInfoMandat += `${lot.trim()}\n`;
                              });
                              commentaireInfoMandat += "\n";
                            }
                          }
                          
                          // Ajouter ce commentaire au début des commentaires temporaires s'il contient des infos MANUELLES
                          const hasManualInfo = (clientInfo.prenom || clientInfo.nom || clientInfo.telephone || clientInfo.courriel ||
                                                professionnelInfo.notaire || professionnelInfo.courtier || professionnelInfo.compagnie ||
                                                workAddress.numero_lot);
                          
                          const commentairesAvecInfo = hasManualInfo ? [
                            {
                              id: `info-mandat-${Date.now()}`,
                              contenu: commentaireInfoMandat,
                              utilisateur_email: user?.email || "",
                              utilisateur_nom: user?.full_name || "Système",
                              created_date: new Date().toISOString()
                            },
                            ...commentairesTemporaires
                          ] : commentairesTemporaires;
                          
                          setCommentairesTemporairesDossier(commentairesAvecInfo);
                          setHistoriqueDossier(historique);
                          setActiveTabMandatDossier("0");
                          setInfoDossierCollapsed(false);
                          setMandatStepCollapsed(false);
                          setIsOuvrirDossierDialogOpen(true);
                        }}
                      >
                        <FolderOpen className="w-5 h-5 mr-2" />
                        Ouvrir dossier
                      </Button>
                    )}
                  </div>
                  {formData.ttl === "Oui" && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg mb-6">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span className="text-indigo-400 font-semibold text-sm tracking-wide">TTL</span>
                    </div>
                  )}

                  <form id="dossier-form" onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }} className="space-y-3">
                  {/* Section Informations du dossier - Toujours en haut */}
                  <DossierInfoStepForm
                    disabled={isLocked}
                    arpenteurGeometre={formData.arpenteur_geometre}
                    onArpenteurChange={(value) => {
                      if (isLocked) return;
                      setFormData({...formData, arpenteur_geometre: value});
                      setHasFormChanges(true);
                    }}
                    statut={formData.statut}
                    onStatutChange={(value) => {
                      if (isLocked) return;
                      // Si un numéro de dossier est inscrit et qu'on change de statut, demander confirmation
                      if (formData.numero_dossier && value !== formData.statut) {
                        setPendingStatutChange(value);
                        setShowStatutChangeConfirm(true);
                        return;
                      }
                      
                      // Ne pas attribuer automatiquement le numéro de dossier
                      if (value !== "Mandats à ouvrir") {
                        setFormData({...formData, statut: value, numero_dossier: "", date_ouverture: ""});
                      } else {
                        setFormData({...formData, statut: value});
                      }
                    }}
                    numeroDossier={formData.numero_dossier}
                    onNumeroDossierChange={(value) => setFormData({...formData, numero_dossier: value})}
                    dateOuverture={formData.date_ouverture}
                    onDateOuvertureChange={(value) => setFormData({...formData, date_ouverture: value})}
                    placeAffaire={formData.placeAffaire}
                    onPlaceAffaireChange={(value) => setFormData({...formData, placeAffaire: value})}
                    isCollapsed={dossierInfoStepCollapsed}
                    onToggleCollapse={() => setDossierInfoStepCollapsed(!dossierInfoStepCollapsed)}
                  />

                  {/* Étape 1: Informations du client */}
                  <ClientStepForm
                    disabled={isLocked}
                    clients={clientsReguliers}
                    selectedClientIds={formData.clients_ids}
                    onSelectClient={(clientId) => {
                      if (isLocked) return;
                      setFormData(prev => ({
                        ...prev,
                        clients_ids: prev.clients_ids.includes(clientId)
                          ? prev.clients_ids.filter(id => id !== clientId)
                          : [...prev.clients_ids, clientId]
                      }));
                      setHasFormChanges(true);
                    }}
                    isCollapsed={clientStepCollapsed}
                    onToggleCollapse={() => setClientStepCollapsed(!clientStepCollapsed)}
                    clientInfo={clientInfo}
                    onClientInfoChange={(info) => {
                      setClientInfo(info);
                      setHasFormChanges(true);
                    }}
                  />

                  {/* Étape 2: Professionnel */}
                  <ProfessionnelStepForm
                    disabled={isLocked}
                    notaires={notaires}
                    courtiers={courtiers}
                    compagnies={clients.filter(c => c.type_client === 'Compagnie')}
                    selectedNotaireIds={formData.notaires_ids || []}
                    selectedCourtierIds={formData.courtiers_ids || []}
                    selectedCompagnieIds={formData.compagnies_ids || []}
                    onSelectNotaire={(id) => {
                      if (isLocked) return;
                      setFormData(prev => ({
                        ...prev,
                        notaires_ids: (prev.notaires_ids || []).includes(id)
                          ? prev.notaires_ids.filter(nid => nid !== id)
                          : [...(prev.notaires_ids || []), id]
                      }));
                    }}
                    onSelectCourtier={(id) => {
                      if (isLocked) return;
                      setFormData(prev => ({
                        ...prev,
                        courtiers_ids: (prev.courtiers_ids || []).includes(id)
                          ? prev.courtiers_ids.filter(cid => cid !== id)
                          : [...(prev.courtiers_ids || []), id]
                      }));
                    }}
                    onSelectCompagnie={(id) => {
                      if (isLocked) return;
                      setFormData(prev => ({
                        ...prev,
                        compagnies_ids: (prev.compagnies_ids || []).includes(id)
                          ? prev.compagnies_ids.filter(cid => cid !== id)
                          : [...(prev.compagnies_ids || []), id]
                      }));
                    }}
                    professionnelInfo={professionnelInfo}
                    onProfessionnelInfoChange={setProfessionnelInfo}
                    isCollapsed={professionnelStepCollapsed}
                    onToggleCollapse={() => setProfessionnelStepCollapsed(!professionnelStepCollapsed)}
                  />

                  {/* Étape 3: Adresse des travaux */}
                  <AddressStepForm
                    disabled={isLocked}
                    address={workAddress}
                    onAddressChange={(addr) => {
                      if (isLocked) return;
                      setWorkAddress(addr);
                      setHasFormChanges(true);
                    }}
                    isCollapsed={addressStepCollapsed}
                    onToggleCollapse={() => setAddressStepCollapsed(!addressStepCollapsed)}
                    clientDossiers={dossiers.filter(d => 
                      formData.clients_ids.length > 0 && 
                      formData.clients_ids.some(clientId => d.clients_ids?.includes(clientId))
                    )}
                    allLots={lots}
                    onSelectExistingAddress={(addr, mandatLots) => {
                      if (addr) {
                        // Récupérer les numéros de lots depuis l'entité Lot
                        let lotNumbers = "";
                        if (mandatLots && mandatLots.length > 0) {
                          const lotNumeros = mandatLots.map(lotId => {
                            // Chercher le lot dans la liste des lots chargés
                            const foundLot = lots.find(l => l.id === lotId);
                            return foundLot?.numero_lot || lotId;
                          });
                          lotNumbers = lotNumeros.join('\n');
                        }
                        setWorkAddress({
                          numeros_civiques: addr.numeros_civiques || [""],
                          rue: addr.rue || "",
                          ville: addr.ville || "",
                          province: addr.province || "QC",
                          code_postal: addr.code_postal || "",
                          numero_lot: lotNumbers
                        });
                      }
                    }}
                  />

                  {/* Étape 4: Mandats */}
                  <MandatStepForm
                    disabled={isLocked}
                    mandats={mandatsInfo}
                    onMandatsChange={(newMandats) => {
                      if (isLocked) return;
                      setMandatsInfo(newMandats);
                      setHasFormChanges(true);
                    }}
                    isCollapsed={mandatStepCollapsed}
                    onToggleCollapse={() => setMandatStepCollapsed(!mandatStepCollapsed)}
                    statut={formData.statut}
                  />

                  {/* Étape 5: Tarification */}
                  <TarificationStepForm
                    disabled={isLocked}
                    mandats={mandatsInfo}
                    onTarificationChange={(newMandats) => {
                      if (isLocked) return;
                      setMandatsInfo(newMandats);
                      setHasFormChanges(true);
                    }}
                    isCollapsed={tarificationStepCollapsed}
                    onToggleCollapse={() => setTarificationStepCollapsed(!tarificationStepCollapsed)}
                  />

                  {/* Étape 6: Documents */}
                  {formData.arpenteur_geometre && (clientInfo.prenom || clientInfo.nom || formData.numero_dossier) && (
                    <DocumentsStepForm
                      arpenteurGeometre={formData.arpenteur_geometre}
                      numeroDossier={formData.numero_dossier}
                      isCollapsed={documentsStepCollapsed}
                      onToggleCollapse={() => setDocumentsStepCollapsed(!documentsStepCollapsed)}
                      onDocumentsChange={setHasDocuments}
                      isTemporaire={!formData.numero_dossier}
                      clientInfo={clientInfo}
                    />
                  )}

                </form>
                  </div>

                  {/* Sidebar - 30% */}
                  <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
                  {/* Carte de l'adresse des travaux - Collapsible */}
                  <div 
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                    onClick={() => setMapCollapsed(!mapCollapsed)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <h3 className="text-slate-300 text-base font-semibold">Carte</h3>
                    </div>
                    {mapCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                  {!mapCollapsed && (workAddress.rue || workAddress.ville) && (
                    <div className="p-4 border-b border-slate-800 flex-shrink-0 max-h-[25%]">
                      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden h-full">
                        <div className="aspect-square w-full max-h-[calc(100%-28px)]">
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                              `${workAddress.numeros_civiques?.[0] || ''} ${workAddress.rue || ''}, ${workAddress.ville || ''}, ${workAddress.province || 'Québec'}, Canada`
                            )}&zoom=15`}
                          />
                        </div>
                        <div className="p-2 bg-slate-800/80">
                          <p className="text-xs text-slate-300 truncate">
                            📍 {workAddress.numeros_civiques?.[0]} {workAddress.rue}, {workAddress.ville}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Header Tabs Commentaires/Historique - Collapsible */}
                  <div 
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  >
                    <div className="flex items-center gap-2">
                      {sidebarTab === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
                      <h3 className="text-slate-300 text-base font-semibold">
                        {sidebarTab === "commentaires" ? "Commentaires" : "Historique"}
                      </h3>
                    </div>
                    {sidebarCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>

                  {!sidebarCollapsed && (
                    <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col overflow-hidden">
                      <TabsList className="grid grid-cols-2 h-9 mx-4 mr-6 mt-2 flex-shrink-0 bg-transparent gap-2">
                        <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Commentaires
                        </TabsTrigger>
                        <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                          <Clock className="w-4 h-4 mr-1" />
                          Historique
                        </TabsTrigger>
                      </TabsList>
                    
                    <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 pr-6 mt-0">
                      <CommentairesSection
                        dossierId={editingDossier?.id}
                        dossierTemporaire={!editingDossier}
                        commentairesTemp={commentairesTemporaires}
                        onCommentairesTempChange={setCommentairesTemporaires}
                      />
                    </TabsContent>
                    
                    <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
                      {historique.length > 0 ? (
                        <div className="space-y-2">
                          {historique.map((entry, idx) => (
                            <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium">{entry.action}</p>
                                  {entry.details && (
                                    <p className="text-slate-400 text-xs mt-1 break-words">{entry.details}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500">
                                    <span className="text-emerald-400">{entry.utilisateur_nom}</span>
                                    <span>•</span>
                                    <span>{format(new Date(entry.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-center">
                          <div>
                            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-500">Aucune action enregistrée</p>
                            <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    </Tabs>
                  )}
                  </div>
                  </div>

                  {/* Boutons - Seulement bouton Créer pour nouveau mandat */}
                  {!editingPriseMandat && (
                    <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
                      <Button type="submit" form="dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                        Créer
                      </Button>
                    </div>
                  )}

                  </motion.div>
                  </DialogContent>
                  </Dialog>

          {/* Dialog pour ouvrir un dossier - Formulaire complet comme dans Dossiers */}
          <Dialog open={isOuvrirDossierDialogOpen} onOpenChange={(open) => {
            if (!open) {
              // Vérifier si des modifications ont été faites par rapport à l'état initial
              const initialMandats = mandatsInfo.filter(m => m.type_mandat).map(m => ({
                type_mandat: m.type_mandat,
                date_livraison: m.date_livraison || ""
              }));
              const currentMandats = nouveauDossierForm.mandats.map(m => ({
                type_mandat: m.type_mandat,
                date_livraison: m.date_livraison || ""
              }));
              
              const hasChanges = nouveauDossierForm.numero_dossier || 
                JSON.stringify(nouveauDossierForm.clients_ids) !== JSON.stringify(formData.clients_ids) ||
                nouveauDossierForm.notaires_ids.length > 0 ||
                nouveauDossierForm.courtiers_ids.length > 0 ||
                nouveauDossierForm.mandats.some(m => m.utilisateur_assigne) ||
                JSON.stringify(currentMandats) !== JSON.stringify(initialMandats) ||
                commentairesTemporairesDossier.length !== commentairesTemporaires.length ||
                dossierDocuments.length > 0;
              
              if (hasChanges) {
                setShowCancelConfirmDossier(true);
              } else {
                setIsOuvrirDossierDialogOpen(false);
                setNouveauDossierForm({
                  numero_dossier: "",
                  arpenteur_geometre: "",
                  place_affaire: "",
                  date_ouverture: new Date().toISOString().split('T')[0],
                  statut: "Ouvert",
                  ttl: "Non",
                  clients_ids: [],
                  notaires_ids: [],
                  courtiers_ids: [],
                  mandats: []
                });
                setCommentairesTemporairesDossier([]);
                setDossierDocuments([]);
                setActiveTabMandatDossier("0");
              }
            } else {
              setIsOuvrirDossierDialogOpen(open);
            }
          }}>
            <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
              <DialogHeader className="sr-only">
                <DialogTitle className="text-2xl">Nouveau dossier</DialogTitle>
              </DialogHeader>
              <motion.div 
                className="flex flex-col h-[90vh]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Nouveau dossier</h2>
                    {nouveauDossierForm.numero_dossier && nouveauDossierForm.arpenteur_geometre && (
                      <p className="text-emerald-400 text-lg font-semibold mt-1 flex items-center gap-2 flex-wrap">
                        <span>
                          {getArpenteurInitials(nouveauDossierForm.arpenteur_geometre)}{nouveauDossierForm.numero_dossier}
                          {nouveauDossierForm.clients_ids.length > 0 && getClientsNames(nouveauDossierForm.clients_ids) !== "-" && (
                            <span> - {getClientsNames(nouveauDossierForm.clients_ids)}</span>
                          )}
                        </span>
                        {nouveauDossierForm.mandats && nouveauDossierForm.mandats.length > 0 && (
                          <span className="flex gap-1">
                            {nouveauDossierForm.mandats.slice(0, 3).map((m, idx) => m.type_mandat && (
                              <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>
                                {getAbbreviatedMandatType(m.type_mandat)}
                              </Badge>
                            ))}
                            {nouveauDossierForm.mandats.length > 3 && (
                              <Badge className="bg-slate-700 text-slate-300 text-xs">
                                +{nouveauDossierForm.mandats.length - 3}
                              </Badge>
                            )}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <form id="nouveau-dossier-form" onSubmit={async (e) => {
                    e.preventDefault();
                    
                    // Vérifier que le numéro de dossier n'existe pas déjà
                    const dossierExistant = dossiers.find(d => 
                      d.numero_dossier === nouveauDossierForm.numero_dossier &&
                      d.arpenteur_geometre === nouveauDossierForm.arpenteur_geometre
                    );
                    
                    if (dossierExistant) {
                      alert(`Le numéro de dossier ${nouveauDossierForm.numero_dossier} existe déjà pour ${nouveauDossierForm.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
                      return;
                    }

                    // Validation : au moins un mandat doit exister
                    if (nouveauDossierForm.mandats.length === 0) {
                      alert("Vous devez ajouter au moins un mandat avant d'ouvrir un dossier.");
                      return;
                    }

                    // Validation : tous les mandats doivent avoir un utilisateur assigné
                    const mandatsSansUtilisateur = nouveauDossierForm.mandats.filter(m => !m.utilisateur_assigne);
                    if (mandatsSansUtilisateur.length > 0) {
                      setShowMissingUserWarning(true);
                      return;
                    }

                    try {
                      // Créer le dossier SharePoint
                      await base44.functions.invoke('createSharePointFolder', {
                        arpenteur_geometre: nouveauDossierForm.arpenteur_geometre,
                        numero_dossier: nouveauDossierForm.numero_dossier
                      });

                      // Transférer les documents du dossier temporaire vers le dossier définitif
                      const initialsArp = getArpenteurInitials(nouveauDossierForm.arpenteur_geometre).replace('-', '');
                      const clientName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim() || "Client";
                      const tempFolderPath = `ARPENTEUR/${initialsArp}/DOSSIER/TEMPORAIRE/${initialsArp}-${clientName}/INTRANTS`;
                      const finalFolderPath = `ARPENTEUR/${initialsArp}/DOSSIER/${initialsArp}-${nouveauDossierForm.numero_dossier}/INTRANTS`;

                      console.log(`[TRANSFERT] Début du transfert des documents`);
                      console.log(`[TRANSFERT] Source: ${tempFolderPath}`);
                      console.log(`[TRANSFERT] Destination: ${finalFolderPath}`);

                      try {
                        const moveResponse = await base44.functions.invoke('moveSharePointFiles', {
                          sourceFolderPath: tempFolderPath,
                          destinationFolderPath: finalFolderPath
                        });

                        if (moveResponse.data?.success) {
                          console.log(`[TRANSFERT] ✓ ${moveResponse.data.movedCount} fichier(s) déplacé(s) avec succès`);
                        } else {
                          console.error(`[TRANSFERT] ✗ Erreur:`, moveResponse.data?.error);
                        }
                      } catch (transferError) {
                        console.error("[TRANSFERT] ✗ Erreur lors du transfert:", transferError);
                      }

                      // Mettre à jour chaque mandat avec tache_actuelle: "Cédule"
                      const mandatsAvecCedule = nouveauDossierForm.mandats.map(m => ({
                        ...m,
                        tache_actuelle: "Cédule"
                      }));
                      
                      const dossierDataAvecCedule = {
                        ...nouveauDossierForm,
                        mandats: mandatsAvecCedule
                      };
                      // Créer un commentaire récapitulatif avec les infos MANUELLES du dossier
                      let infoCommentaire = "<h2 style='font-size: 1.31em;'><strong>📋 Informations du mandat</strong></h2>\n\n";
                      let hasAnyManualInfo = false;
                      
                      // Vérifier si un texte saisi correspond à un professionnel sélectionné
                      const selectedClientsNames = nouveauDossierForm.clients_ids.map(id => {
                        const c = clients.find(cl => cl.id === id);
                        return c ? `${c.prenom} ${c.nom}`.trim() : '';
                      });
                      const selectedNotairesNames = nouveauDossierForm.notaires_ids.map(id => {
                        const n = notaires.find(nt => nt.id === id);
                        return n ? `${n.prenom} ${n.nom}`.trim() : '';
                      });
                      const selectedCourtiersNames = nouveauDossierForm.courtiers_ids.map(id => {
                        const ct = courtiers.find(cr => cr.id === id);
                        return ct ? `${ct.prenom} ${ct.nom}`.trim() : '';
                      });
                      const compagnies = clients.filter(c => c.type_client === 'Compagnie');
                      const selectedCompagniesNames = (nouveauDossierForm.compagnies_ids || []).map(id => {
                        const cp = compagnies.find(cmp => cmp.id === id);
                        return cp ? `${cp.prenom} ${cp.nom}`.trim() : '';
                      });
                      
                      // Client saisi manuellement (si différent des sélectionnés)
                      const clientSaisiManuel = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
                      if ((clientInfo.prenom || clientInfo.nom || clientInfo.telephone || clientInfo.courriel) && 
                          !selectedClientsNames.includes(clientSaisiManuel)) {
                        hasAnyManualInfo = true;
                        infoCommentaire += `<strong><u>Client</u></strong>\n`;
                        if (clientInfo.prenom || clientInfo.nom) {
                          infoCommentaire += clientSaisiManuel + "\n";
                        }
                        if (clientInfo.telephone) infoCommentaire += `Tél (${clientInfo.type_telephone || 'Cellulaire'}): ${clientInfo.telephone}\n`;
                        if (clientInfo.courriel) infoCommentaire += `Email: ${clientInfo.courriel}\n`;
                        infoCommentaire += "\n";
                      }
                      
                      // Notaire saisi manuellement (si différent des sélectionnés)
                      if (professionnelInfo.notaire && !selectedNotairesNames.includes(professionnelInfo.notaire.trim())) {
                        hasAnyManualInfo = true;
                        infoCommentaire += `<strong><u>Notaire</u></strong>\n`;
                        infoCommentaire += `${professionnelInfo.notaire}\n\n`;
                      }
                      
                      // Courtier saisi manuellement (si différent des sélectionnés)
                      if (professionnelInfo.courtier && !selectedCourtiersNames.includes(professionnelInfo.courtier.trim())) {
                        hasAnyManualInfo = true;
                        infoCommentaire += `<strong><u>Courtier immobilier</u></strong>\n`;
                        infoCommentaire += `${professionnelInfo.courtier}\n\n`;
                      }
                      
                      // Compagnie saisie manuellement (si différente des sélectionnées)
                      if (professionnelInfo.compagnie && !selectedCompagniesNames.includes(professionnelInfo.compagnie.trim())) {
                        hasAnyManualInfo = true;
                        infoCommentaire += `<strong><u>Compagnie</u></strong>\n`;
                        infoCommentaire += `${professionnelInfo.compagnie}\n\n`;
                      }
                      
                      // Lots (saisis manuellement dans workAddress.numero_lot)
                      if (workAddress.numero_lot && workAddress.numero_lot.trim()) {
                        const lotsArray = workAddress.numero_lot.split('\n').filter(l => l.trim());
                        if (lotsArray.length > 0) {
                          hasAnyManualInfo = true;
                          infoCommentaire += `<strong><u>Lots</u></strong>\n`;
                          lotsArray.forEach(lot => {
                            infoCommentaire += `${lot.trim()}\n`;
                          });
                          infoCommentaire += "\n";
                        }
                      }
                      
                      // Préparer les commentaires finaux - ajouter le commentaire récapitulatif seulement s'il y a des infos manuelles
                      let commentairesFinaux = [...commentairesTemporairesDossier];
                      if (hasAnyManualInfo) {
                        const commentaireInfos = {
                          contenu: infoCommentaire,
                          utilisateur_email: user?.email || "",
                          utilisateur_nom: user?.full_name || "Système",
                          created_date: new Date().toISOString()
                        };
                        commentairesFinaux = [commentaireInfos, ...commentairesTemporairesDossier];
                      }
                      
                      const newDossier = await createDossierMutation.mutateAsync({ 
                        dossierData: dossierDataAvecCedule,
                        commentairesToCreate: commentairesFinaux
                      });
                      
                      // Créer des notifications pour chaque utilisateur assigné à un mandat
                      const notificationPromises = mandatsAvecCedule
                        .filter(m => m.utilisateur_assigne)
                        .map(m => {
                          const clientsNames = getClientsNames(dossierDataAvecCedule.clients_ids);
                          const numeroDossier = `${getArpenteurInitials(dossierDataAvecCedule.arpenteur_geometre)}${dossierDataAvecCedule.numero_dossier}`;
                          
                          return base44.entities.Notification.create({
                            utilisateur_email: m.utilisateur_assigne,
                            titre: "Nouvelle tâche assignée",
                            message: `La tâche "Cédule" du mandat "${m.type_mandat}" du dossier ${numeroDossier}${clientsNames && clientsNames !== '-' ? ` - ${clientsNames}` : ''} vous a été assignée.`,
                            type: "dossier",
                            dossier_id: newDossier.id,
                            lue: false
                          });
                        });
                      
                      await Promise.all(notificationPromises);
                      queryClient.invalidateQueries({ queryKey: ['notifications'] });
                      
                      // Envoyer un email aux clients
                      const clientsEmails = dossierDataAvecCedule.clients_ids
                        .map(id => {
                          const client = clients.find(c => c.id === id);
                          return client?.courriels?.find(c => c.actuel)?.courriel || client?.courriels?.[0]?.courriel;
                        })
                        .filter(email => email);
                      
                      // Récupérer les emails des notaires et courtiers pour CC
                      const notairesEmails = (dossierDataAvecCedule.notaires_ids || [])
                        .map(id => {
                          const notaire = clients.find(c => c.id === id);
                          return notaire?.courriels?.find(c => c.actuel)?.courriel || notaire?.courriels?.[0]?.courriel;
                        })
                        .filter(email => email);
                      
                      const courtiersEmails = (dossierDataAvecCedule.courtiers_ids || [])
                        .map(id => {
                          const courtier = clients.find(c => c.id === id);
                          return courtier?.courriels?.find(c => c.actuel)?.courriel || courtier?.courriels?.[0]?.courriel;
                        })
                        .filter(email => email);
                      
                      // Construire le contenu de l'email
                      for (const clientEmail of clientsEmails) {
                        const client = clients.find(c => c.courriels?.some(ce => ce.courriel === clientEmail));
                        const nomClient = client ? `${client.prenom} ${client.nom}` : "Client";
                        
                        const mandatsDescription = mandatsAvecCedule.map(m => m.type_mandat).join(', ');
                        const adresseComplete = mandatsAvecCedule[0]?.adresse_travaux 
                          ? formatAdresse(mandatsAvecCedule[0].adresse_travaux)
                          : "à déterminer";
                        
                        // Trouver la date de livraison la plus éloignée parmi tous les mandats
                        const datesLivraison = mandatsAvecCedule
                          .map(m => m.date_livraison)
                          .filter(d => d)
                          .sort((a, b) => new Date(b) - new Date(a));
                        const dateLivraison = datesLivraison[0] 
                          ? format(new Date(datesLivraison[0]), "dd MMMM yyyy", { locale: fr })
                          : "à déterminer";
                        
                        const dateOuverture = format(new Date(dossierDataAvecCedule.date_ouverture), "dd MMMM yyyy", { locale: fr });
                        
                        const emailBody = `Bonjour ${nomClient},

Nous vous confirmons par la présente l'ouverture de votre dossier d'arpentage en date du ${dateOuverture}, concernant le(s) mandat(s) suivant(s) : ${mandatsDescription}, à être réalisé(s) à l'adresse ${adresseComplete}.

La date prévue de livraison des documents est fixée au ${dateLivraison}, sous réserve des délais liés aux autorisations, à l'accès au site et aux conditions terrain.

Nous communiquerons avec vous si des informations supplémentaires sont requises ou si un ajustement au calendrier devait s'avérer nécessaire.

N'hésitez pas à nous contacter pour toute question ou précision.

Veuillez agréer, ${nomClient}, nos salutations distinguées.`;
                        
                        // Envoyer l'email au client
                        await base44.integrations.Core.SendEmail({
                          to: clientEmail,
                          subject: `Confirmation d'ouverture de dossier ${getArpenteurInitials(dossierDataAvecCedule.arpenteur_geometre)}${dossierDataAvecCedule.numero_dossier}`,
                          body: emailBody,
                          from_name: "GTG - Guay Turcotte Gilbert"
                        });
                        
                        // Envoyer aussi aux notaires et courtiers en CC
                        for (const notaireEmail of notairesEmails) {
                          await base44.integrations.Core.SendEmail({
                            to: notaireEmail,
                            subject: `Confirmation d'ouverture de dossier ${getArpenteurInitials(dossierDataAvecCedule.arpenteur_geometre)}${dossierDataAvecCedule.numero_dossier}`,
                            body: emailBody,
                            from_name: "GTG - Guay Turcotte Gilbert"
                          });
                        }
                        
                        for (const courtierEmail of courtiersEmails) {
                          await base44.integrations.Core.SendEmail({
                            to: courtierEmail,
                            subject: `Confirmation d'ouverture de dossier ${getArpenteurInitials(dossierDataAvecCedule.arpenteur_geometre)}${dossierDataAvecCedule.numero_dossier}`,
                            body: emailBody,
                            from_name: "GTG - Guay Turcotte Gilbert"
                          });
                        }
                      }
                      
                      // Supprimer la prise de mandat si elle existe
                      if (editingPriseMandat?.id) {
                        await deletePriseMandatMutation.mutateAsync(editingPriseMandat.id);
                      }
                      
                      setIsOuvrirDossierDialogOpen(false);
                      setIsDialogOpen(false);
                      resetFullForm();
                      setCommentairesTemporairesDossier([]);
                      alert(`Dossier ${getArpenteurInitials(nouveauDossierForm.arpenteur_geometre)}${nouveauDossierForm.numero_dossier} créé avec succès !`);
                    } catch (error) {
                      console.error("Erreur lors de la création du dossier:", error);
                      alert("Erreur lors de la création du dossier.");
                    }
                  }} className="space-y-3">
                    {/* Section Informations du dossier */}
                    <Card className="border-slate-700 bg-slate-800/30">
                        <CardHeader 
                          className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20"
                          onClick={() => setInfoDossierCollapsed(!infoDossierCollapsed)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                                <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                              </div>
                              <CardTitle className="text-blue-300 text-base">Informations du dossier</CardTitle>
                              {nouveauDossierForm.numero_dossier && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                  {getArpenteurInitials(nouveauDossierForm.arpenteur_geometre)}{nouveauDossierForm.numero_dossier}
                                </Badge>
                              )}
                            </div>
                            {infoDossierCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                          </div>
                        </CardHeader>

                        {!infoDossierCollapsed && (
                          <CardContent className="pt-2 pb-3">
                           <div className="grid grid-cols-[33%_67%] gap-4">
                             {/* Colonne gauche - Informations de base - 33% */}
                             <div className="space-y-2 border-r border-slate-700 pr-4">
                               <div className="space-y-1">
                                 <Label className="text-slate-400 text-xs">Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                                 <Select value={nouveauDossierForm.arpenteur_geometre} onValueChange={(value) => setNouveauDossierForm({...nouveauDossierForm, arpenteur_geometre: value})}>
                                   <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                                     <SelectValue placeholder="Sélectionner" />
                                   </SelectTrigger>
                                   <SelectContent className="bg-slate-800 border-slate-700">
                                     {ARPENTEURS.map((arpenteur) => (
                                       <SelectItem key={arpenteur} value={arpenteur} className="text-white text-sm">{arpenteur}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div className="space-y-1">
                                 <Label className="text-slate-400 text-xs">N° de dossier <span className="text-red-400">*</span></Label>
                                 <Input value={nouveauDossierForm.numero_dossier} onChange={(e) => setNouveauDossierForm({...nouveauDossierForm, numero_dossier: e.target.value})} required placeholder="Ex: 2024-001" className="bg-slate-700 border-slate-600 text-white h-7 text-sm" />
                               </div>
                               <div className="space-y-1">
                                 <Label className="text-slate-400 text-xs">Date d'ouverture <span className="text-red-400">*</span></Label>
                                 <Input type="date" value={nouveauDossierForm.date_ouverture} onChange={(e) => setNouveauDossierForm({...nouveauDossierForm, date_ouverture: e.target.value})} required className="bg-slate-700 border-slate-600 text-white h-7 text-sm" />
                               </div>
                               <div className="space-y-1">
                                 <Label className="text-slate-400 text-xs">Place d'affaire</Label>
                                 <Select value={nouveauDossierForm.place_affaire || ""} onValueChange={(value) => setNouveauDossierForm({...nouveauDossierForm, place_affaire: value})}>
                                   <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                                     <SelectValue placeholder="Sélectionner" />
                                   </SelectTrigger>
                                   <SelectContent className="bg-slate-800 border-slate-700">
                                     <SelectItem value="Alma" className="text-white text-sm">Alma</SelectItem>
                                     <SelectItem value="Saguenay" className="text-white text-sm">Saguenay</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>

                             {/* Colonne droite - Tabs Clients/Notaires/Courtiers - 67% */}
                             <div>
                            <Tabs value={activeContactTab} onValueChange={setActiveContactTab} className="w-full">
                              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 h-7">
                                <TabsTrigger value="clients" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Clients {nouveauDossierForm.clients_ids.length > 0 && `(${nouveauDossierForm.clients_ids.length})`}
                                </TabsTrigger>
                                <TabsTrigger value="notaires" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Notaires {nouveauDossierForm.notaires_ids.length > 0 && `(${nouveauDossierForm.notaires_ids.length})`}
                                </TabsTrigger>
                                <TabsTrigger value="courtiers" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Courtiers {nouveauDossierForm.courtiers_ids.length > 0 && `(${nouveauDossierForm.courtiers_ids.length})`}
                                </TabsTrigger>
                                <TabsTrigger value="compagnies" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  Compagnies {(nouveauDossierForm.compagnies_ids || []).length > 0 && `(${nouveauDossierForm.compagnies_ids.length})`}
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="clients" className="mt-2">
                              <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
                                {/* Colonne gauche - Clients sélectionnés */}
                                <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
                                 <div className="flex items-center justify-between mb-2">
                                   <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                    {nouveauDossierForm.clients_ids.length > 0 ? (
                                      <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                        {nouveauDossierForm.clients_ids.map(clientId => {
                                          const client = clients.find(c => c.id === clientId);
                                          if (!client) return null;
                                          const currentPhone = client.telephones?.find(t => t.actuel)?.telephone || client.telephones?.[0]?.telephone || "";
                                          const currentEmail = client.courriels?.find(c => c.actuel)?.courriel || client.courriels?.[0]?.courriel || "";
                                          const preferences = client.preferences_livraison || [];
                                          return (
                                            <div 
                                              key={clientId} 
                                              className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-blue-500/30 transition-colors"
                                              onClick={() => {
                                                setEditingClientForForm(client);
                                                setClientTypeForForm(client.type_client);
                                                setIsClientFormDialogOpen(true);
                                              }}
                                            >
                                              <button 
                                                type="button" 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setNouveauDossierForm(prev => ({...prev, clients_ids: prev.clients_ids.filter(id => id !== clientId)}));
                                                }} 
                                                className="absolute right-1 top-1 hover:text-red-400 text-blue-300"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                              <div className="space-y-1 pr-4">
                                                <div className="font-semibold">{client.prenom} {client.nom}</div>
                                                {currentEmail && <div className="text-[10px] text-slate-300">✉️ {currentEmail}</div>}
                                                {currentPhone && <div className="text-[10px] text-slate-300">📞 {currentPhone}</div>}
                                                {preferences.length > 0 && (
                                                  <div className="flex gap-1">
                                                    {preferences.map(pref => (
                                                      <span key={pref} className="text-[10px] bg-blue-600/30 px-1 py-0.5 rounded">
                                                        {pref === "Main propre" ? "✋" : pref === "Poste" ? "📮" : "📧"}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">
                                        Aucun client sélectionné
                                      </div>
                                    )}
                                   </div>
                                   {!contactsListCollapsed && (
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant="ghost"
                                       onClick={() => setContactsListCollapsed(true)}
                                       className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                     >
                                       <ChevronUp className="w-4 h-4 rotate-90" />
                                     </Button>
                                   )}
                                   {contactsListCollapsed && (
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant="ghost"
                                       onClick={() => setContactsListCollapsed(false)}
                                       className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                     >
                                       <ChevronDown className="w-4 h-4 rotate-90" />
                                     </Button>
                                   )}
                                 </div>
                                </div>

                                {/* Colonne droite - Liste des clients existants */}
                                <div className={`border-l border-slate-700 pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
                                  <div className="mb-2 flex gap-2">
                                    <div className="relative flex-1">
                                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                      <Input
                                        placeholder="Rechercher..."
                                        value={clientSearchTerm}
                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                        className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        setEditingClientForForm(null);
                                        setClientTypeForForm("Client");
                                        setIsClientFormDialogOpen(true);
                                      }}
                                      className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                    <p className="text-slate-400 text-xs mb-2">Clients existants ({filteredClientsForSelector.length})</p>
                                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                                      {filteredClientsForSelector.length > 0 ? (
                                        filteredClientsForSelector.slice(0, 15).map((client) => {
                                          const isSelected = nouveauDossierForm.clients_ids.includes(client.id);
                                          return (
                                            <div
                                              key={client.id}
                                              onClick={() => {
                                                setNouveauDossierForm(prev => ({
                                                  ...prev,
                                                  clients_ids: prev.clients_ids.includes(client.id)
                                                    ? prev.clients_ids.filter(id => id !== client.id)
                                                    : [...prev.clients_ids, client.id]
                                                }));
                                              }}
                                              className={`px-2 py-1.5 rounded text-xs cursor-pointer ${
                                                isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{client.prenom} {client.nom}</span>
                                                {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                                              </div>
                                              <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                                                {client.telephones?.find(t => t.actuel)?.telephone && (
                                                  <p>
                                                    📞 <a 
                                                      href={`tel:${client.telephones.find(t => t.actuel).telephone.replace(/\D/g, '')}`}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                                    >
                                                      {client.telephones.find(t => t.actuel).telephone}
                                                    </a>
                                                  </p>
                                                )}
                                                {client.courriels?.find(c => c.actuel)?.courriel && <p className="truncate">✉️ {client.courriels.find(c => c.actuel).courriel}</p>}
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                       <p className="text-slate-500 text-xs text-center py-2">Aucun client</p>
                                      )}
                                      </div>
                                      </div>
                                      </div>
                                      </TabsContent>

                                      <TabsContent value="notaires" className="mt-2">
                                      <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
                                      {/* Colonne gauche - Notaires sélectionnés */}
                                      <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
                                      <div className="flex items-center justify-between mb-2">
                                      <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                        {nouveauDossierForm.notaires_ids.length > 0 ? (
                                          <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                            {nouveauDossierForm.notaires_ids.map(notaireId => {
                                              const notaire = clients.find(c => c.id === notaireId);
                                              if (!notaire) return null;
                                              const currentPhone = notaire.telephones?.find(t => t.actuel)?.telephone || notaire.telephones?.[0]?.telephone || "";
                                              const currentEmail = notaire.courriels?.find(c => c.actuel)?.courriel || notaire.courriels?.[0]?.courriel || "";
                                              const preferences = notaire.preferences_livraison || [];
                                              return (
                                                <div 
                                                  key={notaireId} 
                                                  className="bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-purple-500/30 transition-colors"
                                                  onClick={() => {
                                                    setEditingClientForForm(notaire);
                                                    setClientTypeForForm(notaire.type_client);
                                                    setIsClientFormDialogOpen(true);
                                                  }}
                                                >
                                                  <button 
                                                    type="button" 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setNouveauDossierForm(prev => ({...prev, notaires_ids: prev.notaires_ids.filter(id => id !== notaireId)}));
                                                    }} 
                                                    className="absolute right-1 top-1 hover:text-red-400 text-purple-300"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                  <div className="space-y-1 pr-4">
                                                    <div className="font-semibold">{notaire.prenom} {notaire.nom}</div>
                                                    {currentEmail && <div className="text-[10px] text-slate-300">✉️ {currentEmail}</div>}
                                                    {currentPhone && <div className="text-[10px] text-slate-300">📞 {currentPhone}</div>}
                                                    {preferences.length > 0 && (
                                                      <div className="flex gap-1">
                                                        {preferences.map(pref => (
                                                          <span key={pref} className="text-[10px] bg-purple-600/30 px-1 py-0.5 rounded">
                                                            {pref === "Main propre" ? "✋" : pref === "Poste" ? "📮" : "📧"}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">
                                            Aucun notaire sélectionné
                                          </div>
                                        )}
                                      </div>
                                      {!contactsListCollapsed && (
                                       <Button
                                         type="button"
                                         size="sm"
                                         variant="ghost"
                                         onClick={() => setContactsListCollapsed(true)}
                                         className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                       >
                                         <ChevronUp className="w-4 h-4 rotate-90" />
                                       </Button>
                                      )}
                                      {contactsListCollapsed && (
                                       <Button
                                         type="button"
                                         size="sm"
                                         variant="ghost"
                                         onClick={() => setContactsListCollapsed(false)}
                                         className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                       >
                                         <ChevronDown className="w-4 h-4 rotate-90" />
                                       </Button>
                                      )}
                                      </div>
                                      </div>

                                      {/* Colonne droite - Liste des notaires existants */}
                                      <div className={`border-l border-slate-700 pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
                                      <div className="mb-2 flex gap-2">
                                      <div className="relative flex-1">
                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                        <Input
                                          placeholder="Rechercher..."
                                          value={notaireSearchTerm}
                                          onChange={(e) => setNotaireSearchTerm(e.target.value)}
                                          className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                          setEditingClientForForm(null);
                                          setClientTypeForForm("Notaire");
                                          setIsClientFormDialogOpen(true);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                      </div>
                                    <p className="text-slate-400 text-xs mb-2">Notaires existants ({filteredNotairesForSelector.length})</p>
                                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                                      {filteredNotairesForSelector.length > 0 ? (
                                        filteredNotairesForSelector.slice(0, 15).map((notaire) => {
                                          const isSelected = nouveauDossierForm.notaires_ids.includes(notaire.id);
                                          return (
                                            <div
                                              key={notaire.id}
                                              onClick={() => {
                                                setNouveauDossierForm(prev => ({
                                                  ...prev,
                                                  notaires_ids: prev.notaires_ids.includes(notaire.id)
                                                    ? prev.notaires_ids.filter(id => id !== notaire.id)
                                                    : [...prev.notaires_ids, notaire.id]
                                                }));
                                              }}
                                              className={`px-2 py-1.5 rounded text-xs cursor-pointer ${
                                                isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{notaire.prenom} {notaire.nom}</span>
                                                {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                                              </div>
                                              <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                                                {notaire.telephones?.find(t => t.actuel)?.telephone && (
                                                  <p>
                                                    📞 <a 
                                                      href={`tel:${notaire.telephones.find(t => t.actuel).telephone.replace(/\D/g, '')}`}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                                    >
                                                      {notaire.telephones.find(t => t.actuel).telephone}
                                                    </a>
                                                  </p>
                                                )}
                                                {notaire.courriels?.find(c => c.actuel)?.courriel && <p className="truncate">✉️ {notaire.courriels.find(c => c.actuel).courriel}</p>}
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                       <p className="text-slate-500 text-xs text-center py-2">Aucun notaire</p>
                                      )}
                                      </div>
                                      </div>
                                      </div>
                                      </TabsContent>

                              <TabsContent value="courtiers" className="mt-2">
                                <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
                                  {/* Colonne gauche - Courtiers sélectionnés */}
                                  <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
                                   <div className="flex items-center justify-between mb-2">
                                     <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                        {nouveauDossierForm.courtiers_ids.length > 0 ? (
                                          <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                            {nouveauDossierForm.courtiers_ids.map(courtierId => {
                                              const courtier = clients.find(c => c.id === courtierId);
                                              if (!courtier) return null;
                                              const currentPhone = courtier.telephones?.find(t => t.actuel)?.telephone || courtier.telephones?.[0]?.telephone || "";
                                              const currentEmail = courtier.courriels?.find(c => c.actuel)?.courriel || courtier.courriels?.[0]?.courriel || "";
                                              const preferences = courtier.preferences_livraison || [];
                                              return (
                                                <div 
                                                  key={courtierId} 
                                                  className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-orange-500/30 transition-colors"
                                                  onClick={() => {
                                                    setEditingClientForForm(courtier);
                                                    setClientTypeForForm(courtier.type_client);
                                                    setIsClientFormDialogOpen(true);
                                                  }}
                                                >
                                                  <button 
                                                    type="button" 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setNouveauDossierForm(prev => ({...prev, courtiers_ids: prev.courtiers_ids.filter(id => id !== courtierId)}));
                                                    }} 
                                                    className="absolute right-1 top-1 hover:text-red-400 text-orange-300"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                  <div className="space-y-1 pr-4">
                                                    <div className="font-semibold">{courtier.prenom} {courtier.nom}</div>
                                                    {currentEmail && <div className="text-[10px] text-slate-300">✉️ {currentEmail}</div>}
                                                    {currentPhone && <div className="text-[10px] text-slate-300">📞 {currentPhone}</div>}
                                                    {preferences.length > 0 && (
                                                      <div className="flex gap-1">
                                                        {preferences.map(pref => (
                                                          <span key={pref} className="text-[10px] bg-orange-600/30 px-1 py-0.5 rounded">
                                                            {pref === "Main propre" ? "✋" : pref === "Poste" ? "📮" : "📧"}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">
                                            Aucun courtier sélectionné
                                          </div>
                                        )}
                                      </div>
                                     {!contactsListCollapsed && (
                                       <Button
                                         type="button"
                                         size="sm"
                                         variant="ghost"
                                         onClick={() => setContactsListCollapsed(true)}
                                         className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                       >
                                         <ChevronUp className="w-4 h-4 rotate-90" />
                                       </Button>
                                     )}
                                     {contactsListCollapsed && (
                                       <Button
                                         type="button"
                                         size="sm"
                                         variant="ghost"
                                         onClick={() => setContactsListCollapsed(false)}
                                         className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                       >
                                         <ChevronDown className="w-4 h-4 rotate-90" />
                                       </Button>
                                     )}
                                   </div>
                                  </div>

                                  {/* Colonne droite - Liste des courtiers existants */}
                                  <div className={`border-l border-slate-700 pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
                                    <div className="mb-2 flex gap-2">
                                      <div className="relative flex-1">
                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                        <Input
                                          placeholder="Rechercher..."
                                          value={courtierSearchTerm}
                                          onChange={(e) => setCourtierSearchTerm(e.target.value)}
                                          className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                          setEditingClientForForm(null);
                                          setClientTypeForForm("Courtier immobilier");
                                          setIsClientFormDialogOpen(true);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <p className="text-slate-400 text-xs mb-2">Courtiers existants ({filteredCourtiersForSelector.length})</p>
                                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                                      {filteredCourtiersForSelector.length > 0 ? (
                                        filteredCourtiersForSelector.slice(0, 15).map((courtier) => {
                                          const isSelected = nouveauDossierForm.courtiers_ids.includes(courtier.id);
                                          return (
                                            <div
                                              key={courtier.id}
                                              onClick={() => {
                                                setNouveauDossierForm(prev => ({
                                                  ...prev,
                                                  courtiers_ids: prev.courtiers_ids.includes(courtier.id)
                                                    ? prev.courtiers_ids.filter(id => id !== courtier.id)
                                                    : [...prev.courtiers_ids, courtier.id]
                                                }));
                                              }}
                                              className={`px-2 py-1.5 rounded text-xs cursor-pointer ${
                                                isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{courtier.prenom} {courtier.nom}</span>
                                                {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                                              </div>
                                              <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                                                {courtier.telephones?.find(t => t.actuel)?.telephone && (
                                                  <p>
                                                    📞 <a 
                                                      href={`tel:${courtier.telephones.find(t => t.actuel).telephone.replace(/\D/g, '')}`}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                                    >
                                                      {courtier.telephones.find(t => t.actuel).telephone}
                                                    </a>
                                                  </p>
                                                )}
                                                {courtier.courriels?.find(c => c.actuel)?.courriel && <p className="truncate">✉️ {courtier.courriels.find(c => c.actuel).courriel}</p>}
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                       <p className="text-slate-500 text-xs text-center py-2">Aucun courtier</p>
                                      )}
                                      </div>
                                      </div>
                                      </div>
                                      </TabsContent>

                              <TabsContent value="compagnies" className="mt-2">
                                <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
                                  {/* Colonne gauche - Compagnies sélectionnées */}
                                  <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
                                   <div className="flex items-center justify-between mb-2">
                                     <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                        {(nouveauDossierForm.compagnies_ids || []).length > 0 ? (
                                          <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                            {nouveauDossierForm.compagnies_ids.map(compagnieId => {
                                              const compagnie = clients.find(c => c.id === compagnieId);
                                              if (!compagnie) return null;
                                              const currentPhone = compagnie.telephones?.find(t => t.actuel)?.telephone || compagnie.telephones?.[0]?.telephone || "";
                                              const currentEmail = compagnie.courriels?.find(c => c.actuel)?.courriel || compagnie.courriels?.[0]?.courriel || "";
                                              const preferences = compagnie.preferences_livraison || [];
                                              return (
                                                <div 
                                                  key={compagnieId} 
                                                  className="bg-green-500/20 text-green-400 border border-green-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-green-500/30 transition-colors"
                                                  onClick={() => {
                                                    setEditingClientForForm(compagnie);
                                                    setClientTypeForForm(compagnie.type_client);
                                                    setIsClientFormDialogOpen(true);
                                                  }}
                                                >
                                                  <button 
                                                    type="button" 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setNouveauDossierForm(prev => ({...prev, compagnies_ids: (prev.compagnies_ids || []).filter(id => id !== compagnieId)}));
                                                    }} 
                                                    className="absolute right-1 top-1 hover:text-red-400 text-green-300"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                  <div className="space-y-1 pr-4">
                                                    <div className="font-semibold">{compagnie.prenom} {compagnie.nom}</div>
                                                    {currentEmail && <div className="text-[10px] text-slate-300">✉️ {currentEmail}</div>}
                                                    {currentPhone && <div className="text-[10px] text-slate-300">📞 {currentPhone}</div>}
                                                    {preferences.length > 0 && (
                                                      <div className="flex gap-1">
                                                        {preferences.map(pref => (
                                                          <span key={pref} className="text-[10px] bg-green-600/30 px-1 py-0.5 rounded">
                                                            {pref === "Main propre" ? "✋" : pref === "Poste" ? "📮" : "📧"}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">
                                            Aucune compagnie sélectionnée
                                          </div>
                                        )}
                                      </div>
                                     {!contactsListCollapsed && (
                                       <Button
                                         type="button"
                                         size="sm"
                                         variant="ghost"
                                         onClick={() => setContactsListCollapsed(true)}
                                         className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                       >
                                         <ChevronUp className="w-4 h-4 rotate-90" />
                                       </Button>
                                     )}
                                     {contactsListCollapsed && (
                                       <Button
                                         type="button"
                                         size="sm"
                                         variant="ghost"
                                         onClick={() => setContactsListCollapsed(false)}
                                         className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                       >
                                         <ChevronDown className="w-4 h-4 rotate-90" />
                                       </Button>
                                     )}
                                   </div>
                                  </div>

                                  {/* Colonne droite - Liste des compagnies existantes */}
                                  <div className={`border-l border-slate-700 pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
                                    <div className="mb-2 flex gap-2">
                                      <div className="relative flex-1">
                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                        <Input
                                          placeholder="Rechercher..."
                                          value={courtierSearchTerm}
                                          onChange={(e) => setCourtierSearchTerm(e.target.value)}
                                          className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                          setEditingClientForForm(null);
                                          setClientTypeForForm("Compagnie");
                                          setIsClientFormDialogOpen(true);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <p className="text-slate-400 text-xs mb-2">Compagnies existantes ({clients.filter(c => c.type_client === 'Compagnie').length})</p>
                                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                                      {clients.filter(c => c.type_client === 'Compagnie').length > 0 ? (
                                        clients.filter(c => c.type_client === 'Compagnie').slice(0, 15).map((compagnie) => {
                                          const isSelected = (nouveauDossierForm.compagnies_ids || []).includes(compagnie.id);
                                          return (
                                            <div
                                              key={compagnie.id}
                                              onClick={() => {
                                                setNouveauDossierForm(prev => ({
                                                  ...prev,
                                                  compagnies_ids: (prev.compagnies_ids || []).includes(compagnie.id)
                                                    ? prev.compagnies_ids.filter(id => id !== compagnie.id)
                                                    : [...(prev.compagnies_ids || []), compagnie.id]
                                                }));
                                              }}
                                              className={`px-2 py-1.5 rounded text-xs cursor-pointer ${
                                                isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{compagnie.prenom} {compagnie.nom}</span>
                                                {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                                              </div>
                                              <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                                                {compagnie.telephones?.find(t => t.actuel)?.telephone && (
                                                  <p>
                                                    📞 <a 
                                                      href={`tel:${compagnie.telephones.find(t => t.actuel).telephone.replace(/\D/g, '')}`}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                                    >
                                                      {compagnie.telephones.find(t => t.actuel).telephone}
                                                    </a>
                                                  </p>
                                                )}
                                                {compagnie.courriels?.find(c => c.actuel)?.courriel && <p className="truncate">✉️ {compagnie.courriels.find(c => c.actuel).courriel}</p>}
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                       <p className="text-slate-500 text-xs text-center py-2">Aucune compagnie</p>
                                      )}
                                      </div>
                                      </div>
                                      </div>
                                      </TabsContent>
                            </Tabs>
                             </div>
                           </div>
                          </CardContent>
                        )}
                      </Card>

                    {/* Section Mandats */}
                    <Card className="border-slate-700 bg-slate-800/30">
                        <CardHeader 
                          className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-1.5 bg-orange-900/20"
                          onClick={() => setMandatStepCollapsed(!mandatStepCollapsed)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center">
                                <FileText className="w-3.5 h-3.5 text-orange-400" />
                              </div>
                              <CardTitle className="text-orange-300 text-base">Mandats</CardTitle>
                              {nouveauDossierForm.mandats.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {nouveauDossierForm.mandats.slice(0, 3).map((m, idx) => m.type_mandat && (
                                    <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>
                                      {getAbbreviatedMandatType(m.type_mandat)}
                                    </Badge>
                                  ))}
                                  {nouveauDossierForm.mandats.length > 3 && (
                                    <Badge className="bg-slate-700 text-slate-300 text-xs">
                                      +{nouveauDossierForm.mandats.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            {mandatStepCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                          </div>
                        </CardHeader>

                        {!mandatStepCollapsed && (
                          <CardContent className="pt-2 pb-3">
                            {nouveauDossierForm.mandats.length > 0 ? (
                              <Tabs value={activeTabMandatDossier} onValueChange={setActiveTabMandatDossier} className="w-full">
                                <div className="flex justify-between items-center mb-0 gap-3">
                                 {/* Tabs à gauche */}
                                 <div className="flex-1">
                                   <TabsList className="bg-slate-800/30 border border-slate-700 h-auto justify-start p-1 rounded-lg inline-flex">
                                      {nouveauDossierForm.mandats.map((mandat, index) => (
                                        <TabsTrigger
                                          key={index}
                                          value={index.toString()}
                                          className="orange data-[state=active]:bg-orange-500/30 data-[state=active]:text-orange-300 data-[state=active]:border-b-2 data-[state=active]:border-orange-300 text-slate-300 px-3 py-1 text-xs font-medium rounded-md transition-all"
                                        >
                                          {mandat.type_mandat || `Mandat ${index + 1}`}
                                        </TabsTrigger>
                                      ))}
                                    </TabsList>
                                  </div>
                                  
                                  {/* Boutons à droite */}
                                  <div className="flex gap-1">
                                    {nouveauDossierForm.mandats.length > 1 && (
                                      <Button 
                                        type="button" 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => {
                                         const indexToRemove = parseInt(activeTabMandatDossier);
                                         setMandatIndexToDelete(indexToRemove);
                                         setShowDeleteMandatConfirm(true);
                                        }}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                    <Button type="button" size="sm" onClick={() => {
                          const newIndex = nouveauDossierForm.mandats.length;
                          const firstMandat = nouveauDossierForm.mandats[0];
                          const defaultAdresse = sameAddressForAllMandats && firstMandat?.adresse_travaux ? JSON.parse(JSON.stringify(firstMandat.adresse_travaux)) : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "QC" };
                          const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : [];
                          
                          setNouveauDossierForm(prev => ({
                            ...prev,
                            mandats: [...prev.mandats, {
                              type_mandat: "",
                              date_ouverture: "",
                              minute: "",
                              date_minute: "",
                              type_minute: "Initiale",
                              minutes_list: [],
                              tache_actuelle: "",
                              statut_terrain: "",
                              adresse_travaux: defaultAdresse,
                              lots: defaultLots,
                              prix_estime: 0,
                              rabais: 0,
                              taxes_incluses: false,
                              date_livraison: "",
                              date_signature: "",
                              date_debut_travaux: "",
                              terrain: {
                                date_limite_leve: "",
                                instruments_requis: "",
                                a_rendez_vous: false,
                                date_rendez_vous: "",
                                heure_rendez_vous: "",
                                donneur: "",
                                technicien: "",
                                dossier_simultane: "",
                                temps_prevu: "",
                                notes: ""
                              },
                              factures: [],
                              notes: "",
                              utilisateur_assigne: ""
                            }]
                          }));
                          setActiveTabMandatDossier(newIndex.toString());
                              }} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 h-6 text-xs">
                                      <Plus className="w-3 h-3 mr-1" />
                                      Ajouter
                                    </Button>
                                  </div>
                                </div>

                                {nouveauDossierForm.mandats.map((mandat, index) => (
                                  <TabsContent key={index} value={index.toString()} className="mt-2 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-slate-400 text-xs">Type de mandat</Label>
                                        <Select value={mandat.type_mandat} onValueChange={(value) => {
                                          setNouveauDossierForm(prev => ({
                                            ...prev,
                                            mandats: prev.mandats.map((m, i) => i === index ? { ...m, type_mandat: value } : m)
                                          }));
                                        }}>
                                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
                                            <SelectValue placeholder="Sélectionner" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-slate-800 border-slate-700">
                                            {TYPES_MANDATS.map((type) => (
                                              <SelectItem key={type} value={type} className="text-white text-xs">{type}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-slate-400 text-xs">Utilisateur assigné <span className="text-red-400">*</span></Label>
                                        <Select value={mandat.utilisateur_assigne} onValueChange={(value) => {
                                          setNouveauDossierForm(prev => ({
                                            ...prev,
                                            mandats: prev.mandats.map((m, i) => i === index ? { ...m, utilisateur_assigne: value } : m)
                                          }));
                                        }}>
                                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
                                            <SelectValue placeholder="Sélectionner" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-slate-800 border-slate-700">
                                            {users.map((u) => (
                                              <SelectItem key={u.email} value={u.email} className="text-white text-xs">{u.full_name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    
                                    {/* Ligne délimitative */}
                                    <div className="border-t border-slate-600 my-2"></div>

                                    {/* Grille avec Adresse et Dates côte à côte */}
                                    <div className="grid grid-cols-[60%_1px_40%] gap-3">
                                      {/* Adresse des travaux - 60% */}
                                      <div className="space-y-2">
                                        <Label className="text-slate-400 text-xs">Adresse des travaux</Label>
                                        {/* Barre de recherche d'adresse */}
                                        <div className="relative">
                                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3 z-10" />
                                          <Input
                                            placeholder="Rechercher une adresse..."
                                            value={addressSearchQuery}
                                          onChange={async (e) => {
                                            const query = e.target.value;
                                            setAddressSearchQuery(query);
                                            setCurrentMandatIndexForAddress(index);

                                            if (addressSearchTimeout) clearTimeout(addressSearchTimeout);

                                            if (query.length >= 3) {
                                              const timeout = setTimeout(async () => {
                                                setIsSearchingAddress(true);
                                                try {
                                                  const searchQuery = query.toLowerCase().includes('alma') ? query : `${query}, Alma, Québec`;
                                                  const encodedQuery = encodeURIComponent(searchQuery);

                                                  const response = await fetch(
                                                    `https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/AdressesQuebec_Geocodage/GeocodeServer/findAddressCandidates?SingleLine=${encodedQuery}&f=json&outFields=*&maxLocations=10`
                                                  );
                                                  const data = await response.json();

                                                  if (data.candidates && data.candidates.length > 0) {
                                                    const formattedAddresses = data.candidates.map(candidate => {
                                                      const attrs = candidate.attributes || {};
                                                      const fullAddr = candidate.address || attrs.Match_addr || "";

                                                      let numero_civique = attrs.AddNum || "";
                                                      let rue = attrs.StName || "";
                                                      let ville = attrs.City || attrs.Municipalit || "";
                                                      let code_postal = attrs.Postal || "";

                                                      if (!numero_civique || !rue) {
                                                        const parts = fullAddr.split(',');
                                                        if (parts.length > 0) {
                                                          const streetPart = parts[0].trim();
                                                          const numMatch = streetPart.match(/^(\d+[-\d]*)\s+(.+)$/);
                                                          if (numMatch) {
                                                            numero_civique = numMatch[1];
                                                            rue = numMatch[2];
                                                          } else {
                                                            rue = streetPart;
                                                          }
                                                        }
                                                        if (parts.length > 1 && !ville) {
                                                          ville = parts[1].trim();
                                                        }
                                                        if (!code_postal) {
                                                          const postalMatch = fullAddr.match(/([A-Z]\d[A-Z]\s?\d[A-Z]\d)/i);
                                                          if (postalMatch) {
                                                            code_postal = postalMatch[1].toUpperCase();
                                                          }
                                                        }
                                                      }

                                                      return {
                                                        numero_civique,
                                                        rue,
                                                        ville,
                                                        province: "QC",
                                                        code_postal,
                                                        full_address: fullAddr
                                                      };
                                                    });
                                                    setAddressSuggestions(formattedAddresses);
                                                  } else {
                                                    setAddressSuggestions([]);
                                                  }
                                                } catch (error) {
                                                  console.error("Erreur recherche adresse:", error);
                                                  setAddressSuggestions([]);
                                                } finally {
                                                  setIsSearchingAddress(false);
                                                }
                                              }, 500);
                                              setAddressSearchTimeout(timeout);
                                            } else {
                                              setAddressSuggestions([]);
                                            }
                                          }}
                                            className="bg-slate-700 border-slate-600 text-white h-6 text-xs pl-7"
                                          />
                                          {isSearchingAddress && (
                                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-2 top-1/2 -translate-y-1/2" />
                                          )}
                                          </div>

                                          {/* Suggestions d'adresses */}
                                          {addressSuggestions.length > 0 && (
                                          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {addressSuggestions.map((suggestion, idx) => (
                                              <div
                                                key={idx}
                                                onClick={() => {
                                                  const newAddress = {
                                                    numeros_civiques: [suggestion.numero_civique || ""],
                                                    rue: suggestion.rue || "",
                                                    ville: suggestion.ville || "",
                                                    province: suggestion.province || "QC",
                                                    code_postal: suggestion.code_postal || ""
                                                  };

                                                  if (sameAddressForAllMandats) {
                                                    setNouveauDossierForm(prev => ({
                                                      ...prev,
                                                      mandats: prev.mandats.map(m => ({
                                                        ...m,
                                                        adresse_travaux: JSON.parse(JSON.stringify(newAddress))
                                                      }))
                                                    }));
                                                  } else {
                                                    setNouveauDossierForm(prev => ({
                                                      ...prev,
                                                      mandats: prev.mandats.map((m, i) => i === currentMandatIndexForAddress ? {
                                                        ...m,
                                                        adresse_travaux: newAddress
                                                      } : m)
                                                    }));
                                                  }
                                                  setAddressSearchQuery("");
                                                  setAddressSuggestions([]);
                                                }}
                                                className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm text-slate-300 flex items-center gap-2 border-b border-slate-700 last:border-b-0"
                                              >
                                                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                <span>{suggestion.full_address || `${suggestion.numero_civique} ${suggestion.rue}, ${suggestion.ville}`}</span>
                                              </div>
                                            ))}
                                          </div>
                                          )}

                                          <div className="grid grid-cols-[100px_1fr] gap-1">
                                           <div className="space-y-0.5">
                                             <Label className="text-slate-500 text-[10px]">N° civique</Label>
                                             <Input 
                                               placeholder="123" 
                                               value={mandat.adresse_travaux?.numeros_civiques?.[0] || ""} 
                                               onChange={(e) => {
                                                 const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                   ...m, 
                                                   adresse_travaux: { ...m.adresse_travaux, numeros_civiques: [e.target.value] } 
                                                 } : m;
                                                 setNouveauDossierForm(prev => ({
                                                   ...prev,
                                                   mandats: prev.mandats.map(updateAddress)
                                                 }));
                                               }}
                                               className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                             />
                                           </div>
                                           <div className="space-y-0.5">
                                             <Label className="text-slate-500 text-[10px]">Rue</Label>
                                             <Input 
                                               placeholder="Rue principale" 
                                               value={mandat.adresse_travaux?.rue || ""} 
                                               onChange={(e) => {
                                                 const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                   ...m, 
                                                   adresse_travaux: { ...m.adresse_travaux, rue: e.target.value } 
                                                 } : m;
                                                 setNouveauDossierForm(prev => ({
                                                   ...prev,
                                                   mandats: prev.mandats.map(updateAddress)
                                                 }));
                                               }}
                                               className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                             />
                                           </div>
                                         </div>
                                         <div className="grid grid-cols-3 gap-1">
                                           <div className="space-y-0.5">
                                             <Label className="text-slate-500 text-[10px]">Ville</Label>
                                             <Input 
                                               placeholder="Ville" 
                                               value={mandat.adresse_travaux?.ville || ""} 
                                               onChange={(e) => {
                                                 const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                   ...m, 
                                                   adresse_travaux: { ...m.adresse_travaux, ville: e.target.value } 
                                                 } : m;
                                                 setNouveauDossierForm(prev => ({
                                                   ...prev,
                                                   mandats: prev.mandats.map(updateAddress)
                                                 }));
                                               }}
                                               className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                             />
                                           </div>
                                           <div className="space-y-0.5">
                                             <Label className="text-slate-500 text-[10px]">Code postal</Label>
                                             <Input 
                                               placeholder="G0A 1A0" 
                                               value={mandat.adresse_travaux?.code_postal || ""} 
                                               onChange={(e) => {
                                                 const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                   ...m, 
                                                   adresse_travaux: { ...m.adresse_travaux, code_postal: e.target.value } 
                                                 } : m;
                                                 setNouveauDossierForm(prev => ({
                                                   ...prev,
                                                   mandats: prev.mandats.map(updateAddress)
                                                 }));
                                               }}
                                               className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                             />
                                           </div>
                                           <div className="space-y-0.5">
                                             <Label className="text-slate-500 text-[10px]">Province</Label>
                                             <Select 
                                               value={mandat.adresse_travaux?.province || "QC"} 
                                               onValueChange={(value) => {
                                                 const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                   ...m, 
                                                   adresse_travaux: { ...m.adresse_travaux, province: value } 
                                                 } : m;
                                                 setNouveauDossierForm(prev => ({
                                                   ...prev,
                                                   mandats: prev.mandats.map(updateAddress)
                                                 }));
                                               }}
                                             >
                                               <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-20">
                                                 <SelectValue />
                                               </SelectTrigger>
                                               <SelectContent className="bg-slate-800 border-slate-700">
                                                 {["QC", "AB", "BC", "PE", "MB", "NB", "NS", "NU", "ON", "SK", "NL", "NT", "YT"].map(prov => (
                                                   <SelectItem key={prov} value={prov} className="text-white text-xs">{prov}</SelectItem>
                                                 ))}
                                               </SelectContent>
                                             </Select>
                                           </div>
                                         </div>
                                        </div>

                                        {/* Séparateur vertical */}
                                        <div className="bg-slate-600"></div>

                                        {/* Dates - 40% vertical */}
                                        <div className="space-y-2 pr-2">
                                          <div className="space-y-1">
                                          <Label className="text-slate-400 text-xs">Date de signature</Label>
                                          <Input 
                                            type="date" 
                                            value={mandat.date_signature || ""} 
                                            onChange={(e) => {
                                              setNouveauDossierForm(prev => ({
                                                ...prev,
                                                mandats: prev.mandats.map((m, i) => i === index ? { ...m, date_signature: e.target.value } : m)
                                              }));
                                            }}
                                            className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-slate-400 text-xs">Début des travaux</Label>
                                          <Input 
                                            type="date" 
                                            value={mandat.date_debut_travaux || ""} 
                                            onChange={(e) => {
                                              setNouveauDossierForm(prev => ({
                                                ...prev,
                                                mandats: prev.mandats.map((m, i) => i === index ? { ...m, date_debut_travaux: e.target.value } : m)
                                              }));
                                            }}
                                            className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-slate-400 text-xs">Date de livraison <span className="text-red-400">*</span></Label>
                                          <Input 
                                            type="date" 
                                            value={mandat.date_livraison || mandatsInfo[0]?.date_livraison || ""} 
                                            onChange={(e) => {
                                              setNouveauDossierForm(prev => ({
                                                ...prev,
                                                mandats: prev.mandats.map((m, i) => i === index ? { ...m, date_livraison: e.target.value } : m)
                                              }));
                                            }}
                                            required
                                            className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                          />
                                        </div>
                                      </div>
                                      </div>

                                      {/* Ligne séparatrice */}
                                      <div className="border-t border-slate-600 my-2"></div>

                                      {/* Section Lots */}
                                      <div className={`grid ${lotTabExpanded && currentMandatIndexDossier === index ? 'grid-cols-[50%_50%]' : 'grid-cols-1'} gap-4 transition-all`}>
                                        {/* Colonne gauche - Lots sélectionnés */}
                                        <div className={`space-y-2 ${lotTabExpanded && currentMandatIndexDossier === index ? 'border-r border-slate-700 pr-4' : ''}`}>
                                          <div className="flex items-center justify-between">
                                            <Label className="text-slate-400 text-xs">Lot</Label>
                                            <div className="flex items-center gap-1.5">
                                              <Checkbox
                                                id={`sameLotsForAllMandats-${index}`}
                                                checked={sameLotsForAllMandats}
                                                onCheckedChange={(checked) => {
                                                  setSameLotsForAllMandats(checked);
                                                  if (checked) {
                                                    const currentLots = mandat.lots || [];
                                                    setNouveauDossierForm(prev => ({
                                                      ...prev,
                                                      mandats: prev.mandats.map(m => ({ ...m, lots: currentLots }))
                                                    }));
                                                  }
                                                }}
                                              />
                                              <Label htmlFor={`sameLotsForAllMandats-${index}`} className="text-slate-400 text-[11px] cursor-pointer">Appliquer à tous les mandats</Label>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                              {mandat.lots && mandat.lots.length > 0 ? (
                                               <div className="grid grid-cols-2 gap-2">
                                                  {mandat.lots.map((lotId) => {
                                                   const lot = getLotById(lotId);
                                                   return (
                                                     <div 
                                                       key={lotId} 
                                                       className="bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-orange-500/20 transition-colors"
                                                       onClick={async () => {
                                                         setEditingLot(lot);
                                                         const formState = {
                                                           numero_lot: lot?.numero_lot || "",
                                                           circonscription_fonciere: lot?.circonscription_fonciere || "",
                                                           cadastre: lot?.cadastre || "Québec",
                                                           rang: lot?.rang || "",
                                                           types_operation: lot?.types_operation || []
                                                         };
                                                         setNewLotForm(formState);
                                                         setInitialLotForm(formState);
                                                         setAvailableCadastresForNewLot(CADASTRES_PAR_CIRCONSCRIPTION[lot?.circonscription_fonciere] || []);
                                                         setCommentairesTemporairesLot([]);
                                                         setLotInfoCollapsed(true);
                                                         setTypesOperationCollapsed(true);
                                                         setLotDocumentsCollapsed(true);

                                                         // Charger l'historique du lot
                                                         const logs = await base44.entities.ActionLog.filter({ entite: 'Lot', entite_id: lot.id }, '-created_date');
                                                         setLotActionLogs(logs);

                                                         setIsNewLotDialogOpen(true);
                                                       }}
                                                     >
                                                       <button 
                                                         type="button" 
                                                         onClick={(e) => {
                                                           e.stopPropagation();
                                                           const newLots = (mandat.lots || []).filter(id => id !== lotId);
                                                           if (sameLotsForAllMandats) {
                                                             setNouveauDossierForm(prev => ({
                                                               ...prev,
                                                               mandats: prev.mandats.map(m => ({ ...m, lots: newLots }))
                                                             }));
                                                           } else {
                                                             setNouveauDossierForm(prev => ({
                                                               ...prev,
                                                               mandats: prev.mandats.map((m, i) => i === index ? { ...m, lots: newLots } : m)
                                                             }));
                                                           }
                                                         }}
                                                         className="absolute right-1 top-1 hover:text-red-400"
                                                       >
                                                         <X className="w-3 h-3" />
                                                       </button>
                                                       <div className="pr-5 space-y-0.5">
                                                         <p className="font-semibold text-orange-400">{lot?.numero_lot || lotId}</p>
                                                         <p className="text-slate-400">{lot?.circonscription_fonciere}</p>
                                                         <p className="text-slate-500">
                                                           {[lot?.rang, lot?.cadastre].filter(Boolean).join(' • ')}
                                                         </p>
                                                       </div>
                                                     </div>
                                                   );
                                                 })}
                                               </div>
                                              ) : (
                                               <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">
                                                 Aucun lot sélectionné
                                               </div>
                                              )}
                                            </div>
                                            {!(lotTabExpanded && currentMandatIndexDossier === index) && (
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  setCurrentMandatIndexDossier(index);
                                                  setLotTabExpanded(true);
                                                }}
                                                className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                              >
                                                <ChevronDown className="w-4 h-4 rotate-90" />
                                              </Button>
                                            )}
                                            {lotTabExpanded && currentMandatIndexDossier === index && (
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setLotTabExpanded(false)}
                                                className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                              >
                                                <ChevronUp className="w-4 h-4 rotate-90" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>

                                        {/* Colonne droite - Liste des lots existants */}
                                        <div className={`border-l border-slate-700 pl-3 pr-2 ${!(lotTabExpanded && currentMandatIndexDossier === index) ? 'hidden' : ''}`}>
                                          <div className="mb-2 flex gap-2">
                                            <div className="relative flex-1">
                                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                              <Input
                                                placeholder="Rechercher lot..."
                                                value={lotSearchTerm}
                                                onChange={(e) => setLotSearchTerm(e.target.value)}
                                                className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                              />
                                            </div>
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => {
                                                setCurrentMandatIndexDossier(index);
                                                setIsNewLotDialogOpen(true);
                                              }}
                                              className="text-orange-400 hover:text-orange-300 h-6 w-6 p-0"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </Button>
                                          </div>

                                          <p className="text-slate-400 text-xs mb-2">Lots existants ({lots.filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.cadastre?.toLowerCase().includes(lotSearchTerm.toLowerCase())).length})</p>
                                          <div className="max-h-[200px] overflow-y-auto space-y-1">
                                            {lots.filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.cadastre?.toLowerCase().includes(lotSearchTerm.toLowerCase())).length > 0 ? (
                                               lots.filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.cadastre?.toLowerCase().includes(lotSearchTerm.toLowerCase())).slice(0, 20).map((lot) => {
                                                 const isSelected = mandat.lots?.includes(lot.id);
                                                 return (
                                                   <div
                                                          key={lot.id}
                                                          onClick={() => {
                                                           const currentLots = nouveauDossierForm.mandats[index].lots || [];
                                                           const lotIsSelected = currentLots.includes(lot.id);
                                                           const newLots = lotIsSelected
                                                             ? currentLots.filter(id => id !== lot.id)
                                                             : [...currentLots, lot.id];

                                                           if (sameLotsForAllMandats) {
                                                             setNouveauDossierForm(prev => ({
                                                               ...prev,
                                                               mandats: prev.mandats.map(m => ({ ...m, lots: newLots }))
                                                             }));
                                                           } else {
                                                             setNouveauDossierForm(prev => ({
                                                               ...prev,
                                                               mandats: prev.mandats.map((m, i) => i === index ? { ...m, lots: newLots } : m)
                                                             }));
                                                           }
                                                          }}
                                                          className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-all ${
                                                            isSelected ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:border-orange-500'
                                                          }`}
                                                        >
                                                          <p className="text-white font-semibold text-xs truncate">
                                                            {lot.numero_lot}
                                                            {lot.rang && <span className="text-slate-300 font-normal"> • {lot.rang}</span>}
                                                            {lot.cadastre && <span className="text-slate-300 font-normal"> • {lot.cadastre}</span>}
                                                            <span className="text-slate-400 font-normal"> • {lot.circonscription_fonciere}</span>
                                                            {isSelected && <Check className="w-3 h-3 ml-2 inline" />}
                                                          </p>
                                                        </div>
                                                 );
                                               })
                                             ) : (
                                               <p className="text-slate-500 text-xs text-center py-2">Aucun lot</p>
                                             )}
                                          </div>
                                        </div>
                                      </div>
                                  </TabsContent>
                                  ))}
                                  </Tabs>
                                  ) : (
                                  <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-lg">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                                    <p className="text-sm mb-4">Aucun mandat ajouté</p>
                                    <Button type="button" size="sm" onClick={() => {
                                      const newIndex = 0;
                                      setNouveauDossierForm(prev => ({
                                        ...prev,
                                        mandats: [{
                                          type_mandat: "",
                                          date_ouverture: "",
                                          minute: "",
                                          date_minute: "",
                                          type_minute: "Initiale",
                                          minutes_list: [],
                                          tache_actuelle: "",
                                          statut_terrain: "",
                                          adresse_travaux: { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "QC" },
                                          lots: [],
                                          prix_estime: 0,
                                          rabais: 0,
                                          taxes_incluses: false,
                                          date_livraison: "",
                                          date_signature: "",
                                          date_debut_travaux: "",
                                          terrain: {
                                            date_limite_leve: "",
                                            instruments_requis: "",
                                            a_rendez_vous: false,
                                            date_rendez_vous: "",
                                            heure_rendez_vous: "",
                                            donneur: "",
                                            technicien: "",
                                            dossier_simultane: "",
                                            temps_prevu: "",
                                            notes: ""
                                          },
                                          factures: [],
                                          notes: "",
                                          utilisateur_assigne: ""
                                        }]
                                      }));
                                      setActiveTabMandatDossier(newIndex.toString());
                                    }} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border-none">
                                      <Plus className="w-4 h-4 mr-2" />
                                      Ajouter un mandat
                                    </Button>
                                  </div>
                                  )}
                                  </CardContent>
                                  )}
                                  </Card>

                    {/* Section Tarification */}
                    <TarificationStepForm
                      disabled={false}
                      mandats={nouveauDossierForm.mandats}
                      onTarificationChange={(updatedMandats) => {
                        setNouveauDossierForm(prev => ({
                          ...prev,
                          mandats: updatedMandats
                        }));
                      }}
                      isCollapsed={tarificationStepCollapsed}
                      onToggleCollapse={() => setTarificationStepCollapsed(!tarificationStepCollapsed)}
                    />

                    {/* Section Documents - Utiliser DocumentsStepForm */}
                    {nouveauDossierForm.numero_dossier && nouveauDossierForm.arpenteur_geometre && (
                      <DocumentsStepForm
                        arpenteurGeometre={nouveauDossierForm.arpenteur_geometre}
                        numeroDossier={nouveauDossierForm.numero_dossier}
                        isCollapsed={documentsCollapsed}
                        onToggleCollapse={() => setDocumentsCollapsed(!documentsCollapsed)}
                        onDocumentsChange={(hasFiles) => {}}
                      />
                    )}
                  </form>
                  </div>

                  <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
                  {/* Carte de l'adresse des travaux - Collapsible */}
                  <div 
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                    onClick={() => setMapCollapsedDossier(!mapCollapsedDossier)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <h3 className="text-slate-300 text-base font-semibold">Carte</h3>
                    </div>
                    {mapCollapsedDossier ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                  {!mapCollapsedDossier && nouveauDossierForm.mandats.length > 0 && nouveauDossierForm.mandats[activeTabMandatDossier]?.adresse_travaux && (
                    nouveauDossierForm.mandats[activeTabMandatDossier].adresse_travaux.rue || nouveauDossierForm.mandats[activeTabMandatDossier].adresse_travaux.ville
                  ) && (
                    <div className="p-4 border-b border-slate-800 flex-shrink-0 max-h-[25%]">
                      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden h-full">
                        <div className="aspect-square w-full max-h-[calc(100%-28px)]">
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                              `${nouveauDossierForm.mandats[activeTabMandatDossier]?.adresse_travaux?.numeros_civiques?.[0] || ''} ${nouveauDossierForm.mandats[activeTabMandatDossier]?.adresse_travaux?.rue || ''}, ${nouveauDossierForm.mandats[activeTabMandatDossier]?.adresse_travaux?.ville || ''}, ${nouveauDossierForm.mandats[activeTabMandatDossier]?.adresse_travaux?.province || 'Québec'}, Canada`
                            )}&zoom=15`}
                          />
                        </div>
                        <div className="p-2 bg-slate-800/80">
                          <p className="text-xs text-slate-300 truncate">
                            📍 {nouveauDossierForm.mandats[activeTabMandatDossier]?.adresse_travaux?.numeros_civiques?.[0]} {nouveauDossierForm.mandats[activeTabMandatDossier]?.adresse_travaux?.rue}, {nouveauDossierForm.mandats[activeTabMandatDossier]?.adresse_travaux?.ville}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Header Tabs Commentaires/Historique - Collapsible */}
                  <div 
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                    onClick={() => setSidebarCollapsedDossier(!sidebarCollapsedDossier)}
                  >
                    <div className="flex items-center gap-2">
                      {sidebarTabDossier === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
                      <h3 className="text-slate-300 text-base font-semibold">
                        {sidebarTabDossier === "commentaires" ? "Commentaires" : "Historique"}
                      </h3>
                    </div>
                    {sidebarCollapsedDossier ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>

                  {!sidebarCollapsedDossier && (
                    <Tabs value={sidebarTabDossier} onValueChange={setSidebarTabDossier} className="flex-1 flex flex-col overflow-hidden">
                      <TabsList className="grid grid-cols-2 h-9 mx-4 mr-6 mt-2 flex-shrink-0 bg-transparent gap-2">
                        <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Commentaires
                        </TabsTrigger>
                        <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                          <Clock className="w-4 h-4 mr-1" />
                          Historique
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 pr-6 mt-0">
                        <CommentairesSection dossierId={null} dossierTemporaire={true} commentairesTemp={commentairesTemporairesDossier} onCommentairesTempChange={setCommentairesTemporairesDossier} />
                      </TabsContent>
                      
                      <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
                        {historiqueDossier.length > 0 ? (
                          <div className="space-y-2">
                            {historiqueDossier.map((entry, idx) => (
                              <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium">{entry.action}</p>
                                    {entry.details && (
                                      <p className="text-slate-400 text-xs mt-1 break-words">{entry.details}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500">
                                      <span className="text-emerald-400">{entry.utilisateur_nom}</span>
                                      <span>•</span>
                                      <span>{format(new Date(entry.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-center">
                            <div>
                              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="text-slate-500">Aucune action enregistrée</p>
                              <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      </Tabs>
                      )}
                      </div>
                      </div>

                      {/* Boutons Annuler/Créer tout en bas - pleine largeur */}
                      <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
                      <Button type="button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={() => {
                      const initialMandats = mandatsInfo.filter(m => m.type_mandat).map(m => ({
                      type_mandat: m.type_mandat,
                      date_livraison: m.date_livraison || ""
                      }));
                      const currentMandats = nouveauDossierForm.mandats.map(m => ({
                      type_mandat: m.type_mandat,
                      date_livraison: m.date_livraison || ""
                      }));

                      const hasChanges = nouveauDossierForm.numero_dossier || 
                      JSON.stringify(nouveauDossierForm.clients_ids) !== JSON.stringify(formData.clients_ids) ||
                      nouveauDossierForm.notaires_ids.length > 0 ||
                      nouveauDossierForm.courtiers_ids.length > 0 ||
                      nouveauDossierForm.mandats.some(m => m.utilisateur_assigne) ||
                      JSON.stringify(currentMandats) !== JSON.stringify(initialMandats) ||
                      commentairesTemporairesDossier.length !== commentairesTemporaires.length ||
                      dossierDocuments.length > 0;

                      if (hasChanges) {
                      setShowCancelConfirmDossier(true);
                      } else {
                      setIsOuvrirDossierDialogOpen(false);
                      setNouveauDossierForm({
                        numero_dossier: "",
                        arpenteur_geometre: "",
                        date_ouverture: new Date().toISOString().split('T')[0],
                        statut: "Ouvert",
                        ttl: "Non",
                        clients_ids: [],
                        notaires_ids: [],
                        courtiers_ids: [],
                        mandats: []
                      });
                      setCommentairesTemporairesDossier([]);
                      setDossierDocuments([]);
                      setActiveTabMandatDossier("0");
                      }
                      }}>
                      Annuler
                      </Button>
                      <Button type="submit" form="nouveau-dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      Ouvrir
                      </Button>
                      </div>
                      </motion.div>
                      </DialogContent>
                      </Dialog>

                      {/* Dialogs de sélection pour le formulaire de dossier */}



        </div>

        {/* Dialog de confirmation de changement de statut */}
        <Dialog open={showStatutChangeConfirm} onOpenChange={setShowStatutChangeConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Des documents sont liés à ce mandat. En changeant le statut, les documents associés au dossier SharePoint seront supprimés.
              </p>
              <p className="text-slate-400 text-sm text-center">
                Êtes-vous sûr de vouloir continuer ?
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowStatutChangeConfirm(false);
                    setPendingStatutChange(null);
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                  onClick={async () => {
                    const value = pendingStatutChange;
                    
                    // Supprimer les documents du dossier SharePoint
                    if (formData.numero_dossier && formData.arpenteur_geometre) {
                      try {
                        const initials = getArpenteurInitials(formData.arpenteur_geometre).replace('-', '');
                        const folderPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${formData.numero_dossier}/INTRANTS`;
                        
                        // Récupérer la liste des fichiers
                        const response = await base44.functions.invoke('sharepoint', {
                          action: 'list',
                          folderPath: folderPath
                        });
                        const files = response.data?.files || [];
                        
                        // Supprimer chaque fichier
                        for (const file of files) {
                          await base44.functions.invoke('sharepoint', {
                            action: 'delete',
                            fileId: file.id
                          });
                        }
                      } catch (error) {
                        console.error("Erreur suppression documents SharePoint:", error);
                      }
                    }
                    
                    if (value !== "Mandats à ouvrir") {
                      setFormData({...formData, statut: value, numero_dossier: "", date_ouverture: ""});
                    } else {
                      setFormData({...formData, statut: value});
                    }
                    setShowStatutChangeConfirm(false);
                    setPendingStatutChange(null);
                    setHasDocuments(false);
                  }}
                >
                  Confirmer
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation d'annulation - Nouveau mandat */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={async () => {
                    // Déverrouiller le mandat si on annule
                    if (editingPriseMandat && !isLocked) {
                      await base44.entities.PriseMandat.update(editingPriseMandat.id, {
                        ...editingPriseMandat,
                        locked_by: null,
                        locked_at: null
                      });
                      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
                    }
                    setShowCancelConfirm(false);
                    setIsDialogOpen(false);
                    resetFullForm();
                    setIsLocked(false);
                    setLockedBy("");
                  }}
                >
                  Abandonner
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowCancelConfirm(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Continuer l'édition
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog pour avertissement modifications non sauvegardées */}
        <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={async () => {
                    // Déverrouiller le mandat si on annule
                    if (editingPriseMandat && !isLocked) {
                      await base44.entities.PriseMandat.update(editingPriseMandat.id, {
                        ...editingPriseMandat,
                        locked_by: null,
                        locked_at: null
                      });
                      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
                    }
                    setShowUnsavedWarning(false);
                    setIsDialogOpen(false);
                    resetFullForm();
                    setIsLocked(false);
                    setLockedBy("");
                  }}
                >
                  Abandonner
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowUnsavedWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Continuer l'édition
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation d'annulation - Ouvrir dossier */}
        <Dialog open={showCancelConfirmDossier} onOpenChange={setShowCancelConfirmDossier}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir quitter ? Toutes les informations saisies seront perdues.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={() => {
                    setShowCancelConfirmDossier(false);
                    setIsOuvrirDossierDialogOpen(false);
                    setNouveauDossierForm({
                      numero_dossier: "",
                      arpenteur_geometre: "",
                      date_ouverture: new Date().toISOString().split('T')[0],
                      statut: "Ouvert",
                      ttl: "Non",
                      clients_ids: [],
                      notaires_ids: [],
                      courtiers_ids: [],
                      mandats: []
                    });
                    setCommentairesTemporairesDossier([]);
                    setDossierDocuments([]);
                    setActiveTabMandatDossier("0");
                  }}
                >
                  Abandonner
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowCancelConfirmDossier(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Continuer l'édition
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression de mandat */}
        <Dialog open={showDeleteMandatConfirm} onOpenChange={setShowDeleteMandatConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowDeleteMandatConfirm(false);
                    setMandatIndexToDelete(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={() => {
                    if (mandatIndexToDelete !== null) {
                      setNouveauDossierForm(prev => ({
                        ...prev,
                        mandats: prev.mandats.filter((_, i) => i !== mandatIndexToDelete)
                      }));
                      setActiveTabMandatDossier(Math.max(0, mandatIndexToDelete - 1).toString());
                    }
                    setShowDeleteMandatConfirm(false);
                    setMandatIndexToDelete(null);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement utilisateur assigné manquant */}
        <Dialog open={showMissingUserWarning} onOpenChange={setShowMissingUserWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Tous les mandats doivent avoir un utilisateur assigné avant de créer le dossier.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowMissingUserWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog pour validation arpenteur requis */}
        <Dialog open={showArpenteurRequiredDialog} onOpenChange={setShowArpenteurRequiredDialog}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Veuillez sélectionner un arpenteur-géomètre.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowArpenteurRequiredDialog(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de succès d'import .d01 */}
        <Dialog open={showD01ImportSuccess} onOpenChange={setShowD01ImportSuccess}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-emerald-400 flex items-center justify-center gap-3">
                <span className="text-2xl">✅</span>
                Succès
                <span className="text-2xl">✅</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Données importées avec succès depuis le fichier .d01
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowD01ImportSuccess(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression de concordance */}
        <Dialog open={showDeleteConcordanceConfirm} onOpenChange={setShowDeleteConcordanceConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer cette concordance ? Cette action est irréversible.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowDeleteConcordanceConfirm(false);
                    setConcordanceIndexToDelete(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={() => {
                    if (concordanceIndexToDelete !== null) {
                      setNewLotForm(prev => ({
                        ...prev,
                        concordances_anterieures: prev.concordances_anterieures.filter((_, i) => i !== concordanceIndexToDelete)
                      }));
                    }
                    setShowDeleteConcordanceConfirm(false);
                    setConcordanceIndexToDelete(null);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation d'annulation de création de lot */}
        <Dialog open={showCancelLotConfirm} onOpenChange={setShowCancelLotConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={() => {
                    setShowCancelLotConfirm(false);
                    setIsNewLotDialogOpen(false);
                    resetLotForm();
                  }}
                >
                  Abandonner
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowCancelLotConfirm(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Continuer l'édition
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement lot existant */}
        <Dialog open={showLotExistsWarning} onOpenChange={setShowLotExistsWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Le lot <span className="text-emerald-400 font-semibold">{newLotForm.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{newLotForm.circonscription_fonciere}</span>.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowLotExistsWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement champs obligatoires manquants */}
        <Dialog open={showLotMissingFieldsWarning} onOpenChange={setShowLotMissingFieldsWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Veuillez remplir tous les champs obligatoires : <span className="text-red-400 font-semibold">Numéro de lot</span> et <span className="text-red-400 font-semibold">Circonscription foncière</span>.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowLotMissingFieldsWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement concordance incomplète */}
        <Dialog open={showConcordanceWarning} onOpenChange={setShowConcordanceWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Veuillez remplir le numéro de lot, la circonscription foncière et le cadastre pour ajouter une concordance.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowConcordanceWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog pour ajouter une minute */}
        <Dialog open={isAddMinuteDialogOpen} onOpenChange={setIsAddMinuteDialogOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-md shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle className="text-xl">Ajouter une minute</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-2">
                <Label>Minute <span className="text-red-400">*</span></Label>
                <Input
                  value={newMinuteForm.minute}
                  onChange={(e) => setNewMinuteForm({ ...newMinuteForm, minute: e.target.value })}
                  placeholder="Ex: 12345"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de minute <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={newMinuteForm.date_minute}
                  onChange={(e) => setNewMinuteForm({ ...newMinuteForm, date_minute: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Type de minute <span className="text-red-400">*</span></Label>
                <Select
                  value={newMinuteForm.type_minute}
                  onValueChange={(value) => setNewMinuteForm({ ...newMinuteForm, type_minute: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Initiale" className="text-white">Initiale</SelectItem>
                    <SelectItem value="Remplace" className="text-white">Remplace</SelectItem>
                    <SelectItem value="Corrige" className="text-white">Corrige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsAddMinuteDialogOpen(false)} className="border-red-500 text-red-400 hover:bg-red-500/10">
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleAddMinuteFromDialog}
                  disabled={!newMinuteForm.minute || !newMinuteForm.date_minute}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  Ajouter
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Client Selector Dialog */}
        <Dialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50" hideClose>
            <DialogHeader>
              <DialogTitle>Sélectionner des clients</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un client..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingClientForForm(null);
                    setClientTypeForForm("Client");
                    setIsClientFormDialogOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {filteredClientsForSelector.map((client) => (
                    <div
                      key={client.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.clients_ids.includes(client.id)
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                      }`}
                      onClick={() => toggleClient(client.id, 'clients')}
                    >
                      <p className="text-white font-medium">{client.prenom} {client.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {client.adresses?.length > 0 && formatAdresse(client.adresses.find(a => a.actuelle || a.actuel)) && (
                          <p className="truncate">📍 {formatAdresse(client.adresses.find(a => a.actuelle || a.actuel))}</p>
                        )}
                        {getCurrentValue(client.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(client.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(client.telephones, 'telephone') && (
                          <p>
                            📞 <a 
                              href={`tel:${getCurrentValue(client.telephones, 'telephone').replace(/\D/g, '')}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {getCurrentValue(client.telephones, 'telephone')}
                            </a>
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsClientSelectorOpen(false);
                          handleEdit(client);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 mt-2 w-full"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setIsClientSelectorOpen(false)} className="w-full bg-emerald-500">
                Valider
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Notaire Selector Dialog */}
        <Dialog open={isNotaireSelectorOpen} onOpenChange={setIsNotaireSelectorOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50" hideClose>
            <DialogHeader>
              <DialogTitle>Sélectionner des notaires</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un notaire..."
                    value={notaireSearchTerm}
                    onChange={(e) => setNotaireSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingClientForForm(null);
                    setClientTypeForForm("Notaire");
                    setIsClientFormDialogOpen(true);
                  }}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {filteredNotairesForSelector.map((notaire) => (
                    <div
                      key={notaire.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.notaires_ids.includes(notaire.id)
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                      }`}
                      onClick={() => toggleClient(notaire.id, 'notaires')}
                    >
                      <p className="text-white font-medium">{notaire.prenom} {notaire.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {notaire.adresses?.length > 0 && formatAdresse(notaire.adresses.find(a => a.actuelle || a.actuel)) && (
                          <p className="truncate">📍 {formatAdresse(notaire.adresses.find(a => a.actuelle || a.actuel))}</p>
                        )}
                        {getCurrentValue(notaire.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(notaire.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(notaire.telephones, 'telephone') && (
                          <p>
                            📞 <a 
                              href={`tel:${getCurrentValue(notaire.telephones, 'telephone').replace(/\D/g, '')}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {getCurrentValue(notaire.telephones, 'telephone')}
                            </a>
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNotaireSelectorOpen(false);
                          handleEdit(notaire);
                        }}
                        className="text-purple-400 hover:text-purple-300 mt-2 w-full"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setIsNotaireSelectorOpen(false)} className="w-full bg-purple-500">
                Valider
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Courtier Selector Dialog */}
        <Dialog open={isCourtierSelectorOpen} onOpenChange={setIsCourtierSelectorOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50" hideClose>
            <DialogHeader>
              <DialogTitle>Sélectionner des courtiers</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un courtier..."
                    value={courtierSearchTerm}
                    onChange={(e) => setCourtierSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingClientForForm(null);
                    setClientTypeForForm("Courtier immobilier");
                    setIsClientFormDialogOpen(true);
                  }}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {filteredCourtiersForSelector.map((courtier) => (
                    <div
                      key={courtier.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.courtiers_ids.includes(courtier.id)
                          ? 'bg-orange-500/20 border border-orange-500/30'
                          : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                      }`}
                      onClick={() => toggleClient(courtier.id, 'courtiers')}
                    >
                      <p className="text-white font-medium">{courtier.prenom} {courtier.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {courtier.adresses?.length > 0 && formatAdresse(courtier.adresses.find(a => a.actuelle || a.actel)) && (
                          <p className="truncate">📍 {formatAdresse(courtier.adresses.find(a => a.actuelle || a.actel))}</p>
                        )}
                        {getCurrentValue(courtier.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(courtier.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(courtier.telephones, 'telephone') && (
                          <p>
                            📞 <a 
                              href={`tel:${getCurrentValue(courtier.telephones, 'telephone').replace(/\D/g, '')}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {getCurrentValue(courtier.telephones, 'telephone')}
                            </a>
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCourtierSelectorOpen(false);
                          handleEdit(courtier);
                        }}
                        className="text-orange-400 hover:text-orange-300 mt-2 w-full"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setIsCourtierSelectorOpen(false)} className="w-full bg-orange-500">
                Valider
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* PDF Viewer Dialog */}
        <Dialog open={!!viewingPdfUrl} onOpenChange={(open) => { if (!open) { setViewingPdfUrl(null); setViewingPdfName(""); } }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
            <div className="flex items-center px-3 py-1.5 border-b border-slate-800 flex-shrink-0 min-h-0">
              <div className="flex items-center gap-2 text-sm">
                <File className="w-4 h-4 text-amber-400" />
                <span className="truncate max-w-[600px] text-white">{viewingPdfName}</span>
              </div>
            </div>
            <DialogHeader className="sr-only">
              <DialogTitle>{viewingPdfName}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden bg-slate-950 min-h-0">
              {viewingPdfUrl && (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingPdfUrl)}&embedded=true`}
                  className="w-full h-full border-0"
                  title={viewingPdfName}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ClientFormDialog (replaces previous New Client Dialogs) */}
        <ClientFormDialog
          open={isClientFormDialogOpen}
          onOpenChange={(open) => {
            setIsClientFormDialogOpen(open);
            if (!open) setEditingClientForForm(null);
          }}
          editingClient={editingClientForForm}
          defaultType={clientTypeForForm}
          initialData={
            clientTypeForForm === "Client" ? clientInfo :
            clientTypeForForm === "Notaire" ? {
              prenom: professionnelInfo.notaire || "",
              nom: "",
              telephone: professionnelInfo.notaire_telephone || "",
              courriel: professionnelInfo.notaire_courriel || ""
            } :
            clientTypeForForm === "Courtier immobilier" ? {
              prenom: professionnelInfo.courtier || "",
              nom: "",
              telephone: professionnelInfo.courtier_telephone || "",
              courriel: professionnelInfo.courtier_courriel || ""
            } : null
          }
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['clients'] }); // Refresh clients list
            // Optionally re-open the selector if creating from there
            if (clientTypeForForm === "Client" && !isOuvrirDossierDialogOpen) {
              setIsClientSelectorOpen(true);
            }
            if (clientTypeForForm === "Notaire" && !isOuvrirDossierDialogOpen) {
              setIsNotaireSelectorOpen(true);
            }
            if (clientTypeForForm === "Courtier immobilier" && !isOuvrirDossierDialogOpen) {
              setIsCourtierSelectorOpen(true);
            }
          }}
        />

        {/* Lot Selector Dialog */}
        <Dialog open={isLotSelectorOpen} onOpenChange={(open) => {
          setIsLotSelectorOpen(open);
          if (!open) {
            setLotCirconscriptionFilter("all");
            setLotSearchTerm("");
            setLotCadastreFilter("Québec");
          }
        }}>
          <DialogContent className="bg-white/5 backdrop-blur-2xl border-2 border-white/20 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle className="text-2xl">Sélectionner des lots</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4 flex-1 overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par numéro, rang..."
                    value={lotSearchTerm}
                    onChange={(e) => setLotSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Select value={lotCirconscriptionFilter} onValueChange={setLotCirconscriptionFilter}>
                  <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Circonscription" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">Toutes les circonscriptions</SelectItem>
                    {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                      <SelectItem key={circ} value={circ} className="text-white">
                        {circ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={lotCadastreFilter} onValueChange={setLotCadastreFilter}>
                  <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Cadastre" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                    <SelectItem value="all" className="text-white">Tous les cadastres</SelectItem>
                    <SelectItem value="Québec" className="text-white">Québec</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => setIsNewLotDialogOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau lot
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-700 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                      <TableHead className="text-slate-300">Numéro de lot</TableHead>
                      <TableHead className="text-slate-300">Circonscription</TableHead>
                      <TableHead className="text-slate-300">Cadastre</TableHead>
                      <TableHead className="text-slate-300">Rang</TableHead>
                      <TableHead className="text-slate-300 text-right">Sélection</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLotsForSelector.length > 0 ? (
                      filteredLotsForSelector.map((lot) => {
                        const isSelected = currentMandatIndex !== null &&
                          formData.mandats[currentMandatIndex]?.lots?.includes(lot.id);
                        return (
                          <TableRow
                            key={lot.id}
                            className={`cursor-pointer transition-colors border-slate-800 ${
                              isSelected
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
                                : 'hover:bg-slate-800/30'
                            }`}
                            onClick={() => addLotToCurrentMandat(lot.id)}
                          >
                            <TableCell className="font-medium text-white">
                              {lot.numero_lot}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                {lot.circonscription_fonciere}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {lot.cadastre || "-"}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {lot.rang || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {isSelected && (
                                <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50">
                                  <Check className="w-3 h-3 mr-1" />
                                  Sélectionné
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="text-slate-400">
                            <Grid3x3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun lot trouvé</p>
                            <p className="text-sm mt-2">Essayez de modifier vos filtres ou créez un nouveau lot</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={() => setIsLotSelectorOpen(false)} className="w-full bg-emerald-500">
                Valider la sélection
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* New Lot Dialog */}
        <Dialog open={isNewLotDialogOpen} onOpenChange={(open) => {
          if (!open) {
            let hasChanges = false;
            if (editingLot) {
                hasChanges = JSON.stringify(newLotForm) !== JSON.stringify(initialLotForm) || commentairesTemporairesLot.length > 0;
            } else {
                hasChanges = newLotForm.numero_lot || 
                  newLotForm.circonscription_fonciere || 
                  newLotForm.rang || 
                  newLotForm.types_operation.length > 0 ||
                  commentairesTemporairesLot.length > 0;
            }
            
            if (hasChanges) {
              setShowCancelLotConfirm(true);
            } else {
              setIsNewLotDialogOpen(false);
              resetLotForm();
            }
          } else {
            // Charger l'historique du lot lors de l'ouverture en mode édition
            if (open && editingLot) {
              const loadActionLogs = async () => {
                const logs = await base44.entities.ActionLog.filter({ entite: 'Lot', entite_id: editingLot.id }, '-created_date');
                setLotActionLogs(logs);
              };
              loadActionLogs();
            }
            setIsNewLotDialogOpen(open);
          }
        }}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Nouveau lot</DialogTitle>
            </DialogHeader>
            
            <motion.div 
              className="flex flex-col h-[90vh]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 flex overflow-hidden">
                {/* Colonne gauche - Formulaire - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-4 border-r border-slate-800">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">{editingLot ? "Modifier lot" : "Nouveau lot"}</h2>
                  </div>
                  
                  <form id="lot-form" onSubmit={handleNewLotSubmit} className="space-y-3">
                    {/* Section Import .d01 - Visible uniquement en mode création */}
                    {!editingLot && (
                      <div 
                        className={`border border-dashed rounded-lg p-2 transition-all ${
                          isDragOverD01 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-slate-600 bg-slate-800/20 hover:border-slate-500'
                        }`}
                        onDragOver={handleD01DragOver}
                        onDragLeave={handleD01DragLeave}
                        onDrop={handleD01Drop}
                      >
                        {isImportingD01 ? (
                          <div className="flex items-center justify-center gap-2 text-teal-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Importation...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-400 text-xs">Importer depuis un fichier .d01</span>
                            </div>
                            <label>
                              <input
                                type="file"
                                accept=".d01"
                                onChange={handleD01FileSelect}
                                className="hidden"
                              />
                              <span className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded cursor-pointer transition-colors inline-block">
                                Parcourir
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section Informations du lot */}
                    <LotInfoStepForm
                      lotForm={newLotForm}
                      onLotFormChange={(data) => setNewLotForm(data)}
                      availableCadastres={availableCadastresForNewLot}
                      onCirconscriptionChange={handleLotCirconscriptionChange}
                      isCollapsed={lotInfoCollapsed}
                      onToggleCollapse={() => setLotInfoCollapsed(!lotInfoCollapsed)}
                      disabled={false}
                      CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                    />

                    {/* Section Types d'opération */}
                    <TypesOperationStepForm
                      typesOperation={newLotForm.types_operation || []}
                      onTypesOperationChange={(data) => setNewLotForm({...newLotForm, types_operation: data})}
                      isCollapsed={typesOperationCollapsed}
                      onToggleCollapse={() => setTypesOperationCollapsed(!typesOperationCollapsed)}
                      disabled={false}
                      CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                      allLots={lots}
                    />

                    {/* Section Documents */}
                    <DocumentsStepFormLot
                      lotNumero={newLotForm.numero_lot || ""}
                      circonscription={newLotForm.circonscription_fonciere || ""}
                      isCollapsed={lotDocumentsCollapsed}
                      onToggleCollapse={() => setLotDocumentsCollapsed(!lotDocumentsCollapsed)}
                      disabled={false}
                    />
                  </form>
                </div>

                {/* Colonne droite - Commentaires et Historique - 30% */}
                <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
                 {/* Header Tabs Commentaires/Historique - Collapsible */}
                 <div 
                   className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                   onClick={() => setSidebarCollapsedLot(!sidebarCollapsedLot)}
                 >
                   <div className="flex items-center gap-2">
                     {sidebarTabLot === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
                     <h3 className="text-slate-300 text-base font-semibold">
                       {sidebarTabLot === "commentaires" ? "Commentaires" : "Historique"}
                     </h3>
                   </div>
                   {sidebarCollapsedLot ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                 </div>

                 {!sidebarCollapsedLot && (
                   <Tabs value={sidebarTabLot} onValueChange={setSidebarTabLot} className="flex-1 flex flex-col overflow-hidden">
                     <TabsList className="grid grid-cols-2 h-9 mx-4 mr-6 mt-2 flex-shrink-0 bg-transparent gap-2">
                       <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                         <MessageSquare className="w-4 h-4 mr-1" />
                         Commentaires
                       </TabsTrigger>
                       <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                         <Clock className="w-4 h-4 mr-1" />
                         Historique
                       </TabsTrigger>
                     </TabsList>

                     <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 pr-6 mt-0">
                       <CommentairesSectionLot
                         lotId={editingLot?.id}
                         lotTemporaire={!editingLot}
                         commentairesTemp={commentairesTemporairesLot}
                         onCommentairesTempChange={setCommentairesTemporairesLot}
                       />
                     </TabsContent>

                     <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
                       {lotActionLogs.length > 0 ? (
                         <div className="space-y-3">
                           {lotActionLogs.map((log) => (
                             <div key={log.id} className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                               <div className="flex items-start justify-between gap-2">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                     <Badge className={`text-xs ${
                                       log.action === 'Création' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                       log.action === 'Modification' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                       'bg-red-500/20 text-red-400 border-red-500/30'
                                     }`}>
                                       {log.action}
                                     </Badge>
                                     <span className="text-slate-400 text-xs">
                                       {log.created_date && format(new Date(log.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                     </span>
                                   </div>
                                   <p className="text-slate-300 text-sm">{log.details}</p>
                                   <p className="text-slate-500 text-xs mt-1">Par {log.utilisateur_nom}</p>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="flex items-center justify-center h-full text-center">
                           <div>
                             <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                             <p className="text-slate-500">Aucune action enregistrée</p>
                             <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>
                           </div>
                         </div>
                       )}
                     </TabsContent>
                   </Tabs>
                 )}
                </div>
              </div>

              {/* Boutons tout en bas - pleine largeur */}
              <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => {
                 let hasChanges = false;
                 if (editingLot) {
                     hasChanges = JSON.stringify(newLotForm) !== JSON.stringify(initialLotForm) || commentairesTemporairesLot.length > 0;
                 } else {
                     hasChanges = newLotForm.numero_lot || 
                       newLotForm.circonscription_fonciere || 
                       newLotForm.rang || 
                       newLotForm.types_operation.length > 0 ||
                       commentairesTemporairesLot.length > 0;
                 }

                  if (hasChanges) {
                    setShowCancelLotConfirm(true);
                  } else {
                    setIsNewLotDialogOpen(false);
                    resetLotForm();
                  }
                }} className="border-red-500 text-red-400 hover:bg-red-500/10">
                  Annuler
                </Button>
                <Button type="submit" form="lot-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                   {editingLot ? "Modifier" : "Créer"}
                 </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Client Details Dialog */}
        <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
            <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
              <DialogTitle className="text-2xl">
                Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="flex-1 overflow-hidden p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {viewingClientDetails && (
                <ClientDetailView
                  client={viewingClientDetails}
                  onClose={() => setViewingClientDetails(null)}
                  onViewDossier={(dossier) => {
                    setViewingClientDetails(null);
                    setViewingDossier(dossier);
                    setIsViewDialogOpen(true);
                  }}
                />
              )}
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* View Dossier Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Détails du dossier</DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <motion.div 
                className="flex h-[90vh]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Main content - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6 flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                      Détails du dossier {getArpenteurInitials(viewingDossier.arpenteur_geometre)}{viewingDossier.numero_dossier}
                    </h2>
                    {viewingDossier.ttl === "Oui" && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        <span className="text-indigo-400 font-semibold text-sm tracking-wide">TTL</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Informations principales */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <Label className="text-slate-400 text-sm">Arpenteur-géomètre</Label>
                        <p className="text-white font-medium mt-1">{viewingDossier.arpenteur_geometre}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Statut</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className={`${getStatutBadgeColor(viewingDossier.statut)} border`}>
                            {viewingDossier.statut}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Date de création</Label>
                        <p className="text-white font-medium mt-1">
                          {viewingDossier.created_date ? format(new Date(viewingDossier.created_date), "dd MMMM yyyy", { locale: fr }) : '-'}
                        </p>
                      </div>
                    </div>

                    {viewingDossier.utilisateur_assigne && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                        <p className="text-white font-medium mt-1 text-sm">
                          {users.find(u => u.email === viewingDossier.utilisateur_assigne)?.full_name || viewingDossier.utilisateur_assigne}
                        </p>
                      </div>
                    )}

                    {viewingDossier.description && (
                      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                        <Label className="text-slate-400 text-sm">Description</Label>
                        <p className="text-white mt-2 whitespace-pre-wrap">{viewingDossier.description}</p>
                      </div>
                    )}

                    {/* Clients, Notaires, Courtiers */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Clients */}
                      {viewingDossier.ttl === "Oui" ? (
                        viewingDossier.clients_texte && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                            <p className="text-white p-3 bg-slate-800/30 rounded-lg whitespace-pre-wrap">{viewingDossier.clients_texte}</p>
                          </div>
                        )
                      ) : (
                        viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                            <div className="flex flex-col gap-2">
                              {viewingDossier.clients_ids.map(clientId => {
                                const client = getClientById(clientId);
                                return client ? (
                                  <Badge 
                                    key={clientId} 
                                    className="bg-blue-500/20 text-blue-400 border-blue-500/30 border w-full justify-start cursor-pointer hover:bg-blue-500/30 transition-colors"
                                    onClick={() => {
                                      setIsViewDialogOpen(false);
                                      setViewingClientDetails(client);
                                    }}
                                  >
                                    {client.prenom} {client.nom}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )
                      )}

                      {/* Notaires */}
                      {viewingDossier.ttl === "Oui" ? (
                        viewingDossier.notaires_texte && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Notaires</Label>
                            <p className="text-white p-3 bg-slate-800/30 rounded-lg whitespace-pre-wrap">{viewingDossier.notaires_texte}</p>
                          </div>
                        )
                      ) : (
                        viewingDossier.notaires_ids && viewingDossier.notaires_ids.length > 0 && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Notaires</Label>
                            <div className="flex flex-col gap-2">
                              {viewingDossier.notaires_ids.map(notaireId => {
                                const notaire = getClientById(notaireId);
                                return notaire ? (
                                  <Badge 
                                    key={notaireId} 
                                    className="bg-purple-500/20 text-purple-400 border-purple-500/30 border w-full justify-start cursor-pointer hover:bg-purple-500/30 transition-colors"
                                    onClick={() => {
                                      setIsViewDialogOpen(false);
                                      setViewingClientDetails(notaire);
                                    }}
                                  >
                                    {notaire.prenom} {notaire.nom}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )
                      )}

                      {/* Courtiers */}
                      {viewingDossier.ttl === "Oui" ? (
                        viewingDossier.courtiers_texte && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Courtiers immobiliers</Label>
                            <p className="text-white p-3 bg-slate-800/30 rounded-lg whitespace-pre-wrap">{viewingDossier.courtiers_texte}</p>
                          </div>
                        )
                      ) : (
                        viewingDossier.courtiers_ids && viewingDossier.courtiers_ids.length > 0 && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Courtiers immobiliers</Label>
                            <div className="flex flex-col gap-2">
                              {viewingDossier.courtiers_ids.map(courtierId => {
                                const courtier = getClientById(courtierId);
                                return courtier ? (
                                  <Badge 
                                    key={courtierId} 
                                    className="bg-orange-500/20 text-orange-400 border-orange-500/30 border w-full justify-start cursor-pointer hover:bg-orange-500/30 transition-colors"
                                    onClick={() => {
                                      setIsViewDialogOpen(false);
                                      setViewingClientDetails(courtier);
                                    }}
                                  >
                                    {courtier.prenom} {courtier.nom}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Mandats */}
                    {viewingDossier.mandats && viewingDossier.mandats.length > 0 && (
                      <div>
                        <Label className="text-slate-400 text-sm mb-3 block">Mandats ({viewingDossier.mandats.length})</Label>
                        <div className="space-y-3">
                          {viewingDossier.mandats.map((mandat, index) => (
                            <Card key={index} className="bg-slate-800/50 border-slate-700">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <h5 className="font-semibold text-emerald-400 text-lg">{mandat.type_mandat || `Mandat ${index + 1}`}</h5>
                                  {mandat.prix_estime > 0 && (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                                      {mandat.prix_estime.toFixed(2)} $
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) !== "" && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Adresse des travaux</Label>
                                      <p className="text-slate-300 text-sm mt-1">📍 {formatAdresse(mandat.adresse_travaux)}</p>
                                    </div>
                                  )}
                                  
                                  {mandat.lots && mandat.lots.length > 0 && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Lots</Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {mandat.lots.map((lotId) => {
                                          const lot = getLotById(lotId);
                                          return (
                                            <Badge key={lotId} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                              {lot?.numero_lot || lotId}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Utilisateur assigné pour mandat */}
                                {mandat.utilisateur_assigne && (
                                  <div>
                                    <Label className="text-slate-400 text-xs">Utilisateur assigné pour le mandat</Label>
                                    <p className="text-slate-300 text-sm mt-1">
                                      {users.find(u => u.email === mandat.utilisateur_assigne)?.full_name || mandat.utilisateur_assigne}
                                    </p>
                                  </div>
                                )}

                                {/* Dates */}
                                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-slate-700">
                                  {mandat.date_ouverture && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Ouverture</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_ouverture), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_signature && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Signature</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_signature), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_debut_travaux && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Début travaux</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_debut_travaux), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_livraison && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Livraison</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_livraison), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Tarification */}
                                {(mandat.prix_estime > 0 || mandat.rabais > 0) && (
                                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
                                    {mandat.prix_estime > 0 && (
                                      <div>
                                        <Label className="text-slate-400 text-xs">Prix estimé</Label>
                                        <p className="text-slate-300 text-sm mt-1">{mandat.prix_estime.toFixed(2)} $</p>
                                      </div>
                                    )}
                                    {mandat.rabais > 0 && (
                                      <div>
                                        <Label className="text-slate-400 text-xs">Rabais</Label>
                                        <p className="text-slate-300 text-sm mt-1">{mandat.rabais.toFixed(2)} $</p>
                                      </div>
                                    )}
                                    <div>
                                        <Label className="text-slate-400 text-xs">Taxes</Label>
                                        <p className="text-slate-300 text-sm mt-1">
                                          {mandat.taxes_incluses ? "✓ Incluses" : "Non incluses"}
                                        </p>
                                      </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Boutons Fermer/Modifier tout en bas */}
                  <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)} className="border-red-500 text-red-400 hover:bg-red-500/10">
                      Fermer
                    </Button>
                    <Button type="button" className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={handleEditFromView}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>

                {/* Right side - Commentaires Sidebar - 30% */}
                <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Commentaires</h3>
                  </div>
                  <div className="flex-1 overflow-hidden p-4 pr-4">
                    <CommentairesSection
                      dossierId={viewingDossier?.id}
                      dossierTemporaire={false}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>


        {/* Table des prises de mandat */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-800 pb-1 pt-0">
            <div className="flex flex-col gap-2">
              
              {/* Tabs pour les statuts - style tabs pleine largeur */}
              <div className="flex w-full border-b border-slate-700">
                <button
                  role="tab"
                  onClick={() => setActiveListTab("nouveau")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "nouveau"
                      ? "border-cyan-500 text-cyan-400 bg-cyan-500/10"
                      : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5"
                  }`}
                >
                  <FileQuestion className="w-4 h-4" />
                  Nouveau mandat / Demande d'informations
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 ml-1">
                    {priseMandats.filter(pm => pm.statut === "Nouveau mandat/Demande d'information").length}
                  </Badge>
                </button>
                <button
                  role="tab"
                  onClick={() => setActiveListTab("ouvrir")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "ouvrir"
                      ? "border-purple-500 text-purple-400 bg-purple-500/10"
                      : "border-transparent text-slate-400 hover:text-purple-400 hover:bg-purple-500/5"
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Mandat à ouvrir
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 ml-1">
                    {priseMandats.filter(pm => pm.statut === "Mandats à ouvrir").length}
                  </Badge>
                </button>
                <button
                  role="tab"
                  onClick={() => setActiveListTab("non-octroye")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "non-octroye"
                      ? "border-red-500 text-red-400 bg-red-500/10"
                      : "border-transparent text-slate-400 hover:text-red-400 hover:bg-red-500/5"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Mandat non-octroyé
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-1">
                    {priseMandats.filter(pm => pm.statut === "Mandat non octroyé").length}
                  </Badge>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 border border-slate-700/50 relative"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="text-sm">Filtres</span>
                    {(filterArpenteur.length > 0 || filterVille.length > 0 || filterTypeMandat.length > 0 || filterUrgence.length > 0 || filterDateStart || filterDateEnd) && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        {filterArpenteur.length + filterVille.length + filterTypeMandat.length + filterUrgence.length + (filterDateStart ? 1 : 0) + (filterDateEnd ? 1 : 0)}
                      </Badge>
                    )}
                    {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </Button>
                </div>

                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <CollapsibleContent>
                    <div className="p-2 border border-emerald-500/30 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                          <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3 text-emerald-500" />
                            <h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4>
                          </div>
                          {(filterArpenteur.length > 0 || filterVille.length > 0 || filterTypeMandat.length > 0 || filterUrgence.length > 0 || filterDateStart || filterDateEnd) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFilterArpenteur([]);
                                setFilterVille([]);
                                setFilterTypeMandat([]);
                                setFilterUrgence([]);
                                setFilterDateStart("");
                                setFilterDateEnd("");
                              }}
                              className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                            >
                              <X className="w-2.5 h-2.5 mr-1" />
                              Réinitialiser
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          <div className="space-y-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                                  <span className="truncate">Arpenteurs ({filterArpenteur.length > 0 ? `${filterArpenteur.length}` : 'Tous'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                                {ARPENTEURS.map((arp) => (
                                  <DropdownMenuCheckboxItem
                                    key={arp}
                                    checked={filterArpenteur.includes(arp)}
                                    onCheckedChange={(checked) => {
                                      setFilterArpenteur(
                                        checked
                                          ? [...filterArpenteur, arp]
                                          : filterArpenteur.filter((a) => a !== arp)
                                      );
                                    }}
                                    className="text-white"
                                  >
                                    {arp}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                                  <span className="truncate">Villes ({filterVille.length > 0 ? `${filterVille.length}` : 'Toutes'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-slate-800 border-slate-700">
                                {allVilles.map((ville) => (
                                  <DropdownMenuCheckboxItem
                                    key={ville}
                                    checked={filterVille.includes(ville)}
                                    onCheckedChange={(checked) => {
                                      setFilterVille(
                                        checked
                                          ? [...filterVille, ville]
                                          : filterVille.filter((v) => v !== ville)
                                      );
                                    }}
                                    className="text-white"
                                  >
                                    {ville}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                                  <span className="truncate">Types ({filterTypeMandat.length > 0 ? `${filterTypeMandat.length}` : 'Tous'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                                {TYPES_MANDATS.map((type) => (
                                  <DropdownMenuCheckboxItem
                                    key={type}
                                    checked={filterTypeMandat.includes(type)}
                                    onCheckedChange={(checked) => {
                                      setFilterTypeMandat(
                                        checked
                                          ? [...filterTypeMandat, type]
                                          : filterTypeMandat.filter((t) => t !== type)
                                      );
                                    }}
                                    className="text-white"
                                  >
                                    {type}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                                  <span className="truncate">Urgence ({filterUrgence.length > 0 ? `${filterUrgence.length}` : 'Toutes'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                                {["Pas pressé", "Normal", "Rapide"].map((urg) => (
                                  <DropdownMenuCheckboxItem
                                    key={urg}
                                    checked={filterUrgence.includes(urg)}
                                    onCheckedChange={(checked) => {
                                      setFilterUrgence(
                                        checked
                                          ? [...filterUrgence, urg]
                                          : filterUrgence.filter((u) => u !== urg)
                                      );
                                    }}
                                    className="text-white"
                                  >
                                    {urg}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-emerald-500/30">
                          <Label className="text-xs text-emerald-500">Période</Label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="date"
                              value={filterDateStart}
                              onChange={(e) => setFilterDateStart(e.target.value)}
                              placeholder="Du"
                              className="flex-1 border-emerald-500/30 text-emerald-500 h-8 text-xs px-2"
                            />
                            <span className="text-emerald-500 text-xs">→</span>
                            <Input
                              type="date"
                              value={filterDateEnd}
                              onChange={(e) => setFilterDateEnd(e.target.value)}
                              placeholder="Au"
                              className="flex-1 border-emerald-500/30 text-emerald-500 h-8 text-xs px-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('arpenteur_geometre')}
                    >
                      {activeListTab === "ouvrir" ? "Dossier" : "Arpenteur-Géomètre"} {sortField === 'arpenteur_geometre' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('clients')}
                    >
                      Clients {sortField === 'clients' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('adresse_travaux')}
                    >
                      Adresse des travaux {sortField === 'adresse_travaux' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('ville')}
                    >
                      Ville {sortField === 'ville' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('types_mandats')}
                    >
                      Types de mandats {sortField === 'types_mandats' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('created_date')}
                    >
                      Date {sortField === 'created_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('urgence_percue')}
                    >
                      Urgence {sortField === 'urgence_percue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priseMandats
                    .filter(pm => {
                      // Filtre par tab actif
                      const tabStatut = activeListTab === "nouveau" 
                        ? "Nouveau mandat/Demande d'information"
                        : activeListTab === "ouvrir"
                        ? "Mandats à ouvrir"
                        : "Mandat non octroyé";
                      return pm.statut === tabStatut;
                    })
                    .filter(pm => {
                      const searchLower = searchTerm.toLowerCase();
                      const clientName = pm.client_info?.prenom || pm.client_info?.nom 
                        ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim().toLowerCase()
                        : getClientsNames(pm.clients_ids).toLowerCase();
                      const matchesSearch = (
                        pm.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
                        clientName.includes(searchLower) ||
                        formatAdresse(pm.adresse_travaux)?.toLowerCase().includes(searchLower) ||
                        pm.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
                      );
                      const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(pm.arpenteur_geometre);
                      const matchesVille = filterVille.length === 0 || filterVille.includes(pm.adresse_travaux?.ville);
                      const matchesTypeMandat = filterTypeMandat.length === 0 || pm.mandats?.some(m => filterTypeMandat.includes(m.type_mandat));
                      const matchesUrgence = filterUrgence.length === 0 || filterUrgence.includes(pm.urgence_percue);
                      
                      const pmDate = new Date(pm.created_date);
                      const matchesDateStart = filterDateStart === "" || pmDate >= new Date(filterDateStart);
                      const matchesDateEnd = filterDateEnd === "" || pmDate <= new Date(filterDateEnd + "T23:59:59");
                      
                      return matchesSearch && matchesArpenteur && matchesVille && matchesTypeMandat && matchesUrgence && matchesDateStart && matchesDateEnd;
                    })
                    .sort((a, b) => {
                      if (!sortField) return 0;
                      let aValue, bValue;
                      switch (sortField) {
                        case 'arpenteur_geometre':
                          aValue = (a.arpenteur_geometre || '').toLowerCase();
                          bValue = (b.arpenteur_geometre || '').toLowerCase();
                          break;
                        case 'created_date':
                          aValue = new Date(a.created_date || 0).getTime();
                          bValue = new Date(b.created_date || 0).getTime();
                          break;
                        case 'clients':
                          const aClientName = a.client_info?.prenom || a.client_info?.nom 
                            ? `${a.client_info.prenom || ''} ${a.client_info.nom || ''}`.trim()
                            : getClientsNames(a.clients_ids);
                          const bClientName = b.client_info?.prenom || b.client_info?.nom 
                            ? `${b.client_info.prenom || ''} ${b.client_info.nom || ''}`.trim()
                            : getClientsNames(b.clients_ids);
                          aValue = aClientName.toLowerCase();
                          bValue = bClientName.toLowerCase();
                          break;
                        case 'adresse_travaux':
                          aValue = `${a.adresse_travaux?.numeros_civiques?.[0] || ''} ${a.adresse_travaux?.rue || ''}`.toLowerCase();
                          bValue = `${b.adresse_travaux?.numeros_civiques?.[0] || ''} ${b.adresse_travaux?.rue || ''}`.toLowerCase();
                          break;
                        case 'ville':
                          aValue = (a.adresse_travaux?.ville || '').toLowerCase();
                          bValue = (b.adresse_travaux?.ville || '').toLowerCase();
                          break;
                        case 'types_mandats':
                          aValue = (a.mandats?.[0]?.type_mandat || '').toLowerCase();
                          bValue = (b.mandats?.[0]?.type_mandat || '').toLowerCase();
                          break;
                        case 'urgence_percue':
                          const urgenceOrder = { 'Rapide': 1, 'Normal': 2, 'Pas pressé': 3 };
                          aValue = urgenceOrder[a.urgence_percue] || 4;
                          bValue = urgenceOrder[b.urgence_percue] || 4;
                          break;
                        default:
                          aValue = '';
                          bValue = '';
                      }
                      if (typeof aValue === 'string' && typeof bValue === 'string') {
                        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                      }
                      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                    })
                    .map((pm) => {
                      const getUrgenceColor = (urgence) => {
                        switch (urgence) {
                          case "Pas pressé": return "bg-green-500/20 text-green-400 border-green-500/30";
                          case "Normal": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
                          case "Rapide": return "bg-red-500/20 text-red-400 border-red-500/30";
                          default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
                        }
                      };

                      return (
                        <TableRow 
                          key={pm.id} 
                          className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                          onClick={() => handleEditPriseMandat(pm)}
                        >
                          <TableCell className="font-medium">
                            {activeListTab === "ouvrir" ? (
                              <Badge variant="outline" className={`${getArpenteurColor(pm.arpenteur_geometre)} border`}>
                                {getArpenteurInitials(pm.arpenteur_geometre)}{pm.numero_dossier || "N/A"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className={`${getArpenteurColor(pm.arpenteur_geometre)} border`}>
                                {pm.arpenteur_geometre}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {pm.client_info?.prenom || pm.client_info?.nom 
                              ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim()
                              : getClientsNames(pm.clients_ids)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                            {pm.adresse_travaux?.numeros_civiques?.[0] || pm.adresse_travaux?.rue
                              ? `${pm.adresse_travaux.numeros_civiques?.[0] || ''} ${pm.adresse_travaux.rue || ''}`.trim()
                              : '-'}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {pm.adresse_travaux?.ville || '-'}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {pm.mandats && pm.mandats.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {pm.mandats.slice(0, 2).map((m, idx) => (
                                  <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>
                                    {getAbbreviatedMandatType(m.type_mandat)}
                                  </Badge>
                                ))}
                                {pm.mandats.length > 2 && (
                                  <Badge className="bg-slate-700 text-slate-300 text-xs">
                                    +{pm.mandats.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">Aucun</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {pm.created_date ? format(new Date(pm.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
                          </TableCell>
                          <TableCell>
                            {pm.urgence_percue ? (
                              <Badge className={`${getUrgenceColor(pm.urgence_percue)} border text-xs`}>
                                {pm.urgence_percue}
                              </Badge>
                            ) : (
                              <span className="text-slate-600 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Êtes-vous sûr de vouloir supprimer cette prise de mandat ?")) {
                                    deletePriseMandatMutation.mutate(pm.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {priseMandats.filter(pm => {
                    const tabStatut = activeListTab === "nouveau" 
                      ? "Nouveau mandat/Demande d'information"
                      : activeListTab === "ouvrir"
                      ? "Mandats à ouvrir"
                      : "Mandat non octroyé";
                    return pm.statut === tabStatut;
                  }).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                        Aucune prise de mandat dans cette catégorie
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
});

export default PriseDeMandat;