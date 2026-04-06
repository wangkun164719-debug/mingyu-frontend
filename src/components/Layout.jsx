import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-x-hidden bg-aurora text-mist-100">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%)]" />
        <div className="absolute left-1/2 top-0 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(74,103,166,0.22),transparent_60%)] blur-3xl" />
      </div>
      <Header />
      <main key={location.pathname} className="relative z-10 animate-rise">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
