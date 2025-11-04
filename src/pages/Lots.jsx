import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Grid3x3, FileText, Upload, ExternalLink, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CIRCONSCRIPTIONS = ["Lac-Saint-Jean-Est", "Lac-Saint-Jean-Ouest", "Chicoutimi"];

const CADASTRES_PAR_CIRCONSCRIPTION = {
  "Lac-Saint-Jean-Est": [
    "Québec",
    "Canton de Caron",
    "Canton de de l'Île",
    "Canton de Garnier",
    "Village d'Héberville",
    "Canton d'Hébertville-Station",
    "Canton de Labarre",
    "Canton de Mésy",
    "Canton de Métabetchouan",
    "Canton de Signay",
    "Canton de Taillon"
  ],
  "Lac-Saint-Jean-Ouest": [
    "Québec",
    "Canton d'Albanel",
    "Canton de Charlevoix",
    "Canton de Dablon",
    "Canton de Dalmas",
    "Canton de Demeules",
    "Canton de Dequen",
    "Canton de Dolbeau",
    "Canton de Girard",
    "Canton de Jogues",
    "Canton de Malherbe",
    "Canton de Métabetchouan",
    "Canton de Milot",
    "Canton de Normandin",
    "Canton de Ouiatchouan",
    "Canton de Racine",
    "Canton de Roberval",
    "Canton de Saint-Hilaire"
  ],
  "Chicoutimi": [
    "Québec",
    "Cité d'Arvida",
    "Canton de Bagot",
    "Village de Bagotville",
    "Canton de Bégin",
    "Canton de Boileau",
    "Canton de Bourget",
    "Canton de Chicoutimi",
    "Paroisse de Chicoutimi",
    "Ville de Chicoutimi",
    "Canton de Dumas",
    "Canton de Durocher",
    "Canton de Falardeau",
    "Canton de Ferland",
    "Ville de Grande-Baie",
    "Canton de Harvey",
    "Canton de Hébert",
    "Canton de Jonquière",
    "Canton de Kénogami",
    "Canton de Labrecque",
    "Canton de Laterrière",
    "Canton d'Otis",
    "Canton de Périgny",
    "Canton de Rouleau",
    "Canton de Simard",
    "Paroisse de Saint-Alexis",
    "Paroisse de Saint-Alphonse",
    "Ville de Sainte-Anne-de-Chicoutimi",
    "Canton de Saint-Germains",
    "Canton de Saint-Jean",
    "Canton de Taché",
    "Canton de Tremblay"
  ]
};

