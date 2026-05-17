export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-bg-dark/50 px-6 py-8 mt-16">
      <div className="max-w-5xl mx-auto text-center text-xs text-white/30 space-y-2">
        <p>Research and non-commercial use only. Powered by Meta TRIBE v2 (CC BY-NC 4.0). Not affiliated with Meta.</p>
        <p>
          Trained on 720+ subjects, 1,000+ hours of fMRI data.{" "}
          <a href="https://github.com/facebookresearch/tribev2" className="underline hover:text-cyan-accent" target="_blank" rel="noopener noreferrer">
            Source
          </a>
        </p>
      </div>
    </footer>
  );
}