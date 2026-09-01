fetch('http://localhost:3000/api/inventory/products')
  .then(r => r.json())
  .then(d => console.log('Products:', d))
  .catch(e => console.error(e));
