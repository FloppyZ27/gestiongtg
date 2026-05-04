import React from "react";
import CommentairesSection from "./CommentairesSection";

export default function CommentairesSectionWrapper({ dossierId, commentairesTemp, onCommentairesTempChange, onAddHistoriqueEntry }) {
  return (
    <div className="h-full flex flex-col p-4 pr-6 gap-0">
      <CommentairesSection
        dossierId={dossierId}
        dossierTemporaire={!dossierId}
        commentairesTemp={commentairesTemp}
        onCommentairesTempChange={onCommentairesTempChange}
        onAddHistoriqueEntry={onAddHistoriqueEntry}
      />
    </div>
  );
}