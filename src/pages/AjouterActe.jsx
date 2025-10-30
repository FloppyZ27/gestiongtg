import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Nouvel acte</h1>
            <p className="text-slate-600 mt-1">Enregistrer un nouvel acte notarié</p>
          </div>
        </div>

        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              Acte créé avec succès ! Redirection en cours...
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-xl">
          <CardHeader className="border-b border-slate-200 bg-white">
            <CardTitle className="text-xl font-bold text-slate-900">Informations de l'acte</CardTitle>
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