import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Shield } from "lucide-react";
import CategoryFilters from "./CategoryFilters";
import PromptCard from "./PromptCard";
import AddPromptForm from "./AddPromptForm";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("All Prompts");
  const [showAddForm, setShowAddForm] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchPrompts = async () => {
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setPrompts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchPrompts();

      const channel = supabase
        .channel("admin-prompts-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "prompts",
          },
          () => {
            fetchPrompts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const filteredPrompts =
    selectedCategory === "All Prompts"
      ? prompts
      : prompts.filter((prompt) => prompt.category === selectedCategory);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">Admin Panel</h1>
            </div>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add New Prompt
            </Button>
          )}
        </div>

        <CategoryFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {showAddForm && (
          <AddPromptForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              fetchPrompts();
              setShowAddForm(false);
            }}
          />
        )}

        {loading ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
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
