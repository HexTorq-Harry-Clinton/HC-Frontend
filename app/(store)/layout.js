import RunningBar from "@/components/RunningBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginNudge from "@/components/LoginNudge";

// Storefront shell: ticker + header + footer around every shop page,
// plus the guest login nudge (same flow as before).
export default function StoreLayout({ children }) {
  return (
    <>
      <RunningBar />
      <Header />
      <main>{children}</main>
      <Footer />
      <LoginNudge />
    </>
  );
}
