import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";

interface AddPromptFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddPromptForm = ({ onClose, onSuccess }: AddPromptFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [promptText, setPromptText] = useState("");
  const [aiTool, setAiTool] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      let imageUrl = "";

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("prompt-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("prompt-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Insert prompt into database
      const { error: insertError } = await supabase.from("prompts").insert({
        image_url: imageUrl,
        prompt_text: promptText,
        ai_tool: aiTool,
        category: category,
      });

      if (insertError) throw insertError;

      console.log("Prompt successfully added to database!");
      toast.success("Prompt added successfully! It will appear in both Admin and Main panels.");
      
      // Call success callback to trigger refresh
      onSuccess();
      
      // Close the form
      onClose();
      
      // Reset form
      setImageFile(null);
      setImagePreview("");
      setPromptText("");
      setAiTool("");
      setCategory("");
    } catch (error) {
      console.error("Error adding prompt:", error);
      toast.error("Failed to add prompt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-8 border-2 border-primary/20 shadow-[var(--shadow-card)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Add New Prompt</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Upload Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload image
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
          <div className="space-y-2">
            <Label htmlFor="promptText">
              Prompt Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="promptText"
              placeholder="Enter the AI prompt..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* AI Tool */}
          <div className="space-y-2">
            <Label htmlFor="aiTool">
              AI Tool <span className="text-destructive">*</span>
            </Label>
            <Input
              id="aiTool"
              placeholder="e.g., Midjourney, DALL-E, Stable Diffusion"
              value={aiTool}
              onChange={(e) => setAiTool(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Men">Men</SelectItem>
                <SelectItem value="Women">Women</SelectItem>
                <SelectItem value="Couple">Couple</SelectItem>
                <SelectItem value="Kids">Kids</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Prompt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddPromptForm;
