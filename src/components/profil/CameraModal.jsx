import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CameraModal({ onClose, folderPath, onPhotoUploaded, streamRef }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      } catch {
        // Fallback caméra frontale
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => setCameraReady(true);
          }
        } catch (err) {
          setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    // Flash visuel
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setUploading(true);
      setError(null);
      const fileName = `photo_${Date.now()}.jpg`;
      try {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
        await base44.functions.invoke('uploadToSharePoint', {
          folderPath,
          fileName,
          fileContent: base64,
          contentType: 'image/jpeg'
        });
        setCapturedCount(prev => prev + 1);
        onPhotoUploaded();
      } catch {
        setError("Erreur lors du téléversement. Réessayez.");
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between py-6 px-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between max-w-2xl">
        <div className="text-white font-semibold text-lg flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          Appareil photo
        </div>
        {capturedCount > 0 && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            {capturedCount} photo{capturedCount > 1 ? 's' : ''} ajoutée{capturedCount > 1 ? 's' : ''}
          </div>
        )}
        <Button
          onClick={onClose}
          size="icon"
          className="bg-slate-800/80 hover:bg-slate-700 border-none text-white rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Zone vidéo */}
      <div className="relative w-full max-w-2xl flex-1 flex items-center justify-center my-4">
        {/* Flash overlay */}
        {flash && (
          <div className="absolute inset-0 bg-white z-10 rounded-xl opacity-80 pointer-events-none" />
        )}

        {error ? (
          <div className="text-red-400 text-center p-8 bg-slate-900/80 rounded-xl">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-xl object-cover"
            style={{ maxHeight: '65vh' }}
          />
        )}

        {!cameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Boutons */}
      <div className="flex items-center gap-6">
        <Button
          onClick={onClose}
          size="lg"
          className="bg-slate-700 hover:bg-slate-600 border-none text-white px-8"
        >
          {capturedCount > 0 ? 'Terminer' : 'Annuler'}
        </Button>

        <button
          onClick={handleCapture}
          disabled={uploading || !cameraReady}
          className="w-20 h-20 rounded-full bg-white border-4 border-slate-400 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
          title="Prendre une photo"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-300" />
          )}
        </button>

        <div className="w-24" />
      </div>
    </div>
  );
}