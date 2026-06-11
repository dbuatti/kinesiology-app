import React from "react";
import PrintLayout from "@/components/shared/PrintLayout";
import HeartWallPrintable from "@/components/crm/HeartWallPrintable";

const HeartWallPrintPage = () => {
  return (
    <PrintLayout title="Heart Wall Protocol">
      <HeartWallPrintable />
    </PrintLayout>
  );
};

export default HeartWallPrintPage;
