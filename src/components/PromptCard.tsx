import { Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface PromptCardProps {
  imageUrl?: string;
  promptText: string;
  aiTool: string;
  category: string;
}

const PromptCard = ({ imageUrl, promptText, aiTool, category }: PromptCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden hover:shadow-[var(--shadow-hover)] transition-all duration-300 hover:scale-[1.02] bg-card border-border">
      {imageUrl && (
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt="Prompt preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-5 space-y-3">
        <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
          {promptText}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{aiTool}</span>
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
      </CardContent>
    </Card>
  );
};

export default PromptCard;
