import localFont from "next/font/local";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import AuthListener from "@/components/AuthListener";
import { CartProvider } from "@/components/CartProvider";
import GlobalLoader from "@/components/GlobalLoader";
import AgentationToolbar from "@/components/AgentationToolbar";

// Exclusive site-wide typeface: MAINLUX (regular, semibold/bold, and italic)
const mainlux = localFont({
  src: [
    { path: "../fonts/MAINLUX-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/MAINLUX-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/MAINLUX-SemiBold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/MAINLUX-Italic.ttf", weight: "400", style: "italic" },
    { path: "../fonts/MAINLUX-Italic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-mainlux",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata = {
  title: { default: "Harry Clinton | Bespoke Menswear", template: "%s | Harry Clinton" },
  description: "Bespoke suits, shirts, trousers and Indo-Western menswear, tailored for the moments that matter.",
  metadataBase: new URL("https://harryclinton.in"),
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={mainlux.variable}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <SmoothScroll>
          <GlobalLoader />
          <AuthListener />
          <CartProvider>{children}</CartProvider>
        </SmoothScroll>
        <AgentationToolbar />
      </body>
    </html>
  );
}
