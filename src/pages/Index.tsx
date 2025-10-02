import { useState } from "react";
import MainPanel from "@/components/MainPanel";
import AdminPanel from "@/components/AdminPanel";
import SecretModal from "@/components/SecretModal";

const Index = () => {
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  if (isAdminMode) {
    return <AdminPanel onBack={() => setIsAdminMode(false)} />;
  }

  return (
    <>
      <MainPanel onSecretLineClick={() => setIsSecretModalOpen(true)} />
      
      <SecretModal
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
        onSuccess={() => setIsAdminMode(true)}
      />
    </>
  );
};

export default Index;
