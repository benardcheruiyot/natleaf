import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section style={{ padding: '2rem' }}>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Return home</Link>
    </section>
  );
}
