"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import "./reference-page-typography.css";
import "./policies.css";

const TABS = ["Shipping", "Exchange", "Return", "Refund", "Cancellation"];

const SHIPPING_POINTS = [
  "All orders are dispatched within 3-5 business days of order placement. Business days exclude public holidays and Sundays.",
  "Orders with customization might take slightly longer to dispatch. The same will be informed to you via email or WhatsApp.",
  "Once the dispatch happens, delivery may take up to 3 to 5 business days depending on destination city and up to 7 business days for distant locations.",
  "The dispatch details with tracking number are sent to the registered email id.",
  "If the customer is unavailable during the time of product delivery, the order will be rescheduled for the next day and will only be attempted three times.",
  "Outfits purchased during Sale Events will be shipped on a best-effort basis in the same timelines as regular orders.",
  "We deliver for almost all PIN codes across India except for few non availability of the service in certain locations by our courier partner.",
  "We do not charge for delivery on Order value above Rs. 999. If the Order value is Rs. 999 or below Rs. 999 we charge a nominal shipping fee of Rs. 40 against shipping/delivery. However, the said amount is non-refundable in case the outfit is returned.",
  "Shipping is currently free for all orders over Rs.1500 within India.",
];

const EXCHANGE_CONDITIONS = [
  "Damaged, used or washed outfits",
  "Original packaging not provided",
  "Outfits that have been already exchanged once",
];

const EXCHANGE_POINTS = [
  "All our products are specially made to order and are one of a kind. Therefore, to ensure fairness, we will be unable to initiate an exchange for a product that has already been exchanged once.",
  "The exchange / replacement outfit will be dispatched from our warehouse once our quality control team receives the original product and approves the exchange process.",
  "In case of a reverse pick up, we would request you to keep your product packed and ready with all tags and invoices and kindly cooperate with the courier agent who will be instructed to collect the package from you. Once we receive the product from you, the exchange will be processed and dispatched within the next 5 to 7 business days.",
  "If we are unable to arrange for the reverse pick up owing to non-availability of the service in your PIN code, we would request you to self-ship the product to shipping address shared with you via a courier partner of your choice. Please email us the courier receipt, once you ship the package, for us to be able to take over the process.",
];

const RETURN_POINTS = [
  "Orders for which packaging is damaged, or seal broken should not be accepted. Any such consignment, if accepted, cannot be returned.",
  "Kindly cooperate with us in our efforts to ensure that the product is delivered back to us within 10 days of order delivery.",
  "We will try our best to pick up the product to be returned from your registered shipping address within India and will deduct the shipping fee of Rs.150 from the refund amount.",
  "In case of a reverse pick up, we would request you to kindly cooperate with the courier agent who will be instructed to collect the package from you.",
  "In case we aren’t able to arrange for the reverse pick up owing to non-availability of the service in your PIN code, we would request you to self-ship the product to the shipping address shared with you via a courier partner of your choice. Please email us the courier receipt, once you ship the package, for us to be able to take over the process. We will reimburse the shipping cost incurred by you along with the refund amount (Maximum up to Rs.150).",
  "The product received will be inspected for quality and if approved by the Quality Checking team, we will provide you the refund worth the product value.",
];

const REFUND_POINTS = [
  "Once the returned item passes the quality check, we will notify your return acceptance via E-mail and the same will be processed within 2 business days.",
  "It may take up to 4 to 7 business days for the refund to reflect in your account.",
];

const CANCELLATION_POINTS = [
  "Cancellation requests are accepted before the product is shipped.",
  "Once the outfit has been shipped from our end, we will be unable to cancel the same. Please follow the cancellation deadlines.",
  "For prepaid orders cancellation, refund is processed via bank transfer.",
];

function BulletList({ items, ordered = false }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List className={`mt-4 space-y-2 pl-5 text-neutral-600 ${ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </List>
  );
}

export default function PoliciesView() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState(() => (TABS.includes(requestedTab) ? requestedTab : "Shipping"));

  return (
    <div className="hc-reference-page policies-page">
      <div className="policies-container">
        <h1>Label Harry Clinton Policies</h1>
      </div>
      <div className="policies-tabs" role="tablist" aria-label="Policy sections">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={tab === item ? "policies-tab policies-tab--active" : "policies-tab"}
            role="tab"
            aria-selected={tab === item}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="policies-container policies-content">
        <div key={tab} className="policies-content__card">
          {tab === "Shipping" && (
            <section>
              <h2>Shipping Policy</h2>
              <BulletList items={SHIPPING_POINTS} ordered />
            </section>
          )}

          {tab === "Exchange" && (
            <section>
              <h2>Exchange, Return and Refund Policy</h2>
              <p>We have a 5-day window for exchanges and returns, and it is open from the date of order delivery. While we strive for flexibility in our policy, the following conditions will result in nonacceptance of exchange or returns:</p>
              <BulletList items={EXCHANGE_CONDITIONS} />
              <p>Products should be in resalable condition with all the original tags intact. Outfits with removed labels or tags will be considered used and are not eligible for refund/exchange.</p>
              <p>Reverse pickup is subject to availability in your area.</p>
              <p>Our team inspects all the products that we receive for exchange/return and once it passes the quality check, we will process your exchange or return request.</p>
              <p>Customized outfits are made specifically for you and therefore, not eligible for exchange or returns.</p>
              <p>Products purchased on Sale are not eligible for exchange or returns.</p>
              <h5>Exchanges</h5>
              <BulletList items={EXCHANGE_POINTS} />
            </section>
          )}

          {tab === "Return" && (
            <section>
              <h2>Returns</h2>
              <BulletList items={RETURN_POINTS} />
              <p className="italic">All returns are subject to the discretion of Label Harry Clinton, but rest assured, as we value the satisfaction of our customers above everything else!</p>
            </section>
          )}

          {tab === "Refund" && (
            <section>
              <h2>Refunds</h2>
              <BulletList items={REFUND_POINTS} />
            </section>
          )}

          {tab === "Cancellation" && (
            <section>
              <h2>Cancellation – Policy and Process</h2>
              <BulletList items={CANCELLATION_POINTS} />
              <h5>Cancellation by Label Harry Clinton</h5>
              <p>Label Harry Clinton reserve the right at its sole discretion to refuse or cancel any order. Reasons that may lead to orders cancellations are unavailable quantities, errors in product or pricing information, or problems identified by our credit and fraud avoidance department. We may contact you if all or any portion of your order is cancelled or if additional information is required to accept your order. For prepaid orders, the amount will be refunded to the account. The customer agrees not to dispute the decision made by Label Harry Clinton and accept the decision regarding the cancellation.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
