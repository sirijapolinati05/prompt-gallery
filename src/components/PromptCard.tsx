import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PromptCardProps {
  id: string;
  imageUrl?: string;
  promptText: string;
  aiTool: string;
  category: string;
  copyCount: number;
}

const PromptCard = ({ id, imageUrl, promptText, aiTool, category, copyCount }: PromptCardProps) => {
  const [copied, setCopied] = useState(false);
  const [currentCopyCount, setCurrentCopyCount] = useState(copyCount);
  const [lastCopyTime, setLastCopyTime] = useState<number>(0);

  const COPY_COOLDOWN = 5000; // 5 seconds

  const handleCopy = async () => {
    const now = Date.now();
    
    // Rate limiting check
    if (now - lastCopyTime < COPY_COOLDOWN) {
      const remainingSeconds = Math.ceil((COPY_COOLDOWN - (now - lastCopyTime)) / 1000);
      toast.error(`Please wait ${remainingSeconds} seconds before copying again`);
      return;
    }

    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setLastCopyTime(now);
      toast.success("Prompt copied to clipboard!");

      // Increment copy count in database
      const { error } = await supabase
        .from("prompts")
        .update({ copy_count: currentCopyCount + 1 })
        .eq("id", id);

      if (!error) {
        setCurrentCopyCount(prev => prev + 1);
      }

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy prompt");
    }
  };

  const isPopular = currentCopyCount >= 5;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      {imageUrl && (
        <div className="aspect-square overflow-hidden bg-muted relative">
          <img
            src={imageUrl}
            alt="Prompt preview"
            className="w-full h-full object-cover"
          />
          {isPopular && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
              ⭐ Popular
            </Badge>
          )}
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
        
        {/* Copy Count Display */}
        {currentCopyCount > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Users className="w-4 h-4" />
            <span>Copied by {currentCopyCount} {currentCopyCount === 1 ? "person" : "people"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptCard;
