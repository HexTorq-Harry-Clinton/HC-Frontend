"use client";

import { useRouter } from "next/navigation";

// Profile dropdown: exact labels/paths/flow of the previous UI.
function isAdminUser(user) {
  const role = (user?.role || user?.role_code || user?.hc_role || "").toLowerCase();
  return role.includes("admin");
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("hc_user") || "null");
  } catch {
    return null;
  }
}

export default function ProfileDropdown({ onClose }) {
  const router = useRouter();
  const user = typeof window !== "undefined" ? readUser() : null;

  const go = (path) => {
    onClose?.();
    router.push(path);
  };

  const logout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    ["hc_user", "hc_token", "hc_session", "hc_role", "hc_cart", "hc_wishlist", "hc_coupon"].forEach((k) =>
      localStorage.removeItem(k)
    );
    onClose?.();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="profile-dropdown">
        <div className="dropdown-item" onClick={() => go("/login")}>
          <i className="bi bi-box-arrow-in-right"></i> Login
        </div>
        <div className="dropdown-item" onClick={() => go("/register")}>
          <i className="bi bi-person-plus"></i> Register
        </div>
        <DropdownStyle />
      </div>
    );
  }

  return (
    <div className="profile-dropdown">
      <div className="dropdown-header">
        <strong>{user.full_name || user.fullname || user.name || user.email_id || user.email || "User"}</strong>
        {user.role && <p className="dropdown-role">{user.role}</p>}
      </div>
      <div className="dropdown-divider"></div>
      <div className="dropdown-item" onClick={() => go("/profile")}>
        <i className="bi bi-person"></i> My Profile
      </div>
      <div className="dropdown-item" onClick={() => go("/addresses")}>
        <i className="bi bi-geo-alt"></i> My Addresses
      </div>
      <div className="dropdown-item" onClick={() => go("/book-appointment")}>
        <i className="bi bi-calendar-plus"></i> Book Appointment
      </div>
      <div className="dropdown-item" onClick={() => go("/appointments")}>
        <i className="bi bi-calendar-check"></i> My Appointments
      </div>
      <div className="dropdown-item" onClick={() => go("/orders")}>
        <i className="bi bi-bag"></i> My Orders
      </div>
      {isAdminUser(user) && (
        <div className="dropdown-item" onClick={() => go("/admin")}>
          <i className="bi bi-speedometer2"></i> Admin Dashboard
        </div>
      )}
      <div className="dropdown-divider"></div>
      <div className="dropdown-item logout" onClick={logout}>
        <i className="bi bi-box-arrow-right"></i> Logout
      </div>
      <DropdownStyle />
    </div>
  );
}

function DropdownStyle() {
  return (
    <style jsx>{`
      .profile-dropdown { position: absolute; right: 0; top: calc(100% + 10px); min-width: 220px; background: #fff; border: 1px solid #e5e5e5; box-shadow: 0 12px 32px rgba(0,0,0,0.12); z-index: 95; padding: 6px; }
      .dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; font-size: 0.88rem; cursor: pointer; }
      .dropdown-item:hover { background: #f6f4ee; }
      .dropdown-item.logout { color: #b3261e; }
      .dropdown-header { padding: 10px 12px; }
      .dropdown-role { font-size: 0.75rem; color: #777; margin-top: 2px; }
      .dropdown-divider { height: 1px; background: #eee; margin: 4px 0; }
    `}</style>
  );
}
