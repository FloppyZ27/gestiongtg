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
                    className="cursor-pointer hover:bg-purple-900/40 transition-colors rounded-t-lg py-1.5 bg-purple-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">4</div>
            <CardTitle className="text-purple-300 text-base">Tarification</CardTitle>
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
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300 text-xs">Type de mandat</TableHead>
                    <TableHead className="text-slate-300 text-xs">Prix estimé ($)</TableHead>
                    <TableHead className="text-slate-300 text-xs">Rabais ($)</TableHead>
                    <TableHead className="text-slate-300 text-xs text-center">Taxes incluses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mandats.map((mandat, index) => {
                    if (!mandat.type_mandat) return null;
                    return (
                      <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                        <TableCell className="font-medium text-white text-sm">
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            {mandat.type_mandat}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={mandat.prix_estime || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              handleFieldChange(index, 'prix_estime', value ? parseFloat(value) : 0);
                            }}
                            placeholder="0.00"
                            className="bg-slate-700 border-slate-600 text-white h-6 text-sm w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={mandat.rabais || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              handleFieldChange(index, 'rabais', value ? parseFloat(value) : 0);
                            }}
                            placeholder="0.00"
                            className="bg-slate-700 border-slate-600 text-white h-6 text-sm w-28"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={mandat.taxes_incluses || false}
                            onCheckedChange={(checked) => handleFieldChange(index, 'taxes_incluses', checked)}
                            className="border-slate-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Résumé */}
              <div className="p-3 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-6">
                <div className="text-sm">
                  <span className="text-slate-400">Total estimé: </span>
                  <span className="text-white font-semibold">{totalEstime.toFixed(2)} $</span>
                </div>
                {totalRabais > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400">Total rabais: </span>
                    <span className="text-red-400 font-semibold">-{totalRabais.toFixed(2)} $</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-slate-400">Net: </span>
                  <span className="text-purple-400 font-bold">{(totalEstime - totalRabais).toFixed(2)} $</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sélectionnez des mandats dans la section précédente</p>
              <p className="text-xs text-slate-500 mt-1">pour définir leur tarification</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}