import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/CartDrawer';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { MyOrdersPage } from './pages/MyOrdersPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';

// Customer Layout Wrapper
const CustomerLayout: React.FC<{
  searchTerm: string;
  onSearchChange: (val: string) => void;
  children: React.ReactNode;
}> = ({ searchTerm, onSearchChange, children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar searchTerm={searchTerm} onSearchChange={onSearchChange} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {/* Global Modals & Drawers */}
          <AuthModal />
          <CartDrawer />

          <Routes>
            {/* 1. Customer Routes */}
            <Route
              path="/"
              element={
                <CustomerLayout searchTerm={searchTerm} onSearchChange={setSearchTerm}>
                  <HomePage searchTerm={searchTerm} />
                </CustomerLayout>
              }
            />
            <Route
              path="/product/:id"
              element={
                <CustomerLayout searchTerm={searchTerm} onSearchChange={setSearchTerm}>
                  <ProductDetailPage />
                </CustomerLayout>
              }
            />
            <Route
              path="/my-orders"
              element={
                <CustomerLayout searchTerm={searchTerm} onSearchChange={setSearchTerm}>
                  <MyOrdersPage />
                </CustomerLayout>
              }
            />

            {/* 2. Admin Portal Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
