import RunningBar from "@/components/RunningBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Storefront shell: ticker + header + footer around every shop page.
export default function StoreLayout({ children }) {
  return (
    <>
      <RunningBar />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
