import {HugeiconsIcon} from "@hugeicons/react";
import {Plus, Minus} from "lucide-react";
import {GROUP_ICONS} from "../../../pages/solutions/solutionPresentation";
import {ListInput} from "../shared/ListInput";
import {SolutionPreviewView} from "../solutions/SolutionPreviewView";
import {TrustedByView} from "../shared/PublicPreviewViews";
import {useState} from "react";
import {MediaField} from "../shared/MediaField";
import {RichTextField} from "../shared/RichTextField";
import {ItemActionRow} from "../shared/ItemActionRow";
import {SelectField} from "../shared/SelectField";
import {moveItem} from "../../utils/itemOperations";
import {pairBilingualItems, pairIdentity, itemIdentity} from "../../utils/bilingualItems";
import {EditorTabs, BilingualPanel, EditorItemTabs, EditorPanel, CtaRow} from "../shared/EditorPrimitives";
import {PortraitEditorDialog} from "../shared/PortraitEditorDialog";
import {ModuleDetailPanel} from "../solutions/ModuleDetailPanel";

const clusters = [
  ["business", "Kinh doanh"],
  ["supplyChain", "Chuỗi cung ứng"],
  ["manufacturing", "Sản xuất"],
  ["management", "Quản trị"],
];
const definitions = {
  why: {
    text: ["title", "description"],
    shared: ["icon"],
    defaults: { title: "" },
  },
  proofMetrics: {
    text: ["label", "suffix", "subtitle"],
    shared: ["value"],
    defaults: { label: "", value: 0 },
  },
  trustedLogos: {
    text: ["alt"],
    shared: ["url", "width", "scale"],
    defaults: {
      alt: "",
      width: 150,
      scale: 1,
    },
  },
  testimonials: {
    text: ["quote", "name", "role", "company"],
    shared: ["image"],
    defaults: { name: "" },
  },
  faq: {
    text: ["question", "answer"],
    shared: [],
    defaults: { question: "", answer: "" },
  },
  solutionClusters: {
    text: ["label", "title", "description"],
    shared: ["image", "clusterKey"],
    defaults: { title: "" },
  },
  solutionGroups: {
    text: ["eyebrow", "title", "description", "visualLabel"],
    shared: ["icon", "modules", "visualSrc"],
    defaults: { modules: [] },
  },
  solutionModules: {
    text: ["title", "description", "bullets"],
    shared: ["icon", "visualSrc"],
    defaults: { bullets: [] },
  },
};
const labels = {
  ctaLabel: "Nh\u00e3n CTA",
  title: "Tiêu đề",
  description: "Mô tả",
  label: "Nhãn",
  suffix: "Hậu tố",
  value: "Giá trị",
  alt: "Tên / văn bản thay thế",
  url: "Ảnh logo",
  width: "Chiều rộng (px)",
  maxWidth: "Rộng tối đa (px)",
  height: "Cao tối đa (px)",
  scale: "Tỷ lệ",
  objectFit: "Cách hiển thị",
  quote: "Lời nhận xét",
  name: "Họ tên",
  role: "Chức vụ",
  company: "Công ty",
  image: "Hình ảnh",
  question: "Câu hỏi",
  answer: "Câu trả lời",
  eyebrow: "Dòng giới thiệu",
  visualLabel: "Nhãn hình minh họa",
  icon: "Biểu tượng",
  modules: "Mã phân hệ (mỗi dòng một mã)",
  visualSrc: "Hình minh họa",
  bullets: "T\u00ednh n\u0103ng",
  clusterKey: "Thuộc nhóm",
};

