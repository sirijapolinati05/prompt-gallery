import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import CategoryFilters from "@/components/CategoryFilters";
import SearchBar from "@/components/SearchBar";
import PromptCard from "@/components/PromptCard";
import Footer from "@/components/Footer";
import AdminPanel from "@/components/AdminPanel";
import { useAuth } from "@/hooks/useAuth";

interface Prompt {
  id: string;
  image_url: string | null;
  prompt_text: string;
  ai_tool: string;
  category: string;
  copy_count: number;
}

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Prompts");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

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
    fetchPrompts();

    const channel = supabase
      .channel("prompts-changes")
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
  }, []);

  // Toggle admin mode only if user is admin
  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdminMode(!isAdminMode);
    }
  };

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesCategory =
      selectedCategory === "All Prompts" || prompt.category === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.ai_tool.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isAdminMode && isAdmin) {
    return <AdminPanel onBack={() => setIsAdminMode(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <Header onAdminClick={isAdmin ? handleAdminToggle : undefined} />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <CategoryFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading prompts...</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No prompts found. Try adjusting your filters or search term.
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
      </main>

      <Footer />
    </div>
  );
};

export default Index;
