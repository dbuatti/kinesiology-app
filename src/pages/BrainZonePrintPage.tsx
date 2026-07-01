import PrintLayout from "@/components/shared/PrintLayout";
import BrainZonePrintable from "@/components/crm/BrainZonePrintable";

const BrainZonePrintPage = () => {
  return (
    <PrintLayout title="Brain Zones">
      <BrainZonePrintable />
    </PrintLayout>
  );
};

export default BrainZonePrintPage;
