import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";

import DossiersTable from '../components/dossiers/DossiersTable';
import DossiersFilterBar from "../components/dossiers/DossiersFilterBar";
import ConfirmDeleteDialog from "../components/shared/ConfirmDeleteDialog";
import { Card, CardContent } from "@/components/ui/card";
import EditDossierDialog from "../components/dossiers/EditDossierDialog";
import ClientFormDialog from "../components/clients/ClientFormDialog";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

export default function Dossiers() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDossier, setEditingDossier] = useState(null);
    const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
    const [clientTypeForForm, setClientTypeForForm] = useState('Client');
    const [editingClientForForm, setEditingClientForForm] = useState(null);
    const [filterArpenteur, setFilterArpenteur] = useState([]);
    const [filterVille, setFilterVille] = useState([]);
    const [filterStatut, setFilterStatut] = useState([]);
    const [filterMandat, setFilterMandat] = useState([]);
    const [filterTache, setFilterTache] = useState([]);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [showDeleteDossierConfirm, setShowDeleteDossierConfirm] = useState(false);
    const [dossierIdToDelete, setDossierIdToDelete] = useState(null);
    const [dossierNameToDelete, setDossierNameToDelete] = useState("");

    const queryClient = useQueryClient();

    const { data: dossiers = [], isLoading } = useQuery({ queryKey: ['dossiers'], queryFn: () => base44.entities.Dossier.list('-created_date'), initialData: [] });
    const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), initialData: [] });
    const { data: lots = [] } = useQuery({ queryKey: ['lots'], queryFn: () => base44.entities.Lot.list(), initialData: [] });
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [] });
    
    const deleteDossierMutation = useMutation({
        mutationFn: (id) => base44.entities.Dossier.delete(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['dossiers'] });
        }
      });

    const getClientsNames = useCallback((clientIds) => {
        if (!clientIds || clientIds.length === 0) return "-";
        return clientIds.map((id) => {
          const client = clients.find((c) => c.id === id);
          return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
        }).join(", ");
      }, [clients]);

      const formatAdresse = (addr) => {
        if (!addr) return "";
        const parts = [];
        if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
          parts.push(addr.numeros_civiques.filter((n) => n).join(', '));
        }
        if (addr.rue) parts.push(addr.rue);
        if (addr.ville) parts.push(addr.ville);
        return parts.filter((p) => p).join(', ');
      };

      const getFirstAdresseTravaux = (mandats) => {
        if (!mandats || mandats.length === 0) return "-";
        const addr = mandats[0].adresse_travaux;
        const parts = [addr?.numeros_civiques?.filter(n => n && n !== "").join(', '), addr?.rue, addr?.ville].filter(Boolean);
        return parts.join(', ') || mandats[0].adresse_travaux_texte || "-";
      };

    const handleSort = (field) => {
        const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
    };

    const handleEdit = (dossier) => {
        setEditingDossier(dossier);
        setIsDialogOpen(true);
    };

    const handleDelete = (id, name) => {
        setDossierIdToDelete(id);
        setDossierNameToDelete(name);
        setShowDeleteDossierConfirm(true);
    };
    
    const dossiersWithMandats = useMemo(() => {
        return dossiers.flatMap((dossier) => {
          if (dossier.mandats && dossier.mandats.length > 0) {
            return dossier.mandats.map((mandat, idx) => ({...dossier, mandatInfo: mandat, displayId: `${dossier.id}_${idx}`}));
          } 
          return [{ ...dossier, mandatInfo: null, displayId: dossier.id }];
        });
      }, [dossiers]);

      const filteredDossiers = useMemo(() => {
        return dossiersWithMandats.filter((item) => {
            const searchLower = searchTerm.toLowerCase();
            const fullNumber = ((item.arpenteur_geometre || "")) + (item.numero_dossier || "");
            const clientsNames = getClientsNames(item.clients_ids);
            return (
                (fullNumber.toLowerCase().includes(searchLower) ||
                (item.numero_dossier || "").toLowerCase().includes(searchLower) ||
                clientsNames.toLowerCase().includes(searchLower)) &&
                (filterArpenteur.length === 0 || filterArpenteur.includes(item.arpenteur_geometre)) &&
                (filterVille.length === 0 || filterVille.includes(item.mandatInfo?.adresse_travaux?.ville)) &&
                (filterStatut.length === 0 || filterStatut.includes(item.statut)) &&
                (filterMandat.length === 0 || filterMandat.includes(item.mandatInfo?.type_mandat)) &&
                (filterTache.length === 0 || filterTache.includes(item.mandatInfo?.tache_actuelle))
            );
        });
    }, [dossiersWithMandats, searchTerm, filterArpenteur, filterVille, filterStatut, filterMandat, filterTache, getClientsNames]);

    const sortedDossiers = useMemo(() => {
        if (!sortField) return filteredDossiers;
        // A basic sort, can be expanded
        return [...filteredDossiers].sort((a, b) => {
            const aValue = a[sortField] || '';
            const bValue = b[sortField] || '';
            if (sortDirection === 'asc') {
                return String(aValue).localeCompare(String(bValue));
            }
            return String(bValue).localeCompare(String(aValue));
        });
    }, [filteredDossiers, sortField, sortDirection]);

    const uniqueVilles = useMemo(() => {
        return [...new Set(dossiers.flatMap(d => d.mandats?.map(m => m.adresse_travaux?.ville)).filter(Boolean))];
    }, [dossiers]);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <ConfirmDeleteDialog
                open={showDeleteDossierConfirm}
                onOpenChange={setShowDeleteDossierConfirm}
                onConfirm={() => {if (dossierIdToDelete) deleteDossierMutation.mutate(dossierIdToDelete);}}
                message={`Êtes-vous sûr de vouloir supprimer le dossier ${dossierNameToDelete} ?`}
            />
            
            <div className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">Dossiers</h1>
                    <p className="text-slate-400">Gestion de vos dossiers d'arpentage</p>
                  </div>
                </div>

                <DossiersFilterBar 
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    isFiltersOpen={isFiltersOpen} setIsFiltersOpen={setIsFiltersOpen}
                    filterArpenteur={filterArpenteur} setFilterArpenteur={setFilterArpenteur}
                    filterStatut={filterStatut} setFilterStatut={setFilterStatut}
                    filterMandat={filterMandat} setFilterMandat={setFilterMandat}
                    filterTache={filterTache} setFilterTache={setFilterTache}
                    filterVille={filterVille} setFilterVille={setFilterVille}
                    uniqueVilles={uniqueVilles}
                    dossiersWithMandats={dossiersWithMandats}
                    onNouveauDossier={() => {
                        setEditingDossier(null);
                        setIsDialogOpen(true);
                    }}
                    ARPENTEURS={ARPENTEURS}
                    TYPES_MANDATS={TYPES_MANDATS}
                />
                
                <Card className="border-0 bg-transparent shadow-none">
                    <CardContent className="p-0">
                        {isLoading ? <div>Chargement...</div> : 
                            <DossiersTable 
                                sortedDossiers={sortedDossiers}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                handleSort={handleSort}
                                sortField={sortField}
                                sortDirection={sortDirection}
                                getClientsNames={getClientsNames}
                                lots={lots}
                                getFirstAdresseTravaux={getFirstAdresseTravaux}
                                formatAdresse={formatAdresse}
                            />
                        }
                    </CardContent>
                </Card>
            </div>

            <EditDossierDialog 
                isOpen={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)} 
                dossier={editingDossier} 
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['dossiers'] })} 
                clients={clients}
                users={users}
            />

            <ClientFormDialog open={isClientFormDialogOpen} onOpenChange={setIsClientFormDialogOpen} editingClient={editingClientForForm} defaultType={clientTypeForForm} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['clients'] })} />
        </div>
    )
}