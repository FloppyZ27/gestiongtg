/**
 * Vérifier si un lot est un doublon (même numéro, circonscription, cadastre et rang)
 * @param {Object} lotForm - Le formulaire du lot à vérifier
 * @param {Array} allLots - Liste de tous les lots existants
 * @param {string} editingLotId - ID du lot en édition (pour l'exclure de la vérification)
 * @returns {Object|null} Le lot doublon trouvé, ou null
 */
export const checkLotDuplicate = (lotForm, allLots, editingLotId = null) => {
  return allLots.find(l => 
    l.numero_lot === lotForm.numero_lot && 
    l.circonscription_fonciere === lotForm.circonscription_fonciere &&
    (l.rang || "") === (lotForm.rang || "") &&
    (l.cadastre || "") === (lotForm.cadastre || "") &&
    l.id !== editingLotId
  );
};