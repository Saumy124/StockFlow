import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { Sun, Moon, Bell, AlertTriangle, ShoppingCart, Check, User, LogOut, Settings, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useCurrency } from '../../hooks/useCurrency';
import { dashboardApi } from '../../lib/api';
import './Header.css';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your business at a glance' },
  '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
  '/customers': { title: 'Customers', subtitle: 'Manage your customer base' },
  '/orders': { title: 'Orders', subtitle: 'Track and manage orders' },
};

// Close a dropdown when clicking outside of it
function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export default function Header() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();
  const base = '/' + pathname.split('/')[1];
  const info = PAGE_TITLES[base] || { title: 'Stockflow', subtitle: '' };

  const [now, setNow] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Pull dashboard data to build real notifications (low stock + recent orders)
  const { data } = useQuery('dashboard', () =>
    dashboardApi.getStats().then((r) => r.data)
  );

  const lowStock = data?.low_stock_products || [];
  const recentOrders = data?.recent_orders || [];

  const notifications = [
    ...lowStock.map((p) => ({
      id: `stock-${p.id}`,
      icon: AlertTriangle,
      variant: p.quantity === 0 ? 'danger' : 'warning',
      title: p.quantity === 0 ? `${p.name} is out of stock` : `${p.name} is low on stock`,
      meta: `${p.quantity} units remaining`,
    })),
    ...recentOrders.slice(0, 3).map((o) => ({
      id: `order-${o.id}`,
      icon: ShoppingCart,
      variant: 'info',
      title: `New order #${o.id} from ${o.customer.full_name}`,
      meta: `${o.items.length} item(s)`,
    })),
  ];
  const notifCount = notifications.length;

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">{info.title}</h1>
        <p className="header-subtitle">{info.subtitle}</p>
      </div>

      <div className="header-right">
        <div className="header-clock">
          <span className="clock-time">{timeStr}</span>
          <span className="clock-date">{dateStr}</span>
        </div>

        {/* Currency toggle */}
        <button
          className="currency-toggle"
          onClick={toggleCurrency}
          title={`Switch to ${currency === 'USD' ? 'Rupees' : 'Dollars'}`}
        >
          <span className={`currency-opt ${currency === 'USD' ? 'active' : ''}`}>$ USD</span>
          <span className={`currency-opt ${currency === 'INR' ? 'active' : ''}`}>₹ INR</span>
        </button>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className={`toggle-track ${theme}`}>
            <span className="toggle-thumb">
              {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
            </span>
          </span>
        </button>

        {/* Notifications */}
        <div className="dropdown-wrap" ref={notifRef}>
          <button
            className="header-icon-btn"
            aria-label="Notifications"
            onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
          >
            <Bell size={17} />
            {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </button>

          {notifOpen && (
            <div className="dropdown-panel notif-panel">
              <div className="dropdown-header">
                <span>Notifications</span>
                <span className="dropdown-count">{notifCount} new</span>
              </div>
              <div className="dropdown-list">
                {notifCount === 0 ? (
                  <div className="dropdown-empty">
                    <Check size={20} />
                    <span>You're all caught up!</span>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="notif-item">
                        <div className={`notif-icon notif-icon-${n.variant}`}>
                          <Icon size={15} />
                        </div>
                        <div className="notif-text">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-meta">{n.meta}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {notifCount > 0 && (
                <Link to="/products" className="dropdown-footer" onClick={() => setNotifOpen(false)}>
                  Review inventory →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="dropdown-wrap" ref={profileRef}>
          <button
            className="header-avatar"
            onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
            aria-label="Profile"
          >
            SF
          </button>

          {profileOpen && (
            <div className="dropdown-panel profile-panel">
              <div className="profile-header">
                <div className="profile-avatar-lg">SF</div>
                <div>
                  <div className="profile-name">Stockflow Admin</div>
                  <div className="profile-email">admin@stockflow.app</div>
                </div>
              </div>
              <div className="profile-divider" />
              <div className="profile-menu">
                <button className="profile-item" onClick={() => { toggleTheme(); }}>
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</span>
                </button>
                <button className="profile-item" onClick={() => { toggleCurrency(); }}>
                  <Settings size={16} />
                  <span>Currency: {currency === 'USD' ? 'US Dollar' : 'Indian Rupee'}</span>
                </button>
                <Link to="/dashboard" className="profile-item" onClick={() => setProfileOpen(false)}>
                  <User size={16} />
                  <span>Dashboard</span>
                </Link>
              </div>
              <div className="profile-divider" />
              <button className="profile-item profile-signout" onClick={() => setProfileOpen(false)}>
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
