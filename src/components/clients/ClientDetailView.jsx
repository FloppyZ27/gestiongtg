import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Check, Edit, Save } from "lucide-react";

export default function ClientDetailView({ client, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    prenom: client?.prenom || "",
    nom: client?.nom || "",
    type_client: client?.type_client || "Client",
    adresses: client?.adresses && client.adresses.length > 0 ? client.adresses : [{ adresse: "", latitude: null, longitude: null, actuelle: true }],
    courriels: client?.courriels && client.courriels.length > 0 ? client.courriels : [{ courriel: "", actuel: true }],
    telephones: client?.telephones && client.telephones.length > 0 ? client.telephones : [{ telephone: "", actuel: true }],
    notes: client?.notes || ""
  });

  const queryClient = useQueryClient();

  const updateClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.update(client.id, clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsEditing(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      adresses: formData.adresses.filter(a => a.adresse.trim() !== ""),
      courriels: formData.courriels.filter(c => c.courriel.trim() !== ""),
      telephones: formData.telephones.filter(t => t.telephone.trim() !== "")
    };
    updateClientMutation.mutate(cleanedData);
  };

  const addField = (fieldName) => {
    if (fieldName === 'adresses') {
      setFormData(prev => ({
        ...prev,
        adresses: [...prev.adresses, { adresse: "", latitude: null, longitude: null, actuelle: false }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], { [fieldName.slice(0, -1)]: "", actuel: false }]
      }));
    }
  };

  const removeField = (fieldName, index) => {
    if (formData[fieldName].length > 1) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    }
  };

  const updateField = (fieldName, index, key, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) => 
        i === index ? { ...item, [key]: value } : item
      )
    }));
  };

  const toggleActuel = (fieldName, index) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) => ({
        ...item,
        [fieldName === 'adresses' ? 'actuelle' : 'actuel']: i === index
      }))
    }));
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-400">Prénom</Label>
            <p className="text-white font-medium text-lg">{client.prenom}</p>
          </div>
          <div>
            <Label className="text-slate-400">Nom</Label>
            <p className="text-white font-medium text-lg">{client.nom}</p>
          </div>
        </div>

        <div>
          <Label className="text-slate-400">Type</Label>
          <p className="text-white font-medium">{client.type_client || "Client"}</p>
        </div>

        {client.adresses && client.adresses.length > 0 && (
          <div>
            <Label className="text-slate-400 mb-2 block">Adresses</Label>
            <div className="space-y-2">
              {client.adresses.map((addr, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg">
                  <p className="text-white">{addr.adresse}</p>
                  {addr.actuelle && (
                    <Badge className="mt-2 bg-green-500/20 text-green-400 text-xs">
                      Actuelle
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {client.courriels && client.courriels.length > 0 && (
          <div>
            <Label className="text-slate-400 mb-2 block">Courriels</Label>
            <div className="space-y-2">
              {client.courriels.map((email, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg flex justify-between items-center">
                  <p className="text-white">{email.courriel}</p>
                  {email.actuel && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      Actuel
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {client.telephones && client.telephones.length > 0 && (
          <div>
            <Label className="text-slate-400 mb-2 block">Téléphones</Label>
            <div className="space-y-2">
              {client.telephones.map((tel, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg flex justify-between items-center">
                  <p className="text-white">{tel.telephone}</p>
                  {tel.actuel && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      Actuel
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {client.notes && (
          <div>
            <Label className="text-slate-400 mb-2 block">Notes</Label>
            <p className="text-slate-300 bg-slate-800/30 p-3 rounded-lg">{client.notes}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prénom <span className="text-red-400">*</span></Label>
          <Input
            value={formData.prenom}
            onChange={(e) => setFormData({...formData, prenom: e.target.value})}
            required
            className="bg-slate-800 border-slate-700"
          />
        </div>
        <div className="space-y-2">
          <Label>Nom <span className="text-red-400">*</span></Label>
          <Input
            value={formData.nom}
            onChange={(e) => setFormData({...formData, nom: e.target.value})}
            required
            className="bg-slate-800 border-slate-700"
          />
        </div>
      </div>

      {/* Adresses */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Adresses</Label>
          <Button
            type="button"
            size="sm"
            onClick={() => addField('adresses')}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        {formData.adresses.map((item, index) => (
          <div key={index} className="space-y-2 p-3 bg-slate-800/30 rounded-lg">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  value={item.adresse}
                  onChange={(e) => updateField('adresses', index, 'adresse', e.target.value)}
                  placeholder="Adresse complète"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => toggleActuel('adresses', index)}
                className={`${item.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30`}
              >
                <Check className="w-4 h-4" />
              </Button>
              {formData.adresses.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeField('adresses', index)}
                  className="text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Courriels */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Courriels</Label>
          <Button
            type="button"
            size="sm"
            onClick={() => addField('courriels')}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        {formData.courriels.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="email"
              value={item.courriel}
              onChange={(e) => updateField('courriels', index, 'courriel', e.target.value)}
              placeholder="Courriel"
              className="bg-slate-800 border-slate-700"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => toggleActuel('courriels', index)}
              className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}
            >
              <Check className="w-4 h-4" />
            </Button>
            {formData.courriels.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeField('courriels', index)}
                className="text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Téléphones */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Téléphones</Label>
          <Button
            type="button"
            size="sm"
            onClick={() => addField('telephones')}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        {formData.telephones.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item.telephone}
              onChange={(e) => updateField('telephones', index, 'telephone', e.target.value)}
              placeholder="Téléphone"
              className="bg-slate-800 border-slate-700"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => toggleActuel('telephones', index)}
              className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}
            >
              <Check className="w-4 h-4" />
            </Button>
            {formData.telephones.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeField('telephones', index)}
                className="text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          className="bg-slate-800 border-slate-700 h-24"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
          Annuler
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
          <Save className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </form>
  );
}