export default function Lots() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [formData, setFormData] = useState({
    circonscription_fonciere: "",
    cadastre: "",
    rang: "",
    numero_lot: "",
    concordances_anterieures: [],
    document_pdf_url: ""
  });

  const queryClient = useQueryClient();

  const { data: lots, isLoading } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list('-created_date'),
    initialData: [],
  });

  const createLotMutation = useMutation({
    mutationFn: (lotData) => base44.entities.Lot.create(lotData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: ({ id, lotData }) => base44.entities.Lot.update(id, lotData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteLotMutation = useMutation({
    mutationFn: (id) => base44.entities.Lot.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
  });

  const filteredLots = lots.filter(lot => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lot.numero_lot?.toLowerCase().includes(searchLower) ||
      lot.cadastre?.toLowerCase().includes(searchLower) ||
      lot.rang?.toLowerCase().includes(searchLower) ||
      lot.circonscription_fonciere?.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingLot) {
      updateLotMutation.mutate({ id: editingLot.id, lotData: formData });
    } else {
      createLotMutation.mutate(formData);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, document_pdf_url: result.file_url });
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleCirconscriptionChange = (value) => {
    setFormData({
      ...formData,
      circonscription_fonciere: value,
      cadastre: ""
    });
  };

  const addConcordance = () => {
    setFormData({
      ...formData,
      concordances_anterieures: [...formData.concordances_anterieures, {
        circonscription_fonciere: "",
        cadastre: "",
        numero_lot: "",
        rang: ""
      }]
    });
  };

  const removeConcordance = (index) => {
    setFormData({
      ...formData,
      concordances_anterieures: formData.concordances_anterieures.filter((_, i) => i !== index)
    });
  };

  const updateConcordance = (index, field, value) => {
    setFormData({
      ...formData,
      concordances_anterieures: formData.concordances_anterieures.map((conc, i) => {
        if (i === index) {
          const updated = { ...conc, [field]: value };
          if (field === 'circonscription_fonciere') {
            updated.cadastre = "";
          }
          return updated;
        }
        return conc;
      })
    });
  };

  const resetForm = () => {
    setFormData({
      circonscription_fonciere: "",
      cadastre: "",
      rang: "",
      numero_lot: "",
      concordances_anterieures: [],
      document_pdf_url: ""
    });
    setEditingLot(null);
  };

  const handleEdit = (lot) => {
    setEditingLot(lot);
    setFormData({
      circonscription_fonciere: lot.circonscription_fonciere || "",
      cadastre: lot.cadastre || "",
      rang: lot.rang || "",
      numero_lot: lot.numero_lot || "",
      concordances_anterieures: lot.concordances_anterieures || [],
      document_pdf_url: lot.document_pdf_url || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lot ?")) {
      deleteLotMutation.mutate(id);
    }
  };

  const availableCadastres = formData.circonscription_fonciere 
    ? CADASTRES_PAR_CIRCONSCRIPTION[formData.circonscription_fonciere] || []
    : [];

  const getAvailableCadastresForConcordance = (circonscription) => {
    return circonscription ? CADASTRES_PAR_CIRCONSCRIPTION[circonscription] || [] : [];
  };

  const statsCards = [
    {
      title: "Total des lots",
      value: lots.length,
      icon: Grid3x3,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Ce mois",
      value: lots.filter(l => {
        const lotDate = new Date(l.created_date);
        const now = new Date();
        return lotDate.getMonth() === now.getMonth() && lotDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Plus,
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Lots
              </h1>
              <Grid3x3 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion de vos lots cadastraux</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
                <Plus className="w-5 h-5 mr-2" />
                Nouveau lot
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingLot ? "Modifier le lot" : "Nouveau lot"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Circonscription foncière <span className="text-red-400">*</span></Label>
                    <Select value={formData.circonscription_fonciere} onValueChange={handleCirconscriptionChange}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {CIRCONSCRIPTIONS.map((circ) => (
                          <SelectItem key={circ} value={circ} className="text-white">
                            {circ}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cadastre</Label>
                    <Select 
                      value={formData.cadastre} 
                      onValueChange={(value) => setFormData({...formData, cadastre: value})}
                      disabled={!formData.circonscription_fonciere}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder={formData.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord une circonscription"} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                        {availableCadastres.map((cadastre) => (
                          <SelectItem key={cadastre} value={cadastre} className="text-white">
                            {cadastre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Numéro de lot <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.numero_lot}
                      onChange={(e) => setFormData({...formData, numero_lot: e.target.value})}
                      required
                      placeholder="Ex: 1234-5678"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rang</Label>
                    <Input
                      value={formData.rang}
                      onChange={(e) => setFormData({...formData, rang: e.target.value})}
                      placeholder="Ex: Rang 4"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Concordances antérieures</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addConcordance}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter une concordance
                    </Button>
                  </div>
                  {formData.concordances_anterieures.length > 0 ? (
                    <div className="space-y-3">
                      {formData.concordances_anterieures.map((conc, index) => {
                        const concCadastres = getAvailableCadastresForConcordance(conc.circonscription_fonciere);
                        return (
                          <Card key={index} className="border-slate-700 bg-slate-800/30">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <Label className="text-sm">Concordance {index + 1}</Label>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeConcordance(index)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs">Circonscription foncière</Label>
                                  <Select 
                                    value={conc.circonscription_fonciere} 
                                    onValueChange={(value) => updateConcordance(index, 'circonscription_fonciere', value)}
                                  >
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                      <SelectValue placeholder="Sélectionner" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                      {CIRCONSCRIPTIONS.map((circ) => (
                                        <SelectItem key={circ} value={circ} className="text-white">
                                          {circ}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Cadastre</Label>
                                  <Select 
                                    value={conc.cadastre} 
                                    onValueChange={(value) => updateConcordance(index, 'cadastre', value)}
                                    disabled={!conc.circonscription_fonciere}
                                  >
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                      <SelectValue placeholder={conc.circonscription_fonciere ? "Sélectionner" : "Choisir circonscription"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                                      {concCadastres.map((cadastre) => (
                                        <SelectItem key={cadastre} value={cadastre} className="text-white">
                                          {cadastre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs">Numéro de lot</Label>
                                  <Input
                                    value={conc.numero_lot}
                                    onChange={(e) => updateConcordance(index, 'numero_lot', e.target.value)}
                                    placeholder="Ex: 1234-5678"
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Rang</Label>
                                  <Input
                                    value={conc.rang}
                                    onChange={(e) => updateConcordance(index, 'rang', e.target.value)}
                                    placeholder="Ex: Rang 4"
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-3 bg-slate-800/30 rounded-lg">
                      Aucune concordance antérieure
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Document PDF</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingPdf}
                      className="bg-slate-800 border-slate-700"
                    />
                    {uploadingPdf && (
                      <Button type="button" disabled className="bg-slate-700">
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Upload...
                      </Button>
                    )}
                  </div>
                  {formData.document_pdf_url && (
                    <a
                      href={formData.document_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-2"
                    >
                      <FileText className="w-4 h-4" />
                      Voir le PDF
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    {editingLot ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                    <CardTitle className="text-3xl font-bold mt-2 text-white">
                      {stat.value}
                    </CardTitle>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} opacity-20`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-800">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Liste des lots</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300">Numéro de lot</TableHead>
                    <TableHead className="text-slate-300">Circonscription</TableHead>
                    <TableHead className="text-slate-300">Cadastre</TableHead>
                    <TableHead className="text-slate-300">Rang</TableHead>
                    <TableHead className="text-slate-300">Concordances</TableHead>
                    <TableHead className="text-slate-300">PDF</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLots.map((lot) => (
                    <TableRow key={lot.id} className="hover:bg-slate-800/30 border-slate-800">
                      <TableCell className="font-medium text-white">
                        {lot.numero_lot}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          {lot.circonscription_fonciere}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {lot.cadastre || "-"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {lot.rang || "-"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {lot.concordances_anterieures && lot.concordances_anterieures.length > 0 ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {lot.concordances_anterieures.length}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {lot.document_pdf_url ? (
                          <a
                            href={lot.document_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ouvrir
                          </a>
                        ) : (
                          <span className="text-slate-600 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(lot)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lot.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}