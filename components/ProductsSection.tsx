import React from 'react';
import { Product } from '../types';

interface ProductsSectionProps {
  products: Product[];
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({ products }) => {
  return (
    <section className="relative z-10 w-full px-4 pb-20 -mt-10 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.35em] text-white/50 uppercase">
              Marketplace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Products from GymUnity sellers
            </h2>
          </div>
          <span className="text-sm text-white/60">
            Showing {products.length} items
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/40"
            >
              <div className="h-40 w-full bg-white/5">
                <img
                  src={
                    product.imageUrl ||
                    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop'
                  }
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold text-white">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
