import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Printer } from "lucide-react";

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
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

export default function RapportDossier({ isOpen, onClose, dossier, clients, users, entreeTemps }) {
  const getClientById = (id) => clients?.find(c => c.id === id);
  
  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "";
    return clientIds.map(id => {
      const c = getClientById(id);
      return c ? `${c.prenom} ${c.nom}` : "";
    }).filter(name => name).join(", ");
  };

  const getUserName = (email) => {
    const user = users?.find(u => u.email === email);
    return user?.full_name || email;
  };

  const getTachesAccomplies = () => {
    if (!entreeTemps || !dossier) return [];
    return entreeTemps.filter(e => e.dossier_id === dossier.id);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!dossier) return null;

  const tachesAccomplies = getTachesAccomplies();
  const totalHeures = tachesAccomplies.reduce((sum, e) => sum + (e.heures || 0), 0);
  const dossierNumero = `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black max-w-[95vw] w-[95vw] max-h-[95vh] overflow-hidden p-0">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .rapport-content, .rapport-content * {
              visibility: visible;
            }
            .rapport-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        
        <DialogHeader className="p-6 border-b no-print">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">Rapport de dossier</DialogTitle>
            <Button onClick={handlePrint} className="bg-emerald-500 hover:bg-emerald-600">
              <Printer className="w-4 h-4 mr-2" />
              Imprimer / Exporter PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-100px)] p-8 rapport-content">
          {/* En-tête du rapport */}
          <div className="mb-8 pb-6 border-b-2 border-slate-300">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Rapport de dossier {dossierNumero}
                </h1>
                <p className="text-slate-600">
                  Généré le {format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">{dossier.arpenteur_geometre}</p>
                <p className="text-slate-600">Arpenteur-géomètre</p>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">Informations générales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">N° de dossier</p>
                <p className="text-base">{dossierNumero}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Statut</p>
                <p className="text-base">{dossier.statut}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Date d'ouverture</p>
                <p className="text-base">
                  {dossier.date_ouverture ? format(new Date(dossier.date_ouverture), "dd MMMM yyyy", { locale: fr }) : "-"}
                </p>
              </div>
              {dossier.date_fermeture && (
                <div>
                  <p className="text-sm font-semibold text-slate-600">Date de fermeture</p>
                  <p className="text-base">
                    {format(new Date(dossier.date_fermeture), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              )}
              {dossier.clients_ids && dossier.clients_ids.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-slate-600">Clients</p>
                  <p className="text-base">{getClientsNames(dossier.clients_ids)}</p>
                </div>
              )}
            </div>
          </section>

          {/* Mandats */}
          {dossier.mandats && dossier.mandats.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">Mandats ({dossier.mandats.length})</h2>
              {dossier.mandats.map((mandat, index) => (
                <div key={index} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-bold text-lg mb-3 text-slate-800">
                    {mandat.type_mandat || `Mandat ${index + 1}`}
                  </h3>

                  {/* Informations du mandat */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {mandat.tache_actuelle && (
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Tâche actuelle</p>
                        <p className="text-base">{mandat.tache_actuelle}</p>
                      </div>
                    )}
                    {mandat.utilisateur_assigne && (
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Utilisateur assigné</p>
                        <p className="text-base">{getUserName(mandat.utilisateur_assigne)}</p>
                      </div>
                    )}
                    {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
                      <div className="col-span-2">
                        <p className="text-sm font-semibold text-slate-600">Adresse des travaux</p>
                        <p className="text-base">{formatAdresse(mandat.adresse_travaux)}</p>
                      </div>
                    )}
                  </div>

                  {/* Dates clés */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Dates clés</p>
                    <div className="grid grid-cols-3 gap-3">
                      {mandat.date_signature && (
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <p className="text-xs text-slate-500">Signature</p>
                          <p className="text-sm font-medium">{format(new Date(mandat.date_signature), "dd MMM yyyy", { locale: fr })}</p>
                        </div>
                      )}
                      {mandat.date_debut_travaux && (
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <p className="text-xs text-slate-500">Début travaux</p>
                          <p className="text-sm font-medium">{format(new Date(mandat.date_debut_travaux), "dd MMM yyyy", { locale: fr })}</p>
                        </div>
                      )}
                      {mandat.date_livraison && (
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <p className="text-xs text-slate-500">Livraison</p>
                          <p className="text-sm font-medium">{format(new Date(mandat.date_livraison), "dd MMM yyyy", { locale: fr })}</p>
                        </div>
                      )}
                      {mandat.date_terrain && (
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <p className="text-xs text-slate-500">Terrain</p>
                          <p className="text-sm font-medium">{format(new Date(mandat.date_terrain), "dd MMM yyyy", { locale: fr })}</p>
                        </div>
                      )}
                      {mandat.terrain?.date_limite_leve && (
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <p className="text-xs text-slate-500">Limite levé</p>
                          <p className="text-sm font-medium">{format(new Date(mandat.terrain.date_limite_leve), "dd MMM yyyy", { locale: fr })}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Facturation */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Facturation</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-xs text-slate-500">Prix estimé</p>
                        <p className="text-sm font-medium">{(mandat.prix_estime || 0).toFixed(2)} $</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-xs text-slate-500">Rabais</p>
                        <p className="text-sm font-medium">{(mandat.rabais || 0).toFixed(2)} $</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-xs text-slate-500">Taxes</p>
                        <p className="text-sm font-medium">{mandat.taxes_incluses ? "Incluses" : "Non incluses"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Minutes */}
                  {mandat.minutes_list && mandat.minutes_list.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Minutes ({mandat.minutes_list.length})</p>
                      <div className="space-y-2">
                        {mandat.minutes_list.map((minute, idx) => (
                          <div key={idx} className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center">
                            <span className="text-sm">N° {minute.minute}</span>
                            <span className="text-sm text-slate-600">
                              {minute.date_minute ? format(new Date(minute.date_minute), "dd MMM yyyy", { locale: fr }) : "-"}
                            </span>
                            <span className="text-xs bg-slate-200 px-2 py-1 rounded">{minute.type_minute}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Factures */}
                  {mandat.factures && mandat.factures.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-600 mb-2">Factures ({mandat.factures.length})</p>
                      <div className="space-y-2">
                        {mandat.factures.map((facture, idx) => (
                          <div key={idx} className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-medium">N° {facture.numero_facture}</span>
                            <span className="text-sm text-slate-600">
                              {facture.date_facture ? format(new Date(facture.date_facture), "dd MMM yyyy", { locale: fr }) : "-"}
                            </span>
                            <span className="text-sm font-bold text-emerald-600">{facture.total_ttc?.toFixed(2)} $</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Résumé des tâches accomplies */}
          {tachesAccomplies.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">
                Tâches accomplies ({tachesAccomplies.length})
              </h2>
              <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm font-semibold text-emerald-800">
                  Total des heures travaillées : {totalHeures.toFixed(2)}h
                </p>
              </div>
              <div className="space-y-3">
                {tachesAccomplies
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((entree, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{entree.tache}</p>
                          {entree.mandat && (
                            <p className="text-sm text-slate-600">Mandat : {entree.mandat}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{entree.heures}h</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(entree.date), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      {entree.description && (
                        <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                          {entree.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Par : {getUserName(entree.utilisateur_email)}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Récapitulatif financier */}
          {dossier.mandats && dossier.mandats.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">Récapitulatif financier</h2>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-2 text-sm font-semibold text-slate-700">Mandat</th>
                      <th className="text-right py-2 text-sm font-semibold text-slate-700">Prix estimé</th>
                      <th className="text-right py-2 text-sm font-semibold text-slate-700">Rabais</th>
                      <th className="text-right py-2 text-sm font-semibold text-slate-700">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.mandats.map((mandat, idx) => {
                      const sousTotal = (mandat.prix_estime || 0) - (mandat.rabais || 0);
                      return (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="py-2 text-sm">{mandat.type_mandat || `Mandat ${idx + 1}`}</td>
                          <td className="text-right py-2 text-sm">{(mandat.prix_estime || 0).toFixed(2)} $</td>
                          <td className="text-right py-2 text-sm">-{(mandat.rabais || 0).toFixed(2)} $</td>
                          <td className="text-right py-2 text-sm font-medium">{sousTotal.toFixed(2)} $</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan="3" className="text-right py-3 text-base">Total estimé :</td>
                      <td className="text-right py-3 text-base text-emerald-600">
                        {dossier.mandats.reduce((sum, m) => sum + ((m.prix_estime || 0) - (m.rabais || 0)), 0).toFixed(2)} $
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* Pied de page */}
          <div className="mt-12 pt-6 border-t border-slate-300 text-center text-sm text-slate-500">
            <p>Rapport généré automatiquement par GestionGTG</p>
            <p>{format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}