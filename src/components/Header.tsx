const Header = () => {
  return (
    <header className="bg-gradient-to-r from-primary via-secondary to-primary py-12 px-6 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3 tracking-tight">
        ✨ PromptVault
      </h1>
      <p className="text-primary-foreground/90 text-lg md:text-xl max-w-3xl mx-auto">
        Discover and copy the best AI image generation prompts for creating stunning visuals.
      </p>
    </header>
  );
};

export default Header;
