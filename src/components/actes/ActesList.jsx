import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, FileText, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const typeColors = {
  "Vente": "bg-blue-100 text-blue-800 border-blue-200",
  "Donation": "bg-green-100 text-green-800 border-green-200",
  "Succession": "bg-purple-100 text-purple-800 border-purple-200",
  "Hypothèque": "bg-orange-100 text-orange-800 border-orange-200",
  "Prêt": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Échange": "bg-pink-100 text-pink-800 border-pink-200",
  "Bail": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Servitude": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Autre": "bg-gray-100 text-gray-800 border-gray-200",
};

export default function ActesList({ actes, isLoading, onSelectActe }) {
  if (isLoading) {
    return (
      <div className="p-6">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-4 mb-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (actes.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun acte enregistré</h3>
        <p className="text-slate-600">Commencez par créer votre premier acte notarié</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-700">N° d'acte</TableHead>
            <TableHead className="font-semibold text-slate-700">Date BPD</TableHead>
            <TableHead className="font-semibold text-slate-700">Type</TableHead>
            <TableHead className="font-semibold text-slate-700">Notaire</TableHead>
            <TableHead className="font-semibold text-slate-700">Parties</TableHead>
            <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actes.map((acte) => (
            <TableRow 
              key={acte.id} 
              className="hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onSelectActe(acte)}
            >
              <TableCell className="font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  {acte.numero_acte}
                </div>
              </TableCell>
              <TableCell className="text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
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
              <TableCell className="text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  {acte.notaire}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2 text-sm">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {acte.vendeurs?.length || 0} vendeur(s)
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {acte.acheteurs?.length || 0} acheteur(s)
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectActe(acte);
                  }}
                  className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4" />
                  Voir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}