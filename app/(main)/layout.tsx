import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { getServerUser } from '@/lib/auth';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  return (
    <AuthProvider initialUser={user}>
      <CartProvider>
        <ToastProvider>
          <Navbar />
          <CartDrawer />
          <main style={{ paddingTop: '70px', minHeight: '100vh' }}>
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
