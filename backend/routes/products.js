const express = require('express')
const productService = require('../services/productService')

const router = express.Router()

router.get('/', (req, res) => {
  const query = req.query.q || ''
  const products = productService.listProducts(query)
  res.json(products)
})

router.get('/:id', (req, res) => {
  const product = productService.getProductById(req.params.id)
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }
  res.json(product)
})

module.exports = router
