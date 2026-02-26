import { useState } from "react";
import QuotationList from "../components/quotations/QuotationList";
import AddQuotation from "../components/quotations/AddQuotation";

export default function Quotation() {

  const [mode,setMode] = useState("list"); 
  const [editId,setEditId] = useState(null);

  // ⭐ ADD THIS
  const [refreshKey,setRefreshKey] = useState(0);

  const openAdd = ()=>{
    setEditId(null);
    setMode("add");
  };

  const openEdit = (id)=>{
    setEditId(id);
    setMode("add");
  };

  // ⭐ MODIFY goBack
  const goBack = ()=>{
    setMode("list");

    // force quotation list reload
    setRefreshKey(prev => prev + 1);
  };

  return(
    <>
      {/* LIST */}
      <QuotationList
        key={refreshKey}   // ⭐ VERY IMPORTANT
        onAdd={openAdd}
        onEdit={openEdit}
      />

      {/* MODAL */}
      {mode==="add" && (
        <AddQuotation
          id={editId}
          onBack={goBack}
        />
      )}
    </>
  );
}