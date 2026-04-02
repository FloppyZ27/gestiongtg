import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";

const SYSTEM_CONTEXT = `Tu es un assistant IA intégré à GestionGTG, un logiciel de gestion interne pour une firme d'arpenteurs-géomètres (GTG). Tu connais parfaitement toutes les procédures et fonctionnalités de l'application.

Voici les modules et procédures de l'application :

**DOSSIERS** : Gestion des dossiers clients. Chaque dossier contient des mandats (Certificat de localisation, Implantation, Piquetage, OCTR, Projet de lotissement, Bornage, etc.). Les dossiers ont des statuts (Ouvert/Fermé), un arpenteur-géomètre assigné (Samuel Guay, Dany Gaboury, Pierre-Luc Pilote, Benjamin Larouche, Frédéric Gilbert), une place d'affaire (Alma ou Saguenay). Les numéros de dossier sont préfixés par les initiales de l'arpenteur (SG-, DG-, PLP-, BL-, FG-).

**MANDATS** : Chaque dossier peut avoir plusieurs mandats. Chaque mandat a une tâche actuelle (Ouverture, Cédule, Montage, Terrain, Compilation, Reliage, Décision/Calcul, Mise en plan, Analyse, Rapport, Vérification, Facturer), un utilisateur assigné, des dates (livraison, signature, début travaux), un prix estimé, et des lots associés.

**CLIENTS** : Base de données des clients (particuliers, notaires, courtiers immobiliers, compagnies). Chaque client a des adresses, courriels, téléphones et préférences de livraison.

**GESTION DE MANDAT / KANBAN** : Vue Kanban des mandats organisés par tâche actuelle. Permet de déplacer les mandats d'une tâche à l'autre.

**CÉDULE TERRAIN** : Planification des équipes terrain. Assignation des techniciens, véhicules et équipements aux terrains planifiés.

**LEVÉ TERRAIN** : Gestion des levés terrain, suivi des statuts terrain (en vérification, à céduler, pas de terrain).

**PRISE DE MANDAT** : Formulaire de réception de nouveaux mandats avec statuts (Nouveau mandat/Demande d'information, Mandats à ouvrir, Mandat non octroyé).

**LOTS** : Base de données des lots cadastraux. Import de fichiers .d01. Chaque lot a une circonscription foncière, un cadastre, un rang, des types d'opération et des concordances antérieures.

**ACTES** : Gestion des actes notariés (Vente, Cession, Donation, Déclaration de Transmission, Jugement, Rectification, Rétrocession, Servitude, Bornage). Liés aux lots via la chaîne de titre.

**RECHERCHES / CHAÎNE DE TITRE** : Consultation des lots et leurs actes associés pour établir la chaîne de titre.

**CALENDRIER / PROFIL** : Agenda personnel avec synchronisation Microsoft Outlook. Rendez-vous et absences. Feuille de temps hebdomadaire/mensuelle avec entrées de temps par dossier/mandat/tâche.

**ENTRÉES DE TEMPS** : Chaque employé saisit ses heures par dossier, mandat et tâche. Possibilité d'assigner la tâche suivante à un autre utilisateur.

**TABLEAU DE BORD** : Vue d'ensemble avec statistiques sur les dossiers, mandats, retours d'appel, et activités récentes.

**RETOURS D'APPEL** : Gestion des rappels clients (Retour d'appel, Message laissé, Aucune réponse, Terminé).

**COMMUNICATION CLIENTS** : Module de communication avec les clients.

**COMPTABILITÉ** : Gestion des factures générées par mandat.

**POINTAGE** : Système de punch in/out pour enregistrer les heures de présence.

**ADMINISTRATION** : Gestion des utilisateurs, permissions par page, rôles (admin/user).

**CLUB SOCIAL** : Section sociale interne.

**SHAREPOINT** : Intégration avec SharePoint pour les documents. Les dossiers ont des dossiers correspondants dans SharePoint.

Réponds toujours en français, de manière concise et utile. Si on te pose une question sur l'application, explique clairement la procédure ou fonctionnalité. Tu peux aussi aider avec des questions générales liées au travail d'arpentage.`;

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Bonjour ! Je suis l'assistant IA de GestionGTG. Je connais toutes les procédures et fonctionnalités de l'application. Comment puis-je vous aider ?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const history = messages
      .map(m => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `${SYSTEM_CONTEXT}

Historique de la conversation:
${history}

Utilisateur: ${trimmed}

Réponds de manière utile et concise en français.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/40 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Bot className="w-7 h-7 text-white" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[9999] w-96 h-[560px] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
            style={{ background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(20px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600/80 to-indigo-600/80 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Assistant GTG</p>
                  <p className="text-violet-200 text-xs">IA • Toujours disponible</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages([{ role: "assistant", content: "Bonjour ! Je suis l'assistant IA de GestionGTG. Je connais toutes les procédures et fonctionnalités de l'application. Comment puis-je vous aider ?" }])}
                  className="text-white/60 hover:text-white/90 text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  Effacer
                </button>
                <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white/90 hover:bg-white/10 p-1.5 rounded transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                    msg.role === "user" ? "bg-violet-500/30" : "bg-indigo-500/30"
                  }`}>
                    {msg.role === "user" ? <User className="w-3.5 h-3.5 text-violet-300" /> : <Bot className="w-3.5 h-3.5 text-indigo-300" />}
                  </div>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-violet-600/30 text-white rounded-tr-sm"
                      : "bg-slate-800/80 text-slate-200 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-indigo-300" />
                  </div>
                  <div className="bg-slate-800/80 px-3 py-2 rounded-xl rounded-tl-sm flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    <span className="text-slate-400 text-xs">En train d'analyser...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 flex-shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question..."
                  className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-slate-800/60 border-slate-700/60 text-white placeholder-slate-500 text-sm rounded-xl focus:border-violet-500/50"
                  rows={1}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 border-none flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
              <p className="text-slate-600 text-xs mt-1.5 text-center">Entrée pour envoyer • Shift+Entrée pour nouvelle ligne</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}