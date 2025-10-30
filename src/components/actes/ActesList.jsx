import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, FileText, User, Edit, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const typeColors = {
  "Vente": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Donation": "bg-green-500/20 text-green-400 border-green-500/30",
  "Succession": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Hypothèque": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Prêt": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Échange": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Bail": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Servitude": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Autre": "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function ActesList({ actes, isLoading, onSelectActe, onSort, sortField, sortDirection }) {
  const navigate = useNavigate();

  const handleOpenPDF = (cheminPDF) => {
    if (!cheminPDF) {
      alert("Aucun chemin de document PDF n'est défini pour cet acte.");
      return;
    }
    // Open file using file:// protocol
    window.open(`file:///${cheminPDF.replace(/\\/g, '/')}`, '_blank');
  };

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )
      ) : (
        <ArrowUpDown className="w-4 h-4 opacity-50" />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-4 mb-4">
            <Skeleton className="h-12 w-full bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (actes.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="w-16 h-16 mx-auto text-slate-700 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Aucun acte enregistré</h3>
        <p className="text-slate-400">Commencez par créer votre premier acte d'arpentage</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
            <TableHead className="font-semibold text-slate-300">
              <SortButton field="numero_acte" label="N° d'acte" />
            </TableHead>
            <TableHead className="font-semibold text-slate-300">
              <SortButton field="date_bpd" label="Date BPD" />
            </TableHead>
            <TableHead className="font-semibold text-slate-300">
              <SortButton field="type_acte" label="Type" />
            </TableHead>
            <TableHead className="font-semibold text-slate-300">
              <SortButton field="notaire" label="Notaire" />
            </TableHead>
            <TableHead className="font-semibold text-slate-300">
              <SortButton field="vendeurs" label="Parties" />
            </TableHead>
            <TableHead className="font-semibold text-slate-300">Document</TableHead>
            <TableHead className="font-semibold text-slate-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actes.map((acte) => (
            <TableRow 
              key={acte.id} 
              className="hover:bg-slate-800/30 cursor-pointer transition-colors border-slate-800"
              onClick={() => onSelectActe(acte)}
            >
              <TableCell className="font-medium text-white">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  {acte.numero_acte}
                </div>
              </TableCell>
              <TableCell className="text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {format(new Date(acte.date_bpd), "dd MMM yyyy", { locale: fr })}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="secondary"
                  className={`${typeColors[acte.type_acte] || typeColors["Autre"]} border font-medium`}
                >
                  {acte.type_acte}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  {acte.notaire}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2 text-sm">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    {acte.vendeurs?.length || 0} vendeur(s)
                  </Badge>
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                    {acte.acheteurs?.length || 0} acheteur(s)
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                {acte.chemin_document_pdf ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPDF(acte.chemin_document_pdf);
                    }}
                    className="gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <ExternalLink className="w-4 h-4" />
                    PDF
                  </Button>
                ) : (
                  <span className="text-slate-600 text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(createPageUrl("EditerActe") + "?id=" + acte.id);
                    }}
                    className="gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <Edit className="w-4 h-4" />
                    Éditer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectActe(acte);
                    }}
                    className="gap-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}