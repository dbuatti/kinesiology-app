import React from "react";
import PrintLayout from "@/components/shared/PrintLayout";
import CranialNervePrintable from "@/components/crm/CranialNervePrintable";

const CranialNervePrintPage = () => {
  return (
    <PrintLayout title="Cranial Nerves">
      <CranialNervePrintable />
    </PrintLayout>
  );
};

export default CranialNervePrintPage;
