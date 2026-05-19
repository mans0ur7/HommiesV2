const TypingIndicator = () => {
  return (
    <div className="flex items-end gap-2 justify-start mb-3">
      <div className="w-7" /> {/* Spacer for avatar alignment */}
      <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" 
            style={{ animationDelay: "0ms", animationDuration: "600ms" }}
          />
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" 
            style={{ animationDelay: "150ms", animationDuration: "600ms" }}
          />
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" 
            style={{ animationDelay: "300ms", animationDuration: "600ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
