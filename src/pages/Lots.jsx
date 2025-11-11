
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [filterCirconscription, setFilterCirconscription] = useState("all");
  const [filterCadastre, setFilterCadastre] = useState("all");
  const [availableCadastres, setAvailableCadastres] = useState([]); // For the main form's cadastre
  const [uploadingPdf, setUploadingPdf] = useState(false); // Kept from original
  const [concordancesAnterieure, setConcordancesAnterieure] = useState([]); // The actual list of concordances for the current lot
  const [newConcordance, setNewConcordance] = useState({ // Temporary state for adding a single concordance
    circonscription_fonciere: "",
    cadastre: "",
    numero_lot: "",
    rang: ""
  });

  const [formData, setFormData] = useState({
    numero_lot: "",
    circonscription_fonciere: "",
    cadastre: "",
    rang: "",
    date_bpd: "",
    type_operation: "",
    document_pdf_url: "" // Kept from original
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      concordances_anterieures: concordancesAnterieure
    };
    
    if (editingLot) {
      updateLotMutation.mutate({ id: editingLot.id, lotData: dataToSubmit });
    } else {
      createLotMutation.mutate(dataToSubmit);
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
    setFormData(prev => ({ ...prev, circonscription_fonciere: value, cadastre: "" }));
    setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
  };

  const addConcordance = () => {
    if (newConcordance.numero_lot && newConcordance.circonscription_fonciere) {
      setConcordancesAnterieure([...concordancesAnterieure, { ...newConcordance }]);
      setNewConcordance({
        circonscription_fonciere: "",
        cadastre: "",
        numero_lot: "",
        rang: ""
      });
    }
  };

  const removeConcordance = (index) => {
    setConcordancesAnterieure(concordancesAnterieure.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      numero_lot: "",
      circonscription_fonciere: "",
      cadastre: "",
      rang: "",
      date_bpd: "",
      type_operation: "",
      document_pdf_url: ""
    });
    setConcordancesAnterieure([]);
    setNewConcordance({
      circonscription_fonciere: "",
      cadastre: "",
      numero_lot: "",
      rang: ""
    });
    setEditingLot(null);
    setAvailableCadastres([]);
  };

  const handleEdit = (lot) => {
    setEditingLot(lot);
    setFormData({
      numero_lot: lot.numero_lot || "",
      circonscription_fonciere: lot.circonscription_fonciere || "",
      cadastre: lot.cadastre || "",
      rang: lot.rang || "",
      date_bpd: lot.date_bpd ? format(new Date(lot.date_bpd), 'yyyy-MM-dd') : "", // Format date for input type="date"
      type_operation: lot.type_operation || "",
      document_pdf_url: lot.document_pdf_url || ""
    });
    setConcordancesAnterieure(lot.concordances_anterieures || []);
    if (lot.circonscription_fonciere) {
      setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[lot.circonscription_fonciere] || []);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lot ?")) {
      deleteLotMutation.mutate(id);
    }
  };

  const filteredLots = lots.filter(lot => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      lot.numero_lot?.toLowerCase().includes(searchLower) ||
      lot.cadastre?.toLowerCase().includes(searchLower) ||
      lot.rang?.toLowerCase().includes(searchLower) ||
      lot.circonscription_fonciere?.toLowerCase().includes(searchLower)
    );

    const matchesCirconscription = filterCirconscription === "all" || lot.circonscription_fonciere === filterCirconscription;
    const matchesCadastre = filterCadastre === "all" || lot.cadastre === filterCadastre;

    return matchesSearch && matchesCirconscription && matchesCadastre;
  });

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
            <p className="text-slate-400">Gestion des lots cadastraux</p>
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
                        {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date BPD</Label>
                    <Input
                      type="date"
                      value={formData.date_bpd}
                      onChange={(e) => setFormData({...formData, date_bpd: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type d'opération</Label>
                    <Select value={formData.type_operation} onValueChange={(value) => setFormData({...formData, type_operation: value})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Vente" className="text-white">Vente</SelectItem>
                        <SelectItem value="Cession" className="text-white">Cession</SelectItem>
                        <SelectItem value="Donation" className="text-white">Donation</SelectItem>
                        <SelectItem value="Déclaration de Transmission" className="text-white">Déclaration de Transmission</SelectItem>
                        <SelectItem value="Jugement" className="text-white">Jugement</SelectItem>
                        <SelectItem value="Rectification" className="text-white">Rectification</SelectItem>
                        <SelectItem value="Retrocession" className="text-white">Retrocession</SelectItem>
                        <SelectItem value="Subdivision" className="text-white">Subdivision</SelectItem>
                        <SelectItem value="Morcellement" className="text-white">Morcellement</SelectItem>
                        <SelectItem value="Autre" className="text-white">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Section Concordances antérieures */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Concordances antérieures</Label>
                  
                  {/* Formulaire d'ajout */}
                  <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Circonscription foncière</Label>
                        <Select 
                          value={newConcordance.circonscription_fonciere} 
                          onValueChange={(value) => setNewConcordance({...newConcordance, circonscription_fonciere: value, cadastre: ""})}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
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
                          value={newConcordance.cadastre}
                          onValueChange={(value) => setNewConcordance({...newConcordance, cadastre: value})}
                          disabled={!newConcordance.circonscription_fonciere}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder={newConcordance.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord une circonscription"} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                            {newConcordance.circonscription_fonciere && CADASTRES_PAR_CIRCONSCRIPTION[newConcordance.circonscription_fonciere]?.map((cadastre) => (
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
                        <Label>Numéro de lot</Label>
                        <Input
                          value={newConcordance.numero_lot}
                          onChange={(e) => setNewConcordance({...newConcordance, numero_lot: e.target.value})}
                          placeholder="Ex: 1234-5678"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rang</Label>
                        <Input
                          value={newConcordance.rang}
                          onChange={(e) => setNewConcordance({...newConcordance, rang: e.target.value})}
                          placeholder="Ex: Rang 4"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={addConcordance}
                      disabled={!newConcordance.numero_lot || !newConcordance.circonscription_fonciere}
                      className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter cette concordance
                    </Button>
                  </div>

                  {/* Tableau des concordances ajoutées */}
                  {concordancesAnterieure.length > 0 && (
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">Circonscription</TableHead>
                            <TableHead className="text-slate-300">Cadastre</TableHead>
                            <TableHead className="text-slate-300">Numéro de lot</TableHead>
                            <TableHead className="text-slate-300">Rang</TableHead>
                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {concordancesAnterieure.map((concordance, index) => (
                            <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                              <TableCell className="text-white">{concordance.circonscription_fonciere}</TableCell>
                              <TableCell className="text-white">{concordance.cadastre || "-"}</TableCell>
                              <TableCell className="text-white font-medium">{concordance.numero_lot}</TableCell>
                              <TableCell className="text-white">{concordance.rang || "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeConcordance(index)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-800">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <CardTitle className="text-xl font-bold text-white">Liste des lots</CardTitle>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <Select value={filterCirconscription} onValueChange={setFilterCirconscription}>
                    <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Circonscription" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Toutes les circonscriptions</SelectItem>
                      {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                        <SelectItem key={circ} value={circ} className="text-white">
                          {circ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterCadastre} onValueChange={setFilterCadastre}>
                    <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Cadastre" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les cadastres</SelectItem>
                      {filterCirconscription !== "all" && CADASTRES_PAR_CIRCONSCRIPTION[filterCirconscription]?.map((cadastre) => (
                        <SelectItem key={cadastre} value={cadastre} className="text-white">
                          {cadastre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300">Numéro de lot</TableHead>
                    <TableHead className="text-slate-300">Circonscription</TableHead>
                    <TableHead className="text-slate-300">Cadastre</TableHead>
                    <TableHead className="text-slate-300">Rang</TableHead>
                    <TableHead className="text-slate-300">Date BPD</TableHead>
                    <TableHead className="text-slate-300">Type d'opération</TableHead>
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
                      <TableCell className="text-slate-300 text-sm">
                        {lot.date_bpd ? format(new Date(lot.date_bpd), "dd MMM yyyy", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell>
                        {lot.type_operation ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {lot.type_operation}
                          </Badge>
                        ) : (
                          <span className="text-slate-600 text-sm">-</span>
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
