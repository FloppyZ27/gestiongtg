import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export default function TarificationStepForm({ 
  mandats = [],
  onTarificationChange,
  isCollapsed,
  onToggleCollapse
}) {
  const mandatsWithType = mandats.filter(m => m.type_mandat);

  const handleFieldChange = (index, field, value) => {
    const updatedMandats = mandats.map((m, i) => {
      if (i === index) {
        return { ...m, [field]: value };
      }
      return m;
    });
    onTarificationChange(updatedMandats);
  };

  const totalEstime = mandatsWithType.reduce((sum, m) => sum + (parseFloat(m.prix_estime) || 0), 0);
  const totalRabais = mandatsWithType.reduce((sum, m) => sum + (parseFloat(m.rabais) || 0), 0);

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-purple-900/40 transition-colors rounded-t-lg py-2 bg-purple-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">4</div>
            <CardTitle className="text-purple-300 text-sm">Tarification</CardTitle>
            {totalEstime > 0 && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                Total: {totalEstime.toFixed(2)} $
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          {mandatsWithType.length > 0 ? (
            <div className="flex items-center gap-3 flex-wrap">
              {mandats.map((mandat, index) => {
                if (!mandat.type_mandat) return null;
                return (
                  <div key={index} className="flex items-center gap-1.5 bg-slate-800/50 rounded px-2 py-1">
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] py-0">
                      {mandat.type_mandat}
                    </Badge>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={mandat.prix_estime || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        handleFieldChange(index, 'prix_estime', value ? parseFloat(value) : 0);
                      }}
                      placeholder="Prix"
                      className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-20"
                    />
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={mandat.rabais || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        handleFieldChange(index, 'rabais', value ? parseFloat(value) : 0);
                      }}
                      placeholder="Rabais"
                      className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-16"
                    />
                    <Checkbox
                      checked={mandat.taxes_incluses || false}
                      onCheckedChange={(checked) => handleFieldChange(index, 'taxes_incluses', checked)}
                      className="border-slate-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 h-3 w-3"
                    />
                    <span className="text-[10px] text-slate-500">Tx</span>
                  </div>
                );
              })}
              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className="text-slate-400">Total: <span className="text-white font-semibold">{totalEstime.toFixed(2)} $</span></span>
                {totalRabais > 0 && <span className="text-red-400">-{totalRabais.toFixed(2)} $</span>}
                <span className="text-purple-400 font-bold">Net: {(totalEstime - totalRabais).toFixed(2)} $</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 text-slate-500 text-xs">
              <DollarSign className="w-4 h-4 mx-auto mb-1 opacity-50" />
              Sélectionnez des mandats pour la tarification
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}