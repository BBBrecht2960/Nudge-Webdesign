'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from './Button';
import { Phone } from 'lucide-react';
import { posthog } from '@/lib/posthog';

const SCROLL_THRESHOLD = 200; // Minimum scroll distance before showing
const FINAL_CTA_BUFFER = 100; // Hide sticky CTA when within this distance of FinalCTA

export function StickyMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);

  const checkVisibility = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // Find FinalCTA section
    const finalCTAElement = document.getElementById('final-cta');
    
    if (!finalCTAElement) {
      // If FinalCTA doesn't exist, use simple bottom check
      const documentHeight = document.documentElement.scrollHeight;
      const scrollBottom = scrollTop + windowHeight;
      const distanceFromBottom = documentHeight - scrollBottom;
      const isNearBottom = distanceFromBottom < FINAL_CTA_BUFFER;
      
      setIsVisible(scrollTop > SCROLL_THRESHOLD && !isNearBottom);
      return;
    }

    // Get FinalCTA position
    const finalCTARect = finalCTAElement.getBoundingClientRect();
    const finalCTATop = scrollTop + finalCTARect.top;
    const finalCTABottom = finalCTATop + finalCTARect.height;
    
    // Current viewport position
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + windowHeight;
    
    // Check if FinalCTA is visible or near viewport
    const isFinalCTAInView = finalCTARect.top < windowHeight && finalCTARect.bottom > 0;
    const distanceToFinalCTA = finalCTATop - viewportBottom;
    const isNearFinalCTA = distanceToFinalCTA < FINAL_CTA_BUFFER && distanceToFinalCTA > -FINAL_CTA_BUFFER;
    
    // Show sticky CTA only if:
    // 1. Scrolled past threshold
    // 2. FinalCTA is not in view or near viewport
    const shouldShow = scrollTop > SCROLL_THRESHOLD && !isFinalCTAInView && !isNearFinalCTA;
    
    setIsVisible(shouldShow);
  }, []);

  useEffect(() => {
    // Throttle scroll events for better performance
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check (defer to avoid synchronous setState)
    window.requestAnimationFrame(() => {
      checkVisibility();
    });
    
    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      window.requestAnimationFrame(() => {
        checkVisibility();
      });
    }, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [checkVisibility]);

  const handleCTAClick = () => {
    posthog?.capture('sticky_cta_click', {
      cta_type: 'primary',
      cta_text: 'Plan een gratis gesprek',
      section: 'sticky_mobile_bar',
    });
    // Scroll to form or open contact modal
    const form = document.getElementById('contact-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePhoneClick = () => {
    posthog?.capture('phone_click', {
      source: 'sticky_mobile_bar',
    });
  };

  if (!isVisible) return null;

  const phoneNumber = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] w-full min-w-0 max-w-[100vw] overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] min-w-0">
        <Button
          onClick={handleCTAClick}
          className="flex-1 min-w-0 text-sm min-h-[48px]"
          size="lg"
        >
          Plan gratis gesprek
        </Button>
        <a
          href={`tel:${phoneNumber}`}
          onClick={handlePhoneClick}
          className="p-3.5 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg bg-accent hover:bg-accent/80 active:bg-accent/70 transition-colors shrink-0 touch-manipulation"
          aria-label="Bel ons"
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
