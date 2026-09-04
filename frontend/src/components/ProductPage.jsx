import React from 'react';
import PropTypes from 'prop-types';
import styles from './product-page.module.css';
import { Link } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import { formatUsdCents } from '../utils/currency';
import { toCategoryRoute } from '../constants/categories';

export default function ProductPage({ product, relatedProducts = [], onBack, onAddToCart }) {
  const [quantity, setQuantity] = React.useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('reviews');
  const [showAddedNotice, setShowAddedNotice] = React.useState(false);
  const [reviewForm, setReviewForm] = React.useState({
    rating: '',
    review: '',
    name: '',
    email: '',
    remember: false,
  });
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);
  const price = formatUsdCents(product.price_cents || 0);
  const attributes = product.attributes || {};
  const categories = product.categories || [];

  React.useEffect(() => {
    if (!isLightboxOpen) {
      return undefined;
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isLightboxOpen]);

  function handleQuantityChange(event) {
    const parsed = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(parsed)) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.max(1, parsed));
  }

  function handleAddToCart(event) {
    event.preventDefault();
    onAddToCart(product, quantity);
    setShowAddedNotice(true);
  }

  function handleReviewChange(event) {
    const { name, value, type, checked } = event.target;
    setReviewSubmitted(false);
    setReviewForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleReviewSubmit(event) {
    event.preventDefault();
    setReviewSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        {categories[0] ? (
          <>
            <span>/</span>
            <Link to={toCategoryRoute(categories[0])}>{categories[0]}</Link>
          </>
        ) : null}
        <span>/</span>
        <span>{product.title}</span>
      </nav>

      {showAddedNotice ? (
        <div className={styles.addedNotice} role="alert" aria-live="polite">
          <p>“{product.title}” has been added to your cart.</p>
          <div className={styles.noticeActions}>
            <Link to="/checkout">Checkout</Link>
            <Link to="/cart">View cart</Link>
          </div>
        </div>
      ) : null}

      <button onClick={onBack} className={styles.back} type="button">
        ← Continue shopping
      </button>

      <div className={styles.productMain}>
        <div className={styles.productGallery}>
          <button
            type="button"
            className={styles.galleryTrigger}
            aria-label="Open product image"
            onClick={() => setIsLightboxOpen(true)}
          >
            ⤢
          </button>
          <button
            type="button"
            className={styles.imageButton}
            onClick={() => setIsLightboxOpen(true)}
            aria-label={`Open larger image of ${product.title}`}
          >
            <ImageWithFallback
              src={product.images?.[0]}
              alt={product.title}
              className={styles.productImage}
            />
          </button>
        </div>
        <div className={styles.productInfo}>
          <h1>{product.title}</h1>
          <p className={styles.price}>{price}</p>
          <p className={styles.description}>{product.description}</p>

          <dl className={styles.productStats}>
            {attributes.thc && (
              <div>
                <dt className={styles.detailTerm}>THC</dt>
                <dd className={styles.detailValue}>{attributes.thc}</dd>
              </div>
            )}
            {attributes.cbd && (
              <div>
                <dt className={styles.detailTerm}>CBD</dt>
                <dd className={styles.detailValue}>{attributes.cbd}</dd>
              </div>
            )}
          </dl>

          <form className={styles.buyRow} onSubmit={handleAddToCart}>
            <label htmlFor="productQuantity" className={styles.qtyLabel}>
              Quantity
            </label>
            <input
              id="productQuantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={handleQuantityChange}
              className={styles.qtyInput}
            />
            <button className={styles.buy} type="submit">
              Add to cart
            </button>
          </form>

          <p className={styles.metaLine}>
            <strong>Categories:</strong>{' '}
            {categories.length
              ? categories.map((category, index) => (
                  <React.Fragment key={category}>
                    {index > 0 ? ', ' : ''}
                    <Link to={toCategoryRoute(category)}>{category}</Link>
                  </React.Fragment>
                ))
              : 'Uncategorized'}
          </p>
          <p className={styles.metaLine}>
            <strong>SKU:</strong> {product.sku || 'N/A'}
          </p>
        </div>
      </div>

      <section className={styles.reviewsBlock} aria-label="Reviews">
        <ul className={styles.tabs} role="tablist" aria-label="Product tabs">
          <li className={activeTab === 'reviews' ? styles.tabActive : ''}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              aria-controls="tab-reviews"
              id="tab-button-reviews"
              onClick={() => setActiveTab('reviews')}
            >
              Reviews 0
            </button>
          </li>
        </ul>
        <div
          id="tab-reviews"
          role="tabpanel"
          aria-labelledby="tab-button-reviews"
          hidden={activeTab !== 'reviews'}
          className={styles.tabPanel}
        >
          <h2>Reviews</h2>
          <p>There are no reviews yet.</p>
          <p>
            Be the first to review <strong>{product.title}</strong>
          </p>
          <p className={styles.reviewMetaText}>
            Your email address will not be published. Required fields are marked *
          </p>
          {reviewSubmitted ? (
            <p className={styles.reviewSuccess} role="status" aria-live="polite">
              Thanks for your review. It will be visible after moderation.
            </p>
          ) : null}
          <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
            <fieldset>
              <legend>Your rating *</legend>
              <div className={styles.ratingRow} role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className={styles.starLabel}>
                    <input
                      type="radio"
                      name="rating"
                      value={String(star)}
                      checked={reviewForm.rating === String(star)}
                      onChange={handleReviewChange}
                      required
                    />
                    <span>{'★'.repeat(star)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor="reviewText">Your review *</label>
            <textarea
              id="reviewText"
              name="review"
              value={reviewForm.review}
              onChange={handleReviewChange}
              required
            />
            <label htmlFor="reviewName">Name *</label>
            <input
              id="reviewName"
              name="name"
              value={reviewForm.name}
              onChange={handleReviewChange}
              required
            />
            <label htmlFor="reviewEmail">Email *</label>
            <input
              id="reviewEmail"
              name="email"
              type="email"
              value={reviewForm.email}
              onChange={handleReviewChange}
              required
            />
            <label className={styles.rememberRow}>
              <input
                type="checkbox"
                name="remember"
                checked={reviewForm.remember}
                onChange={handleReviewChange}
              />
              <span>Save my name and email in this browser for next time.</span>
            </label>
            <button type="submit" className={styles.reviewSubmit}>
              Submit
            </button>
          </form>
        </div>
      </section>

      {relatedProducts.length ? (
        <section className={styles.relatedSection} aria-label="Related products">
          <h2>Related products</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((relatedProduct) => (
              <article key={relatedProduct.id} className={styles.relatedCard}>
                <Link to={`/product/${relatedProduct.id}`} className={styles.relatedImageLink}>
                  <ImageWithFallback
                    src={relatedProduct.images?.[0]}
                    alt={relatedProduct.title}
                    className={styles.relatedImage}
                  />
                </Link>
                <p className={styles.relatedCategoryLine}>
                  {(relatedProduct.categories || []).slice(0, 3).join(', ')}
                </p>
                <Link to={`/product/${relatedProduct.id}`} className={styles.relatedTitle}>
                  {relatedProduct.title}
                </Link>
                <p className={styles.relatedPrice}>
                  {formatUsdCents(relatedProduct.price_cents || 0)}
                </p>
                <button
                  type="button"
                  className={styles.relatedButton}
                  onClick={() => onAddToCart(relatedProduct, 1)}
                >
                  Add to cart
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {isLightboxOpen ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Image preview for ${product.title}`}
        >
          <button
            type="button"
            className={styles.lightboxBackdrop}
            aria-label="Close image preview backdrop"
            onClick={() => setIsLightboxOpen(false)}
          />
          <button
            type="button"
            className={styles.lightboxClose}
            aria-label="Close image preview"
            onClick={() => setIsLightboxOpen(false)}
          >
            ×
          </button>
          <ImageWithFallback
            src={product.images?.[0]}
            alt={product.title}
            className={styles.lightboxImage}
          />
        </div>
      ) : null}
    </div>
  );
}

ProductPage.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    price_cents: PropTypes.number.isRequired,
    description: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    categories: PropTypes.arrayOf(PropTypes.string),
    attributes: PropTypes.object,
    sku: PropTypes.string,
    inventory: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  relatedProducts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      price_cents: PropTypes.number.isRequired,
      images: PropTypes.arrayOf(PropTypes.string),
      categories: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  onBack: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
};
