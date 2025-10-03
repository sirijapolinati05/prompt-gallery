import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import CategoryFilters from "./CategoryFilters";
import PromptCard from "./PromptCard";
import PromptForm from "./PromptForm";
import Dexie from "dexie";
import { toast } from "sonner";

interface Prompt {
  id: string;
  image_url: string | null;
  prompt_text: string;
  ai_tool: string;
  category: string;
  created_at: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

// Initialize Dexie database
const db = new Dexie("PromptsDatabase");
db.version(1).stores({
  prompts: "id, prompt_text, ai_tool, category, created_at",
});

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All Prompts");
  const [showAddForm, setShowAddForm] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const fetchPrompts = async () => {
    try {
      const data = await db.prompts
        .orderBy("created_at")
        .reverse()
        .toArray();
      // Add copy count from localStorage to each prompt
      const promptsWithCounts = data.map((prompt) => {
        const storageKey = `copyCount_${prompt.prompt_text.replace(/\s+/g, '_')}`;
        const copyCount = parseInt(localStorage.getItem(storageKey) || "0", 10);
        return { ...prompt, copyCount };
      });
      // Sort by copy count in descending order
      const sortedPrompts = promptsWithCounts.sort((a, b) => b.copyCount - a.copyCount);
      // Determine the copy count threshold for top 3 (including ties)
      const top3Threshold = sortedPrompts.length >= 3 ? sortedPrompts[2].copyCount : 0;
      // Mark prompts as popular if their copy count is >= top3Threshold and non-zero
      const updatedPrompts = sortedPrompts.map((prompt) => ({
        ...prompt,
        isPopular: prompt.copyCount >= top3Threshold && prompt.copyCount > 0,
      }));
      setPrompts(updatedPrompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast.error("Failed to load prompts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await db.prompts.delete(id);
      setPrompts(prompts.filter((prompt) => prompt.id !== id));
      toast.success("Prompt deleted successfully");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowAddForm(true);
  };

  const handleAddOrUpdatePrompt = async (promptData: {
    image_url: string | null;
    prompt_text: string;
    ai_tool: string;
    category: string;
  }) => {
    try {
      const prompt: Prompt = {
        id: editingPrompt ? editingPrompt.id : crypto.randomUUID(),
        created_at: editingPrompt ? editingPrompt.created_at : new Date().toISOString(),
        ...promptData,
      };
      await db.prompts.put(prompt);
      await fetchPrompts();
      toast.success(editingPrompt ? "Prompt updated successfully" : "Prompt added successfully");
      setShowAddForm(false);
      setEditingPrompt(null);
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error(editingPrompt ? "Failed to update prompt" : "Failed to add prompt");
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const filteredPrompts = prompts.filter((prompt) => {
    if (selectedCategory === "All Prompts") return true;
    return prompt.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <div /> {/* Spacer */}
        </div>

        {/* Category Filters and Add Button */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
          <CategoryFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          {!showAddForm && (
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingPrompt(null);
                  setShowAddForm(true);
                }}
                size="sm"
                className="px-3 py-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Prompt
              </Button>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <PromptForm
            onClose={() => {
              setShowAddForm(false);
              setEditingPrompt(null);
            }}
            onSubmit={handleAddOrUpdatePrompt}
            initialPrompt={editingPrompt}
          />
        )}

        {/* Prompts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading prompts...</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No prompts found. Add your first prompt!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                imageUrl={prompt.image_url || undefined}
                promptText={prompt.prompt_text}
                aiTool={prompt.ai_tool}
                category={prompt.category}
                isAdmin={true}
                onEdit={() => handleEdit(prompt)}
                onDelete={() => handleDelete(prompt.id)}
                isPopular={prompt.isPopular}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;