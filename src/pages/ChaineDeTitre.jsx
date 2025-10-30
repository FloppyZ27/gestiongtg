import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Link2, Trash2, Plus, MoveIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [placedActes, setPlacedActes] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [draggingActe, setDraggingActe] = useState(null);
  const [connectingArrow, setConnectingArrow] = useState(null);
  const canvasRef = useRef(null);

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

  const handleDragStart = (e, acte) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("acte", JSON.stringify(acte));
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const acteData = e.dataTransfer.getData("acte");
    if (acteData) {
      const acte = JSON.parse(acteData);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setPlacedActes([...placedActes, {
        ...acte,
        id: `${acte.id}-${Date.now()}`,
        x,
        y
      }]);
    }
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
  };

  const startDraggingActe = (e, index) => {
    setDraggingActe({ index, offsetX: e.clientX - placedActes[index].x, offsetY: e.clientY - placedActes[index].y });
  };

  const handleMouseMove = (e) => {
    if (draggingActe !== null) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - draggingActe.offsetX;
      const y = e.clientY - rect.top - draggingActe.offsetY;
      
      setPlacedActes(prev => prev.map((acte, idx) => 
        idx === draggingActe.index ? { ...acte, x, y } : acte
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingActe(null);
  };

  const removeActe = (index) => {
    // Remove acte and associated arrows
    const acteId = placedActes[index].id;
    setPlacedActes(prev => prev.filter((_, i) => i !== index));
    setArrows(prev => prev.filter(arrow => arrow.from !== acteId && arrow.to !== acteId));
  };

  const startConnectingArrow = (acteId) => {
    setConnectingArrow(acteId);
  };

  const completeConnection = (toActeId) => {
    if (connectingArrow && connectingArrow !== toActeId) {
      setArrows([...arrows, { from: connectingArrow, to: toActeId }]);
      setConnectingArrow(null);
    }
  };

  const removeArrow = (index) => {
    setArrows(prev => prev.filter((_, i) => i !== index));
  };

  const clearCanvas = () => {
    setPlacedActes([]);
    setArrows([]);
  };

  const renderPersonNames = (parties) => {
    if (!parties || parties.length === 0) return "-";
    return parties
      .filter(p => p.nom || p.prenom)
      .map(p => `${p.prenom || ''} ${p.nom || ''}`.trim())
      .join(', ');
  };

  const getActeCenter = (acte) => {
    return { x: acte.x + 150, y: acte.y + 150 }; // Approximate center of card
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link2 className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Chaine de Titre
            </h1>
            <p className="text-slate-400">Glissez les actes librement et créez des connexions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar des actes */}
          <div className="lg:col-span-1">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl sticky top-4">
              <CardHeader className="border-b border-slate-800 pb-4">
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
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-4 space-y-3">
                  {filteredActes.map((acte) => (
                    <div
                      key={acte.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, acte)}
                      className="cursor-move"
                    >
                      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 transition-all">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-white font-mono text-xs">
                              {acte.numero_acte}
                            </div>
                            <Badge 
                              variant="secondary"
                              className={`${typeColors[acte.type_acte] || typeColors["Vente"]} border text-xs`}
                            >
                              {acte.type_acte}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400">
                            {acte.notaire}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-4">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold text-white">Canvas de la chaine de titre</CardTitle>
                  <div className="flex gap-2">
                    {connectingArrow && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectingArrow(null)}
                        className="gap-2 bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        Annuler connexion
                      </Button>
                    )}
                    {placedActes.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCanvas}
                        className="gap-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Vider
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  ref={canvasRef}
                  onDrop={handleCanvasDrop}
                  onDragOver={handleCanvasDragOver}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="relative w-full h-[calc(100vh-250px)] bg-slate-800/20 border-2 border-dashed border-slate-700 overflow-auto"
                  style={{ minHeight: '600px' }}
                >
                  {/* SVG for arrows */}
                  <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                    {arrows.map((arrow, idx) => {
                      const fromActe = placedActes.find(a => a.id === arrow.from);
                      const toActe = placedActes.find(a => a.id === arrow.to);
                      if (!fromActe || !toActe) return null;

                      const from = getActeCenter(fromActe);
                      const to = getActeCenter(toActe);

                      return (
                        <g key={idx}>
                          <defs>
                            <marker
                              id={`arrowhead-${idx}`}
                              markerWidth="10"
                              markerHeight="10"
                              refX="9"
                              refY="3"
                              orient="auto"
                            >
                              <polygon points="0 0, 10 3, 0 6" fill="#34d399" />
                            </marker>
                          </defs>
                          <line
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke="#34d399"
                            strokeWidth="2"
                            markerEnd={`url(#arrowhead-${idx})`}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {placedActes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Link2 className="w-16 h-16 text-slate-700 mb-4" />
                      <p className="text-slate-500 text-lg font-medium">
                        Glissez des actes ici pour créer votre chaine de titre
                      </p>
                      <p className="text-slate-600 text-sm mt-2">
                        Positionnez-les librement et créez des connexions
                      </p>
                    </div>
                  ) : (
                    placedActes.map((acte, index) => (
                      <div
                        key={acte.id}
                        className="absolute"
                        style={{ 
                          left: acte.x, 
                          top: acte.y,
                          width: '300px',
                          zIndex: 10
                        }}
                      >
                        <Card className="border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-xl">
                          <CardContent className="p-4">
                            {/* Header avec boutons */}
                            <div className="flex justify-between items-center mb-3">
                              <button
                                onMouseDown={(e) => startDraggingActe(e, index)}
                                className="cursor-move p-1 hover:bg-slate-700 rounded"
                              >
                                <MoveIcon className="w-4 h-4 text-slate-400" />
                              </button>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                  onClick={() => connectingArrow === acte.id ? setConnectingArrow(null) : startConnectingArrow(acte.id)}
                                  title="Créer une connexion"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                {connectingArrow && connectingArrow !== acte.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                    onClick={() => completeConnection(acte.id)}
                                    title="Connecter ici"
                                  >
                                    <Link2 className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  onClick={() => removeActe(index)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Acheteurs */}
                            <div className="mb-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                              <div className="text-xs font-semibold text-cyan-400 mb-1">ACHETEUR(S)</div>
                              <div className="text-sm text-white">
                                {renderPersonNames(acte.acheteurs)}
                              </div>
                            </div>

                            {/* Info de l'acte avec flèche */}
                            <div className="flex flex-col items-center my-3">
                              <div className="w-full text-center space-y-1 p-3 bg-slate-700/50 rounded-lg">
                                <div className="font-mono font-bold text-white text-sm">
                                  {acte.numero_acte}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {format(new Date(acte.date_bpd), "dd MMM yyyy", { locale: fr })}
                                </div>
                                <Badge 
                                  variant="secondary"
                                  className={`${typeColors[acte.type_acte] || typeColors["Vente"]} border text-xs`}
                                >
                                  {acte.type_acte}
                                </Badge>
                              </div>
                              <div className="text-emerald-400 text-2xl my-1">↓</div>
                            </div>

                            {/* Vendeurs */}
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                              <div className="text-xs font-semibold text-emerald-400 mb-1">VENDEUR(S)</div>
                              <div className="text-sm text-white">
                                {renderPersonNames(acte.vendeurs)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Liste des connexions */}
            {arrows.length > 0 && (
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mt-4">
                <CardHeader className="border-b border-slate-800">
                  <CardTitle className="text-sm font-bold text-white">Connexions ({arrows.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {arrows.map((arrow, idx) => {
                      const fromActe = placedActes.find(a => a.id === arrow.from);
                      const toActe = placedActes.find(a => a.id === arrow.to);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                          <div className="text-sm text-slate-300">
                            <span className="font-mono text-emerald-400">{fromActe?.numero_acte}</span>
                            {" → "}
                            <span className="font-mono text-cyan-400">{toActe?.numero_acte}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-400 hover:text-red-300"
                            onClick={() => removeArrow(idx)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}