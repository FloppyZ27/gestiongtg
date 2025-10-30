import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, X, UserPlus, FileText, Upload, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const TYPES_ACTES = [
  "Vente",
  "Donation",
  "Succession",
  "Hypothèque",
  "Prêt",
  "Échange",
  "Bail",
  "Servitude",
  "Autre"
];

export default function ActeForm({ acte, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState(acte || {
    numero_acte: "",
    numero_acte_anterieur: "",
    date_bpd: "",
    type_acte: "",
    notaire: "",
    document_pdf_url: "",
    vendeurs: [{ nom: "", prenom: "", adresse: "" }],
    acheteurs: [{ nom: "", prenom: "", adresse: "" }],
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Veuillez sélectionner un fichier PDF');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, document_pdf_url: file_url }));
      setUploadedFileName(file.name);
    } catch (error) {
      alert('Erreur lors de l\'upload du fichier');
    }
    setUploading(false);
  };

  const handlePersonChange = (type, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }));
  };

  const addPerson = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { nom: "", prenom: "", adresse: "" }]
    }));
  };

  const removePerson = (type, index) => {
    if (formData[type].length > 1) {
      setFormData(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Informations générales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Informations générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numero_acte" className="text-slate-300">
              N° d'acte <span className="text-red-400">*</span>
            </Label>
            <Input
              id="numero_acte"
              value={formData.numero_acte}
              onChange={(e) => handleInputChange('numero_acte', e.target.value)}
              placeholder="Ex: ACT-2024-001"
              required
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_acte_anterieur" className="text-slate-300">
              N° d'acte antérieur
            </Label>
            <Input
              id="numero_acte_anterieur"
              value={formData.numero_acte_anterieur || ""}
              onChange={(e) => handleInputChange('numero_acte_anterieur', e.target.value)}
              placeholder="Ex: ACT-2023-999"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_bpd" className="text-slate-300">
              Date BPD <span className="text-red-400">*</span>
            </Label>
            <Input
              id="date_bpd"
              type="date"
              value={formData.date_bpd}
              onChange={(e) => handleInputChange('date_bpd', e.target.value)}
              required
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type_acte" className="text-slate-300">
              Type d'acte <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formData.type_acte}
              onValueChange={(value) => handleInputChange('type_acte', value)}
              required
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {TYPES_ACTES.map((type) => (
                  <SelectItem key={type} value={type} className="text-white">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notaire" className="text-slate-300">
              Notaire <span className="text-red-400">*</span>
            </Label>
            <Input
              id="notaire"
              value={formData.notaire}
              onChange={(e) => handleInputChange('notaire', e.target.value)}
              placeholder="Nom du notaire"
              required
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="document_pdf" className="text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document PDF
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="document_pdf"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="bg-slate-800/50 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
              />
              {uploading && (
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              )}
            </div>
            {formData.document_pdf_url && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-green-400" />
                <span className="text-green-400">
                  {uploadedFileName || "Document uploadé avec succès"}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Sélectionnez un fichier PDF depuis votre ordinateur
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Vendeurs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Vendeurs</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addPerson('vendeurs')}
            className="gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un vendeur
          </Button>
        </div>

        {formData.vendeurs.map((vendeur, index) => (
          <Card key={index} className="border-slate-700 bg-slate-800/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold text-emerald-400">
                  Vendeur {index + 1}
                </CardTitle>
                {formData.vendeurs.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePerson('vendeurs', index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Nom</Label>
                  <Input
                    value={vendeur.nom}
                    onChange={(e) => handlePersonChange('vendeurs', index, 'nom', e.target.value)}
                    placeholder="Nom"
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Prénom</Label>
                  <Input
                    value={vendeur.prenom}
                    onChange={(e) => handlePersonChange('vendeurs', index, 'prenom', e.target.value)}
                    placeholder="Prénom"
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">Adresse</Label>
                <Input
                  value={vendeur.adresse}
                  onChange={(e) => handlePersonChange('vendeurs', index, 'adresse', e.target.value)}
                  placeholder="Adresse complète"
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="bg-slate-700" />

      {/* Acheteurs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Acheteurs</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addPerson('acheteurs')}
            className="gap-2 bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un acheteur
          </Button>
        </div>

        {formData.acheteurs.map((acheteur, index) => (
          <Card key={index} className="border-slate-700 bg-slate-800/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold text-cyan-400">
                  Acheteur {index + 1}
                </CardTitle>
                {formData.acheteurs.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePerson('acheteurs', index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Nom</Label>
                  <Input
                    value={acheteur.nom}
                    onChange={(e) => handlePersonChange('acheteurs', index, 'nom', e.target.value)}
                    placeholder="Nom"
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Prénom</Label>
                  <Input
                    value={acheteur.prenom}
                    onChange={(e) => handlePersonChange('acheteurs', index, 'prenom', e.target.value)}
                    placeholder="Prénom"
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">Adresse</Label>
                <Input
                  value={acheteur.adresse}
                  onChange={(e) => handlePersonChange('acheteurs', index, 'adresse', e.target.value)}
                  placeholder="Adresse complète"
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="gap-2 bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? "Enregistrement..." : (acte ? "Modifier l'acte" : "Enregistrer l'acte")}
        </Button>
      </div>
    </form>
  );
}