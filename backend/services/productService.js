const products = require('../data/products.json')

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function listProducts(search = '') {
  const query = normalizeText(search)
  if (!query) {
    return products
  }

  return products.filter(product => {
    const text = [product.title, product.description, ...(product.tags || []), ...(product.categories || [])]
      .map(normalizeText)
      .join(' ')

    return text.includes(query)
  })
}

function getProductById(id) {
  return products.find(product => String(product.id) === String(id))
}

module.exports = {
  listProducts,
  getProductById,
}
