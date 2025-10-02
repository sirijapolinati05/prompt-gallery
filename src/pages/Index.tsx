import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CategoryFilters from "@/components/CategoryFilters";
import SearchBar from "@/components/SearchBar";
import PromptCard from "@/components/PromptCard";
import Footer from "@/components/Footer";
import SecretModal from "@/components/SecretModal";
import AdminPanel from "@/components/AdminPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prompt {
  id: string;
  image_url: string | null;
  prompt_text: string;
  ai_tool: string;
  category: string;
}

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Prompts");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
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
    // Fetch prompts when component mounts or when returning from admin mode
    if (!isAdminMode) {
      fetchPrompts();
    }

    // Subscribe to realtime changes
    const channel = supabase
      .channel("main-prompts-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prompts",
        },
        (payload) => {
          console.log("Main panel: Database changed!", payload);
          fetchPrompts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminMode]);

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesCategory =
      selectedCategory === "All Prompts" || prompt.category === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.ai_tool.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isAdminMode) {
    return <AdminPanel onBack={() => setIsAdminMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto py-12 px-4">
        <CategoryFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        {isLoading ? (
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
                imageUrl={prompt.image_url || undefined}
                promptText={prompt.prompt_text}
                aiTool={prompt.ai_tool}
                category={prompt.category}
              />
            ))}
          </div>
        )}
      </main>

      <Footer onSecretLineClick={() => setIsSecretModalOpen(true)} />
      
      <SecretModal
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
        onSuccess={() => setIsAdminMode(true)}
      />
    </div>
  );
};

export default Index;
