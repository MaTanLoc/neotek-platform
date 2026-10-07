import {itemIdentity} from '../../utils/bilingualItems'
import {HomeHeroView} from '../shared/PublicPreviewViews'
import {DraftPreviewPanel} from '../shared/DraftPreviewPanel'
import {heroDraft} from '../../utils/content'
import {CtaRow, EditorActionBar, EditorTabs, EditorItemTabs, BilingualPanel, EditorPanel} from '../shared/EditorPrimitives'
import {useConfirm} from '../../app/ConfirmProvider'
import {useState} from 'react'
import {updateItem} from '../../utils/itemOperations'
import {ImagePositionField} from '../shared/ImagePositionField'
import {SelectField} from '../shared/SelectField'
import {MediaField} from '../shared/MediaField'
import {RichTextField} from '../shared/RichTextField'

const action = { enabled: true, label: '', url: '' }
const emptySlide = { key: '', showContent: true, eyebrow: '', headline: '', description: '', desktopImage: '', mobileImage: '', imagePosition: '', mobileImagePosition: '', overlay: '', contentPosition: '', primaryCta: action, secondaryCta: action }
const tabs = [['content', 'Nội dung'], ['media', 'Hình ảnh'], ['actions', 'Nút hành động'], ['settings', 'Cài đặt']]
const positions = [['left', 'Trái'], ['center', 'Giữa'], ['right', 'Phải']]
const overlays = [['none', 'Không phủ'], ['dark-left', 'Tối bên trái'], ['dark-center', 'Tối ở giữa'], ['dark-right', 'Tối bên phải'], ['dark-full', 'Tối toàn ảnh']]

function HeroPreview({ slide, language }) {
  if (!slide) return <><p className="admin-muted">Chưa có bản nội dung cho ngôn ngữ này.</p></>
  return <><DraftPreviewPanel label={language + ' Hero draft'}><div className="hero-carousel"><HomeHeroView slide={heroDraft(slide)} /></div></DraftPreviewPanel></>
}

