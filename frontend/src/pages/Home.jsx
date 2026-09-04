import React, { useMemo } from 'react';
import useProductSearch from '../hooks/useProductSearch';
import ProductList from '../components/ProductList';
import StatusMessage from '../components/StatusMessage';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { getCanonicalCategory } from '../constants/categories';
import ImageWithFallback from '../components/ImageWithFallback';

// hero image source removed (unused) — layout uses CSS background/graphic
const PRODUCTS_PER_PAGE = 12;
const HOME_FEATURED_COUNT = 16;
const FOOTER_PROMO_IMAGES = [
  {
    src: '/images/footer-promo-1.png',
    alt: 'Cannabis promo collection',
  },
  {
    src: '/images/footer-promo-2.webp',
    alt: 'Premium flower close-up',
  },
  {
    src: '/images/footer-promo-3.png',
    alt: 'Delivery service promo',
  },
];

export default function Home({ onAddToCart, forcedCategory = '' }) {
  const { products, loading, error, search } = useProductSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = forcedCategory || searchParams.get('category') || '';
  const selectedPage = Math.max(1, Number(searchParams.get('page') || '1'));
  const selectedSort = searchParams.get('sort') || 'default';
  const [showFilters, setShowFilters] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    search();
  }, [search]);

  function handleSelect(product) {
    navigate(`/product/${product.id}`, { state: { product } });
  }

  function handlePageChange(nextPage) {
    if (!selectedCategory) {
      return;
    }

    const nextParams = {};

    if (forcedCategory) {
      nextParams.page = String(nextPage);
      if (selectedSort !== 'default') {
        nextParams.sort = selectedSort;
      }
      setSearchParams(nextParams);
      return;
    }

    nextParams.category = selectedCategory;
    nextParams.page = String(nextPage);
    if (selectedSort !== 'default') {
      nextParams.sort = selectedSort;
    }
    setSearchParams(nextParams);
  }

  function handleSortChange(event) {
    const nextSort = event.target.value;
    const nextParams = {};

    if (!forcedCategory && selectedCategory) {
      nextParams.category = selectedCategory;
    }

    if (nextSort !== 'default') {
      nextParams.sort = nextSort;
    }

    setSearchParams(nextParams);
  }

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;

    const canonicalCategory = getCanonicalCategory(selectedCategory).toLowerCase();
    const selectedCategoryLower = selectedCategory.toLowerCase();

    return products.filter((p) => {
      const categoriesLower = (p.categories || []).map((category) =>
        String(category).toLowerCase()
      );
      return (
        categoriesLower.includes(canonicalCategory) ||
        categoriesLower.includes(selectedCategoryLower)
      );
    });
  }, [products, selectedCategory]);

  const sortedProducts = useMemo(() => {
    if (selectedSort === 'default') {
      return filteredProducts;
    }

    const items = [...filteredProducts];

    if (selectedSort === 'popularity') {
      return items.sort((a, b) => (Number(b.inventory) || 0) - (Number(a.inventory) || 0));
    }

    if (selectedSort === 'rating') {
      return items.sort(
        (a, b) =>
          (Number(b.attributes?.average_rating) || 0) - (Number(a.attributes?.average_rating) || 0)
      );
    }

    if (selectedSort === 'latest') {
      return items.sort(
        (a, b) =>
          (Number(b.metadata?.source_id || b.id) || 0) -
          (Number(a.metadata?.source_id || a.id) || 0)
      );
    }

    if (selectedSort === 'price_asc') {
      return items.sort((a, b) => (Number(a.price_cents) || 0) - (Number(b.price_cents) || 0));
    }

    if (selectedSort === 'price_desc') {
      return items.sort((a, b) => (Number(b.price_cents) || 0) - (Number(a.price_cents) || 0));
    }

    return items;
  }, [filteredProducts, selectedSort]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(selectedPage, totalPages);
  const pagedProducts = selectedCategory
    ? sortedProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)
    : sortedProducts.slice(0, HOME_FEATURED_COUNT);
  const isArchiveView = Boolean(selectedCategory);
  const archiveStart =
    isArchiveView && pagedProducts.length ? (currentPage - 1) * PRODUCTS_PER_PAGE + 1 : 0;
  const archiveEnd =
    isArchiveView && pagedProducts.length ? archiveStart + pagedProducts.length - 1 : 0;
  const archiveSummaryText =
    isArchiveView && sortedProducts.length > 0
      ? `Showing ${archiveStart}-${archiveEnd} of ${sortedProducts.length} results`
      : 'Showing 0 results';
  const paginationNumbers =
    isArchiveView && totalPages > 1
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : [];

  return (
    <div>
      {!isArchiveView && !String(location.pathname || '').startsWith('/shop') ? (
        <section className="hero">
          <div className="heroContent">
            <div className="eyebrow">Same Day Delivery</div>
            <div className="heroBadges" aria-label="Store highlights">
              <span className="heroBadge">Lab-tested products</span>
              <span className="heroBadge">Discreet packaging</span>
              <span className="heroBadge">Secure checkout</span>
            </div>
            <h2 className="homeHeroHeading">
              Fast, reliable cannabis delivery — premium flower, vapes, and edibles
            </h2>
            <p className="heroSub">
              Place your order now and get delivery in under an hour in most areas. Discreet
              packaging and lab-tested products.
            </p>
            <div className="heroActions">
              <button type="button" onClick={() => navigate('/shop')} className="heroCta">
                Shop Now
              </button>
              <button
                type="button"
                onClick={() => navigate('/product-category/flowers')}
                className="heroGhost"
              >
                Browse Flowers
              </button>
            </div>
            <a href="tel:+12513379407" className="heroCall">
              Call/Text: +1 (251) 337-9407
            </a>
          </div>

          <div className="heroImageWrap">
            <div className="heroGraphic" aria-hidden="true">
              <div className="heroGraphicCard">
                <span className="heroGraphicBadge">Now delivering</span>
                <h3>Premium flower & concentrates</h3>
                <p>Fast dispatch, local support, and dependable service every time.</p>
                <ul>
                  <li>Same-day availability</li>
                  <li>Trusted product quality</li>
                  <li>Easy online ordering</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mainContent">
        <div className="contentGrid homeContentGrid">
          <div className="productPane">
            <StatusMessage loading={loading} error={error}>
              <section className="productSection">
                <div className="sectionHeader">
                  <div>
                    <h2 className={isArchiveView ? 'archiveHeading' : ''}>
                      {isArchiveView ? selectedCategory : 'Best Selling products'}
                    </h2>
                  </div>
                </div>
                {isArchiveView ? (
                  <div className="archiveToolbar">
                    <button
                      type="button"
                      className="archiveFilterToggle"
                      onClick={() => setShowFilters((current) => !current)}
                      aria-expanded={showFilters}
                      aria-controls="archive-filters"
                    >
                      Show Filters
                    </button>
                    <div className="archiveSortBar">
                      <select
                        aria-label="Shop order"
                        className="archiveSortSelect"
                        value={selectedSort}
                        onChange={handleSortChange}
                      >
                        <option value="default">Default sorting</option>
                        <option value="popularity">Sort by popularity</option>
                        <option value="rating">Sort by average rating</option>
                        <option value="latest">Sort by latest</option>
                        <option value="price_asc">Sort by price: low to high</option>
                        <option value="price_desc">Sort by price: high to low</option>
                      </select>
                      <p className="archiveMeta">{archiveSummaryText}</p>
                    </div>
                  </div>
                ) : null}

                {isArchiveView && showFilters ? (
                  <div
                    id="archive-filters"
                    className="archiveFiltersPanel"
                    role="region"
                    aria-label="Filters"
                  >
                    <p>
                      Filters are currently limited to categories and sort order in this storefront.
                    </p>
                  </div>
                ) : null}
                <ProductList
                  products={pagedProducts}
                  onSelect={handleSelect}
                  onAddToCart={onAddToCart}
                />
                {isArchiveView && totalPages > 1 ? (
                  <div className="archivePagination" role="navigation" aria-label="Pagination">
                    <button
                      type="button"
                      className="archivePageButton archivePageButtonNav"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                    >
                      ←
                    </button>
                    {paginationNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`archivePageButton${pageNumber === currentPage ? ' active' : ''}`}
                        onClick={() => handlePageChange(pageNumber)}
                        aria-current={pageNumber === currentPage ? 'page' : undefined}
                        disabled={pageNumber === currentPage}
                        aria-label={`Go to page ${pageNumber}`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="archivePageButton archivePageButtonNav"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      aria-label="Next page"
                    >
                      →
                    </button>
                  </div>
                ) : null}
              </section>
            </StatusMessage>

            {!isArchiveView ? (
              <>
                <section className="featureSection">
                  <ImageWithFallback
                    src={FOOTER_PROMO_IMAGES[0].src}
                    alt={FOOTER_PROMO_IMAGES[0].alt}
                    className="featureImage"
                  />
                  <div className="featureCopy">
                    <h2>Finest Cannabis Company</h2>
                    <p>
                      In United States at Tropical Cannabis Delivery, we carry cannabis. Not just
                      any cannabis, the absolute highest quality lab-tested, pesticide-free
                      medicinal and recreational products that we have to offer.
                    </p>
                    <p>
                      From Flower to Vapes, Edibles, and Concentrates, you name it, we got it, and
                      we make it all available to you with a click of a button.
                    </p>
                    <h2>Same Day Delivery Service</h2>
                    <p>
                      We deliver premium marijuana products to your home or office by one of our
                      professional bud tenders. Our bud tenders are well-trained and very friendly.
                    </p>
                    <p>
                      Same day delivery in most areas. Call for information on deliveries to your
                      area, or visit our delivery info page.
                    </p>
                  </div>
                </section>

                <section className="middlePromoSection" aria-label="Featured flower image">
                  <ImageWithFallback
                    src={FOOTER_PROMO_IMAGES[1].src}
                    alt={FOOTER_PROMO_IMAGES[1].alt}
                    className="middlePromoImage"
                  />
                  <div className="middlePromoSpacer" aria-hidden="true" />
                </section>

                <section className="supportReplica" aria-label="Service support and license">
                  <h3>Same Day Delivery Service</h3>
                  <p>
                    We believe that everyone deserves access to a cannabis delivery experience that
                    is convenient, informative, reliable, and safe. Our dedicated customer service
                    specialists are available 7 days a week to guide you to the perfect product,
                    track your delivery and offer live support every step of the way.
                  </p>
                  <h3>License</h3>
                  <p className="licenseNumber">License # C10-0000540-LIC</p>
                </section>

                <section className="missionSection">
                  <ImageWithFallback
                    src={FOOTER_PROMO_IMAGES[2].src}
                    alt={FOOTER_PROMO_IMAGES[2].alt}
                    className="missionImage"
                  />
                  <div className="missionCopy">
                    <h2>Our Mission</h2>
                    <p>
                      We’re a local marijuana shop bringing you the highest-grade cannabis in the
                      state. Our namesake, Dreamer, is dedicated to the big dreamers and go getters
                      who have their heads in the clouds but their feet on the ground. We’ve curated
                      a diverse selection of cannabis products that can be tailored to your needs,
                      whether you want to energize or rejuvenate, decompress or shift into
                      overdrive. Our experienced staff and welcoming storefront make your experience
                      fun and enjoyable, and you can pre-order online for easy pickup. We’ll see you
                      soon. In the meantime, keep dreaming.
                    </p>
                  </div>
                </section>

                <section className="trustStrip" aria-label="Store policies">
                  <article className="trustCard">
                    <span className="trustIcon" aria-hidden="true">
                      ⌖
                    </span>
                    <div className="trustTextWrap">
                      <strong>same day Delivery</strong>
                      <span>On all orders</span>
                    </div>
                  </article>
                  <article className="trustCard">
                    <span className="trustIcon" aria-hidden="true">
                      ⇄
                    </span>
                    <div className="trustTextWrap">
                      <strong>Easy 30 days returns</strong>
                      <span>30 days money back guarantee</span>
                    </div>
                  </article>
                  <article className="trustCard">
                    <span className="trustIcon" aria-hidden="true">
                      ◍
                    </span>
                    <div className="trustTextWrap">
                      <strong>International Warranty</strong>
                      <span>Offered in the country of usage</span>
                    </div>
                  </article>
                  <article className="trustCard">
                    <span className="trustIcon" aria-hidden="true">
                      ⌂
                    </span>
                    <div className="trustTextWrap">
                      <strong>100% Secure Checkout</strong>
                      <span>PayPal / MasterCard / Visa</span>
                    </div>
                  </article>
                </section>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
