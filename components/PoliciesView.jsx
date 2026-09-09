"use client";

import { useState } from "react";

// Policies: tabbed Shipping/Exchange/Return/Refund/Cancellation — verbatim.
const TABS = ["Shipping", "Exchange", "Return", "Refund", "Cancellation"];

export default function PoliciesView() {
  const [tab, setTab] = useState("Shipping");

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-center font-display text-5xl font-bold">Our Policies</h1>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border px-5 py-2 text-sm font-semibold transition ${
              tab === t ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 hover:border-neutral-950"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        {tab === "Shipping" && (
          <div>
            <h2 className="font-display text-2xl font-bold">Shipping Policy</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral-600">
              <li>All orders are dispatched within 3-5 business days of order placement. Business days exclude public holidays and Sundays.</li>
              <li>Orders with customization might take slightly longer depending on the nature of the work.</li>
              <li>Once the dispatch happens, delivery may take up to 3 to 5 business days depending on the location.</li>
              <li>The dispatch details with tracking number are sent to the registered email id.</li>
              <li>If the customer is unavailable during delivery, the courier partner will attempt delivery again. Multiple failed attempts may result in return of the package.</li>
              <li>Outfits purchased during Sale Events will be shipped as per the timelines mentioned on the sale page.</li>
              <li>We deliver for almost all PIN codes across India except certain restricted areas.</li>
              <li>Shipping is currently free for all orders over Rs. 1500 within India.</li>
            </ul>
          </div>
        )}

        {tab === "Exchange" && (
          <div>
            <h2 className="font-display text-2xl font-bold">Exchange, Return and Refund Policy</h2>
            <p className="mt-4 text-sm text-neutral-600">
              We have a 5-day window for exchanges and returns from the date of delivery. Items not eligible for exchange or return include: damaged, used or washed outfits; original packaging not provided; outfits that have been already exchanged once.
            </p>
            <p className="mt-3 text-sm text-neutral-600">
              Products should be in resalable condition with all original tags attached. Any signs of wear, alteration or use will lead to rejection of the request.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral-600">
              <li>All our products are specially made to order, hence size exchanges are subject to availability.</li>
              <li>The exchange / replacement outfit will be dispatched once the original product is received and quality checked.</li>
              <li>In case of a reverse pick up, please keep the product packed and ready for collection.</li>
              <li>If reverse pick up is not available, self-ship the product to our warehouse address and we will reimburse the shipping cost against the store credit.</li>
            </ul>
          </div>
        )}

        {tab === "Return" && (
          <div>
            <h2 className="font-display text-2xl font-bold">Return Policy</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral-600">
              <li>Orders for which packaging is damaged or tampered at the time of delivery are eligible for return.</li>
              <li>Kindly ensure the product reaches us within 10 days from the date of delivery.</li>
              <li>We will try our best to pick up from your address through our courier partner.</li>
              <li>If reverse pick up is unavailable, self-ship the product to our warehouse address and we will reimburse the shipping cost.</li>
              <li>The product will be inspected before refund is initiated.</li>
            </ul>
            <p className="mt-4 text-sm italic text-neutral-500">All returns are subject to discretion of Label Harry Clinton.</p>
          </div>
        )}

        {tab === "Refund" && (
          <div>
            <h2 className="font-display text-2xl font-bold">Refund Policy</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral-600">
              <li>Once item passes quality check, we notify you via email and initiate the refund.</li>
              <li>Refund may take 4 to 7 business days to reflect in your original payment method.</li>
            </ul>
          </div>
        )}

        {tab === "Cancellation" && (
          <div>
            <h2 className="font-display text-2xl font-bold">Cancellation Policy</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral-600">
              <li>Cancellation requests are accepted before shipping.</li>
              <li>Once shipped, we cannot cancel the order.</li>
              <li>For prepaid orders, refund is processed via bank transfer or original payment method.</li>
            </ul>
            <h5 className="mt-6 font-semibold">Cancellation by Label Harry Clinton</h5>
            <p className="mt-2 text-sm text-neutral-600">
              Label Harry Clinton reserves the right to cancel any order due to unforeseen circumstances, stock unavailability, or fraudulent activity. In such cases, a full refund will be initiated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