export function HeroEditor({
  value,
  onChange,
  pending,
  pairedValue,
  onPairedChange,
  error,
  dirty = false,
  onDiscard,
  onSave,
}) {
  const confirm = useConfirm()
  const [selectedKey, setSelectedKey] = useState(null)
  const [tab, setTab] = useState('content')

  const viSlides = Array.isArray(value?.slides) ? value.slides : []
  const enSlides = Array.isArray(pairedValue?.slides) ? pairedValue.slides : []

  const orderedKeys = [...new Set([
    ...viSlides.map((slide, index) => itemIdentity(slide, index)),
    ...enSlides.map((slide, index) => itemIdentity(slide, index)),
  ])]

  const activeKey = selectedKey && orderedKeys.includes(selectedKey)
    ? selectedKey
    : orderedKeys[0]

  const viIndex = viSlides.findIndex((slide, index) => (itemIdentity(slide, index)) === activeKey)
  const enIndex = enSlides.findIndex((slide, index) => (itemIdentity(slide, index)) === activeKey)
  const viSlide = viIndex >= 0 ? viSlides[viIndex] : null
  const enSlide = enIndex >= 0 ? enSlides[enIndex] : null

  const writeLocales = (nextViSlides, nextEnSlides) => {
    onChange({ ...(value || {}), slides: nextViSlides })
    onPairedChange?.({ ...(pairedValue || {}), slides: nextEnSlides })
  }

  const ensureCounterpart = (slides, sourceSlide, key, insertAt) => {
    const existingIndex = slides.findIndex((slide, index) => (itemIdentity(slide, index)) === key)
    if (existingIndex >= 0) return { slides, index: existingIndex }

    const created = {
      ...emptySlide,
      key,
      showContent: sourceSlide?.showContent ?? true,
      desktopImage: sourceSlide?.desktopImage || '',
      mobileImage: sourceSlide?.mobileImage || '',
      imagePosition: sourceSlide?.imagePosition || '',
      mobileImagePosition: sourceSlide?.mobileImagePosition || '',
      overlay: sourceSlide?.overlay || '',
      contentPosition: sourceSlide?.contentPosition || '',
      primaryCta: {
        ...action,
        url: sourceSlide?.primaryCta?.url || '',
        enabled: sourceSlide?.primaryCta?.enabled !== false,
      },
      secondaryCta: {
        ...action,
        url: sourceSlide?.secondaryCta?.url || '',
        enabled: sourceSlide?.secondaryCta?.enabled !== false,
      },
    }

    const next = [...slides]
    next.splice(Math.min(insertAt, next.length), 0, created)
    return { slides: next, index: Math.min(insertAt, next.length - 1) }
  }

  const updateLocalized = (language, patch) => {
    if (!activeKey) return

    let nextVi = [...viSlides]
    let nextEn = [...enSlides]

    if (language === 'vi') {
      let target = viIndex
      if (target < 0) {
        const ensured = ensureCounterpart(nextVi, enSlide, activeKey, Math.max(enIndex, 0))
        nextVi = ensured.slides
        target = ensured.index
      }
      nextVi = updateItem(nextVi, target, patch)
    } else {
      let target = enIndex
      if (target < 0) {
        const ensured = ensureCounterpart(nextEn, viSlide, activeKey, Math.max(viIndex, 0))
        nextEn = ensured.slides
        target = ensured.index
      }
      nextEn = updateItem(nextEn, target, patch)
    }

    writeLocales(nextVi, nextEn)
  }

  const updateShared = patch => {
    if (!activeKey) return

    let nextVi = [...viSlides]
    let nextEn = [...enSlides]
    let targetVi = viIndex
    let targetEn = enIndex

    if (targetVi < 0) {
      const ensured = ensureCounterpart(nextVi, enSlide, activeKey, Math.max(enIndex, 0))
      nextVi = ensured.slides
      targetVi = ensured.index
    }

    if (targetEn < 0) {
      const ensured = ensureCounterpart(nextEn, viSlide, activeKey, Math.max(viIndex, 0))
      nextEn = ensured.slides
      targetEn = ensured.index
    }

    nextVi = updateItem(nextVi, targetVi, patch)
    nextEn = updateItem(nextEn, targetEn, patch)
    writeLocales(nextVi, nextEn)
  }

  const updateCtaLabel = (language, name, label) => {
    const slide = language === 'vi' ? viSlide : enSlide
    updateLocalized(language, {
      [name]: {
        ...action,
        ...(slide?.[name] || {}),
        label,
      },
    })
  }

  const updateCtaShared = (name, patch) => {
    if (!viSlide || !enSlide) return
    writeLocales(
      updateItem(viSlides, viIndex, { [name]: { ...action, ...viSlide[name], ...patch } }),
      updateItem(enSlides, enIndex, { [name]: { ...action, ...enSlide[name], ...patch } }),
    )
  }

  const addSlide = () => {
    const key = `slide-${Date.now()}`
    const shared = {
      ...emptySlide,
      key,
      primaryCta: { ...action },
      secondaryCta: { ...action },
    }
    writeLocales(
      [...viSlides, { ...shared, primaryCta: { ...action }, secondaryCta: { ...action } }],
      [...enSlides, { ...shared, primaryCta: { ...action }, secondaryCta: { ...action } }],
    )
    setSelectedKey(key)
    setTab('content')
  }

  const removeSlide = async () => {
    if (!activeKey) return
    const number = Math.max(orderedKeys.indexOf(activeKey) + 1, 1)
    if (!await confirm(`Xóa Slide ${number} khỏi cả Tiếng Việt và English?`)) return

    const nextVi = viSlides.filter((slide, index) => (itemIdentity(slide, index)) !== activeKey)
    const nextEn = enSlides.filter((slide, index) => (itemIdentity(slide, index)) !== activeKey)
    writeLocales(nextVi, nextEn)

    const nextKeys = orderedKeys.filter(key => key !== activeKey)
    setSelectedKey(nextKeys[Math.max(0, number - 2)] || nextKeys[0] || null)
  }

  const selectFor = (key, label, options) => {
    const current = viSlide?.[key] ?? enSlide?.[key] ?? ''
    return <label key={key}>{label}<SelectField label={label} value={current} onChange={next => updateShared({ [key]: next })} options={[['', 'Theo m\u1eb7c \u0111\u1ecbnh'], ...options]} disabled={pending} /></label>
  }

  const structureAligned =
    viSlides.length === enSlides.length &&
    viSlides.every((slide, index) => slide?.key && slide.key === enSlides[index]?.key)

  const missingRequired = [...viSlides, ...enSlides].some(slide => slide.showContent !== false && !slide.headline?.trim())
  const canSaveBilingual = !missingRequired

  const localized = (language, slide) => <>
    <label>Dòng giới thiệu<input value={slide?.eyebrow || ''} onChange={event => updateLocalized(language, { eyebrow: event.target.value })} /></label>
    <label>Tiêu đề chính *<textarea rows={2} required value={slide?.headline || ''} onChange={event => updateLocalized(language, { headline: event.target.value })} /></label>
    <RichTextField label="Mô tả" disabled={pending} value={slide?.description || ''} onChange={description => updateLocalized(language, { description })} />
  </>
  return <div className="admin-standard-editor">
    {!structureAligned && <p className="admin-alert" role="status">Cấu trúc VI/EN cũ khác nhau. Bạn vẫn có thể sửa nội dung; cần đồng bộ trước khi thêm hoặc xóa slide.</p>}
    {activeKey ? <EditorItemTabs items={orderedKeys.map((key, index) => [key, 'Slide ' + (index + 1)])} value={activeKey} onChange={setSelectedKey} onAdd={addSlide} disabled={pending || !structureAligned}>
      <EditorTabs value={tab} onChange={setTab} tabs={tabs.map(([key, title]) => [key, title, <>
        {key === 'content' && <BilingualPanel vi={<>{localized('vi', viSlide)}</>} en={<>{localized('en', enSlide)}</>} />}

        {key === 'media' && <EditorPanel media>
          {[['desktopImage', 'Ảnh máy tính'], ['mobileImage', 'Ảnh điện thoại']].map(([key, label]) =>
            <EditorPanel key={key}>
              <MediaField
                key={`${activeKey}-${key}`}
                label={label}
                disabled={pending}
                value={viSlide?.[key] || enSlide?.[key] || ''}
                onChange={next => updateShared({ [key]: next })}
              />
            </EditorPanel>
          )}
        </EditorPanel>}

        {key === 'actions' && <div className="admin-editor-group">{['primaryCta', 'secondaryCta'].map(name => <CtaRow key={name} kind={name === 'primaryCta' ? 'N\u00fat ch\u00ednh' : 'N\u00fat ph\u1ee5'} vi={viSlide?.[name]} en={enSlide?.[name]} disabled={pending} enabled={(viSlide?.[name]?.enabled ?? enSlide?.[name]?.enabled) !== false} onLabelChange={(language, label) => updateCtaLabel(language, name, label)} onSharedChange={patch => updateCtaShared(name, patch)} />)}</div>}

        {key === 'settings' && <>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={(viSlide?.showContent ?? enSlide?.showContent) !== false}
              onChange={event => updateShared({ showContent: event.target.checked })}
            />
            Hiển thị nội dung trên slide
          </label>
          <div className="admin-form-grid admin-form-grid--two">
            <ImagePositionField label="Vị trí ảnh máy tính" value={viSlide?.imagePosition ?? enSlide?.imagePosition ?? ''} disabled={pending} onChange={imagePosition => updateShared({ imagePosition })} />
            <ImagePositionField label="Vị trí ảnh điện thoại" value={viSlide?.mobileImagePosition ?? enSlide?.mobileImagePosition ?? ''} disabled={pending} onChange={mobileImagePosition => updateShared({ mobileImagePosition })} />
            {selectFor('overlay', 'Lớp phủ ảnh', overlays)}
            {selectFor('contentPosition', 'Vị trí nội dung', positions)}
          </div>
        </>}
      </>])} />
      <EditorPanel title="Xem trước"><BilingualPanel vi={<HeroPreview slide={viSlide} language="vi" />} en={<HeroPreview slide={enSlide} language="en" />} /></EditorPanel>

      {!canSaveBilingual && <small className="admin-form-error">Mỗi banner cần tiêu đề ở cả VI và EN.</small>}


    </EditorItemTabs> : <EditorItemTabs items={[]} value="" onChange={setSelectedKey} onAdd={addSlide} disabled={pending || !structureAligned} />}
    <EditorActionBar dirty={dirty} pending={pending} onDiscard={onDiscard} onSave={onSave} onDelete={activeKey ? removeSlide : undefined} deleteLabel="Xóa slide" deleteDisabled={!structureAligned} saveDisabled={!canSaveBilingual} error={error} />
  </div>
}
