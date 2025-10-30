import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, FileText, Calendar, User, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

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

export default function ActeDetails({ acte, onClose }) {
  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
              Détails de l'acte
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary"
                className={`${typeColors[acte.type_acte] || typeColors["Autre"]} border font-medium text-base px-3 py-1`}
              >
                {acte.type_acte}
              </Badge>
              <span className="text-slate-600 font-mono text-lg">{acte.numero_acte}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Date BPD</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {format(new Date(acte.date_bpd), "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="w-4 h-4" />
              <span className="font-medium">Notaire</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">{acte.notaire}</p>
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* Vendeurs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Vendeurs</h3>
            <Badge variant="outline" className="ml-2">
              {acte.vendeurs?.length || 0}
            </Badge>
          </div>
          
          {acte.vendeurs && acte.vendeurs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acte.vendeurs.map((vendeur, index) => (
                <Card key={index} className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-semibold text-slate-900">
                      {vendeur.prenom} {vendeur.nom}
                    </p>
                    {vendeur.adresse && (
                      <p className="text-sm text-slate-600">{vendeur.adresse}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">Aucun vendeur enregistré</p>
          )}
        </div>

        <Separator className="bg-slate-200" />

        {/* Acheteurs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-slate-900">Acheteurs</h3>
            <Badge variant="outline" className="ml-2">
              {acte.acheteurs?.length || 0}
            </Badge>
          </div>
          
          {acte.acheteurs && acte.acheteurs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acte.acheteurs.map((acheteur, index) => (
                <Card key={index} className="border-green-200 bg-green-50">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-semibold text-slate-900">
                      {acheteur.prenom} {acheteur.nom}
                    </p>
                    {acheteur.adresse && (
                      <p className="text-sm text-slate-600">{acheteur.adresse}</p>
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
        <Separator className="bg-slate-200" />
        
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <p className="text-sm text-slate-600">
            <span className="font-medium">Créé le :</span>{" "}
            {format(new Date(acte.created_date), "dd/MM/yyyy à HH:mm", { locale: fr })}
          </p>
          {acte.created_by && (
            <p className="text-sm text-slate-600">
              <span className="font-medium">Par :</span> {acte.created_by}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}