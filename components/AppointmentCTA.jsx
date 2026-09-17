"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';

export default function AppointmentCTA() {
  return (
    <section className="w-full bg-[#101010] py-24 md:py-32 px-4">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <Reveal>
          <div className="flex flex-col items-center">
            <div className="mb-8 relative">
              <Image 
                src="/brand/logo-gold.png" 
                alt="Harry Clinton Logo" 
                width={80} 
                height={80} 
                className="object-contain"
              />
            </div>
            
            <span className="text-[#c6a15b] text-sm font-semibold tracking-widest uppercase mb-6 block">
              Bespoke Experience
            </span>
            
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-8">
              Your Perfect Suit Awaits
            </h2>
            
            <p className="font-sans text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
              Book a private consultation with our master tailors. We will guide you through fabric selection, measurements, and design — crafting a garment that is uniquely yours.
            </p>
            
            <Link 
              href="/book-appointment" 
              className="inline-block px-10 py-4 border border-[#c6a15b] text-[#c6a15b] hover:bg-[#c6a15b] hover:text-[#101010] transition-colors duration-300 font-medium tracking-wide uppercase text-sm mb-8"
            >
              Book Your Appointment
            </Link>
            
            <p className="font-sans text-gray-400 text-sm">
              Or reach us at{' '}
              <a 
                href="mailto:connect@harryclinton.com" 
                className="text-[#c6a15b] hover:underline hover:text-white transition-colors duration-300"
              >
                connect@harryclinton.com
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
