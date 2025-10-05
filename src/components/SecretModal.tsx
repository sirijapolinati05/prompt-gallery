import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "sonner";

interface SecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SECRET_PASSWORD = "svecw"; // In production, this should be more secure

const SecretModal = ({ isOpen, onClose, onSuccess }: SecretModalProps) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SECRET_PASSWORD) {
      onSuccess();
      onClose();
      setPassword("");
      toast.success("Access granted! Welcome to admin panel.");
    } else {
      toast.error("Incorrect password!");
      setPassword("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl transform transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl perspective-1000 rotate-x-2 rotate-y-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <Lock className="w-5 h-5 text-blue-500" />
            Secret Access
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Enter the secret password to access the admin panel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter secret password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/80 border-none shadow-inner shadow-gray-400/50 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/90 border-gray-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-[#00FF7F] hover:text-black transform transition-all duration-200 rounded-lg text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-[#20B2AA] hover:text-black transform transition-all duration-200 rounded-lg"
            >
              Access
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SecretModal;