import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, FileText, FolderOpen, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";

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

const getTypeColor = (type) => {
  const colors = {
    "Client": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Notaire": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Courtier immobilier": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Compagnie": "bg-green-500/20 text-green-400 border-green-500/30"
  };
  return colors[type] || colors["Client"];
};

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

export default function ClientDetailView({ client, onClose, onViewDossier }) {
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-date_ouverture'),
    initialData: [],
  });

  const getClientDossiers = () => {
    const type = client.type_client;
    const field = type === 'Notaire' ? 'notaires_ids' : 
                  type === 'Courtier immobilier' ? 'courtiers_ids' : 'clients_ids';
    
    return dossiers
      .filter(d => d[field]?.includes(client.id) && d.statut !== "Rejeté")
      .sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture));
  };

  const clientDossiers = getClientDossiers();

  const adresseActuelle = client.adresses?.find(a => a.actuelle);
  const adressesAnciennes = client.adresses?.filter(a => !a.actuelle) || [];

  const courrielActuel = client.courriels?.find(c => c.actuel);
  const courrielsAnciens = client.courriels?.filter(c => !c.actuel) || [];

  const telephoneActuel = client.telephones?.find(t => t.actuel);
  const telephonesAnciens = client.telephones?.filter(t => !t.actuel) || [];

  const handleDossierClick = (dossier) => {
    const url = createPageUrl("Dossiers") + "?dossier_id=" + dossier.id;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header - Centré */}
      <div className="text-center border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white mb-3">Fiche Client</h2>
        <div className="flex items-center justify-center gap-3">
          <span className="text-lg text-white font-medium">{client.prenom}</span>
          <span className="text-lg text-white font-medium">{client.nom}</span>
          <Badge variant="outline" className={`${getTypeColor(client.type_client)} border`}>
            {client.type_client || "Client"}
          </Badge>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="space-y-4">
        {/* Adresses */}
        {(adresseActuelle || adressesAnciennes.length > 0) && (
          <div>
            <Label className="text-slate-400 mb-2 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresse(s)
            </Label>
            <div className="space-y-2">
              {adresseActuelle && (
                <div className="flex items-start justify-between bg-slate-800/30 p-3 rounded-lg">
                  <p className="text-slate-300 flex-1">
                    {typeof adresseActuelle.adresse === 'string' 
                      ? adresseActuelle.adresse 
                      : formatAdresse(adresseActuelle)}
                  </p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                    Actuel
                  </Badge>
                </div>
              )}
              {adressesAnciennes.map((addr, idx) => (
                <div key={idx} className="flex items-start justify-between bg-slate-800/30 p-3 rounded-lg">
                  <p className="text-slate-400 flex-1 text-sm">
                    {typeof addr.adresse === 'string' 
                      ? addr.adresse 
                      : formatAdresse(addr)}
                  </p>
                  <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                    Ancien
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courriels */}
        {(courrielActuel || courrielsAnciens.length > 0) && (
          <div>
            <Label className="text-slate-400 mb-2 block flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Courriel(s)
            </Label>
            <div className="space-y-2">
              {courrielActuel && (
                <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                  <p className="text-slate-300 flex-1">{courrielActuel.courriel}</p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                    Actuel
                  </Badge>
                </div>
              )}
              {courrielsAnciens.map((courriel, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                  <p className="text-slate-400 flex-1 text-sm">{courriel.courriel}</p>
                  <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                    Ancien
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Téléphones */}
        {(telephoneActuel || telephonesAnciens.length > 0) && (
          <div>
            <Label className="text-slate-400 mb-2 block flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Téléphone(s)
            </Label>
            <div className="space-y-2">
              {telephoneActuel && (
                <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                  <p className="text-slate-300 flex-1">{telephoneActuel.telephone}</p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                    Actuel
                  </Badge>
                </div>
              )}
              {telephonesAnciens.map((tel, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                  <p className="text-slate-400 flex-1 text-sm">{tel.telephone}</p>
                  <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                    Ancien
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div>
            <Label className="text-slate-400 mb-2 block flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </Label>
            <div className="bg-slate-800/30 p-3 rounded-lg">
              <p className="text-slate-300 whitespace-pre-wrap">{client.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dossiers associés - Format tableau */}
      {clientDossiers.length > 0 && (
        <div>
          <Label className="text-slate-400 mb-3 block flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Dossiers associés ({clientDossiers.length})
          </Label>
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                  <TableHead className="text-slate-300">N° Dossier</TableHead>
                  <TableHead className="text-slate-300">Arpenteur</TableHead>
                  <TableHead className="text-slate-300">Date d'ouverture</TableHead>
                  <TableHead className="text-slate-300">Mandats</TableHead>
                  <TableHead className="text-slate-300 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientDossiers.map((dossier) => (
                  <TableRow 
                    key={dossier.id} 
                    className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                    onClick={() => handleDossierClick(dossier)}
                  >
                    <TableCell className="font-medium text-white font-mono">
                      {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {dossier.arpenteur_geometre}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {format(new Date(dossier.date_ouverture), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {dossier.mandats && dossier.mandats.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {dossier.mandats.map((mandat, idx) => (
                            <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 text-xs">
                              {mandat.type_mandat}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">Aucun</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <ExternalLink className="w-4 h-4 text-slate-400 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}