import { useState } from "react";
import InvoiceList from "../components/invoice/InvoiceList";
import AddInvoice from "../components/invoice/AddInvoice";

export default function Invoice() {

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
        <InvoiceList
          onAdd={openAdd}
          onEdit={openEdit}
        />
      )}

      {mode==="add" && (
        <AddInvoice
          id={editId}
          onBack={goBack}
        />
      )}
    </>
  );
}
