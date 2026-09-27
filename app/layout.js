import { Playfair_Display, Inter } from "next/font/google";
import localFont from "next/font/local";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import AuthListener from "@/components/AuthListener";
import { CartProvider } from "@/components/CartProvider";

const display = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

// Brand typeface used by the reference site. Exposed as a CSS variable only —
// it is applied to the notification bar, navbar and running bar alone (see
// globals.css `.hc-bar-font`), so the rest of the storefront keeps Inter.
const mainlux = localFont({
  src: [
    { path: "../fonts/MAINLUX-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/MAINLUX-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/MAINLUX-Italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-mainlux",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata = {
  title: { default: "Harry Clinton | Bespoke Menswear", template: "%s | Harry Clinton" },
  description: "Bespoke suits, shirts, trousers and Indo-Western menswear, tailored for the moments that matter.",
  metadataBase: new URL("https://harryclinton.in"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mainlux.variable}`}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <SmoothScroll>
          <AuthListener />
          <CartProvider>{children}</CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
