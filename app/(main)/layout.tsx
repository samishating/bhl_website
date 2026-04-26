'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <main style={{ paddingTop: '70px', minHeight: '100vh' }}>
          {children}
        </main>
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}
