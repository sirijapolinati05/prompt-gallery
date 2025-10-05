import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import CategoryFilters from "@/components/CategoryFilters";
import PromptCard from "@/components/PromptCard";
import Footer from "@/components/Footer";
import Dexie from "dexie";
import { toast } from "sonner";
import { sortPrompts } from "@/components/AdminPanel"; // Import sortPrompts from AdminPanel

// Dexie DB setup
const db = new Dexie("PromptsDatabase");
db.version(2).stores({
  prompts: "id, prompt_text, ai_tool, category, created_at, order",
});

interface Prompt {
  id: string;
  image_url: string | null;
  prompt_text: string;
  ai_tool: string;
  category: string;
  created_at: string;
  copyCount?: number;
  isPopular?: boolean;
  order?: number;
}

interface MainPanelProps {
  onSecretLineClick: () => void;
}

const MainPanel = ({ onSecretLineClick }: MainPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All Prompts");
  const [searchTerm, setSearchTerm] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Click tracking for secret feature - works in ALL sections
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickPositionRef = useRef({ x: 0, y: 0 });
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const fetchPrompts = async () => {
    try {
      const data = await db.prompts.toArray();
      console.log("MainPanel: Fetched prompts from Dexie:", data);

      // Add copy count from localStorage
      const promptsWithCounts = data.map((prompt, index) => {
        const storageKey = `copyCount_${prompt.prompt_text.replace(/\s+/g, "_")}`;
        const copyCount = parseInt(localStorage.getItem(storageKey) || "0", 10);
        return {
          ...prompt,
          copyCount,
          category: prompt.category.toLowerCase(),
          order: prompt.order ?? index, // Default to index if order is undefined
        };
      });

      // Check manual reorder status
      const isManuallyReordered = localStorage.getItem("isManuallyReordered") === "true";

      // Sort prompts using the shared sortPrompts function
      const sortedPrompts = sortPrompts(promptsWithCounts, isManuallyReordered);

      setPrompts(sortedPrompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast.error("Failed to load prompts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();

    // Listen for storage changes (copyCount updates or manual reorder)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("copyCount_") || e.key === "isManuallyReordered") {
        console.log("MainPanel: Storage changed, re-fetching");
        fetchPrompts();
      }
    };

    // Listen for custom events from AdminPanel
    const handlePromptsUpdate = () => {
      console.log("MainPanel: Prompts updated event received");
      fetchPrompts();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("promptsUpdated", handlePromptsUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("promptsUpdated", handlePromptsUpdate);
    };
  }, []);

  // Re-fetch when coming back from AdminPanel
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("MainPanel: Page became visible, re-fetching");
        fetchPrompts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesCategory =
      selectedCategory === "All Prompts" ||
      prompt.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      searchTerm === "" ||
      prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.ai_tool.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Handle background clicks for secret feature - WORKS IN ALL SECTIONS
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only count clicks on the background itself, not on child elements
    if (e.target === e.currentTarget) {
      const currentX = e.clientX;
      const currentY = e.clientY;

      // Check if click is within 50px radius of last click (same spot)
      const distance = Math.sqrt(
        Math.pow(currentX - lastClickPositionRef.current.x, 2) +
        Math.pow(currentY - lastClickPositionRef.current.y, 2)
      );

      const isSameSpot = clickCountRef.current === 0 || distance < 50;

      if (isSameSpot) {
        clickCountRef.current += 1;
        lastClickPositionRef.current = { x: currentX, y: currentY };

        // Visual feedback - dot with ripple effect only
        const ripple = document.createElement("div");
        ripple.className = "fixed pointer-events-none z-50";
        ripple.style.left = `${currentX}px`;
        ripple.style.top = `${currentY}px`;
        ripple.style.transform = "translate(-50%, -50%)";
        ripple.innerHTML = `
          <div class="relative">
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
            <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>
        `;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        console.log(`Click count: ${clickCountRef.current}/4 in ${selectedCategory} section`);

        // Reset timer
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }

        // If 4 clicks reached, scroll based on which direction has more distance
        if (clickCountRef.current >= 4) {
          const windowHeight = window.innerHeight;
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const documentHeight = document.documentElement.scrollHeight;

          // Calculate distances
          const distanceToTop = scrollTop; // Distance to top of page
          const distanceToBottom = documentHeight - (scrollTop + windowHeight); // Distance to bottom of page

          console.log(`Distances - Top: ${distanceToTop}px, Bottom: ${distanceToBottom}px`);

          if (distanceToTop > distanceToBottom) {
            // More distance to scroll up - go to header
            console.log(`More distance to top (${distanceToTop}px) - Scrolling to header...`);
            headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            toast.success(`Scrolling to top!`);
          } else {
            // More distance to scroll down - go to footer
            console.log(`More distance to bottom (${distanceToBottom}px) - Scrolling to footer...`);
            footerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            toast.success(`Scrolling to bottom!`);
          }

          clickCountRef.current = 0;
          lastClickPositionRef.current = { x: 0, y: 0 };
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
          }
        } else {
          // Reset count after 2 seconds if not completed
          clickTimerRef.current = setTimeout(() => {
            console.log("Click timer reset");
            clickCountRef.current = 0;
            lastClickPositionRef.current = { x: 0, y: 0 };
          }, 2000);
        }
      } else {
        // Different spot - reset count
        console.log("Click in different spot - resetting count");
        clickCountRef.current = 1;
        lastClickPositionRef.current = { x: currentX, y: currentY };

        // Show reset feedback - dot only
        const resetRipple = document.createElement("div");
        resetRipple.className = "fixed pointer-events-none z-50";
        resetRipple.style.left = `${currentX}px`;
        resetRipple.style.top = `${currentY}px`;
        resetRipple.style.transform = "translate(-50%, -50%)";
        resetRipple.innerHTML = `
          <div class="relative">
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
            <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>
        `;
        document.body.appendChild(resetRipple);
        setTimeout(() => resetRipple.remove(), 600);

        // Set new timer
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }
        clickTimerRef.current = setTimeout(() => {
          clickCountRef.current = 0;
          lastClickPositionRef.current = { x: 0, y: 0 };
        }, 2000);
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-background cursor-pointer"
      onClick={handleBackgroundClick}
    >
      <div ref={headerRef}>
        <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      </div>

      <main className="max-w-7xl mx-auto py-12 px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <CategoryFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 pointer-events-auto">
            <p className="text-muted-foreground">Loading prompts...</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-12 pointer-events-auto">
            <p className="text-muted-foreground">
              No prompts found. Try adjusting your filters or search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pointer-events-auto">
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

      <div ref={footerRef}>
        <Footer onSecretLineClick={onSecretLineClick} />
      </div>
    </div>
  );
};

export default MainPanel;