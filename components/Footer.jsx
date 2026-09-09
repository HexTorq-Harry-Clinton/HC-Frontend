import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-950 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <Image src="/brand/logo-white.png" alt="Harry Clinton" width={150} height={36} />
          <p className="mt-3 text-sm text-neutral-400">
            Bespoke menswear, tailored for the moments that matter.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/suits" className="hover:text-white">Suits</Link></li>
            <li><Link href="/shirts" className="hover:text-white">Shirts</Link></li>
            <li><Link href="/trousers" className="hover:text-white">Trousers</Link></li>
            <li><Link href="/indowestern" className="hover:text-white">Indo-Western</Link></li>
            <li><Link href="/new-arrivals" className="hover:text-white">New Arrivals</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/aboutUs" className="hover:text-white">About Us</Link></li>
            <li><Link href="/contact-us" className="hover:text-white">Contact</Link></li>
            <li><Link href="/book-appointment" className="hover:text-white">Book Appointment</Link></li>
            <li><Link href="/FAQs" className="hover:text-white">FAQs</Link></li>
            <li><Link href="/help-center" className="hover:text-white">Help Center</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions" className="hover:text-white">Terms</Link></li>
            <li><Link href="/Policies" className="hover:text-white">Policies</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Harry Clinton. All rights reserved.
      </div>
    </footer>
  );
}
