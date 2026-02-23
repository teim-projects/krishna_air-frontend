import { useState } from "react";
import QuotationList from "../components/quotations/QuotationList";
import AddQuotation from "../components/quotations/AddQuotation";

export default function Quotation() {

  const [mode,setMode] = useState("list"); 
  const [editId,setEditId] = useState(null);

  const openAdd = ()=>{
    setEditId(null);
    setMode("add");
  };

  const openEdit = (id)=>{
    setEditId(id);
    setMode("add");
  };

  const goBack = ()=>{
    setMode("list");
  };

  return(
    <>
      {mode==="list" && (
        <QuotationList
          onAdd={openAdd}
          onEdit={openEdit}
        />
      )}

      {mode==="add" && (
        <AddQuotation
          id={editId}
          onBack={goBack}
        />
      )}
    </>
  );
}
