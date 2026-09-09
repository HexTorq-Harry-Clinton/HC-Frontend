"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Coming Soon: same structure/texts as the previous UI.
export default function ComingSoonView() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    let n = 1;
    const t = setInterval(() => {
      n = (n % 3) + 1;
      setDots(".".repeat(n));
    }, 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <Image src="/brand/logo-black.png" alt="Harry Clinton" width={180} height={48} className="mx-auto" />
      <h1 className="mt-8 font-display text-5xl font-bold md:text-6xl">Coming Soon</h1>
      <p className="mx-auto mt-4 max-w-xl text-neutral-500">
        We are crafting something extraordinary for you. Stay tuned for the reveal{dots}
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to Home
      </Link>
      <div className="mt-12 overflow-hidden border-y border-neutral-200">
        <div className="animate-marquee py-3">
          {Array(4).fill(["HARRY CLINTON", "·", "COMING SOON", "·", "CRAFTED FOR YOU", "·"]).flat().map((word, idx) => (
            <span key={idx} className={`mx-4 font-bold uppercase ${word === "·" ? "text-gold" : ""}`}>
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
