import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import AuthListener from "@/components/AuthListener";
import { CartProvider } from "@/components/CartProvider";

const display = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata = {
  title: { default: "Harry Clinton | Bespoke Menswear", template: "%s | Harry Clinton" },
  description: "Bespoke suits, shirts, trousers and Indo-Western menswear, tailored for the moments that matter.",
  metadataBase: new URL("https://harryclinton.in"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <SmoothScroll>
          <AuthListener />
          <CartProvider>{children}</CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
