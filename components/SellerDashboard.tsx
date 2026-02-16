import React from 'react';
import { Button } from './ui/Button';
import { Product } from '../types';

interface SellerDashboardProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onBack: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  products,
  onAddProduct,
  onBack,
}) => {
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || Number.isNaN(parsedPrice)) {
      return;
    }

    onAddProduct({
      name: name.trim(),
      price: parsedPrice,
      imageUrl: imageUrl.trim() || undefined,
    });

    setName('');
    setPrice('');
    setImageUrl('');
  };

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?q=80&w=2400&auto=format&fit=crop"
          alt="Gym equipment"
          className="object-cover w-full h-full opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85"></div>
        <div className="absolute inset-0 bg-black/35"></div>
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col gap-8 px-4 pt-24 pb-16 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.35em] text-white/50 uppercase">
            Seller Dashboard
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">
                Manage your GymUnity products
              </h1>
              <p className="mt-2 text-sm text-white/70">
                Add new items and keep them visible for every user.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-white">Add a product</h2>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">Product name</label>
                <input
                  type="text"
                  placeholder="Example: HIIT Program"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-mindrift-green/60 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="29.00"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-mindrift-green/60 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  className="w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-mindrift-green/60 focus:border-transparent"
                />
              </div>
              <Button type="submit" className="w-full py-3 text-base !bg-mindrift-green !hover:bg-mindrift-greenHover">
                Publish product
              </Button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/50 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Live products</h2>
              <span className="text-xs text-white/60">{products.length} total</span>
            </div>
            <div className="mt-6 space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <img
                    src={
                      product.imageUrl ||
                      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop'
                    }
                    alt={product.name}
                    className="h-16 w-20 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{product.name}</p>
                    <p className="mt-1 text-xs text-white/60">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
