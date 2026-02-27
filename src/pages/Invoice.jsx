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
      {/* ✅ ALWAYS SHOW LIST IN BACKGROUND */}
      <InvoiceList
        onAdd={openAdd}
        onEdit={openEdit}
      />

      {/* ✅ SHOW ADD INVOICE AS MODAL OVER LIST */}
      {mode==="add" && (
        <AddInvoice
          id={editId}
          onBack={goBack}
        />
      )}
    </>
  );
}