export function CollectionSectionEditor({
  type,
  value,
  pairedValue,
  onChange,
  onPairedChange,
  pending,
  moduleOptions = [],
  pairedModuleOptions = [],
  groupOptions = [],
  pairedGroupOptions = [],
}) {
  const definition = definitions[type];
  const vi = value || {};
  const en = pairedValue || {};
  const viItems = vi?.items || [],
    enItems = en?.items || [];
  const pairs = pairBilingualItems(
    viItems,
    enItems,
    (a, b) => type !== "solutionClusters" || a.clusterKey === b.clusterKey,
  );
  const keys = pairs.map((pair) => pair.id);
  const [selected, setSelected] = useState(undefined);
  const [moduleGroup, setModuleGroup] = useState(null);
  const validGroups = groupOptions.filter((group) => group.key);
  const unassigned = pairs.filter(
    (pair) =>
      !validGroups.some((group) =>
        (group.modules || []).includes((pair.vi || pair.en).key),
      ),
  );
  const groupKey =
    moduleGroup &&
    (moduleGroup === "__unassigned__" ||
      validGroups.some((group) => group.key === moduleGroup))
      ? moduleGroup
      : validGroups[0]?.key || "__unassigned__";
  const [cluster, setCluster] = useState("business");
  const write = (nextVi, nextEn) => {
    onChange(nextVi);
    onPairedChange(nextEn);
  };
  const writeItems = (a, b) => write({ ...vi, items: a }, { ...en, items: b });
  // Keyless imported items gain stable paired keys at the first explicit
  // structural edit. Text-only edits leave the imported data untouched.
  const writeStructure = (a, b) => {
    const keys = a.map((item) => item.key || `${type}-${crypto.randomUUID()}`);
    writeItems(
      a.map((item, i) => ({ ...item, key: keys[i] })),
      b.map((item, i) => ({ ...item, key: keys[i] })),
    );
  };
  const aligned =
    viItems.length === enItems.length &&
    viItems.every((item, i) => itemIdentity(item, i) === itemIdentity(enItems[i], i));

  const update = (key, patch, language) => {
    const pair = pairs.find((pair) => pair.id === key);
    const apply = (items, target) =>
      items.map((item, i) =>
        i === (target === "vi" ? pair.viIndex : pair.enIndex) &&
        (!language || language === target)
          ? { ...item, ...patch }
          : item,
      );
    writeItems(apply(viItems, "vi"), apply(enItems, "en"));
  };
  const add = (parentKey) => {
    if (!aligned) return;
    const item = {
      ...definition.defaults,
      key: parentKey || `${type}-${crypto.randomUUID()}`,
      ...(type === "solutionClusters" && !parentKey
        ? { clusterKey: cluster }
        : {}),
    };
    writeStructure([...viItems, { ...item }], [...enItems, { ...item }]);
    if (type === "solutionModules") setModuleGroup("__unassigned__");
    setSelected(pairIdentity(item, viItems.length));
  };
  const remove = (key) => {
    if (!aligned) return;
    const pair = pairs.find((pair) => pair.id === key);
    writeStructure(
      viItems.filter((_, i) => i !== pair.viIndex),
      enItems.filter((_, i) => i !== pair.enIndex),
    );
    setSelected(undefined);
  };
  const move = (key, direction) => {
    if (!aligned) return;
    const index = pairs.find((pair) => pair.id === key).viIndex;
    if (type === "solutionClusters") {
      const siblings = viItems
        .map((item, i) => ({ item, i }))
        .filter(({ item }) => item.clusterKey === viItems[index].clusterKey);
      const position = siblings.findIndex((entry) => entry.i === index);
      const target = siblings[position + direction]?.i;
      if (target === undefined) return;
      const swap = (items) => {
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      };
      writeStructure(swap(viItems), swap(enItems));
    } else
      writeStructure(
        moveItem(viItems, index, direction),
        moveItem(enItems, index, direction),
      );
  };
  const field = (key, item, name, language) => {
    const change = (next) => update(key, { [name]: next }, language);
    const label = name === "subtitle" ? "Mô tả chỉ số" : labels[name];
    if (name === "icon" && type === "solutionGroups")
      return (
        <label key={name}>
          {label}
          <SelectField
            label={label}
            value={item.icon || item.key}
            options={Object.entries(GROUP_ICONS).map(([key, icon]) => [
              key,
              {
                business: "Kinh doanh",
                supplyChain: "Chuỗi cung ứng",
                operations: "Dự án & Sản xuất",
                management: "Quản trị",
              }[key],
              <HugeiconsIcon
                icon={icon}
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
              />,
            ])}
            onChange={change}
            disabled={pending}
          />
        </label>
      );
    if (name === "icon" && ["why", "solutionModules"].includes(type))
      return (
        <MediaField
          key={name}
          variant="compact"
          value={item[name] || ""}
          previewValue={
            type === "solutionModules" &&
            item[name] &&
            !/^(https?:|\/)/.test(item[name])
              ? `/assets/SolutionPageIcon/${item[name]}`
              : item[name]
          }
          label={label}
          disabled={pending}
          onChange={change}
        />
      );
    if (name === "image" && type === "testimonials")
      return (
        <PortraitEditorDialog
          key={name}
          item={item}
          disabled={pending}
          onChange={(patch) => update(key, patch)}
        />
      );
    if (["url", "image", "visualSrc"].includes(name))
      return (
        <MediaField
          key={name}
          value={item[name] || ""}
          variant={type === "trustedLogos" ? "logo" : "generic"}
          label={label}
          disabled={pending}
          onChange={change}
        />
      );
    if (["description", "quote", "answer"].includes(name))
      return (
        <RichTextField
          key={name}
          label={label}
          value={item[name] || ""}
          disabled={pending}
          onChange={change}
        />
      );
    if (["subtitle", "question", "title"].includes(name))
      return (
        <label key={name}>
          {label}
          <textarea
            rows={name === "subtitle" ? 3 : 2}
            value={item[name] || ""}
            disabled={pending}
            onChange={(event) => change(event.target.value)}
          />
        </label>
      );
    if (name === "clusterKey")
      return (
        <label key={name}>
          {label}
          <SelectField
            label={label}
            value={item[name] || ""}
            options={clusters}
            onChange={change}
            disabled={pending}
          />
        </label>
      );
    if (name === "objectFit")
      return (
        <label key={name}>
          {label}
          <SelectField
            label={label}
            value={item[name] || "contain"}
            options={[
              ["contain", "Giữ toàn bộ ảnh"],
              ["cover", "Lấp đầy khung"],
            ]}
            onChange={change}
            disabled={pending}
          />
        </label>
      );
    if (name === "modules")
      return (
        <div key={name} className="admin-editor-group">
          <strong>Phân hệ trong nhóm</strong>
          <div className="admin-module-checklist">
            {[
              ...moduleOptions,
              ...(item.modules || [])
                .filter(
                  (key) => !moduleOptions.some((module) => module.key === key),
                )
                .map((key) => ({
                  key,
                  title:
                    "Kh\u00f4ng t\u00ecm th\u1ea5y ph\u00e2n h\u1ec7: " + key,
                })),
            ].map((module) => (
              <label className="admin-checkbox" key={module.key}>
                <input
                  type="checkbox"
                  checked={(item.modules || []).includes(module.key)}
                  disabled={pending}
                  onChange={(event) =>
                    change(
                      event.target.checked
                        ? [...(item.modules || []), module.key]
                        : (item.modules || []).filter(
                            (key) => key !== module.key,
                          ),
                    )
                  }
                />
                {module.title || "Phân hệ chưa có tên"}
              </label>
            ))}
          </div>
          {!moduleOptions.length && (
            <small className="admin-muted">Chưa có phân hệ để lựa chọn.</small>
          )}
        </div>
      );
    if (name === "bullets")
      return (
        <ListInput
          key={key + language}
          label={label}
          value={item.bullets || []}
          disabled={pending}
          onChange={change}
        />
      );
    if (name === "scale") {
      const current = Number(item.scale ?? 1);

      return (
        <label key={name} className="admin-scale-field">
          <span className="admin-scale-field__label">
            <span>{label}</span>
            <strong>{current.toFixed(2)}×</strong>
          </span>

          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={current}
            disabled={pending}
            onChange={(event) => change(Number(event.target.value))}
          />
        </label>
      );
    }

    const numeric = ["width", "value"].includes(name);

    return (
      <label key={name}>
        {label}
        <input
          type={numeric ? "number" : "text"}
          min={name === "width" ? Math.min(60, item.width ?? 60) : undefined}
          max={name === "width" ? Math.max(400, item.width ?? 400) : undefined}
          step="any"
          value={item[name] ?? (name === "width" ? 150 : "")}
          disabled={pending}
          onChange={(event) =>
            change(
              numeric
                ? event.target.value === ""
                  ? undefined
                  : Number(event.target.value)
                : event.target.value,
            )
          }
        />
        {name === "width" && (
          <small className="admin-muted">
            Khuyến nghị 60–400 px; giữ nguyên kích thước đã lưu.
          </small>
        )}
      </label>
    );
  };
  const visible =
    type === "solutionClusters"
      ? keys.filter((key) => {
          const pair = pairs.find((pair) => pair.id === key),
            item = pair.vi || pair.en;
          return (
            item.clusterKey === cluster ||
            (cluster === "__unassigned__" && !clusters.some(
              ([parent]) => parent === item.key || parent === item.clusterKey,
            ))
          );
        })
      : type === "solutionModules"
        ? pairs
            .filter((pair) =>
              groupKey === "__unassigned__"
                ? unassigned.includes(pair)
                : (
                    validGroups.find((group) => group.key === groupKey)
                      ?.modules || []
                  ).includes((pair.vi || pair.en).key),
            )
            .map((pair) => pair.id)
        : keys;
  const active = visible.includes(selected) ? selected : visible[0];
  // Undefined initializes the first record; null explicitly closes all accordions.
  const openKey = selected === null ? null : active;
  const itemTitle = (pair, index) => {
    const item = pair.vi || pair.en;
    return (
      (type === "solutionGroups" ? item.eyebrow : "") ||
      item.title ||
      item.name ||
      item.question ||
      item.alt ||
      item.label ||
      "Mục " + (index + 1)
    );
  };
  const solutionPreview = (item, language) => {
    if (!item) return <p className="admin-muted">Chưa có bản ngôn ngữ này.</p>;
    const modules =
      type === "solutionModules"
        ? [item]
        : language === "vi"
          ? moduleOptions
          : pairedModuleOptions;
    const group =
      type === "solutionGroups"
        ? item
        : (language === "vi" ? groupOptions : pairedGroupOptions).find(
            (group) => group.key === groupKey,
          ) || {
            key: "unassigned",
            title: language === "vi" ? "Chưa phân nhóm" : "Ungrouped",
            modules: [],
          };
    return (
      <SolutionPreviewView
        group={{
          ...group,
          modules:
            type === "solutionModules" ? [item.key] : group.modules || [],
        }}
        modules={modules}
        language={language}
      />
    );
  };
  const renderItem = (key) => {
    const pair = pairs.find((pair) => pair.id === key),
      a = pair.vi,
      b = pair.en;
    const item = a || b;
    const siblings =
      type === "solutionClusters"
        ? viItems.filter((entry) => entry.clusterKey === item.clusterKey)
        : viItems;
    const position =
      type === "solutionClusters"
        ? siblings.findIndex((entry) => entry.key === item.key)
        : pair.viIndex;
    const localized = (names) => (
      <BilingualPanel
        vi={
          a ? (
            names.map((name) => field(key, a, name, "vi"))
          ) : (
            <p className="admin-muted">VI missing</p>
          )
        }
        en={
          b ? (
            names.map((name) => field(key, b, name, "en"))
          ) : (
            <p className="admin-muted">EN missing</p>
          )
        }
      />
    );
    const shared = (names) => (
      <fieldset className="admin-editor-fields" disabled={pending || !a || !b}>
        <EditorPanel surface>
          {names.map((name) => field(key, item, name))}
        </EditorPanel>
      </fieldset>
    );
    const parent =
      type === "solutionClusters" &&
      clusters.some(([parent]) => parent === item.key);
    const text = definition.text.filter(
      (name) =>
        type !== "solutionClusters" ||
        parent ||
        !["description", "label"].includes(name),
    );
    const sharedNames = definition.shared.filter(name => type !== "solutionClusters" || (name === "image" && parent));
    const trustedPreview = (
      <div className="admin-trusted-preview">
        <TrustedByView
          headingId="admin-trusted-draft-heading"
          copy={{ title: vi.title || "Logo preview" }}
          logos={viItems.map((item, index) => ({
            ...item,
            id: item.key || index,
            src: item.url,
            width: item.width || 150,
            scale: item.scale ?? 1,
          }))}
        />
      </div>
    );
    const tabs =
      type === "solutionGroups"
        ? [
            ["content", "Nội dung", localized(text)],
            ["modules", "Phân hệ", shared(["modules"])],
            [
              "media",
              "Hình minh họa",
              <EditorPanel media>
                {shared(["icon", "visualSrc"])}
                <small className="admin-muted">
                  Ảnh nhóm dùng khi phân hệ chưa có ảnh riêng.
                </small>
              </EditorPanel>,
            ],
          ]
        : type === "solutionModules"
          ? [
              [
                "content",
                "Nội dung",
                <EditorPanel>
                  {localized(["title", "description", "bullets"])}
                  <CtaRow
                    vi={{ label: a?.ctaLabel }}
                    en={{ label: b?.ctaLabel }}
                    slug={item.slug}
                    disabled={pending || !a || !b}
                    onLabelChange={(language, ctaLabel) =>
                      update(key, { ctaLabel }, language)
                    }
                    onSlugChange={(slug) => update(key, { slug })}
                  />
                  <ModuleDetailPanel moduleKey={item.key} slug={item.slug} disabled={pending || !a || !b} />
                </EditorPanel>,
              ],
              [
                "media",
                "Hình ảnh",
                <EditorPanel media>
                  {shared(["visualSrc"])}
                  <details>
                    <summary>Biểu tượng nhỏ trong accordion (tùy chọn)</summary>
                    {shared(["icon"])}
                  </details>
                </EditorPanel>,
              ],
            ]
          : null;
    return (
      <EditorPanel>
        {tabs ? (
          <EditorPanel>{tabs.map(([id, title, content]) => <EditorPanel key={id} title={title}>{content}</EditorPanel>)}</EditorPanel>
        ) : (
          <>
            {localized(text)}
            {sharedNames.length > 0 && shared(sharedNames)}
          </>
        )}
        {type === "trustedLogos" && trustedPreview}
        {["solutionGroups", "solutionModules"].includes(type) && (
          <EditorPanel title="Xem trước">
            <BilingualPanel
              vi={solutionPreview(a, "vi")}
              en={solutionPreview(b, "en")}
            />
          </EditorPanel>
        )}
        
        {aligned && !parent && (
          <ItemActionRow
            index={position}
            total={siblings.length}
            onMove={(_, direction) => move(key, direction)}
            onRemove={() => remove(key)}
          />
        )}
      </EditorPanel>
    );
  };
  const items = visible.map((key, index) => [
    key,
    itemTitle(
      pairs.find((pair) => pair.id === key),
      index,
    ),
  ]);
  const editor =
    ["faq", "solutionClusters"].includes(type) ? (
      <EditorPanel>
        {items.map(([key, title]) => (
          <section key={key} className="admin-collection-card">
            <button
              className="admin-collection-heading"
              type="button"
              aria-expanded={openKey === key}
              onClick={() => setSelected(openKey === key ? null : key)}
            >
              <strong>{title}</strong>
              <span aria-hidden="true">
                {openKey === key ? (
                  <Minus size={16} />
                ) : (
                  <Plus size={16} />
                )}
              </span>
            </button>
            {openKey === key && renderItem(key)}
          </section>
        ))}
        <button
          type="button"
          className="admin-button admin-button--secondary"
          disabled={!aligned || pending || (type === "solutionClusters" && cluster === "__unassigned__")}
          onClick={() => add()}
        >
          <Plus size={16} aria-hidden="true" />
          Thêm mục cho VI và EN
        </button>
      </EditorPanel>
    ) : (
      <EditorItemTabs
        items={items}
        value={active}
        onChange={(key) => {
          setSelected(key);
        }}
        onAdd={() => add()}
        disabled={!aligned || pending}
      >
        {active && renderItem(active)}
      </EditorItemTabs>
    );
  return (
    <div className="admin-standard-editor">
      {!aligned && (
        <div
          className="admin-alert admin-alert--warning admin-bilingual-sync-warning"
          role="status"
        >
          <div>
            <strong>Cấu trúc VI/EN cũ chưa đồng bộ.</strong>
            <p>
              Nội dung hai ngôn ngữ vẫn được giữ nguyên. Thêm, xóa và sắp xếp
              đang tạm khóa để tránh lệch dữ liệu.
            </p>
          </div>

        </div>
      )}
      {type === "solutionModules" ? (
        <EditorItemTabs
          parent
          label="Nhóm giải pháp"
          value={groupKey}
          onChange={(key) => {
            setModuleGroup(key);
            setSelected(undefined);
            }}
          items={[
            ...validGroups.map((group) => [
              group.key,
              group.eyebrow || group.title || group.key,
            ]),
            ...(unassigned.length ||
            !validGroups.length ||
            groupKey === "__unassigned__"
              ? [["__unassigned__", "Chưa phân nhóm"]]
              : []),
          ]}
        >
          {editor}
        </EditorItemTabs>
      ) : type === "solutionClusters" ? (
        <EditorTabs
          parent
          label="Cụm giải pháp"
          tabs={[...clusters, ...(pairs.some(pair => { const item = pair.vi || pair.en; return !clusters.some(([key]) => item.key === key || item.clusterKey === key) }) ? [["__unassigned__", "Chưa phân cụm"]] : [])].map(([key, title]) => [key, title, <EditorPanel>{pairs.filter(pair => (pair.vi || pair.en).key === cluster).map(pair => <div key={pair.id}>{renderItem(pair.id)}</div>)}<EditorPanel title="Phân hệ trong cụm">{editor}</EditorPanel></EditorPanel>])}
          value={cluster}
          onChange={(key) => {
            setCluster(key);
            setSelected(undefined);
          }}
        />
      ) : (
        editor
      )}
      {type === "solutionClusters" && cluster !== "__unassigned__" &&
        ![...viItems, ...enItems].some((item) => item.key === cluster) && (
          <button
            type="button"
            className="admin-button admin-button--secondary"
            disabled={!aligned || pending}
            onClick={() => add(cluster)}
          >
            Tạo nhóm cho VI và EN
          </button>
        )}
    </div>
  );
}
