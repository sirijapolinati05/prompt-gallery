import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur mt-auto">
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">
          Made with <Heart className="inline w-4 h-4 text-red-500 fill-current animate-pulse" /> by PromptVault Team
        </p>
      </div>
    </footer>
  );
};

export default Footer;
