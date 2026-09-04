import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import useProductSearch from './hooks/useProductSearch';
import SiteFooter from './components/SiteFooter';
import Home from './pages/Home';
import ProductView from './pages/ProductView';
import CartView from './pages/CartView';
import CheckoutView from './pages/CheckoutView';
import OrderReceivedView from './pages/OrderReceivedView';
import PaymentStatusView from './pages/PaymentStatusView';
import NotFound from './pages/NotFound';
import { CATEGORY_NAV_GROUPS, fromCategoryPath, toCategoryRoute } from './constants/categories';
import {
  CARD_DECLINED_SUPPORT_PHONE,
  getPaymentMethodHint,
  getPaymentMethodLabel,
} from './constants/payments';
import { createOrder, getImageUrl } from './api';
import { formatUsdCents } from './utils/currency';

const BRAND_LOGO_SRC = 'https://www.greenstoneretail.shop/wp-content/uploads/2026/05/rise.png';
const CART_STORAGE_KEY = 'green-rise-cart-v1';
const LAST_ORDER_STORAGE_KEY = 'green-rise-last-order-v1';

function CategoryArchiveRoute({ onAddToCart }) {
  const location = useLocation();
  const category = fromCategoryPath(location.pathname);
  return <Home onAddToCart={onAddToCart} forcedCategory={category} />;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [cartNotice, setCartNotice] = useState(null);
  const [orderMessage, setOrderMessage] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const cartPreviewRef = useRef(null);
  const { search } = useProductSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckoutRoute = location.pathname === '/checkout' || location.pathname === '/checkout/';

  useEffect(() => {
    search();
  }, [search]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const normalized = parsed
        .map((item) => ({
          id: item.id,
          title: String(item.title || ''),
          price_cents: Number(item.price_cents) || 0,
          image: String(item.image || ''),
          quantity: Math.max(1, Number(item.quantity) || 1),
        }))
        .filter((item) => item.id && item.title);
      if (normalized.length) {
        setCartItems(normalized);
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_ORDER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      setLastOrder(parsed);
    } catch {
      window.localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!lastOrder) return;
    window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(lastOrder));
  }, [lastOrder]);

  useEffect(() => {
    if (!navOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) {
      setExpandedGroups({});
    }
  }, [navOpen]);

  useEffect(() => {
    setNavOpen(false);
    setIsCartPreviewOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isCartPreviewOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!cartPreviewRef.current?.contains(event.target)) {
        setIsCartPreviewOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsCartPreviewOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCartPreviewOpen]);

  function handleSearch(e) {
    e.preventDefault();
    search(query);
  }

  function addToCart(product, quantity = 1) {
    const quantityToAdd = Math.max(1, Number.parseInt(quantity, 10) || 1);
    setOrderMessage('');
    setCartNotice({
      productTitle: product.title,
      quantity: quantityToAdd,
    });
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
        );
      }
      return [
        ...current,
        {
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          image: product.images?.[0] || '',
          quantity: quantityToAdd,
        },
      ];
    });
    setIsCartPreviewOpen(true);
    // Mirror source behavior: show adding state then redirect to cart
    window.setTimeout(() => {
      navigate('/cart');
    }, 380);
  }

  function updateCartQuantity(productId, nextQuantity) {
    setOrderMessage('');
    setCartItems((current) => {
      if (nextQuantity <= 0) {
        return current.filter((item) => item.id !== productId);
      }
      return current.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(1, nextQuantity) } : item
      );
    });
  }

  function clearCart() {
    setOrderMessage('');
    setCartItems([]);
    setIsCartPreviewOpen(false);
  }

  async function handlePlaceOrder(customer) {
    if (!cartItems.length) {
      return { ok: false, error: 'Your cart is empty. Add items before placing an order.' };
    }
    if (isPlacingOrder) {
      return { ok: false, error: 'Your order is already being processed.' };
    }

    setIsPlacingOrder(true);
    try {
      const submittedItems = cartItems.map((item) => ({
        ...item,
      }));

      const response = await createOrder({
        customer,
        items: cartItems,
      });
      const count = response.order?.item_count ?? cartCount;
      const totalCents = response.order?.total_cents ?? cartTotal;
      const formatted = formatUsdCents(totalCents);
      const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
      const orderNumber = response.order?.orderNumber || 'GR';
      const createdAt = response.order?.createdAt || new Date().toISOString();
      const orderSnapshot = {
        orderNumber,
        createdAt,
        total_cents: totalCents,
        item_count: count,
        paymentMethod: getPaymentMethodLabel(customer.paymentMethod),
        paymentHint: getPaymentMethodHint(customer.paymentMethod),
        customer: {
          ...customer,
        },
        items: submittedItems,
      };

      setLastOrder(orderSnapshot);
      setOrderMessage(
        `Thanks ${name}! Order #${orderNumber} placed for ${count} item${count === 1 ? '' : 's'} - total ${formatted}.`
      );

      if (customer.paymentMethod === 'card_payment') {
        navigate('/payment-status', {
          state: {
            phone: CARD_DECLINED_SUPPORT_PHONE,
            orderNumber,
          },
        });
        return { ok: true };
      }

      setCartItems([]);
      setIsCartPreviewOpen(false);
      navigate(`/checkout/order-received/${encodeURIComponent(orderNumber)}`, {
        state: {
          order: orderSnapshot,
        },
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error?.response?.data?.error || 'Unable to place your order right now.',
      };
    } finally {
      setIsPlacingOrder(false);
    }
  }

  function handleCancelCheckout() {
    navigate('/cart');
  }

  function toggleGroup(label) {
    setExpandedGroups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`app${isCheckoutRoute ? ' checkoutRoute' : ''}`}>
      <header className="header">
        <div className="cartAnnouncement" aria-live="polite">
          <button
            type="button"
            className="cartTitleLink"
            onClick={() => setIsCartPreviewOpen((current) => !current)}
          >
            Your Cart
          </button>
          <p>
            {cartCount
              ? `${cartCount} product${cartCount === 1 ? '' : 's'} in the cart.`
              : 'No products in the cart.'}
          </p>
        </div>

        <div className="topbar">
          <span className="topbarLabel">CALL/TEXT</span>
          <a href="tel:+16464813387" className="topbarLink">
            +1 (646) 481-3387
          </a>
          <div className="topbarLinks">
            <button
              type="button"
              className="ghostButton topbarLink"
              onClick={() => navigate('/checkout')}
            >
              Checkout
            </button>
            <a
              href="https://wa.me/16464813387?text=Hi%2C%20I%20need%20help%20with%20my%20order"
              className="topbarLink"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="brandRow">
          <button
            type="button"
            className="menuButton"
            aria-label={navOpen ? 'Close main navigation' : 'Open main navigation'}
            aria-expanded={navOpen}
            aria-controls="site-navigation"
            onClick={() => setNavOpen((current) => !current)}
          >
            <span className="srOnly">{navOpen ? 'Close' : 'Menu'}</span>
            <span aria-hidden="true" className={`menuIcon${navOpen ? ' open' : ''}`}>
              <span className="menuLine" />
              <span className="menuLine" />
              <span className="menuLine" />
            </span>
            <span className="menuButtonLabel" aria-hidden="true">
              {navOpen ? 'CLOSE' : 'MENU'}
            </span>
          </button>

          <div className="brandBlock">
            <Link to="/" className="brandHeadingLink" aria-label="Greenline Wellness">
              <img
                src={getImageUrl(BRAND_LOGO_SRC)}
                alt="Greenline Wellness"
                className="brandLogo"
              />
              <h1>Greenline Wellness</h1>
            </Link>
            <p className="subtitle">
              Fast same-day delivery across the United States with premium flower, vapes, edibles,
              prerolls, and concentrates.
            </p>
          </div>

          <div className="cartStatus">
            <button
              type="button"
              className="accountShortcut"
              aria-label="My Account"
              onClick={() => navigate('/cart')}
            >
              <span className="shortcutIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <circle cx="12" cy="8" r="4.1" />
                  <path d="M4.4 20a7.6 7.6 0 0 1 15.2 0" />
                </svg>
              </span>
              <span className="shortcutLabel">My Account</span>
            </button>
            <Link to="/checkout" className="checkoutShortcut" aria-label="Checkout">
              <span className="shortcutIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12h6" />
                  <path d="M12 9l3 3-3 3" />
                </svg>
              </span>
              <span className="shortcutLabel">Checkout</span>
            </Link>
            <Link to="/cart" className="topbarLink">
              Your Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </Link>
            <div className="cartPreviewWrap" ref={cartPreviewRef}>
              <button
                type="button"
                className="cartCount cartPreviewToggle"
                aria-label={`Cart item count: ${cartCount}`}
                aria-expanded={isCartPreviewOpen}
                aria-controls="header-cart-preview"
                onClick={() => setIsCartPreviewOpen((current) => !current)}
              >
                <span className="cartIcon" aria-hidden="true">
                  <svg viewBox="0 0 44 24" focusable="false" aria-hidden="true">
                    <path d="M4.2 4.1h3l1.9 9.7h19.2l2.3-7.5H10.4" />
                    <circle cx="14.7" cy="19.1" r="1.9" />
                    <circle cx="25.7" cy="19.1" r="1.9" />
                  </svg>
                </span>
                {cartCount > 0 ? (
                  <span className="cartBadge" aria-hidden="true">
                    {cartCount}
                  </span>
                ) : null}
              </button>

              <aside
                id="header-cart-preview"
                className={`cartPreviewPanel${isCartPreviewOpen ? ' open' : ''}`}
                aria-hidden={!isCartPreviewOpen}
                aria-label="Cart preview"
              >
                <h3>Your Cart</h3>
                {cartItems.length ? (
                  <>
                    <ul className="cartPreviewItems">
                      {cartItems.slice(0, 4).map((item) => (
                        <li key={item.id}>
                          <span>{item.title}</span>
                          <span>
                            {item.quantity} x {formatUsdCents(item.price_cents || 0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="cartPreviewTotal">Total: {formatUsdCents(cartTotal)}</p>
                    <div className="cartPreviewActions">
                      <Link to="/cart" className="cartPreviewLink">
                        View cart
                      </Link>
                      <Link to="/checkout" className="cartPreviewCheckoutLink">
                        Checkout
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="cartPreviewEmpty">No products in the cart.</p>
                )}
              </aside>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="search-form" role="search">
          <label htmlFor="site-search" className="searchLabel">
            Search for:
          </label>
          <input
            id="site-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
          />
          <button type="submit">Search</button>
        </form>

        <nav
          id="site-navigation"
          className={`primaryNav${navOpen ? ' open' : ''}`}
          aria-label="Primary Navigation"
        >
          <button
            type="button"
            className="drawerCloseButton"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          >
            ×
          </button>
          <ul className="primaryNavInner">
            {CATEGORY_NAV_GROUPS.map((group) => (
              <li
                key={group.label}
                className={`primaryNavItem${expandedGroups[group.label] ? ' open' : ''}`}
              >
                <Link
                  to={toCategoryRoute(group.label)}
                  className="primaryNavLink"
                  onClick={() => setNavOpen(false)}
                >
                  <span className="primaryNavLabel">{group.label}</span>
                </Link>
                {group.children?.length ? (
                  <>
                    <button
                      type="button"
                      className="primaryNavChevronButton"
                      aria-expanded={expandedGroups[group.label] ? 'true' : 'false'}
                      aria-controls={`submenu-${group.label.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => toggleGroup(group.label)}
                    >
                      <span className="primaryNavChevron" aria-hidden="true">
                        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                          <path d="M3.2 5.8L8 10.6l4.8-4.8" />
                        </svg>
                      </span>
                      <span className="srOnly">Toggle {group.label} submenu</span>
                    </button>
                    <ul
                      id={`submenu-${group.label.replace(/\s+/g, '-').toLowerCase()}`}
                      className="primarySubNav"
                      aria-label={`${group.label} subcategories`}
                    >
                      {group.children.map((child) => (
                        <li key={child}>
                          <Link
                            to={toCategoryRoute(child)}
                            className="primarySubNavLink"
                            onClick={() => setNavOpen(false)}
                          >
                            {child}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="content" role="main">
        {cartNotice &&
        !location.pathname.startsWith('/cart') &&
        !location.pathname.startsWith('/checkout') ? (
          <section className="cartActionNotice" role="alert" aria-live="polite">
            <p>
              “{cartNotice.productTitle}” has been added to your cart.
              {cartNotice.quantity > 1 ? ` Quantity: ${cartNotice.quantity}.` : ''}
            </p>
            <div className="cartActionNoticeLinks">
              <Link to="/checkout">Checkout</Link>
              <Link to="/cart">View cart</Link>
              <button type="button" onClick={() => setCartNotice(null)}>
                Dismiss
              </button>
            </div>
          </section>
        ) : null}
        <Routes>
          <Route path="/" element={<Home onAddToCart={addToCart} />} />
          <Route path="/shop" element={<Home onAddToCart={addToCart} />} />
          <Route path="/shop/" element={<Home onAddToCart={addToCart} />} />
          <Route
            path="/product-category/:slug/*"
            element={<CategoryArchiveRoute onAddToCart={addToCart} />}
          />
          <Route path="/product/:id" element={<ProductView onAddToCart={addToCart} />} />
          <Route
            path="/cart"
            element={
              <CartView
                cartItems={cartItems}
                total={cartTotal}
                onUpdateQuantity={updateCartQuantity}
                onClear={clearCart}
                onCheckout={() => navigate('/checkout')}
                message={orderMessage}
                isPlacingOrder={isPlacingOrder}
              />
            }
          />
          <Route
            path="/cart/"
            element={
              <CartView
                cartItems={cartItems}
                total={cartTotal}
                onUpdateQuantity={updateCartQuantity}
                onClear={clearCart}
                onCheckout={() => navigate('/checkout')}
                message={orderMessage}
                isPlacingOrder={isPlacingOrder}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutView
                cartItems={cartItems}
                total={cartTotal}
                onPlaceOrder={handlePlaceOrder}
                onCancel={handleCancelCheckout}
                isPlacingOrder={isPlacingOrder}
              />
            }
          />
          <Route
            path="/checkout/"
            element={
              <CheckoutView
                cartItems={cartItems}
                total={cartTotal}
                onPlaceOrder={handlePlaceOrder}
                onCancel={handleCancelCheckout}
                isPlacingOrder={isPlacingOrder}
              />
            }
          />
          <Route
            path="/checkout/order-received/:orderNumber"
            element={<OrderReceivedView lastOrder={lastOrder} />}
          />
          <Route path="/payment-status" element={<PaymentStatusView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <SiteFooter />
    </div>
  );
}
