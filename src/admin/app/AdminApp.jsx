import { AuthProvider } from "../auth/AuthContext";
import { ADMIN_PAGES } from "../config/sectionMetadata";
import { lazy, Suspense, useContext, useEffect, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  ExternalLink,
  LogOut,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { ConfirmProvider } from "./ConfirmProvider";
import { CmsProvider } from "./CmsProvider";
import { useCms } from "./cmsContext";
import { AdminLogin } from "../pages/AdminLogin";
import { BookingsManager } from "../pages/BookingsManager";
import { PagesList } from "../pages/PagesList";
import { SolutionDetailsManager } from "../pages/SolutionDetailsManager";
import {
  SolutionDetailsContext,
  loadSolutionDetails,
  detailStatus,
} from "../utils/solutionDetails";
import { CmsTutorial } from "./CmsTutorial";
import { PageEditor } from "../pages/PageEditor";
import { adminApi } from "../../services/admin/adminApi";
import { getPublicPreviewRoute } from "../config/previewRoutes";
import "../styles/admin.css";
const SolutionDetailEditor = lazy(
  () => import("../editors/solution-detail/SolutionDetailEditor"),
);

function Protected({ children }) {
  const { status, restore } = useAuth();
  const location = useLocation();
  if (status === "loading")
    return <div className="admin-loading">Đang tải phiên quản trị…</div>;
  if (status === "error")
    return (
      <div className="admin-loading" role="alert">
        Không thể kiểm tra phiên quản trị.{" "}
        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={restore}
        >
          Thử lại
        </button>
      </div>
    );
  if (status !== "authenticated")
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  return children;
}
function LoginRoute() {
  const { status } = useAuth();
  return status === "authenticated" ? (
    <Navigate to="/admin" replace />
  ) : (
    <AdminLogin />
  );
}
function SidebarPage({ page }) {
  const location = useLocation();
  const active = location.pathname.startsWith(`/admin/pages/${page.slug}`);
  const [open, setOpen] = useState(null);
  const expanded = open ?? active;
  const Icon = page.icon;

  return (
    <div
      className={`admin-nav-page${expanded ? " is-expanded" : ""}${active ? " has-active-child" : ""}`}
    >
      <div className="admin-nav-page-row">
        <NavLink
          to={`/admin/pages/${page.slug}`}
          end
          className={({ isActive }) =>
            `admin-nav-link admin-nav-link--page${isActive ? " is-active" : ""}`
          }
        >
          <Icon size={17} aria-hidden="true" />
          <span>{page.label}</span>
        </NavLink>

        <button
          type="button"
          className="admin-nav-collapse"
          aria-label={`${expanded ? "Thu gọn" : "Mở"} ${page.label}`}
          aria-expanded={expanded}
          aria-controls={`admin-nav-${page.slug}`}
          onClick={() => setOpen(!expanded)}
        >
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="admin-nav-sections" id={`admin-nav-${page.slug}`}>
        {page.sections.map(([key, label]) => (
          <NavLink
            key={key}
            to={`/admin/pages/${page.slug}/${key}`}
            className={({ isActive }) =>
              `admin-nav-link admin-nav-link--section${isActive ? " is-active" : ""}`
            }
          >
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function Shell({ children }) {
  const { user, logout, clearAuth } = useAuth();
  const { confirmLeave, dirty } = useCms();
  const location = useLocation();
  const navigate = useNavigate();
  const contentRouteActive =
    /^\/admin\/(pages|solutions|solution-details)(\/|$)/.test(
      location.pathname,
    );
  const detailActive = /^\/admin\/(solutions|solution-details)(\/|$)/.test(
    location.pathname,
  );
  const [detailOpen, setDetailOpen] = useState(null);
  const [catalogue, setCatalogue] = useState({ loading: true, entries: [] });
  useEffect(() => {
    let active = true;
    loadSolutionDetails()
      .then((value) => {
        if (active) setCatalogue(value);
      })
      .catch((error) => {
        if (error.status === 401) clearAuth();
        if (active)
          setCatalogue({
            loading: false,
            entries: [],
            error: "Không thể tải danh sách bài viết. Vui lòng tải lại trang.",
          });
      });
    return () => {
      active = false;
    };
  }, [clearAuth, location.pathname]);
  const [contentOpen, setContentOpen] = useState(null);
  const [logoutError, setLogoutError] = useState("");
  const contentExpanded = contentOpen ?? contentRouteActive;
  const preview = getPublicPreviewRoute(
    location.pathname.split("/")[3] || "home",
    "vi",
  );
  const handleLogout = async () => {
    if (!(await confirmLeave())) return;
    try {
      await logout();
    } catch {
      setLogoutError("Không thể đăng xuất. Vui lòng thử lại.");
      return;
    }
    dirty.current = false;
    navigate("/admin/login", { replace: true });
  };
  return (
    <div className="admin-shell" lang="vi">
      <header className="admin-header">
        <Link
          to="/admin"
          className="admin-brand"
          aria-label="Tổng quan Neotek CMS"
        >
          <img
            className="admin-brand-logo"
            src="/assets/logo/logo_306x98.png"
            alt="Neotek"
          />
          <span className="admin-brand-divider" />
          <span className="admin-brand-product">CMS</span>
        </Link>
        <div className="admin-header-actions">
          {logoutError && <span role="alert">{logoutError}</span>}
          {preview && (
            <a
              className="admin-header-preview"
              href={preview}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} />
              <span>Xem website</span>
            </a>
          )}
          <div className="admin-user">
            <CmsTutorial
              pathname={location.pathname}
              userKey={user?.id || user?.email}
            />
            <div className="admin-user-copy">
              <span>{user?.email}</span>
              <strong>
                {user?.role === "ADMIN" ? "Quản trị viên" : "Biên tập viên"}
              </strong>
            </div>
            <button
              className="admin-icon-button"
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-sidebar" tabIndex={0}>
          <nav className="admin-nav" aria-label="Điều hướng quản trị">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `admin-nav-link admin-nav-link--root${isActive ? " is-active" : ""}`
              }
            >
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>Tổng quan</span>
            </NavLink>

            <div
              className={`admin-nav-content${contentExpanded ? " is-expanded" : ""}`}
            >
              <button
                type="button"
                className="admin-nav-link admin-nav-link--root admin-nav-content-toggle"
                aria-expanded={contentExpanded}
                aria-controls="admin-content-pages"
                onClick={() => setContentOpen(!contentExpanded)}
              >
                <FileText size={18} aria-hidden="true" />
                <span>Trang nội dung</span>
                <ChevronDown
                  className="admin-nav-content-chevron"
                  size={15}
                  aria-hidden="true"
                />
              </button>

              <div className="admin-nav-content-tree" id="admin-content-pages">
                <div className="admin-nav-content-tree-inner">
                  {ADMIN_PAGES.map((page) => (
                    <SidebarPage key={page.slug} page={page} />
                  ))}
                  <div
                    className={`admin-nav-page${(detailOpen ?? detailActive) ? " is-expanded" : ""}`}
                  >
                    <div className="admin-nav-page-row">
                      <NavLink
                        to="/admin/solution-details"
                        className={({ isActive }) =>
                          `admin-nav-link admin-nav-link--page${isActive ? " is-active" : ""}`
                        }
                      >
                        <FileText size={17} />
                        <span>Chi tiết giải pháp</span>
                      </NavLink>
                      <button
                        className="admin-nav-collapse"
                        aria-label="Mở hoặc thu gọn Chi tiết giải pháp"
                        aria-expanded={detailOpen ?? detailActive}
                        aria-controls="admin-detail-pages"
                        onClick={() =>
                          setDetailOpen(!(detailOpen ?? detailActive))
                        }
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                    <div className="admin-nav-sections" id="admin-detail-pages">
                      <NavLink
                        to="/admin/solution-details"
                        end
                        className={({ isActive }) =>
                          `admin-nav-link admin-nav-link--section${isActive ? " is-active" : ""}`
                        }
                      >
                        Tất cả bài viết
                      </NavLink>
                      {catalogue.entries
                        .filter((entry) => entry.page)
                        .map((entry) => (
                          <NavLink
                            key={entry.key}
                            to={`/admin/solutions/${entry.slug}`}
                            className={({ isActive }) =>
                              `admin-nav-link admin-nav-link--section admin-nav-link--detail${
                                isActive ? " is-active" : ""
                              }`
                            }
                          >
                            <span className="admin-nav-detail-title">
                              {entry.title}
                            </span>

                            <small
                              className="admin-nav-detail-status"
                              title={detailStatus(entry.page)}
                            >
                              {entry.page.status === "PUBLISHED"
                                ? "Đã xuất bản"
                                : detailStatus(entry.page)}
                            </small>
                          </NavLink>
                        ))}
                      {catalogue.error && (
                        <small role="status">{catalogue.error}</small>
                      )}
                    </div>
                  </div>

                  <NavLink
                    to="/admin/pages"
                    end
                    className={({ isActive }) =>
                      `admin-nav-link admin-nav-link--all${isActive ? " is-active" : ""}`
                    }
                  >
                    Tất cả trang
                  </NavLink>
                </div>
              </div>
            </div>

            {user?.role === 'ADMIN' && <NavLink to="/admin/bookings" className={({ isActive }) => 'admin-nav-link admin-nav-link--root' + (isActive ? ' is-active' : '')}><CalendarDays size={18} aria-hidden="true" /><span>Đặt lịch</span></NavLink>}
          </nav>
        </aside>
        <main className="admin-main" tabIndex={0}>
          <div className="admin-main-content">
            <SolutionDetailsContext.Provider value={catalogue}>
              {children}
            </SolutionDetailsContext.Provider>
          </div>
        </main>
      </div>
    </div>
  );
}
function BookingOverviewLink() {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <Link to="/admin/bookings" className="admin-overview-card"><span className="admin-overview-icon"><CalendarDays size={22} /></span><div><strong>Đặt lịch</strong><p>Quản lý yêu cầu và lịch hẹn khách hàng.</p></div></Link> : null;
}
function Overview() {
  const {
    entries,
    loading: detailsLoading,
    error: detailsError,
  } = useContext(SolutionDetailsContext);
  const { clearAuth } = useAuth();
  const [pages, setPages] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    adminApi
      .getPages()
      .then(async (result) => {
        if (active) setPages(result);
        const details = await Promise.all(
          result
            .filter((page) =>
              ADMIN_PAGES.some((item) => item.slug === page.slug),
            )
            .map((page) => adminApi.getPage(page.slug)),
        );
        if (active)
          setPages(
            result.map(
              (page) => details.find((item) => item.id === page.id) || page,
            ),
          );
      })
      .catch((error) => {
        if (error.status === 401) clearAuth();
        if (active)
          setError("Không tải được thông tin trang. Vui lòng thử lại.");
      });
    return () => {
      active = false;
    };
  }, [clearAuth]);
  return (
    <section className="admin-overview">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Neotek CMS</p>
          <h1>Nội dung website</h1>
          <p className="admin-muted">
            Chọn trang để cập nhật nội dung, hình ảnh và thông tin tìm kiếm.
          </p>
        </div>
      </div>
      {error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-overview-grid">
        {ADMIN_PAGES.map((item) => {
          const page = pages.find((page) => page.slug === item.slug);
          const Icon = item.icon;
          return (
            <Link
              key={item.slug}
              to={`/admin/pages/${item.slug}`}
              className="admin-overview-card"
            >
              <span className="admin-overview-icon">
                <Icon size={22} />
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>
                  {page
                    ? page.status === "PUBLISHED"
                      ? "Đã xuất bản"
                      : "Bản nháp"
                    : "Quản lý nội dung"}
                  {page?.sections
                    ? ` · ${page.sections.length} mục nội dung`
                    : ""}
                </p>
                <p>Chỉnh sửa {item.label.toLowerCase()}</p>
              </div>
              <span className="admin-overview-arrow">
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </Link>
          );
        })}
        <Link to="/admin/solution-details" className="admin-overview-card">
          <span className="admin-overview-icon">
            <FileText size={22} />
          </span>
          <div>
            <strong>Chi tiết giải pháp</strong>
            <p>
              {detailsLoading
                ? "Đang tải…"
                : detailsError
                  ? "Không thể tải số liệu"
                  : `${entries.filter((entry) => entry.page?.status === "PUBLISHED").length} bài đã xuất bản · ${entries.filter((entry) => entry.page?.status === "DRAFT").length} bản nháp / ${entries.filter((entry) => !entry.page).length} chưa tạo`}
            </p>
            <p>Quản lý nội dung chuyên sâu cho từng phân hệ</p>
          </div>
          <span className="admin-overview-arrow">
            <ArrowRight size={18} />
          </span>
        </Link>
        <BookingOverviewLink />
      </div>
    </section>
  );
}
export function AdminApp() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <CmsProvider>
          <Routes>
            <Route path="login" element={<LoginRoute />} />
            <Route
              index
              element={
                <Protected>
                  <Shell>
                    <Overview />
                  </Shell>
                </Protected>
              }
            />
            <Route
              path="pages"
              element={
                <Protected>
                  <Shell>
                    <PagesList />
                  </Shell>
                </Protected>
              }
            />
            <Route
              path="solution-details"
              element={
                <Protected>
                  <Shell>
                    <SolutionDetailsManager />
                  </Shell>
                </Protected>
              }
            />
            <Route
              path="pages/:slug"
              element={
                <Protected>
                  <Shell>
                    <PageEditor />
                  </Shell>
                </Protected>
              }
            />
            <Route
              path="pages/:slug/:sectionKey"
              element={
                <Protected>
                  <Shell>
                    <PageEditor />
                  </Shell>
                </Protected>
              }
            />
            <Route
              path="solutions/:slug"
              element={
                <Protected>
                  <Shell>
                    <Suspense fallback={<p>Đang tải trình soạn thảo…</p>}>
                      <SolutionDetailEditor />
                    </Suspense>
                  </Shell>
                </Protected>
              }
            />
            <Route path="bookings" element={<Protected><Shell><BookingsManager /></Shell></Protected>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </CmsProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}
