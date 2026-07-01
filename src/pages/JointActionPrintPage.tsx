import PrintLayout from "@/components/shared/PrintLayout";
import JointActionPrintable from "@/components/crm/JointActionPrintable";

const JointActionPrintPage = () => {
  return (
    <PrintLayout title="Joint Actions">
      <JointActionPrintable />
    </PrintLayout>
  );
};

export default JointActionPrintPage;
