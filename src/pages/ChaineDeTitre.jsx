import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Link2, Trash2, Plus, MoveIcon, ZoomIn, ZoomOut, Eye, EyeOff } from "lucide-react";
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
  const [draggingItem, setDraggingItem] = useState(null);
  const [connectingArrow, setConnectingArrow] = useState(null);
  const [zoom, setZoom] = useState(1);
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

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.3, Math.min(2, prev + delta)));
    }
  };

  const findActeByNumero = (numeroActe) => {
    return actes.find(a => a.numero_acte === numeroActe);
  };

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
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      
      addActeToCanvas(acte, x, y, true);
    }
  };

  const addActeToCanvas = (acte, x, y, showAcheteurs = true) => {
    const acteId = `${acte.numero_acte}-${Date.now()}`;
    const newActe = {
      id: acteId,
      acte: acte,
      acheteurs: showAcheteurs ? { x: x, y: y, visible: true } : null,
      info: { x: x, y: showAcheteurs ? y + 100 : y },
      vendeurs: { x: x, y: showAcheteurs ? y + 200 : y + 100, visible: true }
    };

    setPlacedActes(prev => {
      const updated = [...prev, newActe];
      
      // Recursively add previous acts
      const addPreviousActes = (currentActe, currentId, baseX, baseY) => {
        if (currentActe.numeros_actes_anterieurs && currentActe.numeros_actes_anterieurs.length > 0) {
          let offsetY = baseY + 300;
          currentActe.numeros_actes_anterieurs.forEach((numeroAnterieur, idx) => {
            const acteAnterieur = findActeByNumero(numeroAnterieur);
            if (acteAnterieur) {
              const alreadyPlaced = updated.some(pa => pa.acte.numero_acte === acteAnterieur.numero_acte);
              if (!alreadyPlaced) {
                const anteriorActeId = `${acteAnterieur.numero_acte}-${Date.now()}-${idx}`;
                const anteriorActe = {
                  id: anteriorActeId,
                  acte: acteAnterieur,
                  acheteurs: null,
                  info: { x: baseX, y: offsetY },
                  vendeurs: { x: baseX, y: offsetY + 100, visible: true }
                };
                updated.push(anteriorActe);
                
                setTimeout(() => {
                  setArrows(prevArrows => [...prevArrows, { from: currentId, to: anteriorActeId, type: 'chain' }]);
                }, 100);
                
                // Recursively add previous acts for this anterior act
                addPreviousActes(acteAnterieur, anteriorActeId, baseX, offsetY);
                offsetY += 300;
              }
            }
          });
        }
      };

      addPreviousActes(acte, acteId, x, showAcheteurs ? y + 200 : y + 100);
      
      return updated;
    });
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
  };

  const startDragging = (e, acteIndex, section) => {
    const acte = placedActes[acteIndex];
    if (!acte[section]) return;
    setDraggingItem({ 
      acteIndex, 
      section,
      offsetX: e.clientX / zoom - acte[section].x, 
      offsetY: e.clientY / zoom - acte[section].y 
    });
  };

  const handleMouseMove = (e) => {
    if (draggingItem !== null) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - draggingItem.offsetX;
      const y = (e.clientY - rect.top) / zoom - draggingItem.offsetY;
      
      setPlacedActes(prev => prev.map((acte, idx) => 
        idx === draggingItem.acteIndex 
          ? { ...acte, [draggingItem.section]: { ...acte[draggingItem.section], x, y } }
          : acte
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingItem(null);
  };

  const removeActe = (index) => {
    const acteId = placedActes[index].id;
    setPlacedActes(prev => prev.filter((_, i) => i !== index));
    setArrows(prev => prev.filter(arrow => arrow.from !== acteId && arrow.to !== acteId));
  };

  const removeSection = (index, section) => {
    setPlacedActes(prev => prev.map((acte, idx) => 
      idx === index ? { ...acte, [section]: null } : acte
    ));
  };

  const toggleSection = (index, section) => {
    setPlacedActes(prev => prev.map((acte, idx) => {
      if (idx === index) {
        if (acte[section]) {
          // Hide section
          return { ...acte, [section]: { ...acte[section], visible: false } };
        } else {
          // Show section - create it at a default position
          const infoY = acte.info.y;
          const infoX = acte.info.x;
          return {
            ...acte,
            [section]: {
              x: infoX,
              y: section === 'acheteurs' ? infoY - 100 : infoY + 100,
              visible: true
            }
          };
        }
      }
      return acte;
    }));
  };

  const startConnectingArrow = (acteId) => {
    setConnectingArrow(acteId);
  };

  const completeConnection = (toActeId) => {
    if (connectingArrow && connectingArrow !== toActeId) {
      setArrows([...arrows, { from: connectingArrow, to: toActeId, type: 'manual' }]);
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
    if (!parties || parties.length === 0) return ["-"];
    return parties
      .filter(p => p.nom || p.prenom)
      .map(p => `${p.prenom || ''} ${p.nom || ''}`.trim());
  };

  const getBlockEdge = (position, section, width = 250, height = 80) => {
    // Return edge points for connections
    if (section === 'acheteurs') {
      return { x: position.x + width / 2, y: position.y + height }; // Bottom center
    } else if (section === 'info') {
      return { x: position.x + width / 2, y: position.y }; // Top center
    } else if (section === 'vendeurs') {
      return { x: position.x + width / 2, y: position.y }; // Top center
    }
  };

  const getInfoBottomEdge = (position, width = 250, height = 80) => {
    return { x: position.x + width / 2, y: position.y + height };
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
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-start">
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
                            <div className="font-semibold text-cyan-400">Acheteur(s):</div>
                            {renderPersonNames(acte.acheteurs).map((name, idx) => (
                              <div key={idx}>{name}</div>
                            ))}
                          </div>
                          <div className="text-xs text-slate-400">
                            <div className="font-semibold text-emerald-400">Vendeur(s):</div>
                            {renderPersonNames(acte.vendeurs).map((name, idx) => (
                              <div key={idx}>{name}</div>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(acte.date_bpd), "dd MMM yyyy", { locale: fr })}
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
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))}
                      >
                        <ZoomOut className="w-3 h-3 text-slate-400" />
                      </Button>
                      <span className="text-sm text-slate-400 font-mono w-12 text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                      >
                        <ZoomIn className="w-3 h-3 text-slate-400" />
                      </Button>
                    </div>
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
                  onWheel={handleWheel}
                  className="relative w-full h-[calc(100vh-250px)] overflow-auto"
                  style={{ 
                    minHeight: '600px',
                    backgroundImage: `
                      linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                    backgroundColor: 'rgba(30, 41, 59, 0.2)'
                  }}
                >
                  <div style={{ 
                    transform: `scale(${zoom})`, 
                    transformOrigin: '0 0',
                    width: `${100 / zoom}%`,
                    height: `${100 / zoom}%`,
                    position: 'relative'
                  }}>
                    {/* SVG for connections between blocks and arrows */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                      {/* Lines connecting the 3 blocks of each acte */}
                      {placedActes.map((acteData, idx) => {
                        const lines = [];
                        
                        // Line from acheteurs to info (if acheteurs exists and is visible)
                        if (acteData.acheteurs && acteData.acheteurs.visible) {
                          const acheteurEdge = getBlockEdge(acteData.acheteurs, 'acheteurs');
                          const infoTopEdge = getBlockEdge(acteData.info, 'info');
                          lines.push(
                            <line
                              key={`acheteur-info-${idx}`}
                              x1={acheteurEdge.x}
                              y1={acheteurEdge.y}
                              x2={infoTopEdge.x}
                              y2={infoTopEdge.y}
                              stroke="#64748b"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                            />
                          );
                        }
                        
                        // Line from info to vendeurs (if vendeurs exists and is visible)
                        if (acteData.vendeurs && acteData.vendeurs.visible) {
                          const infoBottomEdge = getInfoBottomEdge(acteData.info);
                          const vendeurTopEdge = getBlockEdge(acteData.vendeurs, 'vendeurs');
                          lines.push(
                            <line
                              key={`info-vendeur-${idx}`}
                              x1={infoBottomEdge.x}
                              y1={infoBottomEdge.y}
                              x2={vendeurTopEdge.x}
                              y2={vendeurTopEdge.y}
                              stroke="#64748b"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                            />
                          );
                        }
                        
                        return <g key={`lines-${idx}`}>{lines}</g>;
                      })}
                      
                      {/* Arrows between different actes */}
                      {arrows.map((arrow, idx) => {
                        const fromActe = placedActes.find(a => a.id === arrow.from);
                        const toActe = placedActes.find(a => a.id === arrow.to);
                        if (!fromActe || !toActe) return null;

                        // For chain connections: from vendeur bottom to info top
                        const from = arrow.type === 'chain' 
                          ? (fromActe.vendeurs && fromActe.vendeurs.visible ? getBlockEdge(fromActe.vendeurs, 'acheteurs') : getInfoBottomEdge(fromActe.info))
                          : getInfoBottomEdge(fromActe.info);
                        const to = getBlockEdge(toActe.info, 'info');

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
                                <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
                              </marker>
                            </defs>
                            <line
                              x1={from.x}
                              y1={from.y}
                              x2={to.x}
                              y2={to.y}
                              stroke="#64748b"
                              strokeWidth="2"
                              strokeDasharray="5,5"
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
                          Utilisez Ctrl + Molette pour zoomer
                        </p>
                      </div>
                    ) : (
                      placedActes.map((acteData, index) => (
                        <React.Fragment key={acteData.id}>
                          {/* Acheteurs Block */}
                          {acteData.acheteurs && acteData.acheteurs.visible && (
                            <div
                              className="absolute"
                              style={{ 
                                left: acteData.acheteurs.x, 
                                top: acteData.acheteurs.y,
                                width: '250px',
                                zIndex: 10
                              }}
                            >
                              <Card className="border-blue-500/50 bg-blue-500/10 backdrop-blur-sm shadow-lg">
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <button
                                      onMouseDown={(e) => startDragging(e, index, 'acheteurs')}
                                      className="cursor-move p-1 hover:bg-blue-500/20 rounded"
                                    >
                                      <MoveIcon className="w-3 h-3 text-blue-400" />
                                    </button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      onClick={() => removeSection(index, 'acheteurs')}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="space-y-1 text-center">
                                    {renderPersonNames(acteData.acte.acheteurs).map((name, idx) => (
                                      <div key={idx} className="text-sm text-white font-medium">
                                        {name}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}

                          {/* Info Block */}
                          <div
                            className="absolute"
                            style={{ 
                              left: acteData.info.x, 
                              top: acteData.info.y,
                              width: '250px',
                              zIndex: 10
                            }}
                          >
                            <Card className="border-purple-500/50 bg-purple-500/10 backdrop-blur-sm shadow-xl">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <button
                                    onMouseDown={(e) => startDragging(e, index, 'info')}
                                    className="cursor-move p-1 hover:bg-purple-500/20 rounded"
                                  >
                                    <MoveIcon className="w-3 h-3 text-purple-400" />
                                  </button>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                      onClick={() => connectingArrow === acteData.id ? setConnectingArrow(null) : startConnectingArrow(acteData.id)}
                                      title="Créer une connexion"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                    {connectingArrow && connectingArrow !== acteData.id && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                        onClick={() => completeConnection(acteData.id)}
                                        title="Connecter ici"
                                      >
                                        <Link2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      onClick={() => removeActe(index)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-center space-y-2">
                                  <div className="font-mono font-bold text-white text-sm">
                                    N° {acteData.acte.numero_acte}
                                  </div>
                                  <div className="text-xs text-slate-300">
                                    {format(new Date(acteData.acte.date_bpd), "dd MMM yyyy", { locale: fr })}
                                  </div>
                                  <Badge 
                                    variant="secondary"
                                    className={`${typeColors[acteData.acte.type_acte] || typeColors["Vente"]} border text-xs`}
                                  >
                                    {acteData.acte.type_acte}
                                  </Badge>
                                  <div className="flex gap-2 justify-center pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleSection(index, 'acheteurs')}
                                      className="text-xs h-6 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                                    >
                                      {acteData.acheteurs && acteData.acheteurs.visible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                      Acheteur
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleSection(index, 'vendeurs')}
                                      className="text-xs h-6 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                                    >
                                      {acteData.vendeurs && acteData.vendeurs.visible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                      Vendeur
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Vendeurs Block */}
                          {acteData.vendeurs && acteData.vendeurs.visible && (
                            <div
                              className="absolute"
                              style={{ 
                                left: acteData.vendeurs.x, 
                                top: acteData.vendeurs.y,
                                width: '250px',
                                zIndex: 10
                              }}
                            >
                              <Card className="border-blue-500/50 bg-blue-500/10 backdrop-blur-sm shadow-lg">
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <button
                                      onMouseDown={(e) => startDragging(e, index, 'vendeurs')}
                                      className="cursor-move p-1 hover:bg-blue-500/20 rounded"
                                    >
                                      <MoveIcon className="w-3 h-3 text-blue-400" />
                                    </button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      onClick={() => removeSection(index, 'vendeurs')}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="space-y-1 text-center">
                                    {renderPersonNames(acteData.acte.vendeurs).map((name, idx) => (
                                      <div key={idx} className="text-sm text-white font-medium">
                                        {name}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </div>
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
                            <span className="font-mono text-emerald-400">{fromActe?.acte.numero_acte}</span>
                            {" → "}
                            <span className="font-mono text-cyan-400">{toActe?.acte.numero_acte}</span>
                            {arrow.type === 'chain' && (
                              <Badge variant="outline" className="ml-2 text-xs border-green-500/30 text-green-400">
                                Auto
                              </Badge>
                            )}
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