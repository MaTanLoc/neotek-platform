import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./admin/auth/AuthContext";
import { AdminApp } from "./admin/AdminApp";
import { useTranslation } from "react-i18next";
import SEO from "./components/common/SEO/SEO";

import { SmoothScroll, SmoothScrollRouteSync } from "./components/common/SmoothScroll/SmoothScroll";

import "./components/common/neotek-components.css";

const HomePage = lazy(() => import("./pages/home/HomePage"));
const SolutionsPage = lazy(() => import("./pages/solutions/SolutionsPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const NotFoundPage = lazy(() => import("./pages/not-found/NotFoundPage"));

function RouteSEO() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const basePath = path.replace(/^\/en(?=\/|$)/, "") || "/";
  const pageKey = ({ "/": "home", "/solutions": "solutions", "/booking": "booking", "/login": "login", "/register": "register" })[basePath];
  return ["/", "/solutions", "/booking", "/login", "/register"].includes(basePath)
    ? <SEO title={t(`seo.${pageKey}.title`)} description={t(`seo.${pageKey}.description`)} robots={["/login", "/register"].includes(basePath) ? "noindex, follow" : "index, follow"} />
    : null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SmoothScroll>
          <div id="smooth-wrapper">
            <div id="smooth-content">
            <RouteSEO />
            <Suspense fallback={null}>
              <SmoothScrollRouteSync />
              <Routes>
                <Route path="/admin/*" element={<AdminApp />} />
                {/* WEBSITE */}
                <Route path="/" element={<HomePage />} />
                <Route path="/en" element={<HomePage />} />

                {/* SOLUTIONS */}
                <Route path="/solutions" element={<SolutionsPage />} />
                <Route path="/en/solutions" element={<SolutionsPage />} />

                {/* BOOKING */}
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/en/booking" element={<BookingPage />} />

                {/* AUTH */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/en/login" element={<Login />} />
                <Route path="/en/register" element={<Register />} />

                {/* FALLBACK */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            </div>
          </div>
        </SmoothScroll>
      </AuthProvider>
    </BrowserRouter>
  );
}
