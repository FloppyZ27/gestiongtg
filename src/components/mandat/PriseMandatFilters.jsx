import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { X, Filter, ChevronUp, ChevronDown } from "lucide-react";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

export default function PriseMandatFilters({
  filterArpenteur,
  setFilterArpenteur,
  filterVille,
  setFilterVille,
  filterTypeMandat,
  setFilterTypeMandat,
  filterUrgence,
  setFilterUrgence,
  filterDateStart,
  setFilterDateStart,
  filterDateEnd,
  setFilterDateEnd,
  isFiltersOpen,
  allVilles
}) {
  return (
    <div className="p-2 border border-red-500/30 rounded-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-red-500/30">
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-red-500" />
            <h4 className="text-xs font-semibold text-red-500">Filtrer</h4>
          </div>
          {(filterArpenteur.length > 0 || filterVille.length > 0 || filterTypeMandat.length > 0 || filterUrgence.length > 0 || filterDateStart || filterDateEnd) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterArpenteur([]);
                setFilterVille([]);
                setFilterTypeMandat([]);
                setFilterUrgence([]);
                setFilterDateStart("");
                setFilterDateEnd("");
              }}
              className="h-6 text-xs text-red-500 hover:text-red-400 px-2"
            >
              <X className="w-2.5 h-2.5 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full border-red-500/30 text-red-500 justify-between h-8 text-xs px-2">
                  <span className="truncate">Arpenteurs ({filterArpenteur.length > 0 ? `${filterArpenteur.length}` : 'Tous'})</span>
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                {ARPENTEURS.map((arp) => (
                  <DropdownMenuCheckboxItem
                    key={arp}
                    checked={filterArpenteur.includes(arp)}
                    onCheckedChange={(checked) => {
                      setFilterArpenteur(
                        checked
                          ? [...filterArpenteur, arp]
                          : filterArpenteur.filter((a) => a !== arp)
                      );
                    }}
                    className="text-white"
                  >
                    {arp}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full border-red-500/30 text-red-500 justify-between h-8 text-xs px-2">
                  <span className="truncate">Villes ({filterVille.length > 0 ? `${filterVille.length}` : 'Toutes'})</span>
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-slate-800 border-slate-700">
                {allVilles.map((ville) => (
                  <DropdownMenuCheckboxItem
                    key={ville}
                    checked={filterVille.includes(ville)}
                    onCheckedChange={(checked) => {
                      setFilterVille(
                        checked
                          ? [...filterVille, ville]
                          : filterVille.filter((v) => v !== ville)
                      );
                    }}
                    className="text-white"
                  >
                    {ville}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full border-red-500/30 text-red-500 justify-between h-8 text-xs px-2">
                  <span className="truncate">Types ({filterTypeMandat.length > 0 ? `${filterTypeMandat.length}` : 'Tous'})</span>
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                {TYPES_MANDATS.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={filterTypeMandat.includes(type)}
                    onCheckedChange={(checked) => {
                      setFilterTypeMandat(
                        checked
                          ? [...filterTypeMandat, type]
                          : filterTypeMandat.filter((t) => t !== type)
                      );
                    }}
                    className="text-white"
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full border-red-500/30 text-red-500 justify-between h-8 text-xs px-2">
                  <span className="truncate">Urgence ({filterUrgence.length > 0 ? `${filterUrgence.length}` : 'Toutes'})</span>
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                {["Pas pressé", "Normal", "Rapide"].map((urg) => (
                  <DropdownMenuCheckboxItem
                    key={urg}
                    checked={filterUrgence.includes(urg)}
                    onCheckedChange={(checked) => {
                      setFilterUrgence(
                        checked
                          ? [...filterUrgence, urg]
                          : filterUrgence.filter((u) => u !== urg)
                      );
                    }}
                    className="text-white"
                  >
                    {urg}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-1 pt-1 border-t border-red-500/30">
          <Label className="text-xs text-red-500">Période</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <Label className="text-xs text-red-500">Du</Label>
              <Input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                placeholder="Du"
                className="w-full border-red-500/30 text-red-500 h-8 text-xs px-2"
              />
            </div>
            <span className="text-red-500 text-xs mt-6">→</span>
            <div className="flex-1 flex flex-col gap-1">
              <Label className="text-xs text-red-500">Au</Label>
              <Input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                placeholder="Au"
                className="w-full border-red-500/30 text-red-500 h-8 text-xs px-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}