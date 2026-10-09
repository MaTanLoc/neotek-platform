import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { FEATURES } from "./config/features";
import { useTranslation } from "react-i18next";
import SEO from "./components/common/SEO/SEO";
import CustomerProvider from './customer/CustomerProvider';

import { SmoothScroll, SmoothScrollRouteSync } from "./components/common/SmoothScroll/SmoothScroll";

import "./components/common/neotek-components.css";

const AdminApp = lazy(() => import("./admin/app/AdminApp").then(module => ({ default: module.AdminApp })));
const HomePage = lazy(() => import("./pages/home/HomePage"));
const SolutionsPage = lazy(() => import("./pages/solutions/SolutionsPage"));
const SolutionDetailPage = lazy(() => import("./pages/solutions/SolutionDetailPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const PasswordRecovery = lazy(() => import('./pages/auth/PasswordRecovery'));
const MyBookings = lazy(() => import('./pages/account/MyBookings'));
const NotFoundPage = lazy(() => import("./pages/not-found/NotFoundPage"));

function RouteSEO() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const basePath = path.replace(/^\/en(?=\/|$)/, "") || "/";
  if (basePath.startsWith('/admin') || basePath.startsWith('/account') || ['/verify-email', '/forgot-password', '/reset-password'].includes(basePath)) return <SEO robots="noindex, nofollow" />;
  const pageKey = ({ "/": "home", "/solutions": "solutions", "/booking": "booking", "/login": "login", "/register": "register" })[basePath];
  return ["/", "/solutions", "/booking", "/login", "/register"].includes(basePath)
    ? <SEO title={t(`seo.${pageKey}.title`)} description={t(`seo.${pageKey}.description`)} robots={["/login", "/register"].includes(basePath) ? "noindex, follow" : "index, follow"} />
    : null;
}

export default function App() {
  return (
    <BrowserRouter>
      <CustomerProvider>
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
                <Route path="/forgot-password" element={<PasswordRecovery key="forgot" />} />
                <Route path="/en/forgot-password" element={<PasswordRecovery key="forgot-en" />} />
                <Route path="/reset-password" element={<PasswordRecovery key="reset" reset />} />
                <Route path="/en/reset-password" element={<PasswordRecovery key="reset-en" reset />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/en/verify-email" element={<VerifyEmail />} />
                <Route path="/account/bookings" element={<MyBookings />} />
                <Route path="/en/account/bookings" element={<MyBookings />} />
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

      </CustomerProvider>
    </BrowserRouter>
  );
}
