import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import piexif from 'piexifjs';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Play, Square, Clock, FolderOpen, Camera, Image, FileText, ChevronRight, ChevronLeft, Mountain, ExternalLink, RefreshCw, User, Calendar, AlertCircle, Wrench, UserCheck, Link2, Timer, Users, X, ZoomIn } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ARPENTEUR_INITIALS = {
  "Samuel Guay": "SG",
  "Dany Gaboury": "DG",
  "Pierre-Luc Pilote": "PLP",
  "Benjamin Larouche": "BL",
  "Frédéric Gilbert": "FG"
};

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = { "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30", "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30", "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

const getAdresseString = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques[0]);
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  if (addr.province) parts.push(addr.province);
  return parts.filter(p => p).join(' ');
};

export default function LeveTerrain() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedItem, setSelectedItem] = useState(null); // { dossier, mandat }
  const [terrainStartTime, setTerrainStartTime] = useState(null); // Date object quand punch in terrain
  const [elapsedTime, setElapsedTime] = useState(0);
  const [spFiles, setSpFiles] = useState({ IN: [], OUT: [] });
  const [photosFiles, setPhotosFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = fermé, number = index ouvert
  const [thumbnailScroll, setThumbnailScroll] = useState(0); // position de scroll des miniatures
  const [photoGPS, setPhotoGPS] = useState(null); // { lat, lng } des coordonnées GPS de la photo actuelle
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: dossiers = [] } = useQuery({ queryKey: ['dossiers'], queryFn: () => base44.entities.Dossier.list(), initialData: [] });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), initialData: [] });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [] });

  // Dossiers du jour avec tâche Terrain
  const dossiersDuJour = dossiers
    .filter(d => d.statut === "Ouvert")
    .flatMap(d => (d.mandats || [])
      .filter(m => m.tache_actuelle === "Terrain")
      .map(m => ({ dossier: d, mandat: m }))
    )
    .sort((a, b) => parseInt(a.dossier.numero_dossier) - parseInt(b.dossier.numero_dossier));

  const getClientsNames = (clientIds) => {
    if (!clientIds?.length) return "-";
    return clientIds.map(id => { const c = clients.find(cl => cl.id === id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(Boolean).join(", ");
  };

  // Timer terrain local (indépendant du pointage de la topbar)
  useEffect(() => {
    if (!terrainStartTime) { setElapsedTime(0); return; }
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - terrainStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [terrainStartTime]);

  const createEntreeMutation = useMutation({
    mutationFn: (data) => base44.entities.EntreeTemps.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entreeTemps'] }),
  });

  const handlePunchIn = () => {
    setTerrainStartTime(new Date());
  };

  const handlePunchOut = () => {
    if (!terrainStartTime) return;
    const now = new Date();
    const dureeHeures = (now.getTime() - terrainStartTime.getTime()) / 1000 / 60 / 60;
    setTerrainStartTime(null);
    setElapsedTime(0);

    if (selectedItem) {
      createEntreeMutation.mutate({
        date: today,
        heures: parseFloat(dureeHeures.toFixed(2)),
        dossier_id: selectedItem.dossier.id,
        mandat: selectedItem.mandat.type_mandat,
        tache: "Terrain",
        utilisateur_email: user?.email,
        description: `Terrain - ${getArpenteurInitials(selectedItem.dossier.arpenteur_geometre)}${selectedItem.dossier.numero_dossier}`
      });
    }
  };

  const formatElapsedTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Charger fichiers SharePoint
  const loadSharePointFiles = async (dossier, mandat) => {
    if (!dossier) return;
    setLoadingFiles(true);
    const arp = dossier.arpenteur_geometre;
    const initiale = ARPENTEUR_INITIALS[arp] || arp;
    const numDossier = dossier.numero_dossier;
    const typeMandat = mandat?.type_mandat || "";

    try {
      const [resIN, resOUT] = await Promise.all([
        base44.functions.invoke('sharepoint', { action: 'list', folderPath: `ARPENTEUR/${initiale}/DOSSIER/${numDossier}/TERRAIN/IN` }),
        base44.functions.invoke('sharepoint', { action: 'list', folderPath: `ARPENTEUR/${initiale}/DOSSIER/${numDossier}/TERRAIN/OUT` }),
      ]);
      setSpFiles({ IN: resIN.data?.files || [], OUT: resOUT.data?.files || [] });
    } catch (e) {
      setSpFiles({ IN: [], OUT: [] });
    }
    setLoadingFiles(false);
  };

  const loadPhotos = async (dossier) => {
    if (!dossier) return;
    setLoadingPhotos(true);
    const arp = dossier.arpenteur_geometre;
    const initiale = ARPENTEUR_INITIALS[arp] || arp;
    const numDossier = dossier.numero_dossier;
    const dateStr = format(new Date(), "yyyyMMdd");
    const photoPath = `ARPENTEUR/${initiale}/DOSSIER/${initiale}-${numDossier}/TERRAIN/IN/${initiale}-${numDossier}_T_${dateStr}/PHOTOS`;

    try {
      const res = await base44.functions.invoke('sharepoint', { action: 'list', folderPath: photoPath });
      setPhotosFiles(res.data?.files || []);
    } catch (e) {
      setPhotosFiles([]);
    }
    setLoadingPhotos(false);
  };

  const handleSelectDossier = (item) => {
    setSelectedItem(item);
    setSpFiles({ IN: [], OUT: [] });
    setPhotosFiles([]);
    loadSharePointFiles(item.dossier, item.mandat);
    loadPhotos(item.dossier);
  };

  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem) return;
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    if (!selectedItem) return;
    const arp = selectedItem.dossier.arpenteur_geometre;
    const initiale = ARPENTEUR_INITIALS[arp] || arp;
    const numDossier = selectedItem.dossier.numero_dossier;
    const dateStr = format(new Date(), "yyyyMMdd");
    const photoFolderPath = `ARPENTEUR/${initiale}/DOSSIER/${initiale}-${numDossier}/TERRAIN/IN/${initiale}-${numDossier}_T_${dateStr}/PHOTOS`;
    try {
      await base44.functions.invoke('uploadToSharePoint', { folderPath: photoFolderPath, fileName: file.name, fileContent: await fileToBase64(file) });
      loadPhotos(selectedItem.dossier);
    } catch (e) {
      console.error("Upload photo error:", e);
    }
  };

  const openCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      // Fallback caméra frontale si caméra arrière indisponible
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error("Caméra indisponible:", e);
        setShowCamera(false);
      }
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const takeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fileName = `photo_${format(new Date(), "yyyyMMdd_HHmmss")}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      closeCamera();
      await uploadPhoto(file);
    }, 'image/jpeg', 0.92);
  };

  const fileToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  // Extraire les coordonnées GPS d'une image
  const extractGPSFromImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const binary = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
      const exifData = piexif.load(binary);
      
      if (exifData.GPS && exifData.GPS[piexif.GPSIFD.GPSLatitude] && exifData.GPS[piexif.GPSIFD.GPSLongitude]) {
        const lat = exifData.GPS[piexif.GPSIFD.GPSLatitude];
        const lng = exifData.GPS[piexif.GPSIFD.GPSLongitude];
        const latRef = exifData.GPS[piexif.GPSIFD.GPSLatitudeRef].toLocaleLowerCase();
        const lngRef = exifData.GPS[piexif.GPSIFD.GPSLongitudeRef].toLocaleLowerCase();
        
        const latDegrees = lat[0][0] / lat[0][1] + lat[1][0] / lat[1][1] / 60 + lat[2][0] / lat[2][1] / 3600;
        const lngDegrees = lng[0][0] / lng[0][1] + lng[1][0] / lng[1][1] / 60 + lng[2][0] / lng[2][1] / 3600;
        
        const latFinal = latRef === 's' ? -latDegrees : latDegrees;
        const lngFinal = lngRef === 'w' ? -lngDegrees : lngDegrees;
        
        return { lat: latFinal, lng: lngFinal };
      }
    } catch (e) {
      // Pas de GPS ou erreur lors de l'extraction
    }
    return null;
  };

  const mapUrl = selectedItem?.mandat?.adresse_travaux
    ? `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}&q=${encodeURIComponent(getAdresseString(selectedItem.mandat.adresse_travaux))}`
    : null;

  const getFileIcon = (file) => {
    if (file.type === 'folder') return <FolderOpen className="w-4 h-4 text-yellow-400" />;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image className="w-4 h-4 text-blue-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Mountain className="w-8 h-8 text-emerald-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Levé Terrain</h1>
              <p className="text-slate-400 text-sm">{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ===== COLONNE GAUCHE : Dossiers du jour ===== */}
          <div className="w-72 flex-shrink-0 border-r border-slate-800 bg-slate-900/30 flex flex-col overflow-hidden">
            <div className="px-3 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dossiers — Tâche Terrain</span>
              </div>
              <p className="text-emerald-400 font-bold text-lg mt-1">{dossiersDuJour.length} dossier{dossiersDuJour.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {dossiersDuJour.length === 0 ? (
                <div className="p-4 text-center text-slate-600 text-sm mt-8">
                  <Mountain className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  Aucun dossier en tâche Terrain aujourd'hui
                </div>
              ) : (
                dossiersDuJour.map(({ dossier, mandat }, idx) => {
                  const isSelected = selectedItem?.dossier?.id === dossier.id && selectedItem?.mandat?.type_mandat === mandat.type_mandat;
                  return (
                    <button
                      key={`${dossier.id}-${idx}`}
                      onClick={() => handleSelectDossier({ dossier, mandat })}
                      className={`w-full text-left p-2 border-b border-slate-800/50 transition-all ${isSelected ? 'ring-2 ring-inset ring-emerald-500' : ''}`}
                    >
                      {/* Carte identique à DossierCard dans CéduleTerrain */}
                      {(() => {
                        const terrain = mandat.terrains_list?.[0] || mandat.terrain;
                        const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
                        const bgColorClass = arpColor.split(' ')[0];
                        const donneurUser = terrain?.donneur
                          ? users.find(u => u.full_name === terrain.donneur)
                          : null;
                        const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
                        return (
                          <div className={`${bgColorClass} rounded-lg p-2`}>
                            {/* Entête badges */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs flex-shrink-0`}>
                                  {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                </Badge>
                                <Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs font-semibold flex-shrink-0`}>
                                  {getAbbreviatedMandatType(mandat.type_mandat)}
                                </Badge>
                              </div>
                              {isSelected && <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                            </div>
                            {/* Client */}
                            <div className="flex items-center gap-1 mb-1">
                              <User className="w-3 h-3 text-white flex-shrink-0" />
                              <span className="text-xs text-white font-medium truncate">{getClientsNames(dossier.clients_ids)}</span>
                            </div>
                            {/* Adresse */}
                            {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
                              <div className="flex items-start gap-1 mb-1">
                                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-400 break-words">{formatAdresse(mandat.adresse_travaux)}</span>
                              </div>
                            )}
                            {/* Date livraison */}
                            {mandat.date_livraison && (
                              <div className="flex items-center gap-1 mb-1">
                                <Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                <span className="text-xs text-emerald-300">Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
                              </div>
                            )}
                            {terrain && (
                              <>
                                {terrain.date_limite_leve && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                                    <span className="text-xs text-yellow-300">Limite: {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
                                  </div>
                                )}
                                {terrain.a_rendez_vous && terrain.date_rendez_vous && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3 text-orange-400 flex-shrink-0" />
                                    <span className="text-xs text-orange-300">
                                      RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}
                                      {terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}
                                    </span>
                                  </div>
                                )}
                                {terrain.instruments_requis && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Wrench className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                    <span className="text-xs text-emerald-300 truncate">{terrain.instruments_requis}</span>
                                  </div>
                                )}
                                {terrain.technicien && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <UserCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                    <span className="text-xs text-blue-300 truncate">{terrain.technicien}</span>
                                  </div>
                                )}
                                {terrain.dossier_simultane && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Link2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                    <span className="text-xs text-purple-300 truncate">Avec: {terrain.dossier_simultane}</span>
                                  </div>
                                )}
                                {/* Temps prévu + Donneur (identique à DossierCard de CéduleTerrain) */}
                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/30">
                                  <div className="flex items-center gap-1">
                                    {terrain.temps_prevu && (
                                      <>
                                        <Timer className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                        <span className="text-xs text-emerald-300">{terrain.temps_prevu}</span>
                                      </>
                                    )}
                                  </div>
                                  {donneurUser ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-emerald-300 font-medium">{getUserInitials(donneurUser.full_name)}</span>
                                      <Avatar className="w-6 h-6 border-2 border-emerald-500/50">
                                        <AvatarImage src={donneurUser.photo_url} />
                                        <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                          {getUserInitials(donneurUser.full_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
                                      <User className="w-3 h-3 text-emerald-500" />
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ===== ZONE PRINCIPALE DROITE ===== */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {!selectedItem ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Mountain className="w-16 h-16 text-slate-700 mb-4" />
                <p className="text-slate-500 text-lg">Sélectionnez un dossier dans la liste</p>
                <p className="text-slate-600 text-sm mt-1">pour afficher les informations du mandat</p>
              </div>
            ) : (
              <>
                {/* ===== SECTION MANDAT + CARTE ===== */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Info mandat */}
                  <Card className="border-slate-800 bg-slate-900/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-white font-bold text-lg">
                          {getArpenteurInitials(selectedItem.dossier.arpenteur_geometre)}{selectedItem.dossier.numero_dossier}
                        </h2>
                        <Badge className={`${getMandatColor(selectedItem.mandat.type_mandat)} border`}>{selectedItem.mandat.type_mandat}</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wider">Client(s)</p>
                          <p className="text-white">{getClientsNames(selectedItem.dossier.clients_ids)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wider">Arpenteur</p>
                          <p className="text-white">{selectedItem.dossier.arpenteur_geometre}</p>
                        </div>
                        {selectedItem.mandat.adresse_travaux && (
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Adresse travaux</p>
                            <p className="text-white">{formatAdresse(selectedItem.mandat.adresse_travaux)}</p>
                          </div>
                        )}
                        {selectedItem.mandat.lots?.length > 0 && (
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Lots</p>
                            <p className="text-white">{selectedItem.mandat.lots.join(', ')}</p>
                          </div>
                        )}
                        {selectedItem.mandat.notes && (
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Notes</p>
                            <p className="text-slate-300 text-sm">{selectedItem.mandat.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Carte */}
                  <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
                    {selectedItem.mandat.adresse_travaux && getAdresseString(selectedItem.mandat.adresse_travaux) ? (
                      <iframe
                        title="Carte adresse travaux"
                        width="100%"
                        height="100%"
                        style={{ minHeight: '220px', border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(getAdresseString(selectedItem.mandat.adresse_travaux))}&output=embed`}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[220px] text-slate-600">
                        <div className="text-center">
                          <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                          <p className="text-sm">Aucune adresse renseignée</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* ===== PUNCH IN / OUT ===== */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Temps Terrain</p>
                          <p className="text-slate-500 text-xs">Enregistrement automatique à la fin</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Voyant */}
                        <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {terrainStartTime ? (
                            <>
                              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-50"></div>
                              </div>
                            </>
                          ) : (
                            <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                          )}
                        </div>

                        {/* Chrono */}
                        <div className="px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                          <span className="text-white font-bold tabular-nums text-sm">{formatElapsedTime(elapsedTime)}</span>
                        </div>

                        {/* Bouton */}
                        {!terrainStartTime ? (
                          <Button onClick={handlePunchIn} size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 border-none h-9">
                            <Play className="w-4 h-4 mr-1" /> Punch In
                          </Button>
                        ) : (
                          <Button onClick={handlePunchOut} size="sm" className="bg-gradient-to-r from-red-500 to-red-600 border-none h-9">
                            <Square className="w-4 h-4 mr-1" /> Punch Out
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ===== DOCUMENTS TERRAIN SharePoint ===== */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-white font-semibold">Documents Terrain</h3>
                      </div>
                      <button onClick={() => loadSharePointFiles(selectedItem.dossier, selectedItem.mandat)} className="text-slate-500 hover:text-slate-300 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {['IN', 'OUT'].map(dir => (
                        <div key={dir}>
                          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${dir === 'IN' ? 'text-emerald-400' : 'text-orange-400'}`}>
                            Terrain {dir}
                          </div>
                          <div className="space-y-1">
                            {loadingFiles ? (
                              <p className="text-slate-600 text-xs">Chargement...</p>
                            ) : spFiles[dir].length === 0 ? (
                              <p className="text-slate-700 text-xs italic">Aucun fichier</p>
                            ) : (
                              spFiles[dir].map(file => (
                                <a
                                  key={file.id}
                                  href={file.webUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/50 transition-colors group"
                                >
                                  {getFileIcon(file)}
                                  <span className="text-slate-300 text-xs truncate flex-1 group-hover:text-white">{file.name}</span>
                                  {file.size && <span className="text-slate-600 text-[10px]">{formatFileSize(file.size)}</span>}
                                  <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                                </a>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ===== PHOTOS ===== */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-400" />
                        <div>
                          <h3 className="text-white font-semibold">Photos</h3>
                          <p className="text-slate-600 text-[10px]">
                            ARPENTEUR/{ARPENTEUR_INITIALS[selectedItem.dossier.arpenteur_geometre]}/DOSSIER/{ARPENTEUR_INITIALS[selectedItem.dossier.arpenteur_geometre]}-{selectedItem.dossier.numero_dossier}/TERRAIN/IN/{ARPENTEUR_INITIALS[selectedItem.dossier.arpenteur_geometre]}-{selectedItem.dossier.numero_dossier}_T_{ format(new Date(), "yyyyMMdd")}/PHOTOS
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => loadPhotos(selectedItem.dossier)} className="text-slate-500 hover:text-slate-300 transition-colors">
                          <RefreshCw className={`w-4 h-4 ${loadingPhotos ? 'animate-spin' : ''}`} />
                        </button>
                        <Button
                          size="sm"
                          onClick={openCamera}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 border-none h-8 text-xs"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1" /> Prendre photo
                        </Button>
                        <input ref={cameraInputRef} type="file" accept="image/*" onChange={handleCameraCapture} className="hidden" />
                      </div>
                    </div>

                    {loadingPhotos ? (
                      <p className="text-slate-600 text-sm text-center py-4">Chargement des photos...</p>
                    ) : photosFiles.length === 0 ? (
                      <div className="text-center py-8 text-slate-700">
                        <Image className="w-10 h-10 mx-auto mb-2 text-slate-800" />
                        <p className="text-sm">Aucune photo pour aujourd'hui</p>
                        <p className="text-xs mt-1">Utilisez le bouton "Prendre photo" pour en ajouter</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {photosFiles.map((file, idx) => {
                          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.name.split('.').pop()?.toLowerCase());
                          return (
                            <button
                              key={file.id}
                              onClick={() => setLightboxIndex(idx)}
                              className="group relative aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-blue-500 transition-all"
                            >
                              {isImage && file.downloadUrl ? (
                                <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Image className="w-8 h-8 text-slate-600" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomIn className="w-5 h-5 text-white" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
      {/* ===== LIGHTBOX PHOTOS ===== */}
      {lightboxIndex !== null && (() => {
        const current = photosFiles[lightboxIndex];
        const isImg = ['jpg','jpeg','png','gif','webp'].includes(current?.name.split('.').pop()?.toLowerCase());
        
        // Extraire GPS à chaque changement de photo
        useEffect(() => {
          if (isImg && current?.downloadUrl) {
            extractGPSFromImage(current.downloadUrl).then(gps => setPhotoGPS(gps));
          } else {
            setPhotoGPS(null);
          }
        }, [lightboxIndex, current?.downloadUrl]);
        
        const goPrev = () => {
          setLightboxIndex(i => (i - 1 + photosFiles.length) % photosFiles.length);
          setThumbnailScroll(Math.max(0, thumbnailScroll - 1));
        };
        const goNext = () => {
          setLightboxIndex(i => (i + 1) % photosFiles.length);
          setThumbnailScroll(Math.min(Math.max(0, photosFiles.length - 5), thumbnailScroll + 1));
        };
        const handleThumbClick = (idx) => {
          setLightboxIndex(idx);
          const visibleCount = 5;
          if (idx < thumbnailScroll) {
            setThumbnailScroll(idx);
          } else if (idx >= thumbnailScroll + visibleCount) {
            setThumbnailScroll(Math.max(0, idx - visibleCount + 1));
          }
        };
        return (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Fermer */}
            <button
              className="absolute top-4 right-4 text-white bg-slate-800/80 hover:bg-slate-700 rounded-full p-2 z-10"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Compteur */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-slate-300 text-sm bg-slate-800/80 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {photosFiles.length}
            </div>

            {/* Flèche gauche */}
            {photosFiles.length > 1 && (
              <button
                className="absolute left-4 text-white bg-slate-800/80 hover:bg-slate-700 rounded-full p-3 z-10"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div className="max-w-5xl max-h-[70vh] flex items-center justify-center px-20" onClick={e => e.stopPropagation()}>
              {isImg && current.downloadUrl ? (
                <img src={current.downloadUrl} alt={current.name} className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-2xl" />
              ) : (
                <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-500">
                  <Image className="w-16 h-16 mb-3" />
                  <p className="text-sm">{current?.name}</p>
                </div>
              )}
            </div>

            {/* Flèche droite */}
            {photosFiles.length > 1 && (
              <button
                className="absolute right-4 text-white bg-slate-800/80 hover:bg-slate-700 rounded-full p-3 z-10"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Carte localisation */}
            {selectedItem?.mandat?.adresse_travaux && (
              <div className="absolute bottom-64 right-4 w-72 h-64 rounded-lg overflow-hidden border border-slate-600 shadow-lg" onClick={e => e.stopPropagation()}>
                <iframe
                  title="Localisation photo"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(getAdresseString(selectedItem.mandat.adresse_travaux))}&output=embed`}
                />
              </div>
            )}

            {/* Bande de miniatures en bas */}
            {photosFiles.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 px-4 py-3 rounded-lg">
                {/* Flèche scroll gauche */}
                {thumbnailScroll > 0 && (
                  <button
                    className="text-slate-400 hover:text-white flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); setThumbnailScroll(Math.max(0, thumbnailScroll - 1)); }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                
                {/* Miniatures */}
                <div className="flex gap-2 overflow-hidden" style={{ width: '300px' }}>
                  {photosFiles.slice(thumbnailScroll, thumbnailScroll + 5).map((file, i) => {
                    const realIdx = thumbnailScroll + i;
                    const isImage = ['jpg','jpeg','png','gif','webp'].includes(file.name.split('.').pop()?.toLowerCase());
                    return (
                      <button
                        key={file.id}
                        onClick={(e) => { e.stopPropagation(); handleThumbClick(realIdx); }}
                        className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                          lightboxIndex === realIdx ? 'border-blue-500 ring-2 ring-blue-400' : 'border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {isImage && file.downloadUrl ? (
                          <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <Image className="w-6 h-6 text-slate-600" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Flèche scroll droite */}
                {thumbnailScroll + 5 < photosFiles.length && (
                  <button
                    className="text-slate-400 hover:text-white flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); setThumbnailScroll(Math.min(photosFiles.length - 5, thumbnailScroll + 1)); }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Nom du fichier */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 text-xs bg-slate-800/80 px-3 py-1 rounded-full">
              {current?.name}
            </div>
          </div>
        );
      })()}

      {/* ===== MODAL CAMÉRA ===== */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-2xl rounded-lg"
            style={{ maxHeight: '70vh', objectFit: 'cover' }}
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-4 mt-6">
            <Button
              onClick={closeCamera}
              size="lg"
              className="bg-slate-700 hover:bg-slate-600 border-none text-white px-8"
            >
              Annuler
            </Button>
            <Button
              onClick={takeSnapshot}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 border-none text-white px-8"
            >
              <Camera className="w-5 h-5 mr-2" /> Capturer
            </Button>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}