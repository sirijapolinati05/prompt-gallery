import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import CategoryFilters from "./CategoryFilters";
import PromptCard from "./PromptCard";
import AddPromptForm from "./AddPromptForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prompt {
  id: string;
  image_url: string | null;
  prompt_text: string;
  ai_tool: string;
  category: string;
  copy_count: number;
}

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All Prompts");
  const [showAddForm, setShowAddForm] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast.error("Failed to load prompts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();

    // Subscribe to realtime changes in admin panel
    const channel = supabase
      .channel("admin-prompts-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prompts",
        },
        (payload) => {
          console.log("Admin panel: Database changed!", payload);
          fetchPrompts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          <div className="w-32" /> {/* Spacer for alignment */}
        </div>

        {/* Category Filters and Add Button */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <CategoryFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add New Image
            </Button>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <AddPromptForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              fetchPrompts();
              setShowAddForm(false);
            }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                id={prompt.id}
                imageUrl={prompt.image_url || undefined}
                promptText={prompt.prompt_text}
                aiTool={prompt.ai_tool}
                category={prompt.category}
                copyCount={prompt.copy_count}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
