import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProductsSection } from './components/ProductsSection';
import { SellerDashboard } from './components/SellerDashboard';
import { Product } from './types';
import { loadProducts, saveProducts } from './lib/storage';
import { Home } from './src/pages/Home';
import { LoginPage } from './src/pages/LoginPage';
import { RegisterPage } from './src/pages/RegisterPage';
import { Dashboard } from './src/pages/Dashboard';
import { AICoach } from './src/pages/AICoach';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { AdminRoute } from './src/components/AdminRoute';
import { NewsFeedPage } from './src/pages/NewsFeedPage';
import { NewsExplorePage } from './src/pages/NewsExplorePage';
import { NewsPreferencesPage } from './src/pages/NewsPreferencesPage';
import { NewsArticlePage } from './src/pages/NewsArticlePage';
import { NewsChatPage } from './src/pages/NewsChatPage';
import { AdminNewsPage } from './src/pages/AdminNewsPage';
import { ApiUser } from './src/lib/api';
import { HowItWorksPage } from './src/pages/HowItWorksPage';

const readStoredUser = (): ApiUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = React.useState<Product[]>(() => loadProducts());
  const [currentUser, setCurrentUser] = React.useState<ApiUser | null>(() => readStoredUser());

  React.useEffect(() => {
    saveProducts(products);
  }, [products]);

  const syncUser = (user: ApiUser | null) => {
    setCurrentUser(user);
    if (typeof window === 'undefined') {
      return;
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  };

  const handleRegister = (user: ApiUser) => {
    syncUser(user);
  };

  const handleLogin = (user: ApiUser) => {
    syncUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
  };

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    setProducts((prev) => [
      {
        ...product,
        id: `p-${Date.now()}`,
        sellerId: currentUser ? String(currentUser.id) : undefined,
      },
      ...prev,
    ]);
  };

  const hideNavbar = location.pathname === '/login';

  return (
    <main className="min-h-screen bg-black text-white">
      {!hideNavbar && <Navbar currentUser={currentUser} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute onAuthenticated={syncUser}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-coach"
          element={
            <ProtectedRoute onAuthenticated={syncUser}>
              <AICoach />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news"
          element={
            <ProtectedRoute onAuthenticated={syncUser}>
              <NewsFeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news/explore"
          element={
            <ProtectedRoute onAuthenticated={syncUser}>
              <NewsExplorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news/preferences"
          element={
            <ProtectedRoute onAuthenticated={syncUser}>
              <NewsPreferencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news/article/:id"
          element={
            <ProtectedRoute onAuthenticated={syncUser}>
              <NewsArticlePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news/chat"
          element={
            <ProtectedRoute onAuthenticated={syncUser}>
              <NewsChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/news"
          element={
            <AdminRoute onAuthenticated={syncUser}>
              <AdminNewsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/store"
          element={
            <div className="pt-24">
              <ProductsSection products={products} />
            </div>
          }
        />
        <Route
          path="/seller"
          element={
            currentUser?.role === 'seller' ? (
              <SellerDashboard
                products={products}
                onAddProduct={handleAddProduct}
                onBack={() => navigate('/')}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
};

export default App;
