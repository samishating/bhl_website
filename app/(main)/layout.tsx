import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main style={{ paddingTop: '70px', minHeight: '100vh' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
