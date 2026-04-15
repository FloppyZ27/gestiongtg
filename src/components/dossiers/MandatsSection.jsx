import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, ChevronDown, ChevronUp } from "lucide-react";
import MandatTabs from "./MandatTabs";

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

export default function MandatsSection({
  formData,
  setFormData,
  updateMandat,
  addMandat,
  removeMandat,
  openLotSelector,
  removeLotFromMandat,
  getLotById,
  users,
  activeTabMandat,
  setActiveTabMandat,
  mandatStepCollapsed,
  setMandatStepCollapsed,
  setShowDeleteMandatConfirm,
  setMandatIndexToDelete,
  editingDossier,
}) {
  const updateMandatAddress = (mandatIndex, newAddresses) => {
    setFormData((prev) => ({
      ...prev,
      mandats: prev.mandats.map((m, i) =>
        i === mandatIndex
          ? { ...m, adresse_travaux: newAddresses[0] || { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" } }
          : m
      )
    }));
  };

  return (
    <Card className="border-slate-700 bg-slate-800/30 mt-3" data-section="mandats">
      <CardHeader
        className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-1.5 bg-orange-900/20"
        onClick={() => setMandatStepCollapsed(!mandatStepCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <CardTitle className="text-orange-300 text-base">Mandats</CardTitle>
            {formData.mandats.length > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                {formData.mandats.length} mandat{formData.mandats.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                addMandat();
                setMandatStepCollapsed(false);
              }}
              className="h-7 text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
            {mandatStepCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {!mandatStepCollapsed && (
        <CardContent className="pt-2 pb-3">
          {formData.mandats.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">Aucun mandat</p>
              <Button
                type="button"
                size="sm"
                onClick={addMandat}
                className="mt-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter un mandat
              </Button>
            </div>
          ) : (
            <Tabs value={activeTabMandat} onValueChange={setActiveTabMandat}>
              <TabsList className="bg-slate-800/50 border border-slate-700 h-auto p-1 rounded-lg mb-4 flex flex-wrap gap-1">
                {formData.mandats.map((mandat, index) => (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-3 py-1.5 rounded-md text-xs"
                  >
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${getMandatColor(mandat.type_mandat)}`}>
                      {getAbbreviatedMandatType(mandat.type_mandat) || `Mandat ${index + 1}`}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {formData.mandats.map((mandat, index) => (
                <TabsContent key={index} value={index.toString()}>
                  <MandatTabs
                    mandat={mandat}
                    mandatIndex={index}
                    updateMandat={updateMandat}
                    updateMandatAddress={updateMandatAddress}
                    openLotSelector={openLotSelector}
                    openAddMinuteDialog={() => {}}
                    openNewLotDialog={() => {}}
                    removeLotFromMandat={removeLotFromMandat}
                    removeMinuteFromMandat={(mandatIdx, minuteIdx) => {
                      const updatedMandats = [...formData.mandats];
                      updatedMandats[mandatIdx].minutes_list = updatedMandats[mandatIdx].minutes_list.filter((_, i) => i !== minuteIdx);
                      setFormData({ ...formData, mandats: updatedMandats });
                    }}
                    getLotById={getLotById}
                    users={users}
                    formStatut={formData.statut}
                    onRemoveMandat={() => {
                      setMandatIndexToDelete(index);
                      setShowDeleteMandatConfirm(true);
                    }}
                    isReferenceDisabled={false}
                    isTTL={formData.ttl === "Oui"}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      )}
    </Card>
  );
}