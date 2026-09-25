
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const toggleVisibility = () => {
      if (scrollContainer.scrollTop > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    scrollContainer.addEventListener('scroll', toggleVisibility);
    return () => scrollContainer.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-5 right-5 z-40 h-9 w-9 rounded-full shadow-lg transition-all duration-300 ease-out-expo border border-border bg-card/90 backdrop-blur-xl hover:bg-card print:hidden",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"
      )}
    >
      <ChevronUp size={17} className="text-foreground" />
    </Button>
  );
};

export default BackToTop;