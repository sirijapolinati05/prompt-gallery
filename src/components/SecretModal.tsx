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

const SECRET_PASSWORD = "admin123"; // In production, this should be more secure

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Secret Access
          </DialogTitle>
          <DialogDescription>
            Enter the secret password to access the admin panel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter secret password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            autoFocus
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Access
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SecretModal;
