import { Tabs } from "radix-ui";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Circle,
  Plus,
  Trash2,
} from "lucide-react";
import { SelectField } from "./SelectField";

export function EditorTabs({
  tabs,
  value,
  onChange,
  label = "Nhóm trường",
  actions,
  itemTabs = false,
  parent = false,
}) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={onChange}
      className={`admin-editor-tabs${itemTabs ? " admin-editor-tabs--items" : ""}${parent ? " admin-editor-tabs--parent" : ""}`}
    >
      <Tabs.List
        aria-label={label}
        className="admin-editor-tab-rail"
        onWheel={(event) => {
          if (
            itemTabs &&
            event.currentTarget.scrollWidth > event.currentTarget.clientWidth
          )
            event.currentTarget.scrollLeft += event.deltaY || event.deltaX;
        }}
      >
        {tabs.map(([key, title]) => (
          <Tabs.Trigger
            key={key}
            value={key}
            title={title}
            onFocus={(event) => {
              if (itemTabs)
                event.currentTarget.scrollIntoView({
                  block: "nearest",
                  inline: "nearest",
                });
            }}
          >
            {title}
          </Tabs.Trigger>
        ))}
        {actions}
      </Tabs.List>
      {tabs.map(([key, , content]) => (
        <Tabs.Content key={key} value={key} className="admin-editor-tab-panel">
          {content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
export function BilingualPanel({ vi, en }) {
  return (
    <div className="admin-bilingual-panel">
      {[
        ["VI", vi],
        ["EN", en],
      ].map(([language, children]) => (
        <section className="admin-language-panel" key={language}>
          <strong className="admin-language-panel__heading">{language}</strong>
          {children}
        </section>
      ))}
    </div>
  );
}
export function EditorPanel({ title, children, surface = false, media = false }) {
  return (
    <section className={`admin-editor-section${surface ? " admin-editor-group-surface" : ""}${media ? " admin-media-panel" : ""}`}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}
export function EditorItemTabs({
  items,
  value,
  onChange,
  onAdd,
  disabled,
  children,
  label = "Chọn mục nội dung",
  parent = false,
}) {
  return (
    <div className="admin-editor-items">
      <EditorTabs
        itemTabs
        parent={parent}
        value={value}
        onChange={onChange}
        label={label}
        tabs={items.map(([key, title]) => [
          key,
          title,
          value === key ? children : null,
        ])}
        actions={
          onAdd && (
            <button
              type="button"
              aria-label="Thêm mục cho VI và EN"
              title="Thêm mục cho VI và EN"
              disabled={disabled}
              onClick={onAdd}
            >
              <Plus size={16} />
            </button>
          )
        }
      />
      {!items.length && <p className="admin-muted">Chưa có mục nội dung.</p>}
    </div>
  );
}
export function SemanticStatus({ dirty, pending, error, children }) {
  const state = error
    ? "error"
    : pending
      ? "info"
      : dirty
        ? "warning"
        : "success";
  const Icon = error
    ? AlertCircle
    : pending
      ? Loader2
      : dirty
        ? Circle
        : CheckCircle2;
  return (
    <span
      className={`admin-semantic-status admin-semantic-status--${state}`}
      role={error ? "alert" : "status"}
    >
      <Icon size={15} aria-hidden="true" />
      {children ||
        (error
          ? "Lưu thất bại"
          : pending
            ? "Đang lưu…"
            : dirty
              ? "Chưa lưu"
              : "Đã lưu")}
    </span>
  );
}
export function EditorActionBar({
  dirty,
  pending,
  error,
  onDiscard,
  onSave,
  onDelete,
  deleteLabel = "Xóa",
  deleteDisabled,
  saveDisabled,
  showStatus = false,
  actions,
}) {
  if (!onDelete && !actions && !dirty && !pending && !error) return null;
  return (
    <div className="admin-editor-action-bar">
      <div>
        {onDelete && (
          <button
            type="button"
            className="admin-button admin-button--danger-ghost"
            disabled={pending || deleteDisabled}
            onClick={onDelete}
          >
            <Trash2 size={16} aria-hidden="true" />
            {deleteLabel}
          </button>
        )}
      </div>
      <div className="admin-editor-action-bar__save">
        {actions}
        {showStatus && (dirty || pending || error) && (
          <SemanticStatus dirty={dirty} pending={pending} error={error} />
        )}
        {dirty && !pending && (
          <>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={onDiscard}
            >
              Bỏ thay đổi
            </button>
            <button
              type={onSave ? "button" : "submit"}
              className="admin-button admin-button--primary"
              disabled={saveDisabled}
              onClick={onSave}
            >
              Lưu thay đổi
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export function CtaRow({
  kind,
  vi,
  en,
  onLabelChange,
  onSharedChange,
  disabled,
  variant,
  onVariantChange,
  enabled,
  slug,
  onSlugChange,
}) {
  return (
    <div
      className={`admin-navigation-row${onSlugChange ? " admin-navigation-row--module" : ""}${enabled !== undefined ? " admin-navigation-row--enabled" : ""}`}
    >
      {!onSlugChange &&
        (onVariantChange ? (
          <label>
            Kiểu nút
            <SelectField
              label="Kiểu nút"
              value={variant || "primary"}
              disabled={disabled}
              options={[
                ["primary", "Chính"],
                ["secondary", "Phụ"],
                ["ghost", "Liên kết"],
              ]}
              onChange={onVariantChange}
            />
          </label>
        ) : (
          <strong>{kind}</strong>
        ))}
      <label>
        Nhãn · VI
        <input
          value={vi?.label || ""}
          disabled={disabled}
          onChange={(event) => onLabelChange("vi", event.target.value)}
        />
      </label>
      <label>
        Nhãn · EN
        <input
          value={en?.label || ""}
          disabled={disabled}
          onChange={(event) => onLabelChange("en", event.target.value)}
        />
      </label>
      {onSlugChange ? (
        <label>
          Slug phân hệ
          <input
            value={slug || ""}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            disabled={disabled}
            onChange={(event) => onSlugChange(event.target.value)}
          />
          <small className="admin-muted">
            {slug ? `Đích dự kiến: /solutions/${slug}` : "Chưa đặt slug"} · Chưa
            có trang chi tiết.
          </small>
        </label>
      ) : (
        <label>
          {kind === "Nút chính"
            ? "Đích nút chính"
            : kind === "Nút phụ"
              ? "Đích nút phụ"
              : "Liên kết CTA"}
          <input
            value={vi?.url ?? en?.url ?? ""}
            disabled={disabled}
            onChange={(event) => onSharedChange({ url: event.target.value })}
          />
          <small className="admin-muted">
            /solutions, /booking hoặc URL đầy đủ.
          </small>
        </label>
      )}
      {enabled !== undefined && (
        <label className="admin-navigation-enabled">
          <input
            type="checkbox"
            checked={enabled}
            disabled={disabled}
            onChange={(event) =>
              onSharedChange({ enabled: event.target.checked })
            }
          />
          Hiển thị
        </label>
      )}
    </div>
  );
}
