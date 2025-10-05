import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createPortal } from "react-dom";

interface Prompt {
  id?: string;
  image_url: string | null;
  prompt_text: string;
  ai_tool: string;
  category: string;
  created_at?: string;
}

interface PromptFormProps {
  onClose: () => void;
  onSubmit: (data: {
    image_url: string | null;
    prompt_text: string;
    ai_tool: string;
    category: string;
  }) => void;
  initialPrompt?: Prompt | null;
  triggerElement?: HTMLElement | null; // Element that triggered the form
}

const PromptForm = ({ onClose, onSubmit, initialPrompt, triggerElement }: PromptFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [promptText, setPromptText] = useState("");
  const [aiTool, setAiTool] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPromptText(initialPrompt.prompt_text || "");
      setAiTool(initialPrompt.ai_tool || "");
      setCategory(initialPrompt.category || "");
      setImagePreview(initialPrompt.image_url || "");
      setImageFile(null);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (triggerElement && dialogRef.current) {
      const rect = triggerElement.getBoundingClientRect();
      const dialog = dialogRef.current;
      // Position the dialog near the trigger element
      dialog.style.position = "absolute";
      dialog.style.top = `${rect.bottom + window.scrollY}px`;
      dialog.style.left = `${rect.left + window.scrollX}px`;
      dialog.style.maxWidth = "28rem";
      dialog.style.zIndex = "50";
    }
  }, [triggerElement]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!promptText || !aiTool || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        image_url: imagePreview || null,
        prompt_text: promptText,
        ai_tool: aiTool,
        category: category,
      });

      // Reset form
      setImageFile(null);
      setImagePreview("");
      setPromptText("");
      setAiTool("");
      setCategory("");
      onClose(); // Close the dialog after successful submission
    } catch (error) {
      console.error(`Error ${initialPrompt ? "updating" : "adding"} prompt:`, error);
      toast.error(`Failed to ${initialPrompt ? "update" : "add"} prompt. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <Card 
      className="border-2 border-primary/20 shadow-[0_6px_12px_rgba(0,0,0,0.3)] max-w-lg w-full sm:w-[28rem] perspective-1000 bg-muted hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out transform translate-z-6 hover:translate-z-12 hover:scale-[1.02] float-animation"
      style={{
        transform: 'perspective(1000px) translateZ(8px)',
        animation: 'float 2s ease-in-out infinite',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, scale 0.3s ease-in-out',
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
          @keyframes floatInward {
            0% { transform: perspective(500px) translateZ(0px) translateY(0px); }
            50% { transform: perspective(500px) translateZ(-4px) translateY(2px); }
            100% { transform: perspective(500px) translateZ(0px) translateY(0px); }
          }
          .float-inward {
            animation: floatInward 2.5s ease-in-out infinite;
          }
          .input-inset {
            border: 2px solid black !important;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
            transform: translateZ(-2px);
            transition: all 0.2s ease-in-out;
          }
          .input-inset:focus {
            box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.4), 0 0 0 3px rgba(0, 0, 0, 0.1);
            transform: translateZ(-1px);
          }
        `}
      </style>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">{initialPrompt ? "Edit Prompt" : "Add New Prompt"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-1 perspective-500 float-inward" style={{ transform: 'perspective(500px) translateZ(0px)' } as React.CSSProperties}>
            <Label className="text-sm">Upload Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative input-inset">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6"
                  onClick={removeImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors input-inset">
                <div className="flex flex-col items-center justify-center pt-3 pb-4">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Click to upload
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Prompt Text */}
          <div className="space-y-1 perspective-500 float-inward" style={{ transform: 'perspective(500px) translateZ(0px)' } as React.CSSProperties}>
            <Label htmlFor="promptText" className="text-sm">
              Prompt Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="promptText"
              placeholder="Enter AI prompt..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={3}
              required
              className="text-sm input-inset"
            />
          </div>

          {/* AI Tool */}
          <div className="space-y-1 perspective-500 float-inward" style={{ transform: 'perspective(500px) translateZ(0px)' } as React.CSSProperties}>
            <Label htmlFor="aiTool" className="text-sm">
              AI Tool <span className="text-destructive">*</span>
            </Label>
            <Input
              id="aiTool"
              placeholder="e.g., Midjourney, DALL-E"
              value={aiTool}
              onChange={(e) => setAiTool(e.target.value)}
              required
              className="text-sm input-inset"
            />
          </div>

          {/* Category */}
          <div className="space-y-1 perspective-500 float-inward" style={{ transform: 'perspective(500px) translateZ(0px)' } as React.CSSProperties}>
            <Label htmlFor="category" className="text-sm">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="text-sm input-inset">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Men">Men</SelectItem>
                <SelectItem value="Women">Women</SelectItem>
                <SelectItem value="Couple">Couple</SelectItem>
                <SelectItem value="Kids">Kids</SelectItem>
                <SelectItem value="All Prompts">All Prompts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full text-sm" disabled={isSubmitting}>
            {isSubmitting
              ? initialPrompt
                ? "Updating..."
                : "Adding..."
              : initialPrompt
              ? "Update Prompt"
              : "Add Prompt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return createPortal(
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent ref={dialogRef} className="p-0 border-none bg-transparent shadow-none">
        {formContent}
      </DialogContent>
    </Dialog>,
    document.body
  );
};

export default PromptForm;