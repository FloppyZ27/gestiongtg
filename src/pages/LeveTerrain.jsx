import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import piexif from 'piexifjs';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Play, Square, Clock, FolderOpen, Camera, Image, FileText, ChevronRight, ChevronLeft, Mountain, ExternalLink, RefreshCw, User, Calendar, AlertCircle, Wrench, UserCheck, Link2, Timer, Users, X, ZoomIn, Map, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import SharePointTerrainViewer from "@/components/terrain/SharePointTerrainViewer";
import RouteMapModal from "@/components/terrain/RouteMapModal";
import PhotoLightboxModal from "@/components/terrain/PhotoLightboxModal";

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
  const getTodayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayLocal);
  const today = getTodayLocal();

  const goToPrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    // Passer les weekends
    if (d.getDay() === 0) d.setDate(d.getDate() - 2);
    if (d.getDay() === 6) d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedItem(null);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedItem(null);
  };
  const [selectedItem, setSelectedItem] = useState(null); // { dossier, mandat }
  const [selectedTerrainFolder, setSelectedTerrainFolder] = useState(null); // chemin complet du dossier TI sélectionné
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
  const deviceOrientationRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = fermé, number = index ouvert
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [travelSecs, setTravelSecs] = useState(0);
  const [cardStatuts, setCardStatuts] = useState(() => { try { return JSON.parse(localStorage.getItem('terrainCardStatuts') || '{}'); } catch { return {}; } });
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState(null); // { idx, photoName }

  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: dossiers = [] } = useQuery({ queryKey: ['dossiers'], queryFn: () => base44.entities.Dossier.list(), initialData: [] });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), initialData: [] });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try { return await base44.entities.User.list(); } catch { return []; }
    },
    initialData: [],
    retry: false,
  });
  const { data: photosGPS = [] } = useQuery({ queryKey: ['photosGPS'], queryFn: () => base44.entities.PhotoGPS.list(), initialData: [] });
  const { data: employes = [] } = useQuery({ queryKey: ['employes'], queryFn: () => base44.entities.Employe.list(), initialData: [] });
  const { data: equipesTerrain = [] } = useQuery({ queryKey: ['equipesTerrain', selectedDate], queryFn: () => base44.entities.EquipeTerrain.filter({ date_terrain: selectedDate }), initialData: [] });
  const { data: lots = [] } = useQuery({ queryKey: ['lots'], queryFn: () => base44.entities.Lot.list(), initialData: [] });

  // Trouver l'employé correspondant à l'utilisateur connecté (pour affichage)
  const employeConnecte = useMemo(() => {
    if (!user?.email) return null;
    const email = user.email.toLowerCase();
    return employes.find(emp =>
      emp.compte_utilisateur?.toLowerCase() === email ||
      emp.courriel?.toLowerCase() === email
    ) || null;
  }, [employes, user]);

  // Trouver le(s) technicien(s) chef du jour (pour affichage header)
  const technicienChef = useMemo(() => {
    const allTechIds = equipesTerrain.flatMap(e => e.techniciens || []);
    const chefs = employes.filter(emp => allTechIds.includes(emp.id) && emp.poste === 'Technicien Terrain Chef');
    return chefs.map(c => `${c.prenom} ${c.nom}`).join(', ');
  }, [equipesTerrain, employes]);

  // Équipes du jour dont l'utilisateur connecté fait partie
  // Les techniciens peuvent être des IDs User OU des IDs Employe OU des emails
  const equipesDuJourIds = useMemo(() => {
    if (!user?.id && !user?.email) return new Set();
    const possibleIds = new Set([user.id, user.email?.toLowerCase()].filter(Boolean));
    if (employeConnecte) {
      possibleIds.add(employeConnecte.id);
      if (employeConnecte.courriel) possibleIds.add(employeConnecte.courriel.toLowerCase());
      if (employeConnecte.compte_utilisateur) possibleIds.add(employeConnecte.compte_utilisateur.toLowerCase());
    }
    // Aussi chercher via le full_name dans users (au cas où les IDs ne matchent pas)
    if (user?.full_name && users.length > 0) {
      const matchedUser = users.find(u => u.full_name === user.full_name || u.email === user.email);
      if (matchedUser) possibleIds.add(matchedUser.id);
    }
    return new Set(
      equipesTerrain
        .filter(e => (e.techniciens || []).some(id => possibleIds.has(id) || possibleIds.has(String(id).toLowerCase())))
        .map(e => e.id)
    );
  }, [equipesTerrain, user, employeConnecte, users]);

  // Ensemble des cartes assignées aux équipes de l'utilisateur (format dossierId-mandatIdx-terrainIdx)
  const mandatsAssignes = useMemo(() => {
    const result = new Set();
    equipesTerrain
      .filter(e => equipesDuJourIds.has(e.id))
      .forEach(e => (e.mandats || []).forEach(m => result.add(m)));
    return result;
  }, [equipesTerrain, equipesDuJourIds]);

  // Toutes les cartes assignées à TOUTES les équipes du jour (peu importe l'utilisateur)
  const tousLesMandatsDuJour = useMemo(() => {
    const result = new Set();
    equipesTerrain.forEach(e => (e.mandats || []).forEach(m => result.add(m)));
    return result;
  }, [equipesTerrain]);

  // Dossiers du jour sélectionné — filtrés sur les cartes assignées à l'utilisateur connecté
  // Si l'utilisateur n'est dans aucune équipe ce jour, on affiche toutes les cartes du jour
  const dossiersDuJour = useMemo(() => {
    const mandatsToUse = mandatsAssignes.size > 0 ? mandatsAssignes : tousLesMandatsDuJour;
    if (mandatsToUse.size === 0) return [];

    return dossiers
      .flatMap(d => (d.mandats || [])
        .flatMap((m, mandatIdx) => {
          const terrains = m.terrains_list || (m.terrain?.date_cedulee ? [m.terrain] : []);
          return terrains
            .map((t, terrainIdx) => ({ terrain: t, terrainIdx }))
            .filter(({ terrainIdx }) => {
              const cardId = `${d.id}-${mandatIdx}-${terrainIdx}`;
              return mandatsToUse.has(cardId);
            })
            .map(({ terrainIdx }) => ({ dossier: d, mandat: m, terrainIdx }));
        })
      )
      .sort((a, b) => parseInt(a.dossier.numero_dossier) - parseInt(b.dossier.numero_dossier));
  }, [dossiers, selectedDate, mandatsAssignes, tousLesMandatsDuJour]);

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
        date: selectedDate,
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

  const loadPhotos = async (folderPath) => {
    if (!folderPath) return;
    setLoadingPhotos(true);
    const photoPath = `${folderPath}/PHOTOS`;
    try {
      const res = await base44.functions.invoke('sharepoint', { action: 'list', folderPath: photoPath });
      setPhotosFiles(res.data?.files || []);
    } catch (e) {
      setPhotosFiles([]);
    }
    setLoadingPhotos(false);
  };

  // Calcul du temps total de travail — même logique que calculateEquipeTimings dans CeduleTerrain
  // On cherche le terrain dont date_cedulee === selectedDate (même filtrage que dossiersDuJour)
  const parseTimeString = (ts) => {
    if (!ts) return 0;
    // Format "Xh" ou "XhYY" ou "X.Y" (heures décimales)
    const hhmm = ts.match(/(\d+)h(\d+)?/);
    if (hhmm) return parseInt(hhmm[1]) + (hhmm[2] ? parseInt(hhmm[2]) / 60 : 0);
    const decimal = ts.match(/(\d+(?:\.\d+)?)/);
    return decimal ? parseFloat(decimal[0]) : 0;
  };
  // Toutes les cartes de l'équipe ce jour (pas seulement celles de l'utilisateur)
  // Pour refléter le même total que CeduleTerrain (calculateEquipeTimings sur toute l'équipe)
  const mandatsEquipe = useMemo(() => {
    const result = new Set();
    equipesTerrain
      .filter(e => equipesDuJourIds.has(e.id))
      .forEach(e => (e.mandats || []).forEach(m => result.add(m)));
    return result;
  }, [equipesTerrain, equipesDuJourIds]);

  const totalWorkHours = useMemo(() => {
    return dossiers
      .filter(d => d.statut === "Ouvert")
      .flatMap(d => (d.mandats || []).flatMap((m, mandatIdx) => {
        const terrains = m.terrains_list || (m.terrain?.date_cedulee ? [m.terrain] : []);
        return terrains
          .map((t, terrainIdx) => ({ terrain: t, terrainIdx, mandatIdx }))
          .filter(({ terrain }) => terrain.date_cedulee === selectedDate)
          .filter(({ terrainIdx, mandatIdx }) => {
            const cardId = `${d.id}-${mandatIdx}-${terrainIdx}`;
            return mandatsEquipe.has(cardId);
          })
          .map(({ terrain }) => parseTimeString(terrain?.temps_prevu));
      }))
      .reduce((sum, h) => sum + h, 0);
  }, [dossiers, selectedDate, mandatsEquipe]);

  // Calculer le temps de trajet pour les équipes du jour (même logique que CeduleTerrain)
  useEffect(() => {
    const equipesDuJour = equipesTerrain.filter(e => equipesDuJourIds.has(e.id));
    if (!equipesDuJour.length) { setTravelSecs(0); return; }

    const bureauAddress = "11 rue melancon est, Alma";
    const waypoints = equipesDuJour.flatMap(equipe =>
      (equipe.mandats || []).map(cardId => {
        const idParts = cardId.split('-');
        const mandatIdx = parseInt(idParts[idParts.length - 2]);
        const dossier = dossiers.find(d => d.id === idParts.slice(0, idParts.length - 2).join('-'));
        const mandat = dossier?.mandats?.[mandatIdx];
        return mandat?.adresse_travaux ? formatAdresse(mandat.adresse_travaux) : null;
      }).filter(Boolean)
    );

    if (!waypoints.length) { setTravelSecs(0); return; }

    base44.functions.invoke('calculateRouteDuration', {
      origin: bureauAddress,
      destination: bureauAddress,
      waypoints,
    }).then(res => {
      setTravelSecs(res.data?.durationSeconds ?? 0);
    }).catch(() => setTravelSecs(0));
  }, [equipesTerrain, equipesDuJourIds, dossiers, selectedDate]);

  const handleSelectDossier = (item) => {
    setSelectedItem(item);
    setSelectedTerrainFolder(null);
    setSpFiles({ IN: [], OUT: [] });
    setPhotosFiles([]);
    loadSharePointFiles(item.dossier, item.mandat);
  };

  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem) return;
    await uploadPhoto(file, null);
  };

  const uploadPhoto = async (file, deviceGPS) => {
    if (!selectedItem || !selectedTerrainFolder) return;
    const photoFolderPath = `${selectedTerrainFolder}/PHOTOS`;
    try {
      const base64Content = await fileToBase64(file);
      await base44.functions.invoke('uploadToSharePoint', { folderPath: photoFolderPath, fileName: file.name, fileContent: base64Content });

      // Extraire l'orientation EXIF de la photo
      const dataUrl = `data:image/jpeg;base64,${base64Content}`;
      const { gpsData, heading: exifHeading } = await extractGPSAndOrientationFromImage(dataUrl);

      console.log('📸 Photo upload:', { fileName: file.name, exifHeading, deviceGPS });

      // Déterminer le heading final (EXIF prioritaire, puis device)
      let finalHeading = null;
      let finalLat = null;
      let finalLng = null;
      let finalAccuracy = null;

      if (exifHeading !== null && exifHeading !== undefined) {
        finalHeading = exifHeading;
      } else if (deviceGPS && deviceGPS.heading !== null && deviceGPS.heading !== undefined) {
        // Ajouter 90° pour corriger l'offset de DeviceOrientationEvent
        finalHeading = (deviceGPS.heading + 90) % 360;
      }

      if (gpsData) {
        finalLat = gpsData.lat;
        finalLng = gpsData.lng;
      } else if (deviceGPS) {
        finalLat = deviceGPS.lat;
        finalLng = deviceGPS.lng;
        finalAccuracy = deviceGPS.accuracy;
      }

      console.log('💾 Storing PhotoGPS:', { finalLat, finalLng, finalHeading, timestamp: deviceGPS?.timestamp });

      // Sauvegarder les coordonnées GPS et l'orientation
      if (finalLat && finalLng) {
        const photoGPSRecord = {
          dossier_id: selectedItem.dossier.id,
          mandat_type: selectedItem.mandat.type_mandat,
          photo_name: file.name,
          latitude: finalLat,
          longitude: finalLng,
          accuracy_meters: finalAccuracy,
          heading: finalHeading,
          timestamp: deviceGPS?.timestamp || new Date().toISOString(),
          utilisateur_email: user?.email
        };
        console.log('🔐 Final PhotoGPS record:', photoGPSRecord);
        await base44.entities.PhotoGPS.create(photoGPSRecord);
      }

      loadPhotos(selectedTerrainFolder);
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
        return;
      }
    }

    // Capturer l'orientation du téléphone (heading)
    if (typeof DeviceOrientationEvent !== 'undefined') {
      const handleDeviceOrientation = (event) => {
        // alpha = rotation autour de l'axe Z (0-360°) = heading
        const heading = (event.alpha || 0 + 360) % 360;
        deviceOrientationRef.current = heading;
        console.log('📱 Device Orientation:', heading);
      };

      // Demander la permissions pour iOS 13+
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(e => console.warn('Permission orientation refusée:', e));
      } else {
        // Android et autres
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    window.removeEventListener('deviceorientation', () => {});
    deviceOrientationRef.current = null;
    setShowCamera(false);
  };

  const takeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Obtenir les coordonnées GPS du périphérique
    let deviceGPS = null;
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
        });
        deviceGPS = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: deviceOrientationRef.current || position.coords.heading, // Utiliser l'orientation du téléphone si disponible
          timestamp: new Date().toISOString()
        };
        console.log('📍 Device GPS capturé:', deviceGPS);
      } catch (e) {
        console.warn('Géolocalisation non disponible:', e);
      }
    }
    
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
      await uploadPhoto(file, deviceGPS);
    }, 'image/jpeg', 0.92);
  };

  const fileToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });



  // Extraire les coordonnées GPS et l'orientation d'une image
  const extractGPSAndOrientationFromImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const binary = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
      const exifData = piexif.load(binary);

      let gpsData = null;
      let heading = null;

      // Extraire les coordonnées GPS
      if (exifData.GPS && exifData.GPS[piexif.GPSIFD.GPSLatitude] && exifData.GPS[piexif.GPSIFD.GPSLongitude]) {
        const lat = exifData.GPS[piexif.GPSIFD.GPSLatitude];
        const lng = exifData.GPS[piexif.GPSIFD.GPSLongitude];
        const latRef = exifData.GPS[piexif.GPSIFD.GPSLatitudeRef];
        const lngRef = exifData.GPS[piexif.GPSIFD.GPSLongitudeRef];

        const latDegrees = lat[0][0] / lat[0][1] + lat[1][0] / lat[1][1] / 60 + lat[2][0] / lat[2][1] / 3600;
        const lngDegrees = lng[0][0] / lng[0][1] + lng[1][0] / lng[1][1] / 60 + lng[2][0] / lng[2][1] / 3600;

        const latFinal = latRef === 'S' || latRef === 's' ? -latDegrees : latDegrees;
        const lngFinal = lngRef === 'W' || lngRef === 'w' ? -lngDegrees : lngDegrees;

        gpsData = { lat: latFinal, lng: lngFinal };
      }

      // Extraire l'orientation (heading/direction) depuis GPSImgDirection (tag 17 dans GPS)
      if (exifData.GPS && exifData.GPS[piexif.GPSIFD.GPSImgDirection]) {
        const dirData = exifData.GPS[piexif.GPSIFD.GPSImgDirection];
        if (Array.isArray(dirData) && dirData.length > 0) {
          heading = dirData[0] / dirData[1];
        }
      }

      return { gpsData, heading };
    } catch (e) {
      console.error("Erreur extraction EXIF:", e);
    }
    return { gpsData: null, heading: null };
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

  const handleDeletePhoto = async (idx, photoName) => {
    setDeletePhotoConfirm({ idx, photoName });
  };

  const confirmDeletePhoto = async () => {
    if (!deletePhotoConfirm) return;
    const { idx, photoName } = deletePhotoConfirm;
    setDeletePhotoConfirm(null);
    try {
      // Supprimer la photo de SharePoint (via function)
      base44.functions.invoke('deleteSharePointFile', { 
        filePath: photosFiles[idx].webUrl 
      }).catch(() => {});

      // Supprimer les données GPS associées
      const gpsToDelete = photosGPS.find(
        gps => gps.dossier_id === selectedItem.dossier.id && gps.photo_name === photoName
      );
      if (gpsToDelete) {
        base44.entities.PhotoGPS.delete(gpsToDelete.id).catch(() => {});
      }

      // Mettre à jour la liste des photos
      const newPhotos = photosFiles.filter((_, i) => i !== idx);
      setPhotosFiles(newPhotos);

      // Fermer le lightbox si aucune photo restante
      if (newPhotos.length === 0) {
        setLightboxIndex(null);
      } else if (lightboxIndex >= newPhotos.length) {
        setLightboxIndex(lightboxIndex - 1);
      }
    } catch (e) {
      console.error("Erreur suppression photo:", e);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/50">
          {/* Titre + sous-titre */}
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-blue-400">Levé Terrain</h1>
                <Mountain className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-slate-400 text-sm">Consultez vos dossiers cédulés et gérez vos levés de terrain</p>
            </div>

          </div>

          {/* Nom à gauche + Date/Navigation à droite */}
          {user && (
            <div className="flex items-center justify-between py-4 px-6 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-blue-500/50">
                  <AvatarImage src={user.photo_url} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm">
                    {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="text-xl font-bold text-white">{user.full_name}</div>
                  {employeConnecte && (
                    <span className="text-slate-500 text-xs">{employeConnecte.poste}</span>
                  )}
                </div>
              </div>

              {/* Calendrier avec flèches de navigation à droite */}
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={goToPrevDay} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-600 hover:border-blue-500 transition-all cursor-pointer">
                      <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-white font-semibold capitalize text-sm">
                          {format(new Date(selectedDate + 'T00:00:00'), "EEEE d MMMM yyyy", { locale: fr })}
                        </p>
                        {selectedDate === today && <p className="text-emerald-400 text-xs">Aujourd'hui</p>}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="center" side="bottom" sideOffset={8} avoidCollisions={false} style={{ marginTop: '80px' }}>
                    <CalendarUI
                      mode="single"
                      selected={new Date(selectedDate + 'T00:00:00')}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(format(date, 'yyyy-MM-dd'));
                          setSelectedItem(null);
                        }
                      }}
                      locale={fr}
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>

                <Button size="sm" variant="outline" onClick={goToNextDay} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {selectedDate !== today && (
                  <Button size="sm" onClick={() => { setSelectedDate(today); setSelectedItem(null); }} className="bg-emerald-500/20 text-emerald-400 text-xs">
                    Aujourd'hui
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ===== COLONNE GAUCHE : Dossiers du jour ===== */}
          <div className="w-72 flex-shrink-0 border-r border-slate-800 bg-slate-900/30 flex flex-col overflow-hidden">
            <div className="px-3 py-3 border-b border-slate-800 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dossiers cédulés ce jour</span>
              </div>


              {/* Temps total travail (même info que l'équipe dans CeduleTerrain) */}
              {dossiersDuJour.length > 0 && totalWorkHours > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    {(() => {
                      const formatHHMM = (secs) => {
                        const h = Math.floor(secs / 3600);
                        const m = Math.round((secs % 3600) / 60);
                        return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
                      };
                      const travailSecs = totalWorkHours * 3600;
                      const totalSecs = travailSecs + travelSecs;
                      return (
                        <span className="text-emerald-300 text-sm font-semibold">
                          {formatHHMM(totalSecs)}
                          {travelSecs > 0 && <span className="text-slate-400 ml-1">({formatHHMM(travelSecs)} 🚗)</span>}
                        </span>
                      );
                    })()}
                    <Button size="sm" onClick={() => setShowRouteMap(true)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 h-6 w-6 p-0 border border-blue-500/30">
                      <MapPin className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {dossiersDuJour.length === 0 ? (
                <div className="p-4 text-center text-slate-600 text-sm mt-8">
                  <Mountain className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  Aucun dossier céduler aujourd'hui
                </div>
              ) : (
                dossiersDuJour.map(({ dossier, mandat }, idx) => {
                  const isSelected = selectedItem?.dossier?.id === dossier.id && selectedItem?.mandat?.type_mandat === mandat.type_mandat;
                  return (
                    <motion.button
                      key={`${dossier.id}-${idx}`}
                      onClick={() => handleSelectDossier({ dossier, mandat })}
                      layout
                      initial={{ opacity: 1 }}
                      animate={isSelected ? { scale: 1.02, transition: { duration: 0.3, ease: "easeOut" } } : { scale: 1, transition: { duration: 0.2 } }}
                      className={`w-full text-left p-2 border-b border-slate-800/50 relative group`}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.5, 0.3, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.1)',
                            }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded border border-emerald-500/50 pointer-events-none"
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{ opacity: 1, scale: 1.05 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </>
                      )}
                      <div className="relative z-10">
                        {/* Carte identique à DossierCard dans CéduleTerrain */}
                        {(() => {
                        const terrain = mandat.terrains_list?.[0] || mandat.terrain;
                        const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
                        const bgColorClass = arpColor.split(' ')[0];
                        const assignedUser = mandat.utilisateur_assigne
                          ? users.find(u => u.email === mandat.utilisateur_assigne)
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
                                {/* Temps prévu | Statut (lecture seule) | Donneur + Avatar */}
                                                {(() => {
                                                  // Trouver le bon index de mandat et terrain pour construire le cardId correct
                                                  const mandatIdx = dossier.mandats?.indexOf(mandat) ?? 0;
                                                  const terrainIdx = mandat.terrains_list?.findIndex(t => t.date_cedulee === selectedDate) ?? 0;
                                                  const cardId = `${dossier.id}-${mandatIdx >= 0 ? mandatIdx : 0}-${terrainIdx >= 0 ? terrainIdx : 0}`;
                                                  const currentStatut = cardStatuts[cardId]?.statut || null;
                                                  const isOrange = currentStatut === 'Rendez-Vous' || currentStatut === 'Client Avisé';
                                                  const isMauve = currentStatut === 'Confirmé la veille' || currentStatut === 'Retour terrain';
                                                  const assignedUser = users.find(u => u.email === mandat.utilisateur_assigne);
                                                  const donneurUser = terrain.donneur ? users.find(u => u.full_name === terrain.donneur) : null;
                                                  return (
                                                    <div className="flex items-center gap-1 mt-2 pt-1 border-t border-emerald-500/30">
                                                      {/* Temps prévu */}
                                                      <div className="flex-shrink-0">
                                                        {terrain.temps_prevu
                                                          ? <div className="flex items-center gap-0.5"><Timer className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-300">{terrain.temps_prevu}</span></div>
                                                          : <div className="w-10" />}
                                                      </div>
                                                      {/* Statut — lecture seule, badge coloré */}
                                                      <div className="flex-1 min-w-0 flex justify-center">
                                                        {currentStatut ? (
                                                          <span
                                                            className="text-xs font-semibold px-2 py-0.5 rounded text-center truncate"
                                                            style={{
                                                              background: isOrange ? 'rgba(249,115,22,0.3)' : isMauve ? 'rgba(139,92,246,0.3)' : 'rgba(30,41,59,0.4)',
                                                              color: isOrange ? '#fb923c' : isMauve ? '#c084fc' : '#94a3b8',
                                                              border: `1px solid ${isOrange ? '#fb923c' : isMauve ? '#c084fc' : '#94a3b8'}`,
                                                            }}
                                                          >
                                                            {currentStatut}
                                                          </span>
                                                        ) : <div className="flex-1" />}
                                                      </div>
                                                      {/* Donneur + Avatar */}
                                                      <div className="flex items-center gap-1 flex-shrink-0">
                                                        {terrain.donneur && (
                                                          <span className="text-xs text-slate-400 font-medium">
                                                            {terrain.donneur.trim().split(' ').map(n => n[0]?.toUpperCase()).join('')}
                                                          </span>
                                                        )}
                                                        {assignedUser ? (
                                                          <Avatar className="w-5 h-5 border border-emerald-500/50">
                                                            <AvatarImage src={assignedUser.photo_url} />
                                                            <AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(assignedUser.full_name)}</AvatarFallback>
                                                          </Avatar>
                                                        ) : donneurUser ? (
                                                          <Avatar className="w-5 h-5 border border-emerald-500/50">
                                                            <AvatarImage src={donneurUser.photo_url} />
                                                            <AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(donneurUser.full_name)}</AvatarFallback>
                                                          </Avatar>
                                                        ) : (
                                                          <div className="w-5 h-5 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
                                                            <User className="w-2.5 h-2.5 text-emerald-500" />
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                })()}
                              </>
                            )}
                          </div>
                        );
                      })()}
                      </div>
                    </motion.button>
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
                      <div className="flex items-center justify-between gap-2">
                        <Badge className={`${getArpenteurColor(selectedItem.dossier.arpenteur_geometre)} border text-base font-bold`}>
                          {getArpenteurInitials(selectedItem.dossier.arpenteur_geometre)}{selectedItem.dossier.numero_dossier}
                        </Badge>
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
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Lot(s)</p>
                            <p className="text-white">
                              {selectedItem.mandat.lots.map(lotId => {
                                const lot = lots.find(l => l.id === lotId);
                                return lot ? lot.numero_lot : lotId;
                              }).join(', ')}
                            </p>
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
                    <div className="flex items-center gap-2 mb-4">
                      <FolderOpen className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-white font-semibold">Documents Terrain</h3>
                    </div>
                    <SharePointTerrainViewer
                      arpenteurGeometre={selectedItem.dossier.arpenteur_geometre}
                      numeroDossier={selectedItem.dossier.numero_dossier}
                      onTerrainINFolderSelect={(folderPath) => {
                        setSelectedTerrainFolder(folderPath);
                        loadPhotos(folderPath);
                      }}
                      selectedTerrainFolder={selectedTerrainFolder}
                    />
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
                          {selectedTerrainFolder ? (
                            <p className="text-emerald-500 text-[10px]">{selectedTerrainFolder}/PHOTOS</p>
                          ) : (
                            <p className="text-amber-500 text-[10px]">Sélectionnez un dossier terrain IN dans "Documents Terrain"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTerrainFolder && (
                          <button onClick={() => loadPhotos(selectedTerrainFolder)} className="text-slate-500 hover:text-slate-300 transition-colors">
                            <RefreshCw className={`w-4 h-4 ${loadingPhotos ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <Button
                          size="sm"
                          onClick={openCamera}
                          disabled={!selectedTerrainFolder}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 border-none h-8 text-xs disabled:opacity-40"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1" /> Prendre photo
                        </Button>
                        <input ref={cameraInputRef} type="file" accept="image/*" onChange={handleCameraCapture} className="hidden" />
                      </div>
                    </div>

                    {!selectedTerrainFolder ? (
                      <div className="text-center py-8 text-slate-600">
                        <FolderOpen className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                        <p className="text-sm">Aucun dossier terrain sélectionné</p>
                        <p className="text-xs mt-1">Ouvrez un dossier TI dans "Documents Terrain" pour activer les photos</p>
                      </div>
                    ) : loadingPhotos ? (
                      <p className="text-slate-600 text-sm text-center py-4">Chargement des photos...</p>
                    ) : photosFiles.length === 0 ? (
                      <div className="text-center py-8 text-slate-700">
                        <Image className="w-10 h-10 mx-auto mb-2 text-slate-800" />
                        <p className="text-sm">Aucune photo dans ce dossier</p>
                        <p className="text-xs mt-1">Utilisez le bouton "Prendre photo" pour en ajouter</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {photosFiles.map((file, idx) => {
                          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.name.split('.').pop()?.toLowerCase());
                          return (
                            <div key={file.id} className="group relative aspect-square">
                              <button
                                onClick={() => setLightboxIndex(idx)}
                                className="w-full h-full rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-blue-500 transition-all"
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
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePhoto(idx, file.name); }}
                                className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      <PhotoLightboxModal
        photosFiles={photosFiles}
        photosGPS={photosGPS}
        selectedDossier={selectedItem?.dossier}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />

      {/* ===== MODAL CONFIRMATION SUPPRESSION PHOTO ===== */}
      {deletePhotoConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setDeletePhotoConfirm(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Supprimer la photo</h3>
                <p className="text-slate-400 text-sm">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-5 bg-slate-800/50 rounded-lg p-3 truncate">
              📷 {deletePhotoConfirm.photoName}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeletePhotoConfirm(null)} className="border-slate-600 text-slate-300">
                Annuler
              </Button>
              <Button onClick={confirmDeletePhoto} className="bg-red-600 hover:bg-red-700 border-none text-white">
                <Trash2 className="w-4 h-4 mr-1" /> Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CARTE ITINÉRAIRE ===== */}
      {showRouteMap && <RouteMapModal equipesTerrain={equipesTerrain} equipesDuJourIds={equipesDuJourIds} dossiers={dossiers} clients={clients} users={users} selectedDate={selectedDate} onClose={() => setShowRouteMap(false)} />}

      {/* ===== MODAL CAMÉRA ===== */}
      {showCamera && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-2xl"
            style={{ width: '92vw', maxWidth: 900, marginTop: 90, height: 'calc(98vh - 94px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Capture Photo</span>
              </div>
              <button onClick={closeCamera} className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vidéo */}
            <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full"
                style={{ objectFit: 'contain' }}
              />
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Boutons */}
            <div className="flex gap-4 justify-center px-4 py-4 border-t border-slate-700 flex-shrink-0">
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
        </div>
      )}
    </TooltipProvider>
  );
}