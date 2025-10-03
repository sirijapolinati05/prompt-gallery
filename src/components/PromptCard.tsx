import { Copy, Check, Edit, Trash2, Download, Image, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PromptCardProps {
  imageUrl?: string;
  promptText: string;
  aiTool: string;
  category: string;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isPopular?: boolean;
}

const PromptCard = ({ imageUrl, promptText, aiTool, category, isAdmin = false, onEdit, onDelete, isPopular = false }: PromptCardProps) => {
  const [copied, setCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(0);

  // Generate a unique key for localStorage based on promptText
  const storageKey = `copyCount_${promptText.replace(/\s+/g, '_')}`;

  // Load copy count from localStorage on mount
  useEffect(() => {
    const storedCount = localStorage.getItem(storageKey);
    if (storedCount) {
      setCopyCount(parseInt(storedCount, 10));
    }
  }, [storageKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    const newCount = copyCount + 1;
    setCopyCount(newCount);
    localStorage.setItem(storageKey, newCount.toString());
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([promptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prompt.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Prompt downloaded successfully!");
  };

  return (
    <div className="perspective-1000">
      <Card className="overflow-hidden hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out transform translate-z-6 hover:translate-z-12 hover:scale-[1.02] bg-muted border border-black/20 shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
        {imageUrl && (
          <div className="aspect-square overflow-hidden bg-muted p-3 relative">
            <div className="w-full h-full bg-white rounded-md">
              <img
                src={imageUrl}
                alt="Prompt preview"
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            {isPopular && (
              <span className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-md">
                Popular
              </span>
            )}
          </div>
        )}
        <CardContent className="p-5 space-y-3">
          <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
            {promptText}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              <span className="font-medium">{aiTool}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {category}
            </span>
          </div>
          <Button
            onClick={handleCopy}
            className="w-full mt-2"
            variant={copied ? "secondary" : "default"}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Prompt
              </>
            )}
          </Button>
          {isAdmin && (
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 text-green-500" />
              </Button>
            </div>
          )}
          <div className="flex justify-end items-center gap-1 text-xs text-muted-foreground">
            <User className="w-4 h-4" />
            <p>Copied by {copyCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptCard;