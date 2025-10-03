import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CategoryFilters from "@/components/CategoryFilters";
import PromptCard from "@/components/PromptCard";
import Footer from "@/components/Footer";
import Dexie from "dexie";
import { toast } from "sonner";

// Initialize Dexie database
const db = new Dexie("PromptsDatabase");
db.version(1).stores({
  prompts: "id, prompt_text, ai_tool, category, created_at",
});

interface Prompt {
  id: string;
  image_url: string | null;
  prompt_text: string;
  ai_tool: string;
  category: string;
}

interface MainPanelProps {
  onSecretLineClick: () => void;
}

const MainPanel = ({ onSecretLineClick }: MainPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All Prompts");
  const [searchTerm, setSearchTerm] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrompts = async () => {
    try {
      const data = await db.prompts
        .orderBy("created_at")
        .reverse()
        .toArray();
      console.log("MainPanel: Fetched prompts from Dexie:", data);
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

  useEffect(() => {
    fetchPrompts();
  }, []);

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesCategory =
      selectedCategory === "All Prompts" || prompt.category === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.ai_tool.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      
      <main className="max-w-7xl mx-auto py-12 px-4">
        <CategoryFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                imageUrl={prompt.image_url || undefined}
                promptText={prompt.prompt_text}
                aiTool={prompt.ai_tool}
                category={prompt.category}
                isPopular={prompt.isPopular}
              />
            ))}
          </div>
        )}
      </main>

      <Footer onSecretLineClick={onSecretLineClick} />
    </div>
  );
};

export default MainPanel;