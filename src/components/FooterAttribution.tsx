const FooterAttribution = () => {
  return (
    <footer className="w-full py-8 flex justify-center items-center mt-auto">
      <p className="text-sm text-muted-foreground/80">
        Diseñado y desarrollado por{' '}
        <a
          href="https://mursatsolutions.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="relative font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground group"
        >
          MurSat Solutions
          {/* Subrayado animado en hover */}
          <span className="absolute -bottom-[2px] left-0 w-0 h-[1px] bg-foreground/60 transition-all duration-300 group-hover:w-full rounded-full"></span>
        </a>
      </p>
    </footer>
  );
};

export default FooterAttribution;
