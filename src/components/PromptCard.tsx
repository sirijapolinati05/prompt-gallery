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

  // Define category order for sorting
  const categoryOrder = {
    men: 1,
    women: 2,
    couple: 3,
    kids: 4,
  }[category.toLowerCase()] || 5; // Default to 5 for unknown categories

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
      <Card className={`overflow-hidden hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out transform translate-z-6 hover:translate-z-12 hover:scale-[1.02] bg-muted border ${isPopular ? 'border-2 border-yellow-500' : 'border-black/20'} shadow-[0_6px_12px_rgba(0,0,0,0.3)]`}>
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
              <span className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-md font-mono">
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
            <span
              className={`px-3 py-1 rounded-full font-mono text-black text-xs font-bold transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:text-white border ${
                category.toLowerCase() === 'men'
                  ? 'bg-[#7FFFD4] border-[#00CED1] hover:bg-[#FF4500] hover:border-[#FF4500] hover:shadow-[0_4px_8px_rgba(255,69,0,0.5)]'
                  : category.toLowerCase() === 'women'
                  ? 'bg-[#ADFF2F] border-[#9ACD32] hover:bg-[#B22222] hover:border-[#B22222] hover:shadow-[0_4px_8px_rgba(178,34,34,0.5)]'
                  : category.toLowerCase() === 'couple'
                  ? 'bg-[#20B2AA] border-[#008B8B] hover:bg-[#9ACD32] hover:border-[#9ACD32] hover:shadow-[0_4px_8px_rgba(154,205,50,0.5)]'
                  : category.toLowerCase() === 'kids'
                  ? 'bg-[#4682B4] border-[#4169E1] hover:bg-[#2E8B57] hover:border-[#2E8B57] hover:shadow-[0_4px_8px_rgba(46,139,87,0.5)]'
                  : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/30'
              }`}
              style={{
                borderRadius: '9999px',
                padding: '0.25rem 0.75rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 2px rgba(0,0,0,0.1)',
                transition: 'background-color 0.3s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out, color 0.3s ease-in-out',
              } as React.CSSProperties}
            >
              {category}
            </span>
          </div>
          <Button
            onClick={handleCopy}
            className={`w-3/5 mx-auto block mt-2 relative transition-all duration-300 ease-in-out transform translate-y-[-4px] hover:-translate-y-4 hover:-rotate-x-10 hover:scale-105 hover:shadow-[0_16px_32px_rgba(0,0,0,0.6)] ${
              copied ? 'bg-green-500 hover:bg-green-600 text-black border-green-700' : 'bg-primary hover:bg-[#9333ea] text-white border-primary/70 hover:border-[#7e22ce]'
            } font-medium rounded-lg py-2 px-4 border-b-4 flex items-center justify-center float-animation`}
            style={{
              transform: 'perspective(1000px) translateZ(8px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3), inset 0 -2px 2px rgba(0,0,0,0.1), 0 0 20px rgba(147,51,234,0.4)',
              animation: copied ? 'none' : 'float 2s ease-in-out infinite',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out, border-color 0.3s ease-in-out, scale 0.3s ease-in-out',
            } as React.CSSProperties}
          >
            <style>
              {`
                @keyframes float {
                  0% { transform: perspective(1000px) translateZ(8px) translateY(-4px); }
                  50% { transform: perspective(1000px) translateZ(12px) translateY(-6px); }
                  100% { transform: perspective(1000px) translateZ(8px) translateY(-4px); }
                }
                .float-animation {
                  animation: float 2s ease-in-out infinite;
                }
              `}
            </style>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
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