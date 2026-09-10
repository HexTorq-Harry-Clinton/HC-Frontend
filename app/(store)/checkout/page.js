"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { apiFetch, unwrap, currentUser, currentUserId } from "@/lib/api";

const initialAddress = {
  recipient_name: "",
  phone_number: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
};

// Checkout: same structure/texts/flow as the previous UI —
// Shipping Address card, Order Summary with tax/shipping math,
// saved addresses, payment methods, success screen.
export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();

  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);

  // Auth gate + user hydration must run client-side after mount
  // (localStorage is invisible to the server). Mount-sync reads intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const token = localStorage.getItem("hc_token");
    const session = localStorage.getItem("hc_session");
    if (!token && !session) {
      router.push("/login");
      return;
    }
    let parsedUser = currentUser();
    const uid = currentUserId();
    if (parsedUser) setUser(parsedUser);
    if (!uid) return;
    setUserId(uid);
    let live = true;
    apiFetch("/Addresses")
      .then(unwrap)
      .then((all) => {
        if (!live) return;
        const list = (Array.isArray(all) ? all : []).filter((a) => a.user_id === uid);
        setSavedAddresses(list);
        const def = list.find((a) => a.isdefault === 1 || a.isdefault === true) || list[0];
        if (def) {
          setSelectedAddressId(def.address_id);
          setAddress({
            recipient_name: def.full_name || "",
            phone_number: def.mobile_number || "",
            address_line1: def.house_street || "",
            address_line2: def.landmark || "",
            city: def.city || "",
            state: def.state || "",
            postal_code: def.pincode || "",
            country: "India",
          });
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (cart?.ready && cart.items.length === 0 && !success) {
      router.push("/cart");
    }
  }, [cart, success, router]);

  if (!cart?.ready) return <p className="mx-auto max-w-4xl px-4 py-14 text-center">Loading checkout...</p>;

  const discountedTotal = cart.total;
  const discountAmount = cart.discount;
  const shippingPrice = discountedTotal >= 5000 ? 0 : 150;
  const taxAmount = Math.round(discountedTotal * 0.05 * 100) / 100;
  const totalPrice = discountedTotal + taxAmount + shippingPrice;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPlacing(true);

    try {
      let statuses = [];
      try {
        statuses = unwrap(await apiFetch("/Order-Status-Master"));
        if (!Array.isArray(statuses)) statuses = [];
      } catch {
        statuses = [];
      }
      let pendingStatus = statuses.find(
        (s) => s.status_code?.toLowerCase() === "pending" || s.status_name?.toLowerCase() === "pending"
      );
      if (!pendingStatus) {
        const created = unwrap(
          await apiFetch("/Order-Status-Master", {
            method: "POST",
            body: {
              status_name: "Pending",
              status_code: "PENDING",
              status_description: "Order placed, pending processing",
              isactive: 1,
              rcu: "website",
            },
          })
        );
        pendingStatus = created;
      }
      const orderStatusId = pendingStatus?.order_status_id;
      if (!orderStatusId) {
        throw new Error("Could not resolve order status. Please try again.");
      }

      const orderNumber = `ORD-${Date.now()}`;
      const orderRes = await apiFetch("/Orders", {
        method: "POST",
        body: {
          user_id: userId,
          order_number: orderNumber,
          order_status_id: orderStatusId,
          order_date: new Date().toISOString(),
          subtotal_price: discountedTotal,
          discount_amount: discountAmount || 0,
          tax_amount: taxAmount,
          shipping_price: shippingPrice,
          total_price: totalPrice,
          payment_status: "pending",
          rcu: "website",
        },
      });
      const order = orderRes?.data || orderRes;
      const orderId = order?.order_id;
      if (!orderId) {
        throw new Error("Order could not be created.");
      }

      await Promise.all(
        cart.items.map((item) =>
          apiFetch("/Order-Items", {
            method: "POST",
            body: {
              order_id: orderId,
              product_id: item.product_id || item.id,
              product_variant_id: item.product_variant_id || null,
              product_name: item.name,
              sku: item.sku || item.product_variant_id || "SKU",
              qty: item.qty || 1,
              unit_price: item.price || 0,
              rcu: "website",
            },
          })
        )
      );

      await apiFetch("/Order-Addresses", {
        method: "POST",
        body: {
          order_id: orderId,
          address_type: "shipping",
          full_name: address.recipient_name,
          mobile_number: address.phone_number,
          house_street: address.address_line1,
          city: address.city,
          state: address.state,
          pincode: address.postal_code,
          landmark: address.address_line2,
          country: address.country,
          rcu: "website",
        },
      }).catch(() => null);

      await apiFetch("/Order-Status-History", {
        method: "POST",
        body: {
          order_id: orderId,
          order_status_id: orderStatusId,
          orderstatus: "Pending",
          notes: "Order placed via website",
          rcu: "website",
        },
      }).catch(() => null);

      if (userId && saveAddress && !selectedAddressId) {
        try {
          await apiFetch("/Addresses", {
            method: "POST",
            body: {
              user_id: userId,
              full_name: address.recipient_name,
              mobile_number: address.phone_number,
              emailid: "",
              house_street: address.address_line1,
              city: address.city,
              state: address.state,
              pincode: address.postal_code,
              landmark: address.address_line2,
              country: address.country,
              isdefault: savedAddresses.length === 0 ? 1 : 0,
              isactive: 1,
              rcu: "website",
            },
          });
        } catch (addressErr) {
          console.error("Failed to save address to user account", addressErr);
        }
      }

      const finalizeOrder = async (paymentStatus) => {
        if (paymentStatus === "success") {
          await apiFetch("/Orders", {
            method: "PUT",
            body: { order_id: orderId, payment_status: "success", rcu: "website" },
          }).catch(() => null);
        }
        cart.clearCart();
        setSuccess(true);
      };

      if (paymentMethod === "cod") {
        await apiFetch("/Payments", {
          method: "POST",
          body: {
            order_id: orderId,
            user_id: userId,
            amount: totalPrice,
            payment_method: paymentMethod,
            payment_status: "pending",
            payment_date: new Date().toISOString(),
            rcu: "website",
          },
        }).catch(() => null);
        await finalizeOrder("pending");
        return;
      }

      // Online payment via Razorpay (backend endpoints pending — same as before).
      setError("Payment provider is not ready. Please try Cash on Delivery or contact support.");
      setPlacing(false);
      return;
    } catch (err) {
      setError(err.message || "Checkout failed. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <div className="bg-green-50 p-6">
          <h4 className="font-display text-2xl font-bold">Order placed successfully!</h4>
          <p className="mt-2 text-sm">Thank you for your purchase. You will be redirected shortly.</p>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border border-neutral-300 px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="mb-4 font-display text-4xl font-bold">Checkout</h2>
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="border border-neutral-200 bg-white p-5 shadow-sm">
          <h5 className="mb-3 font-semibold">Shipping Address</h5>
          {error && <div className="mb-3 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {savedAddresses.length > 0 && (
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Select a saved address</label>
              <select
                value={selectedAddressId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedAddressId(id);
                  const addr = savedAddresses.find((a) => a.address_id === id);
                  if (addr) {
                    setAddress({
                      recipient_name: addr.full_name || "",
                      phone_number: addr.mobile_number || "",
                      address_line1: addr.house_street || "",
                      address_line2: addr.landmark || "",
                      city: addr.city || "",
                      state: addr.state || "",
                      postal_code: addr.pincode || "",
                      country: "India",
                    });
                  }
                }}
                className={`${inputCls} mb-2`}
              >
                <option value="">Use a saved address</option>
                {savedAddresses.map((addr) => (
                  <option value={addr.address_id} key={addr.address_id}>
                    {addr.full_name} — {addr.house_street}, {addr.city}
                  </option>
                ))}
              </select>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <input type="text" name="recipient_name" value={address.recipient_name} onChange={handleChange} required className={inputCls} />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Phone Number</label>
              <input type="tel" name="phone_number" value={address.phone_number} onChange={handleChange} required className={inputCls} />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Address Line 1</label>
              <input type="text" name="address_line1" value={address.address_line1} onChange={handleChange} required className={inputCls} />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Address Line 2</label>
              <input type="text" name="address_line2" value={address.address_line2} onChange={handleChange} className={inputCls} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">City</label>
                <input type="text" name="city" value={address.city} onChange={handleChange} required className={inputCls} />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">State</label>
                <input type="text" name="state" value={address.state} onChange={handleChange} required className={inputCls} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">Postal Code</label>
                <input type="text" name="postal_code" value={address.postal_code} onChange={handleChange} required className={inputCls} />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">Country</label>
                <input type="text" name="country" value={address.country} onChange={handleChange} required className={inputCls} />
              </div>
            </div>
            {userId && (
              <div className="mb-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  id="saveAddress"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                />
                <label htmlFor="saveAddress">Save this address to my account</label>
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                <option value="card">Credit / Debit Card</option>
                <option value="upi">UPI</option>
                <option value="cod">Cash on Delivery</option>
                <option value="netbanking">Net Banking</option>
              </select>
            </div>
            <button type="submit" disabled={placing} className="btn-primary w-full disabled:opacity-50">
              {placing ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        </div>
        <div className="h-fit border border-neutral-200 bg-white p-5 shadow-sm">
          <h5 className="mb-3 font-semibold">Order Summary</h5>
          {cart.items.map((item) => (
            <div className="mb-2 flex justify-between text-sm" key={item.id}>
              <span>
                {item.name} x {item.qty || 1}
              </span>
              <span>₹{((item.price || 0) * (item.qty || 1)).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <hr className="my-3" />
          <div className="mb-2 flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
          </div>
          {cart.coupon && (
            <div className="mb-2 flex justify-between text-sm text-green-700">
              <span>Discount ({cart.coupon.coupon_code})</span>
              <span>-₹{cart.discount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="mb-2 flex justify-between text-sm">
            <span>Tax (5%)</span>
            <span>₹{taxAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Shipping</span>
            <span>{discountedTotal >= 5000 ? "Free" : "₹150"}</span>
          </div>
          <hr className="my-3" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₹{totalPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
