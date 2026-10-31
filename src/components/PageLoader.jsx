
import { useEffect, useState } from "react";

const PageLoader = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        <img
          src="/Tectonic-logo.webp"
          alt="Tectonic Engineering"
          className="w-52 max-w-[75vw] animate-pulse object-contain"
        />

        <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-full origin-left animate-[loading_2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
