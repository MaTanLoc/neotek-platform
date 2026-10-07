import {Plus} from 'lucide-react'
import {useState} from 'react'
import {BilingualPanel, EditorItemTabs, EditorPanel} from '../shared/EditorPrimitives'
import {MediaField} from '../shared/MediaField'
import {ItemActionRow} from '../shared/ItemActionRow'
import {moveItem} from '../../utils/itemOperations'
import {ImagePositionField} from '../shared/ImagePositionField'
import {SelectField} from '../shared/SelectField'

const overviewIcons = [['BarChart3', 'Báo cáo'], ['Boxes', 'Kho hàng'], ['BriefcaseBusiness', 'Kinh doanh'], ['Factory', 'Sản xuất'], ['LandPlot', 'Dự án'], ['PackageSearch', 'Tra cứu hàng hóa'], ['ShoppingCart', 'Mua bán'], ['Sparkles', 'Tự động hóa'], ['Users', 'Nhân sự']]

export function SolutionOverviewEditor({ value, pairedValue, onChange, onPairedChange, pending }) {
  const [selected, setSelected] = useState('0')
  const vi = value || {}, en = pairedValue || {}
  const a = vi.items || [], b = en.items || []
  const aligned = a.length === b.length && a.every((item, i) => item.key === b[i]?.key && (item.modules || []).length === (b[i]?.modules || []).length && (item.modules || []).every((module, j) => module.key === b[i]?.modules[j]?.key))
  const write = (nextVi, nextEn) => { onChange(nextVi); onPairedChange(nextEn) }
  const update = (index, patch, language) => {
    const apply = (content, target) => ({ ...content, items: (content.items || []).map((item, i) => i === index && (!language || language === target) ? { ...item, ...patch } : item) })
    write(apply(vi, 'vi'), apply(en, 'en'))
  }
  const add = () => { const item = { key: `overview-${crypto.randomUUID()}`, title: '', description: '', image: '', modules: [] }; write({ ...vi, items: [...a, item] }, { ...en, items: [...b, { ...item }] }) }
  const sectionTitle = (language, content) => <label>Tiêu đề · {language.toUpperCase()}<textarea rows={2} value={content.title || ''} onChange={event => write(language === 'vi' ? { ...vi, title: event.target.value } : vi, language === 'en' ? { ...en, title: event.target.value } : en)} /></label>
  const moduleTitle = (language, item, j) => <label>Tên phân hệ · {language.toUpperCase()}<input value={(language === 'vi' ? item : b[index])?.modules[j]?.title || ''} onChange={event => update(index, { modules: (language === 'vi' ? item : b[index]).modules.map((entry, k) => j === k ? { ...entry, title: event.target.value } : entry) }, language)} /></label>
  const index = Math.min(Number(selected), Math.max(0, a.length - 1))
  const item = a[index]
  const fields = (language, translated) => translated ? <>{['title', 'description'].map(key => <label key={key}>{key === 'title' ? 'Tiêu đề' : 'Mô tả'}<textarea rows={key === 'description' ? 4 : 2} value={translated[key] || ''} onChange={event => update(index, { [key]: event.target.value }, language)} /></label>)}</> : <p className="admin-muted">EN missing</p>
  const editor = <EditorItemTabs items={a.map((item, i) => [String(i), item.title || 'Mục ' + (i + 1)])} value={String(index)} onChange={setSelected} onAdd={() => { add(); setSelected(String(a.length)) }} disabled={!aligned || pending}>
    {item && <EditorPanel>
      <BilingualPanel vi={fields('vi', item)} en={fields('en', b[index])} />
      <EditorPanel media>      <MediaField label="Ảnh nhóm" value={item.image || ''} disabled={pending} onChange={image => update(index, { image })} />
      <ImagePositionField value={item.imagePosition} onChange={imagePosition => update(index, { imagePosition })} disabled={pending} />
</EditorPanel>
      <EditorPanel title="Phân hệ trong nhóm">{(item.modules || []).map((module, j) => <div key={module.key} className="admin-editor-group"><BilingualPanel vi={moduleTitle('vi', item, j)} en={moduleTitle('en', item, j)} /><label>Liên kết phân hệ<input value={module.url || ''} onChange={event => {
        const next = (content) => ({ ...content, items: content.items.map((entry, i) => i === index ? { ...entry, modules: entry.modules.map((m, k) => j === k ? { ...m, url: event.target.value } : m) } : entry) })
        write(next(vi), next(en))
      }} /><small className="admin-muted">Dùng /solutions, /booking hoặc địa chỉ https://.</small></label><label>Biểu tượng<SelectField label="Biểu tượng" value={overviewIcons.some(([key]) => key === module.icon) ? module.icon : 'Boxes'} options={overviewIcons} disabled={pending} onChange={icon => {
        const next = content => ({ ...content, items: content.items.map((entry, i) => i === index ? { ...entry, modules: entry.modules.map((m, k) => j === k ? { ...m, icon } : m) } : entry) })
        write(next(vi), next(en))
      }} /></label>{aligned && <ItemActionRow index={j} total={item.modules.length} onMove={(_, direction) => {
        const next = content => ({ ...content, items: content.items.map((entry, i) => i === index ? { ...entry, modules: moveItem(entry.modules, j, direction) } : entry) })
        write(next(vi), next(en))
      }} onRemove={() => {
        const next = content => ({ ...content, items: content.items.map((entry, i) => i === index ? { ...entry, modules: entry.modules.filter((_, k) => k !== j) } : entry) })
        write(next(vi), next(en))
      }} />}</div>)}
      <button type="button" className="admin-button admin-button--secondary" disabled={!aligned} onClick={() => {
        const module = { key: `module-${crypto.randomUUID()}`, title: '', icon: '', url: '' }
        const next = content => ({ ...content, items: content.items.map((entry, i) => i === index ? { ...entry, modules: [...(entry.modules || []), module] } : entry) })
        write(next(vi), next(en))
      }}><Plus size={16} aria-hidden="true" />Thêm phân hệ VI/EN</button>
</EditorPanel>
      {aligned && <ItemActionRow index={index} total={a.length} onMove={(_, direction) => write({ ...vi, items: moveItem(a, index, direction) }, { ...en, items: moveItem(b, index, direction) })} onRemove={() => write({ ...vi, items: a.filter((_, i) => i !== index) }, { ...en, items: b.filter((_, i) => i !== index) })} />}
</EditorPanel>}
  </EditorItemTabs>
  return <div className="admin-standard-editor">
    {!aligned && <p role="status">Cấu trúc cũ khác nhau; giữ nguyên dữ liệu trước khi thay đổi cấu trúc.</p>}
    <EditorPanel title="Thiết lập section"><BilingualPanel vi={sectionTitle('vi', vi)} en={sectionTitle('en', en)} /></EditorPanel>
    {editor}
  </div>
}
