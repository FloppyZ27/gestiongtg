import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, FileText, Calendar, User, Users, Edit, Hash, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

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

export default function ActeDetails({ acte, onClose }) {
  const navigate = useNavigate();

  const handleOpenPDF = () => {
    if (!acte.chemin_document_pdf) {
      alert("Aucun chemin de document PDF n'est défini pour cet acte.");
      return;
    }
    window.open(`file:///${acte.chemin_document_pdf.replace(/\\/g, '/')}`, '_blank');
  };

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
      <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Détails de l'acte
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge 
                variant="secondary"
                className={`${typeColors[acte.type_acte] || typeColors["Autre"]} border font-medium text-base px-3 py-1`}
              >
                {acte.type_acte}
              </Badge>
              <span className="text-slate-300 font-mono text-lg">{acte.numero_acte}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("EditerActe") + "?id=" + acte.id)}
              className="hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300"
            >
              <Edit className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-slate-800 text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Date BPD</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {format(new Date(acte.date_bpd), "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <User className="w-4 h-4" />
              <span className="font-medium">Notaire</span>
            </div>
            <p className="text-lg font-semibold text-white">{acte.notaire}</p>
          </div>

          {acte.numero_acte_anterieur && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Hash className="w-4 h-4" />
                <span className="font-medium">N° d'acte antérieur</span>
              </div>
              <p className="text-lg font-semibold text-emerald-400 font-mono">{acte.numero_acte_anterieur}</p>
            </div>
          )}

          {acte.chemin_document_pdf && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Document PDF</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-400 font-mono bg-slate-800/50 px-3 py-2 rounded border border-slate-700 flex-1 truncate">
                  {acte.chemin_document_pdf}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPDF}
                  className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-slate-700" />

        {/* Vendeurs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Vendeurs</h3>
            <Badge variant="outline" className="ml-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              {acte.vendeurs?.length || 0}
            </Badge>
          </div>
          
          {acte.vendeurs && acte.vendeurs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acte.vendeurs.map((vendeur, index) => (
                <Card key={index} className="border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-semibold text-white">
                      {vendeur.prenom} {vendeur.nom}
                    </p>
                    {vendeur.adresse && (
                      <p className="text-sm text-slate-400">{vendeur.adresse}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">Aucun vendeur enregistré</p>
          )}
        </div>

        <Separator className="bg-slate-700" />

        {/* Acheteurs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Acheteurs</h3>
            <Badge variant="outline" className="ml-2 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              {acte.acheteurs?.length || 0}
            </Badge>
          </div>
          
          {acte.acheteurs && acte.acheteurs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acte.acheteurs.map((acheteur, index) => (
                <Card key={index} className="border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-semibold text-white">
                      {acheteur.prenom} {acheteur.nom}
                    </p>
                    {acheteur.adresse && (
                      <p className="text-sm text-slate-400">{acheteur.adresse}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">Aucun acheteur enregistré</p>
          )}
        </div>

        {/* Métadonnées */}
        <Separator className="bg-slate-700" />
        
        <div className="bg-slate-800/30 rounded-lg p-4 space-y-2 border border-slate-700">
          <p className="text-sm text-slate-400">
            <span className="font-medium text-slate-300">Créé le :</span>{" "}
            {format(new Date(acte.created_date), "dd/MM/yyyy à HH:mm", { locale: fr })}
          </p>
          {acte.created_by && (
            <p className="text-sm text-slate-400">
              <span className="font-medium text-slate-300">Par :</span> {acte.created_by}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}