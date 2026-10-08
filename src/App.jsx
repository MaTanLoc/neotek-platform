import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { FEATURES } from "./config/features";
import { useTranslation } from "react-i18next";
import SEO from "./components/common/SEO/SEO";

import { SmoothScroll, SmoothScrollRouteSync } from "./components/common/SmoothScroll/SmoothScroll";

import "./components/common/neotek-components.css";

const AdminApp = lazy(() => import("./admin/app/AdminApp").then(module => ({ default: module.AdminApp })));
const HomePage = lazy(() => import("./pages/home/HomePage"));
const SolutionsPage = lazy(() => import("./pages/solutions/SolutionsPage"));
const SolutionDetailPage = lazy(() => import("./pages/solutions/SolutionDetailPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const NotFoundPage = lazy(() => import("./pages/not-found/NotFoundPage"));

function RouteSEO() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const basePath = path.replace(/^\/en(?=\/|$)/, "") || "/";
  if (basePath.startsWith('/admin')) return <SEO robots="noindex, nofollow" />;
  const pageKey = ({ "/": "home", "/solutions": "solutions", "/booking": "booking", "/login": "login", "/register": "register" })[basePath];
  return ["/", "/solutions", "/booking", "/login", "/register"].includes(basePath)
    ? <SEO title={t(`seo.${pageKey}.title`)} description={t(`seo.${pageKey}.description`)} robots={["/login", "/register"].includes(basePath) ? "noindex, follow" : "index, follow"} />
    : null;
}

export default function App() {
  return (
    <BrowserRouter>

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
                <Route path="/solutions/:slug" element={<SolutionDetailPage />} />
                <Route path="/en/solutions/:slug" element={<SolutionDetailPage />} />

                {/* BOOKING */}
                {FEATURES.booking && <Route path="/booking" element={<BookingPage />} />}
                {FEATURES.booking && <Route path="/en/booking" element={<BookingPage />} />}

                {/* AUTH */}
                {FEATURES.publicAuth && <Route path="/login" element={<Login />} />}
                {FEATURES.publicAuth && <Route path="/register" element={<Register />} />}

                {FEATURES.publicAuth && <Route path="/en/login" element={<Login />} />}
                {FEATURES.publicAuth && <Route path="/en/register" element={<Register />} />}

                {/* FALLBACK */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            </div>
          </div>
        </SmoothScroll>

    </BrowserRouter>
  );
}
