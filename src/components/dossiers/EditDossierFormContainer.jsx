import React from "react";
import EditDossierForm from "./EditDossierForm";

export default function EditDossierFormContainer(props) {
  return (
    <div className="flex flex-col w-full h-full min-h-0" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <EditDossierForm {...props} />
      </div>
    </div>
  );
}