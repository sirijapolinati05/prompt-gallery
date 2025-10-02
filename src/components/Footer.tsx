interface FooterProps {
  onSecretLineClick: () => void;
}

const Footer = ({ onSecretLineClick }: FooterProps) => {
  return (
    <footer className="mt-20 py-12 px-6 bg-muted/30 text-center border-t border-border">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground">Features:</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• One-click copy</p>
            <p>• Visual references</p>
            <p>• Category filters</p>
            <p>• Search functionality</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground">Categories:</h3>
          <p className="text-sm text-muted-foreground">
            Men | Women | Couple | Kids
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Made with ♡
        </p>
      </div>
      
      {/* Secret silver line */}
      <div 
        className="mt-8 mx-auto max-w-md h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent cursor-pointer hover:via-gray-500 transition-all"
        onDoubleClick={onSecretLineClick}
        title="Double click for secret access"
      />
    </footer>
  );
};

export default Footer;
