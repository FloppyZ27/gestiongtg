import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import ActeForm from "../components/actes/ActeForm";

export default function AjouterActe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const createActeMutation = useMutation({
    mutationFn: (acteData) => base44.entities.Acte.create(acteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actes'] });
      setShowSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 1500);
    },
  });

  const handleSubmit = async (acteData) => {
    createActeMutation.mutate(acteData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Nouvel acte
              </h1>
              <MapPin className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Enregistrer un nouvel acte d'arpentage</p>
          </div>
        </div>

        {showSuccess && (
          <Alert className="mb-6 border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20 backdrop-blur-xl">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <AlertDescription className="text-green-400 font-medium">
              Acte créé avec succès ! Redirection en cours...
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-xl font-bold text-white">Informations de l'acte</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ActeForm 
              onSubmit={handleSubmit}
              onCancel={() => navigate(createPageUrl("Dashboard"))}
              isSubmitting={createActeMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}