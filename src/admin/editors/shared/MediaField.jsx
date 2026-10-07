import {useConfirm} from "../../app/ConfirmProvider";
import {useEffect, useRef, useState} from "react";
import {ImagePlus, Replace, Trash2, Upload, Loader2} from "lucide-react";
import {useAuth} from "../../auth/useAuth";
import {useCms} from "../../app/cmsContext";
import {uploadCmsImage} from "../../../services/admin/mediaUpload";

const accepted = "image/jpeg,image/png,image/webp,image/gif,image/avif";
export function MediaField({
  value,
  previewValue,
  previewStyle,
  onChange,
  label,
  disabled,
  variant = "generic",
  onBusyChange,
}) {
  const confirm = useConfirm();
  const { csrfToken } = useAuth();
  const { locale } = useCms();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef(null),
    depth = useRef(0),
    active = useRef(false),
    root = useRef(null);
  const controller = useRef(null);
  const latestChange = useRef(onChange);
  latestChange.current = onChange;
  useEffect(() => {
    setBusy(false);
    setError("");
    setDragging(false);
    active.current = false;
    return () => controller.current?.abort();
  }, [locale]);
  const blocked = () =>
    disabled ||
    active.current ||
    Boolean(root.current?.closest("fieldset:disabled"));
  const upload = async (file) => {
    if (!file || blocked()) return;
    setError("");
    setDragging(false);
    depth.current = 0;
    if (!accepted.split(",").includes(file.type)) {
      setError("Chọn ảnh PNG, JPG, WebP, GIF hoặc AVIF.");
      return;
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      setError("Ảnh phải nhỏ hơn hoặc bằng 10 MB.");
      return;
    }
    controller.current?.abort();
    const task = new AbortController();
    controller.current = task;
    active.current = true;
    setBusy(true);
    onBusyChange?.(true);
    try {
      const result = await uploadCmsImage(file, csrfToken, task.signal);
      if (!task.signal.aborted) latestChange.current(result.secure_url);
    } catch (error) {
      if (!task.signal.aborted)
        setError(
          error.status === 503
            ? "Tải ảnh chưa được cấu hình. Vui lòng liên hệ quản trị viên."
            : error.status
              ? "Không thể tải ảnh. Vui lòng thử lại."
              : error.message || "Không thể tải ảnh.",
        );
    } finally {
      if (!task.signal.aborted) {
        active.current = false;
        setBusy(false);
        onBusyChange?.(false);
      }
    }
  };
  return (
    <div
      ref={root}
      className={`admin-media-field admin-media-field--${variant}${dragging ? " is-dragging" : ""}${error ? " has-error" : ""}`}
      aria-busy={busy}
    >
      <strong>{label}</strong>
      <div
        className="admin-media-dropzone"
        onDragEnter={(event) => {
          event.preventDefault();
          if (!blocked()) {
            depth.current++;
            setDragging(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = blocked() ? "none" : "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (--depth.current <= 0) {
            depth.current = 0;
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          depth.current = 0;
          setDragging(false);
          if (blocked()) return;
          if (event.dataTransfer.files.length > 1) {
            setError("Chọn một ảnh mỗi lần.");
            return;
          }
          upload(event.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <>
            <div className="admin-media-preview">
              <img
                src={previewValue || value}
                alt={label}
                style={previewStyle}
              />
            </div>
            <div className="admin-media-overlay">
              <button
                type="button"
                className="admin-icon-button"
                aria-label={`Thay ${label}`}
                title="Thay ảnh"
                disabled={disabled || busy}
                onClick={() => input.current?.click()}
              >
                <Replace size={17} />
              </button>
              <button
                type="button"
                className="admin-icon-button"
                aria-label="Gỡ ảnh"
                title="Gỡ ảnh"
                disabled={disabled || busy}
                onClick={async () => {
                  if (await confirm("Gỡ ảnh khỏi nội dung?")) onChange("");
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="admin-media-empty"
            disabled={disabled || busy}
            onClick={() => input.current?.click()}
          >
            <ImagePlus size={28} />
            <span>Kéo thả ảnh hoặc nhấn để chọn</span>
            <small>PNG/JPG/WebP/GIF/AVIF · tối đa 10 MB</small>
            <Upload size={16} />
          </button>
        )}
        <input
          ref={input}
          className="admin-media-file"
          aria-label={`${value ? "Thay" : "Tải"} ${label}`}
          type="file"
          accept={accepted}
          disabled={disabled || busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            upload(file);
          }}
        />
        {busy && (
          <div className="admin-media-upload-state" role="status">
            <Loader2 size={18} />
            Đang tải ảnh…
          </div>
        )}
      </div>
      {value && (
        <small className="admin-muted">
          PNG/JPG/WebP/GIF/AVIF · tối đa 10 MB. Lưu sau khi tải ảnh.
        </small>
      )}
      {error && (
        <p className="admin-media-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
