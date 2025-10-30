import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Link2, ArrowDown, Trash2, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const typeColors = {
  "Vente": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Cession": "bg-green-500/20 text-green-400 border-green-500/30",
  "Donation": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Déclaration de Transmission": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Jugement": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Rectification": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Retrocession": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Servitude": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Bornage": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export default function ChaineDeTitre() {
  const [searchTerm, setSearchTerm] = useState("");
  const [chainActes, setChainActes] = useState([]);

  const { data: actes, isLoading } = useQuery({
    queryKey: ['actes'],
    queryFn: () => base44.entities.Acte.list('-created_date'),
    initialData: [],
  });

  const filteredActes = actes.filter(acte => {
    const searchLower = searchTerm.toLowerCase();
    return (
      acte.numero_acte?.toLowerCase().includes(searchLower) ||
      acte.notaire?.toLowerCase().includes(searchLower) ||
      acte.type_acte?.toLowerCase().includes(searchLower)
    );
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // If dragging from sidebar to chain
    if (source.droppableId === "sidebar" && destination.droppableId === "chain") {
      const acte = filteredActes[source.index];
      const newChain = [...chainActes];
      newChain.splice(destination.index, 0, acte);
      setChainActes(newChain);
    }
    // If reordering within chain
    else if (source.droppableId === "chain" && destination.droppableId === "chain") {
      const newChain = [...chainActes];
      const [removed] = newChain.splice(source.index, 1);
      newChain.splice(destination.index, 0, removed);
      setChainActes(newChain);
    }
  };

  const removeFromChain = (index) => {
    setChainActes(chainActes.filter((_, i) => i !== index));
  };

  const clearChain = () => {
    setChainActes([]);
  };

  const renderActeCard = (acte, index, isDragging = false) => (
    <Card className={`border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-all ${isDragging ? 'shadow-lg shadow-emerald-500/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold text-white font-mono text-sm">
            {acte.numero_acte}
          </div>
          <Badge 
            variant="secondary"
            className={`${typeColors[acte.type_acte] || typeColors["Vente"]} border text-xs`}
          >
            {acte.type_acte}
          </Badge>
        </div>
        <div className="text-sm text-slate-400 space-y-1">
          <div>Notaire: {acte.notaire}</div>
          {acte.circonscription_fonciere && (
            <div>Circ.: {acte.circonscription_fonciere}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link2 className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Chaine de Titre
            </h1>
            <p className="text-slate-400">Construisez votre chaine de titre par glisser-déposer</p>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des actes (sidebar) */}
            <div className="lg:col-span-1">
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl sticky top-4">
                <CardHeader className="border-b border-slate-800">
                  <CardTitle className="text-lg font-bold text-white">Actes disponibles</CardTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Droppable droppableId="sidebar">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="max-h-[600px] overflow-y-auto p-4 space-y-3"
                      >
                        {filteredActes.map((acte, index) => (
                          <Draggable key={acte.id} draggableId={acte.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                {renderActeCard(acte, index, snapshot.isDragging)}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>

            {/* Zone de construction de la chaine */}
            <div className="lg:col-span-2">
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-slate-800">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-white">Chaine de titre</CardTitle>
                    {chainActes.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearChain}
                        className="gap-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Vider
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Droppable droppableId="chain">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`min-h-[500px] rounded-lg border-2 border-dashed p-6 transition-colors ${
                          snapshot.isDraggingOver 
                            ? 'border-emerald-500 bg-emerald-500/5' 
                            : 'border-slate-700 bg-slate-800/20'
                        }`}
                      >
                        {chainActes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <Link2 className="w-16 h-16 text-slate-700 mb-4" />
                            <p className="text-slate-500 text-lg font-medium">
                              Glissez des actes ici pour créer votre chaine de titre
                            </p>
                            <p className="text-slate-600 text-sm mt-2">
                              Les actes seront ordonnés de haut en bas
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {chainActes.map((acte, index) => (
                              <Draggable key={`chain-${acte.id}-${index}`} draggableId={`chain-${acte.id}-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <div className="relative">
                                      {renderActeCard(acte, index, snapshot.isDragging)}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFromChain(index)}
                                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    {index < chainActes.length - 1 && (
                                      <div className="flex justify-center my-4">
                                        <ArrowDown className="w-6 h-6 text-emerald-400" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}