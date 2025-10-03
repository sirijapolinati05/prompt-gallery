import { useState, useEffect } from "react";
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
}

const PromptForm = ({ onClose, onSubmit, initialPrompt }: PromptFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [promptText, setPromptText] = useState("");
  const [aiTool, setAiTool] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setPromptText(initialPrompt.prompt_text || "");
      setAiTool(initialPrompt.ai_tool || "");
      setCategory(initialPrompt.category || "");
      setImagePreview(initialPrompt.image_url || "");
      setImageFile(null); // Reset file, as we use base64 string
    }
  }, [initialPrompt]);

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
    } catch (error) {
      console.error(`Error ${initialPrompt ? "updating" : "adding"} prompt:`, error);
      toast.error(`Failed to ${initialPrompt ? "update" : "add"} prompt. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)] max-w-lg w-full sm:w-[28rem] mx-auto">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">{initialPrompt ? "Edit Prompt" : "Add New Prompt"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-1">
            <Label className="text-sm">Upload Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative">
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
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
          <div className="space-y-1">
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
              className="text-sm"
            />
          </div>

          {/* AI Tool */}
          <div className="space-y-1">
            <Label htmlFor="aiTool" className="text-sm">
              AI Tool <span className="text-destructive">*</span>
            </Label>
            <Input
              id="aiTool"
              placeholder="e.g., Midjourney, DALL-E"
              value={aiTool}
              onChange={(e) => setAiTool(e.target.value)}
              required
              className="text-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="category" className="text-sm">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="text-sm">
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
};

export default PromptForm;