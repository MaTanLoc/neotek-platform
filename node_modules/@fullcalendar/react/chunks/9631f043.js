import { intersectRanges, addMs, addDays, rangeContainsMarker, formatDayString, joinDateTimeFormatParts, diffDays } from '@full-ui/headless-calendar';
import { O as expandRecurring, s as sliceEventStore, an as fabricateEventRange, g as guid, z as EventImpl, aj as setElEventRange, ai as createAriaClickAttrs, l as formatWithOrdinals, a2 as buildRangeEdgeOutput, c as createFormatter, ad as getEventRangeMeta, ao as flatArray, ap as flatMapArray, ac as sortEventSegs, aq as buildEventRangeKey } from './1b9384f3.js';
import { m as memoize, B as BaseComponent, e as watchWidth, s as setRef, a as generateClassName, C as ContentContainer, b as memoizeObjArg, h as watchSize, i as isDimsEqual, w as watchHeight, d as afterSize, r as renderText$1, g as getIsHeightAuto } from './8563f14c.js';
import { g as getDateMeta, c as buildDateStr, b as buildNavLinkAttrs, W as WEEKDAY_ONLY_FORMAT, D as DateComponent, f as findWeekdayText, a as findDayNumberText, e as findMonthText, S as StandardEvent } from './bdcb9f0b.js';
import { i as isMajorUnit, c as computeMajorUnit } from './1b1778bb.js';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { createRef, Component, createElement } from 'react';
import { j as joinClassNames } from './e3a08dde.js';
import { c as classNames } from './f408d713.js';
import { createPortal } from 'react-dom';
import { b as getEventTargetViaRoot, c as computeElIsRtl, g as getAppendableRoot, a as applyStyle } from './300190e3.js';
import { f as computeClippedClientRect } from './e030f505.js';

class Slicer {
    constructor() {
        this.sliceBusinessHours = memoize(this._sliceBusinessHours);
        this.sliceDateSelection = memoize(this._sliceDateSpan);
        this.sliceEventStore = memoize(this._sliceEventStore);
        this.sliceEventDrag = memoize(this._sliceInteraction);
        this.sliceEventResize = memoize(this._sliceInteraction);
        this.forceDayIfListItem = false; // hack
    }
    intersectDateSpan(dateSpan, activeRange, ...extraArgs) {
        const activeDateSpanRange = intersectRanges(dateSpan.range, activeRange);
        if (activeDateSpanRange) {
            const slicedDateSpan = { ...dateSpan, range: activeDateSpanRange };
            if (activeDateSpanRange.start.valueOf() !== dateSpan.range.start.valueOf()) {
                delete slicedDateSpan.instantStartMs;
            }
            if (activeDateSpanRange.end.valueOf() !== dateSpan.range.end.valueOf()) {
                delete slicedDateSpan.instantEndMs;
            }
            return slicedDateSpan;
        }
        return null;
    }
    sliceDateSpan(dateSpan, ...extraArgs) {
        return this.sliceRange(dateSpan.range, ...extraArgs);
    }
    sliceProps(props, dateProfile, nextDayThreshold, context, ...extraArgs) {
        let { eventUiBases } = props;
        let eventSegs = this.sliceEventStore(props.eventStore, eventUiBases, dateProfile, nextDayThreshold, ...extraArgs);
        return {
            dateSelectionSegs: this.sliceDateSelection(props.dateSelection, dateProfile, nextDayThreshold, eventUiBases, context, ...extraArgs),
            businessHourSegs: this.sliceBusinessHours(props.businessHours, dateProfile, nextDayThreshold, context, ...extraArgs),
            fgEventSegs: eventSegs.fg,
            bgEventSegs: eventSegs.bg,
            eventDrag: this.sliceEventDrag(props.eventDrag, eventUiBases, dateProfile, nextDayThreshold, ...extraArgs),
            eventResize: this.sliceEventResize(props.eventResize, eventUiBases, dateProfile, nextDayThreshold, ...extraArgs),
            eventSelection: props.eventSelection,
        }; // TODO: give interactionSegs?
    }
    sliceNowDate(// does not memoize
    date, dateProfile, nextDayThreshold, context, ...extraArgs) {
        return this._sliceDateSpan({ range: { start: date, end: addMs(date, 1) }, allDay: false }, // add 1 ms, protect against null range
        dateProfile, nextDayThreshold, {}, context, ...extraArgs);
    }
    _sliceBusinessHours(businessHours, dateProfile, nextDayThreshold, context, ...extraArgs) {
        if (!businessHours) {
            return [];
        }
        return this._sliceEventStore(expandRecurring(businessHours, computeActiveRange(dateProfile, Boolean(nextDayThreshold)), context), {}, dateProfile, nextDayThreshold, ...extraArgs).bg;
    }
    _sliceEventStore(eventStore, eventUiBases, dateProfile, nextDayThreshold, ...extraArgs) {
        if (eventStore) {
            let rangeRes = sliceEventStore(eventStore, eventUiBases, computeActiveRange(dateProfile, Boolean(nextDayThreshold)), nextDayThreshold);
            return {
                bg: this.sliceEventRanges(rangeRes.bg, extraArgs),
                fg: this.sliceEventRanges(rangeRes.fg, extraArgs),
            };
        }
        return { bg: [], fg: [] };
    }
    _sliceInteraction(interaction, eventUiBases, dateProfile, nextDayThreshold, ...extraArgs) {
        if (!interaction) {
            return null;
        }
        let rangeRes = sliceEventStore(interaction.mutatedEvents, eventUiBases, computeActiveRange(dateProfile, Boolean(nextDayThreshold)), nextDayThreshold);
        return {
            segs: this.sliceEventRanges(rangeRes.fg, extraArgs),
            affectedInstances: interaction.affectedEvents.instances,
            isEvent: interaction.isEvent,
        };
    }
    _sliceDateSpan(dateSpan, dateProfile, nextDayThreshold, eventUiBases, context, ...extraArgs) {
        if (!dateSpan) {
            return [];
        }
        let activeRange = computeActiveRange(dateProfile, Boolean(nextDayThreshold));
        let slicedDateSpan = this.intersectDateSpan(dateSpan, activeRange, ...extraArgs);
        if (slicedDateSpan) {
            dateSpan = slicedDateSpan;
            let eventRange = fabricateEventRange(dateSpan, eventUiBases, context);
            let segs = this.sliceDateSpan(dateSpan, ...extraArgs);
            for (let seg of segs) {
                seg.eventRange = eventRange;
            }
            return segs;
        }
        return [];
    }
    /*
    "complete" seg means it has component and eventRange
    */
    sliceEventRanges(eventRanges, extraArgs) {
        let segs = [];
        for (let eventRange of eventRanges) {
            segs.push(...this.sliceEventRange(eventRange, extraArgs));
        }
        return segs;
    }
    /*
    "complete" seg means it has component and eventRange
    */
    sliceEventRange(eventRange, extraArgs) {
        let dateRange = eventRange.range;
        // hack to make multi-day events that are being force-displayed as list-items to take up only one day
        if (this.forceDayIfListItem && eventRange.ui.display === 'list-item') {
            dateRange = {
                start: dateRange.start,
                end: addDays(dateRange.start, 1),
            };
        }
        let segs = this.sliceRange(dateRange, ...extraArgs); // !!!
        for (let seg of segs) {
            seg.eventRange = eventRange;
            seg.isStart = eventRange.isStart && seg.isStart;
            seg.isEnd = eventRange.isEnd && seg.isEnd;
        }
        return segs;
    }
}
/*
for incorporating slotMinTime/slotMaxTime if appropriate
TODO: should be part of DateProfile!
TimelineDateProfile already does this btw
*/
function computeActiveRange(dateProfile, isComponentAllDay) {
    let range = dateProfile.activeRange;
    if (isComponentAllDay) {
        return range;
    }
    return {
        start: addMs(range.start, dateProfile.slotMinTime.milliseconds),
        end: addMs(range.end, dateProfile.slotMaxTime.milliseconds - 864e5), // 864e5 = ms in a day
    };
}

class DayTableModel {
    constructor(daySeries, breakOnWeeks, dateEnv, majorUnit = '', activeRange) {
        this.daySeries = daySeries;
        this.dateEnv = dateEnv;
        this.majorUnit = majorUnit;
        this.activeRange = activeRange;
        let { dates } = daySeries;
        let daysPerRow;
        let firstDay;
        let rowCount;
        if (breakOnWeeks) {
            // count columns until the day-of-week repeats
            firstDay = dates[0].getUTCDay();
            for (daysPerRow = 1; daysPerRow < dates.length; daysPerRow += 1) {
                if (dates[daysPerRow].getUTCDay() === firstDay) {
                    break;
                }
            }
            rowCount = Math.ceil(dates.length / daysPerRow);
        }
        else {
            rowCount = 1;
            daysPerRow = dates.length;
        }
        this.rowCount = rowCount;
        this.colCount = daysPerRow;
        this.cellRows = this.buildCells();
        this.headerDates = this.buildHeaderDates();
    }
    buildCells() {
        let rows = [];
        for (let row = 0; row < this.rowCount; row += 1) {
            let cells = [];
            for (let col = 0; col < this.colCount; col += 1) {
                cells.push(this.buildCell(row, col));
            }
            rows.push(cells);
        }
        return rows;
    }
    buildCell(row, col) {
        let date = this.daySeries.dates[row * this.colCount + col];
        return {
            key: date.toISOString(),
            date,
            isMajor: this.cellIsMajor(date),
            isDisabled: this.activeRange === null || (this.activeRange !== undefined && !rangeContainsMarker(this.activeRange, date)),
        };
    }
    cellIsMajor(dateMarker) {
        return this.majorUnit ? isMajorUnit(dateMarker, this.majorUnit, this.dateEnv) : false;
    }
    buildHeaderDates() {
        let dates = [];
        for (let col = 0; col < this.colCount; col += 1) {
            dates.push(this.cellRows[0][col].date);
        }
        return dates;
    }
}
function buildDayGridRanges(seriesRange, daysPerRow) {
    let ranges = [];
    if (seriesRange) {
        const { start, end } = seriesRange;
        let index = start;
        while (index < end) {
            let row = Math.floor(index / daysPerRow);
            let nextIndex = Math.min((row + 1) * daysPerRow, end);
            ranges.push({
                row,
                start: index % daysPerRow,
                end: (nextIndex - 1) % daysPerRow + 1,
                isStart: seriesRange.isStart && index === start,
                isEnd: seriesRange.isEnd && nextIndex === end,
            });
            index = nextIndex;
        }
    }
    return ranges;
}

class DayTableSlicer extends Slicer {
    constructor() {
        super(...arguments);
        this.forceDayIfListItem = true;
    }
    sliceRange(dateRange, dayTableModel) {
        return buildDayGridRanges(dayTableModel.daySeries.sliceRange(dateRange), dayTableModel.colCount);
    }
}
class DaySeriesSlicer extends Slicer {
    constructor() {
        super(...arguments);
        this.forceDayIfListItem = true;
    }
    sliceRange(dateRange, daySeries) {
        return buildDayGridRanges(daySeries.sliceRange(dateRange), daySeries.cnt);
    }
}

// TODO: converge types with DayTableCell and DayCellContainer (the component) and refineRenderProps
// the generation of DayTableCell will be distinct (for the BODY cells)
// but can share some of the same types/utils
// Date Cells
// -------------------------------------------------------------------------------------------------
const firstSunday = new Date(259200000);
function buildDateRowConfigs(dates, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, // TODO: rename to dateHeaderFormat?
context) {
    const rowConfig = buildDateRowConfig(dates, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, context);
    const majorUnit = computeMajorUnit(dateProfile, context.dateEnv);
    // HACK mutate isMajor
    // Skip 'day' majorUnit: when each header cell IS a day, every cell would match,
    // so there's no meaningful boundary to highlight (unlike timeline slots which can be sub-day).
    if (datesRepDistinctDays && majorUnit !== 'day') {
        for (const dataConfig of rowConfig.dataConfigs) {
            if (isMajorUnit(dataConfig.dateMarker, majorUnit, context.dateEnv)) {
                dataConfig.renderProps.isMajor = true;
            }
        }
    }
    return [rowConfig];
}
/*
Should this receive resource data attributes?
Or ResourceApi object itself?
*/
function buildDateRowConfig(dateMarkers, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, // TODO: rename to dateHeaderFormat?
context, colSpan, isMajorMod, totalDateCnt) {
    return {
        isDateRow: true,
        renderConfig: buildDateRenderConfig(dayHeaderFormat, datesRepDistinctDays, context),
        dataConfigs: buildDateDataConfigs(dateMarkers, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, context, colSpan, undefined, undefined, undefined, undefined, isMajorMod, totalDateCnt)
    };
}
/*
For header cells: how to connect w/ custom rendering
Applies to all cells in a row
*/
function buildDateRenderConfig(dayHeaderFormat, datesRepDistinctDays, context) {
    const { options } = context;
    return {
        generatorName: 'dayHeaderContent',
        customGenerator: options.dayHeaderContent,
        classNameGenerator: options.dayHeaderClass,
        innerClassNameGenerator: options.dayHeaderInnerClass,
        didMount: options.dayHeaderDidMount,
        willUnmount: options.dayHeaderWillUnmount,
        align: options.dayHeaderAlign,
        sticky: options._dayHeaderSticky,
        dayHeaderFormat,
        datesRepDistinctDays,
    };
}
const dowDates = [];
for (let dow = 0; dow < 7; dow++) {
    dowDates.push(addDays(new Date(259200000), dow)); // start with Sun, 04 Jan 1970 00:00:00 GMT)
}
/*
For header cells: data
*/
function buildDateDataConfigs(dateMarkers, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, // TODO: rename to dateHeaderFormat?
context, colSpan = 1, keyPrefix = '', extraRenderProps = {}, // TODO
extraAttrs = {}, // TODO
className = '', isMajorMod, 
// how many dates the VIEW has, which is only different when a caller renders a subset:
// resource views build one date row per resource, and per-date filtering can drop dates
// that have no resources. nav links key off the view's count, not the subset's
totalDateCnt = dateMarkers.length) {
    const { dateEnv, viewApi, options } = context;
    return datesRepDistinctDays
        ? dateMarkers.map((dateMarker, i) => {
            const dateMeta = getDateMeta(dateMarker, dateEnv, dateProfile, todayRange);
            const isMajor = isMajorMod != null && !(i % isMajorMod);
            const hasNavLink = options.navLinks && !dateMeta.isDisabled &&
                totalDateCnt > 1; // don't show navlink to day if only one day
            const renderProps = {
                ...dateMeta,
                ...extraRenderProps,
                isMajor,
                isSticky: false, // HACK. gets overridden
                inPopover: false,
                hasNavLink,
                view: viewApi,
            };
            const fullDateStr = buildDateStr(context, dateMarker);
            // for DayGridHeaderCell
            return {
                key: keyPrefix + dateMarker.toUTCString(),
                dateMarker,
                renderProps,
                attrs: {
                    'aria-label': fullDateStr,
                    ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}), // TODO: assign undefined for nonexistent
                    'data-date': formatDayString(dateMarker),
                    ...extraAttrs,
                },
                // for navlink
                innerAttrs: hasNavLink
                    ? buildNavLinkAttrs(context, dateMarker, undefined, fullDateStr)
                    : { 'aria-hidden': true }, // label already on cell
                colSpan,
                hasNavLink,
                className,
            };
        })
        : dateMarkers.map((dateMarker, i) => {
            const dow = dateMarker.getUTCDay();
            const normDate = addDays(firstSunday, dow);
            const dateMeta = {
                date: dateEnv.toDate(dateMarker),
                dow,
                isDisabled: false,
                isFuture: false,
                isPast: false,
                isToday: false,
                isOther: false,
            };
            const isMajor = isMajorMod != null && !(i % isMajorMod);
            const renderProps = {
                ...dateMeta,
                date: dowDates[dow],
                isMajor,
                isSticky: false, // HACK. gets overridden
                inPopover: false,
                hasNavLink: false,
                view: viewApi,
                ...extraRenderProps,
            };
            const fullWeekDayStr = joinDateTimeFormatParts(dateEnv.formatToParts(normDate, WEEKDAY_ONLY_FORMAT));
            // for DayGridHeaderCell
            return {
                key: keyPrefix + String(dow),
                dateMarker,
                renderProps,
                attrs: {
                    'aria-label': fullWeekDayStr,
                    ...extraAttrs,
                },
                // NOT a navlink
                innerAttrs: {
                    'aria-hidden': true, // label already on cell
                },
                colSpan,
                className,
            };
        });
}

/*
TODO: make API where createRefMap() called
*/
class RefMap {
    constructor(masterCallback, ignoreDeletes = false) {
        this.masterCallback = masterCallback;
        this.ignoreDeletes = ignoreDeletes;
        this.rev = '';
        this.current = new Map();
        this.callbacks = new Map;
        this.handleValue = (val, key) => {
            let { current, callbacks } = this;
            let priorExists = current.has(key);
            let priorVal = priorExists ? current.get(key) : null;
            let anyChange = false;
            // null signals deletion
            if (val === null) {
                if (priorExists && !this.ignoreDeletes) {
                    current.delete(key);
                    callbacks.delete(key);
                    anyChange = true;
                }
            }
            else {
                anyChange = priorVal !== val;
                current.set(key, val);
            }
            if (anyChange) {
                this.rev = guid();
                if (this.masterCallback) {
                    this.masterCallback(val, key, priorVal);
                }
            }
        };
    }
    createRef(key) {
        let refCallback = this.callbacks.get(key);
        if (!refCallback) {
            refCallback = (val) => {
                this.handleValue(val, key);
            };
            this.callbacks.set(key, refCallback);
        }
        return refCallback;
    }
}

class Ruler extends BaseComponent {
    constructor() {
        super(...arguments);
        this.elRef = createRef();
    }
    render() {
        return (jsx("div", { ref: this.elRef }));
    }
    componentDidMount() {
        this._isUnmounting = false;
        const { props } = this;
        const el = this.elRef.current;
        this.disconnectWidth = watchWidth(el, (width) => {
            if (this._isUnmounting)
                return;
            setRef(props.widthRef, width);
        });
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.disconnectWidth();
        const { props } = this;
        if (props.widthRef) {
            setRef(props.widthRef, null);
        }
    }
}

/** Identifies a DayGrid seg by event instance and start, remaining stable if its end changes. */
function getDayGridSegKey(seg) {
    return `${seg.eventRange.instance.instanceId}:${seg.start}`;
}
// DayGridRange utils (TODO: move)
// -------------------------------------------------------------------------------------------------
function splitSegsByRow(segs, rowCount) {
    const byRow = [];
    for (let row = 0; row < rowCount; row++) {
        byRow[row] = [];
    }
    for (const seg of segs) {
        byRow[seg.row].push(seg);
    }
    return byRow;
}
function splitInteractionByRow(ui, rowCount) {
    const byRow = [];
    if (!ui) {
        for (let row = 0; row < rowCount; row++) {
            byRow[row] = null;
        }
    }
    else {
        for (let row = 0; row < rowCount; row++) {
            byRow[row] = {
                affectedInstances: ui.affectedInstances,
                isEvent: ui.isEvent,
                segs: [],
            };
        }
        for (const seg of ui.segs) {
            byRow[seg.row].segs.push(seg);
        }
    }
    return byRow;
}

class BgEvent extends BaseComponent {
    constructor() {
        super(...arguments);
        // memo
        this.buildPublicEvent = memoize((context, eventDef, eventInstance) => new EventImpl(context, eventDef, eventInstance));
        this.handleEl = (el) => {
            this.el = el;
            if (el) {
                setElEventRange(el, this.props.eventRange);
            }
        };
    }
    render() {
        const { props, context } = this;
        const { eventRange } = props;
        const { options } = context;
        const eventUi = eventRange.ui;
        const eventApi = this.buildPublicEvent(context, eventRange.def, eventRange.instance);
        const subcontentRenderProps = {
            event: eventApi,
            isNarrow: props.isNarrow || false,
            isShort: props.isShort || false,
        };
        const renderProps = {
            event: eventApi,
            view: context.viewApi,
            timeText: '', // never display time
            color: eventUi.color || options.backgroundEventColor,
            contrastColor: eventUi.contrastColor,
            isDraggable: false,
            isStartResizable: false,
            isEndResizable: false,
            isMirror: false,
            isStart: props.isStart,
            isEnd: props.isEnd,
            isFirst: false,
            isLast: false,
            isPast: props.isPast,
            isFuture: props.isFuture,
            isToday: props.isToday,
            isSelected: false,
            isDragging: false,
            isResizing: false,
            isInteractive: false,
            level: 0,
            isNarrow: props.isNarrow || false,
            isShort: props.isShort || false,
            timeClass: '', // never display time
            titleClass: generateClassName(options.backgroundEventTitleClass, subcontentRenderProps),
            options: { eventOverlap: Boolean(options.eventOverlap) },
        };
        // does not include backgroundEventClass.. added below
        const outerClassName = joinClassNames(eventUi.className, classNames.fill, classNames.internalEvent, classNames.internalBgEvent, props.isVertical ? classNames.flexCol : classNames.flexRow);
        const innerClassName = joinClassNames(generateClassName(options.backgroundEventInnerClass, renderProps), classNames.liquid);
        return (jsx(ContentContainer, { tag: 'div', className: outerClassName, style: {
                '--fc-event-color': renderProps.color,
                '--fc-event-contrast-color': renderProps.contrastColor,
            }, defaultGenerator: renderInnerContent, elRef: this.handleEl, renderProps: renderProps, generatorName: "backgroundEventContent", customGenerator: options.backgroundEventContent, classNameGenerator: options.backgroundEventClass, didMount: options.backgroundEventDidMount, willUnmount: options.backgroundEventWillUnmount, children: (InnerContent) => (jsx(InnerContent, { tag: 'div', className: innerClassName })) }));
    }
    componentDidUpdate(prevProps) {
        if (this.el && this.props.eventRange !== prevProps.eventRange) {
            setElEventRange(this.el, this.props.eventRange);
        }
    }
}
function renderInnerContent(props) {
    let { title } = props.event;
    return title && (jsx("div", { className: props.titleClass, children: props.event.title }));
}
// Other types of fills
// -------------------------------------------------------------------------------------------------
function renderFill(fillType, options) {
    return (jsx("div", { className: joinClassNames(fillType === 'non-business' ? options.nonBusinessHoursClass :
            fillType === 'highlight' ? options.highlightClass : undefined, classNames.fill) }));
}

// Temporary stand-in for lateral cell border widths.
// These should eventually be measured from the DOM.
const COL_BORDER_WIDTH = 1;
// Temporary stand-in for row-bottom border widths.
// These should eventually be measured from the DOM.
const ROW_BORDER_WIDTH = 1;

const SPACE_FROM_VIEWPORT = 10;
class MorePopover extends DateComponent {
    constructor() {
        super(...arguments);
        // memo
        this.getDateMeta = memoize(getDateMeta);
        this.closeRef = createRef();
        this.focusStartRef = createRef();
        this.focusEndRef = createRef();
        this.handleRootEl = (rootEl) => {
            this.rootEl = rootEl;
            if (rootEl) {
                this.context.registerInteractiveComponent(this, {
                    el: rootEl,
                    useEventCenter: false,
                });
            }
            else {
                this.context.unregisterInteractiveComponent(this);
            }
        };
        // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
        this.handleDocumentMouseDown = (ev) => {
            // only hide the popover if the click happened outside the popover
            const target = getEventTargetViaRoot(ev);
            if (!this.rootEl.contains(target)) {
                this.handleClose();
            }
        };
        this.handleDocumentKeyDown = (ev) => {
            if (ev.key === 'Escape') {
                this.handleClose();
            }
        };
        // for many different close techniques
        // cannot accept params because might receive a browser Event
        this.handleClose = () => {
            let { onClose } = this.props;
            if (onClose) {
                onClose();
            }
        };
    }
    render() {
        let { props, context } = this;
        let { options, dateEnv, viewApi } = context;
        let { startDate, todayRange, dateProfile } = props;
        let dateMeta = this.getDateMeta(startDate, dateEnv, dateProfile, todayRange);
        let textParts = dateEnv.formatToParts(startDate, options.popoverFormat);
        let text = joinDateTimeFormatParts(textParts);
        const dayHeaderRenderProps = {
            ...dateMeta,
            isMajor: false,
            isNarrow: false,
            isSticky: false,
            inPopover: true,
            level: 0,
            hasNavLink: false,
            text,
            textParts,
            get weekdayText() { return findWeekdayText(textParts); },
            get dayNumberText() { return findDayNumberText(textParts); },
            view: viewApi,
            // TODO: should know about the resource!
        };
        const dayCellRenderProps = {
            ...dateMeta,
            isMajor: false,
            isNarrow: false,
            inPopover: true,
            hasNavLink: false,
            get weekdayText() { return findWeekdayText(textParts); },
            get dayNumberText() { return findDayNumberText(textParts); },
            get monthText() { return findMonthText(textParts); },
            view: viewApi,
            text: '',
            textParts: [],
            options: { businessHours: Boolean(options.businessHours) },
        };
        const fullDateStr = formatDayString(startDate);
        /*
        TODO: DRY with TimelineHeaderCell
        */
        const { dayHeaderAlign } = options;
        const align = typeof dayHeaderAlign === 'function'
            ? dayHeaderAlign({ level: 0, inPopover: true, isNarrow: false })
            : dayHeaderAlign;
        const isRtl = computeElIsRtl(props.alignEl);
        return createPortal(jsxs("div", { "data-date": fullDateStr, id: props.id, role: 'dialog', "aria-labelledby": props.titleId, className: joinClassNames(options.popoverClass, classNames.flexCol, classNames.popoverZ, classNames.abs, classNames.borderBoxRoot, classNames.internalPopover), style: {
                // positioning is mutated directly in updateSize, HOWEVER, we don't want popover to start
                // low on screen because might cause unnecessary scrollbars
                top: 0,
                left: 0,
            }, 
            // HACK because of portal
            dir: isRtl ? 'rtl' : undefined, "data-color-scheme": options.colorScheme || undefined, ref: this.handleRootEl, children: [jsx("div", { tabIndex: 0, style: { outline: 'none' }, ref: this.focusStartRef }), jsxs("div", { className: joinClassNames(generateClassName(options.dayHeaderClass, dayHeaderRenderProps), classNames.flexCol, classNames.borderlessX, classNames.borderlessTop, align === 'center' ? classNames.alignCenter :
                        align === 'end' ? classNames.alignEnd :
                            classNames.alignStart), children: [jsx("div", { children: jsx(ContentContainer, { tag: "div", attrs: {
                                    id: props.titleId,
                                    // NOTE: more-popover never has nav-links
                                }, generatorName: "dayHeaderContent", renderProps: dayHeaderRenderProps, customGenerator: options.dayHeaderContent, defaultGenerator: renderText, classNameGenerator: options.dayHeaderInnerClass, didMount: options.dayHeaderDidMount, willUnmount: options.dayHeaderWillUnmount }) }), jsx(ContentContainer, { tag: 'button', attrs: {
                                'aria-label': options.closeHint,
                                ...createAriaClickAttrs(this.handleClose)
                            }, elRef: this.closeRef, className: joinClassNames(options.popoverCloseClass, classNames.flexRow, classNames.cursorPointer), renderProps: {}, customGenerator: options.popoverCloseContent, generatorName: 'popoverCloseContent' })] }), jsx("div", { className: joinClassNames(generateClassName(options.dayCellClass, dayCellRenderProps), classNames.flexCol, classNames.borderless), children: jsx("div", { className: generateClassName(options.dayCellInnerClass, dayCellRenderProps), children: props.children }) }), jsx("div", { tabIndex: 0, style: { outline: 'none' }, ref: this.focusEndRef })] }), getAppendableRoot(props.alignEl));
    }
    queryHit(isRtl, positionLeft, positionTop, elWidth, elHeight) {
        let { rootEl, props } = this;
        if (positionLeft >= 0 && positionLeft < elWidth &&
            positionTop >= 0 && positionTop < elHeight) {
            return {
                dateProfile: props.dateProfile,
                dateSpan: {
                    allDay: !props.forceTimed,
                    range: {
                        start: props.startDate,
                        end: props.endDate,
                    },
                    ...props.dateSpanProps,
                },
                getDayEl: () => rootEl,
                rect: {
                    left: 0,
                    top: 0,
                    right: elWidth,
                    bottom: elHeight,
                },
                layer: 1, // important when comparing with hits from other components
            };
        }
        return null;
    }
    componentDidMount() {
        document.addEventListener('mousedown', this.handleDocumentMouseDown);
        document.addEventListener('keydown', this.handleDocumentKeyDown);
        this.focusStartRef.current.addEventListener('focus', this.handleClose);
        this.focusEndRef.current.addEventListener('focus', this.handleClose);
        this.closeRef.current.focus({ preventScroll: true });
        this.updateSize();
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleDocumentMouseDown);
        document.removeEventListener('keydown', this.handleDocumentKeyDown);
        this.focusStartRef.current.removeEventListener('focus', this.handleClose);
        this.focusEndRef.current.removeEventListener('focus', this.handleClose);
    }
    updateSize() {
        let { alignEl, alignParentTop } = this.props;
        let { rootEl: popoverEl } = this;
        const isRtl = computeElIsRtl(alignEl);
        // position relative to viewport
        const alignmentRect = computeClippedClientRect(alignEl);
        if (alignmentRect) {
            let popoverDims = popoverEl.getBoundingClientRect();
            // position relative to viewport
            let popoverVPTop = alignParentTop
                // HACK: subtract 1 for DayGrid, which has borders on row-bottom. Only view that uses alignParentTop
                ? alignEl.closest(alignParentTop).getBoundingClientRect().top - ROW_BORDER_WIDTH
                : alignmentRect.top;
            let popoverVPLeft = isRtl ? alignmentRect.right - popoverDims.width : alignmentRect.left;
            // constrain
            popoverVPTop = Math.max(popoverVPTop, SPACE_FROM_VIEWPORT);
            popoverVPLeft = Math.min(popoverVPLeft, document.documentElement.clientWidth - SPACE_FROM_VIEWPORT - popoverDims.width);
            popoverVPLeft = Math.max(popoverVPLeft, SPACE_FROM_VIEWPORT);
            const { offsetParent } = popoverEl;
            // final popover position, relative to offsetParent
            let top;
            let left;
            // TODO: account for RTL
            if (!offsetParent || offsetParent === document.body) {
                top = popoverVPTop + window.scrollY;
                left = popoverVPLeft + window.scrollX;
            }
            else {
                const offsetParentRect = offsetParent.getBoundingClientRect();
                top = popoverVPTop - offsetParentRect.top + offsetParent.scrollTop;
                left = popoverVPLeft - offsetParentRect.left + offsetParent.scrollLeft;
            }
            applyStyle(popoverEl, { top, left });
        }
    }
}
// TODO: DRY
function renderText(renderProps) {
    return renderProps.text;
}

// NOTE: numeric span algebra (intersection, subtraction, unions, sorted
// searches) lives in seg-placement/span-math.ts; CoordRange is structurally
// identical to its LateralSpan.
// { eventRange }
// -------------------------------------------------------------------------------------------------
function computeEarliestStart(segs) {
    return segs.reduce(pickEarliestStart).eventRange.range.start;
}
function computeLatestEnd(segs) {
    return segs.reduce(pickLatestEnd).eventRange.range.end;
}
function pickEarliestStart(r0, r1) {
    return r0.eventRange.range.start < r1.eventRange.range.start ? r0 : r1;
}
function pickLatestEnd(r0, r1) {
    return r0.eventRange.range.end > r1.eventRange.range.end ? r0 : r1;
}

/*
Renders only the themed, customizable more-link presentation. Interaction,
popover state, and date-range semantics belong to MoreLinkContainer.
*/
class MoreLinkTrigger extends BaseComponent {
    render() {
        const { props, context } = this;
        const { options } = context;
        const renderProps = buildMoreLinkRenderProps(props.num, props.isNarrow, props.isMicro, props.display, context);
        return (jsx(ContentContainer, { tag: 'div', elRef: props.elRef, className: joinClassNames(generateClassName(props.display === 'row'
                ? options.rowMoreLinkClass
                : options.columnMoreLinkClass, renderProps), props.className, props.display === 'row'
                ? classNames.flexRow
                : classNames.flexCol, classNames.internalMoreLink, classNames.cursorPointer), style: props.style, attrs: props.attrs, renderProps: renderProps, generatorName: "moreLinkContent", customGenerator: options.moreLinkContent, defaultGenerator: renderMoreLinkText, classNameGenerator: options.moreLinkClass, didMount: props.didMount, willUnmount: props.willUnmount, children: (InnerContent) => (jsx(InnerContent, { tag: 'div', className: joinClassNames(generateClassName(options.moreLinkInnerClass, renderProps), generateClassName(props.display === 'row'
                    ? options.rowMoreLinkInnerClass
                    : options.columnMoreLinkInnerClass, renderProps), props.display === 'row'
                    ? classNames.stickyS
                    : classNames.stickyT) })) }));
    }
}
class MoreLinkContainer extends BaseComponent {
    constructor() {
        super(...arguments);
        this.state = {
            isPopoverOpen: false,
        };
        this.handleLinkEl = (linkEl) => {
            this.linkEl = linkEl;
            if (this.props.elRef) {
                setRef(this.props.elRef, linkEl);
            }
        };
        this.handleClick = (ev) => {
            let { props, context } = this;
            let { dateEnv, options } = context;
            let { moreLinkClick } = options;
            let date = computeRange(props).start;
            function buildPublicSeg(seg) {
                let { def, instance, range } = seg.eventRange;
                const start = buildRangeEdgeOutput(range.start, range.instantStartMs, dateEnv);
                const end = buildRangeEdgeOutput(range.end, range.instantEndMs, dateEnv);
                return {
                    event: new EventImpl(context, def, instance),
                    start: start.date,
                    end: end.date,
                    isStart: seg.isStart,
                    isEnd: seg.isEnd,
                };
            }
            if (typeof moreLinkClick === 'function') {
                moreLinkClick = moreLinkClick({
                    date: dateEnv.toDate(date),
                    allDay: Boolean(props.allDayDate),
                    allSegs: props.segs.map(buildPublicSeg),
                    hiddenSegs: props.hiddenSegs.map(buildPublicSeg),
                    jsEvent: ev,
                    view: context.viewApi,
                });
            }
            if (!moreLinkClick || moreLinkClick === 'popover') {
                this.setState({ isPopoverOpen: true });
            }
            else if (typeof moreLinkClick === 'string') { // a view name
                context.calendarApi.zoomTo(date, moreLinkClick);
            }
        };
        this.handlePopoverClose = () => {
            if (this.linkEl) { // was null sometimes when initiating drag-n-drop would hide the popover
                this.linkEl.focus();
            }
            this.setState({ isPopoverOpen: false });
        };
    }
    render() {
        const { props, state, context } = this;
        const { options, baseId } = context;
        const moreCnt = props.hiddenSegs.length;
        const range = computeRange(props);
        const popoverId = baseId + 'popover-' + range.start.toISOString();
        const renderProps = buildMoreLinkRenderProps(moreCnt, props.isNarrow, props.isMicro, props.display, context);
        const hint = formatWithOrdinals(options.moreLinkHint, [moreCnt], renderProps.longText);
        return (jsxs(Fragment, { children: [Boolean(moreCnt) && (jsx(MoreLinkTrigger, { num: moreCnt, display: props.display, isNarrow: props.isNarrow, isMicro: props.isMicro, elRef: this.handleLinkEl, className: props.className, style: props.style, attrs: {
                        ...props.attrs,
                        ...createAriaClickAttrs(this.handleClick),
                        title: hint,
                        'role': 'button',
                        'aria-haspopup': 'dialog',
                        'aria-expanded': state.isPopoverOpen,
                        'aria-controls': state.isPopoverOpen ? popoverId : undefined,
                    }, didMount: options.moreLinkDidMount, willUnmount: options.moreLinkWillUnmount })), state.isPopoverOpen && (jsx(MorePopover, { id: popoverId, titleId: popoverId + '-title', startDate: range.start, endDate: range.end, dateProfile: props.dateProfile, todayRange: props.todayRange, dateSpanProps: props.dateSpanProps, alignEl: props.alignElRef ? props.alignElRef.current : this.linkEl, alignParentTop: props.alignParentTop, forceTimed: props.forceTimed, onClose: this.handlePopoverClose, children: props.popoverContent() }))] }));
    }
}
function renderMoreLinkText(props) {
    return props.text;
}
function buildMoreLinkRenderProps(num, isNarrow, isMicro, display, context) {
    const { viewApi, options, calendarApi } = context;
    const numericText = `+${num}`; // TODO: offer hook or i18n?
    const longText = typeof options.moreLinkText === 'function' // TODO: eventually use formatWithOrdinals
        ? options.moreLinkText.call(calendarApi, num)
        : `${numericText} ${options.moreLinkText}`;
    return {
        num,
        numericText,
        longText,
        text: (isMicro || display === 'column') ? numericText : longText,
        isNarrow,
        view: viewApi,
    };
}
function computeRange(props) {
    if (props.allDayDate) {
        return {
            start: props.allDayDate,
            end: addDays(props.allDayDate, 1),
        };
    }
    return {
        start: computeEarliestStart(props.hiddenSegs),
        end: computeLatestEnd(props.hiddenSegs),
    };
}

const DEFAULT_TABLE_EVENT_TIME_FORMAT = createFormatter({
    hour: 'numeric',
    minute: '2-digit',
    omitZeroMinute: true,
    meridiem: 'narrow',
});
function hasListItemDisplay(range, eventRange) {
    let { display } = eventRange.ui;
    return display === 'list-item' || (display === 'auto' &&
        !eventRange.def.allDay &&
        (range.end - range.start) === 1 && // single-day
        range.isStart && // "
        range.isEnd // "
    );
}

// All positioned layers share the DayGrid row's isolated stacking context.
const DAY_GRID_NON_BUSINESS_Z_CLASS = classNames.z1;
const DAY_GRID_BG_EVENT_Z_CLASS = classNames.z2;
const DAY_GRID_HIGHLIGHT_Z_CLASS = classNames.z3;
const DAY_GRID_CELL_CONTENT_Z_CLASS = classNames.z4;
const DAY_GRID_EVENT_Z_CLASS = classNames.z5;
const DAY_GRID_INTERACTION_Z_CLASS = classNames.z1000;

class DayGridMoreLink extends BaseComponent {
    render() {
        let { props } = this;
        return (jsx(MoreLinkContainer, { display: 'row', className: joinClassNames(props.className, DAY_GRID_CELL_CONTENT_Z_CLASS), isNarrow: props.isNarrow, isMicro: props.isMicro, dateProfile: props.dateProfile, todayRange: props.todayRange, allDayDate: props.allDayDate, segs: props.segs, hiddenSegs: props.hiddenSegs, alignElRef: props.alignElRef, alignParentTop: props.alignParentTop, dateSpanProps: props.dateSpanProps, popoverContent: () => (jsx(Fragment, { children: props.segs.map((seg) => {
                    let { eventRange } = seg;
                    let { instanceId } = eventRange.instance;
                    let isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId]);
                    let isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId]);
                    let isInvisible = isDragging || isResizing;
                    return (jsx("div", { style: {
                            visibility: isInvisible ? 'hidden' : undefined,
                        }, children: jsx(StandardEvent, { display: hasListItemDisplay(seg, eventRange) ? 'list-item' : 'row', eventRange: eventRange, isStart: seg.isStart, isEnd: seg.isEnd, isDragging: isDragging, isResizing: isResizing, isMirror: false, isSelected: instanceId === props.eventSelection, defaultTimeFormat: DEFAULT_TABLE_EVENT_TIME_FORMAT, defaultDisplayEventEnd: false, ...getEventRangeMeta(eventRange, props.todayRange) }) }, instanceId));
                }) })) }));
    }
}

class DayGridCell extends DateComponent {
    constructor() {
        super(...arguments);
        // memo
        this.getDateMeta = memoize(getDayGridCellDateMeta);
        this.refineRenderProps = memoizeObjArg(refineRenderProps);
        // ref
        this.rootElRef = createRef();
        this.handleBodyEl = (bodyEl) => {
            if (this.disconnectBodyHeight) {
                this.disconnectBodyHeight();
                this.disconnectBodyHeight = undefined;
                this.headerHeight = undefined;
                setRef(this.props.headerHeightRef, null);
                setRef(this.props.mainHeightRef, null);
            }
            // Print cells don't need this screen-only measurement.
            if (bodyEl && (this.props.headerHeightRef || this.props.mainHeightRef)) {
                // we want to fire on ANY size change, because we do more advanced stuff
                this.disconnectBodyHeight = watchSize(bodyEl, (_bodyWidth, bodyHeight) => {
                    if (this._isUnmounting) {
                        return;
                    }
                    const { props } = this;
                    const rootEl = this.rootElRef.current;
                    // A queued resize can outlive the cell element.
                    if (!rootEl) {
                        return;
                    }
                    const mainRect = bodyEl.getBoundingClientRect();
                    const rootRect = rootEl.getBoundingClientRect();
                    const headerHeight = mainRect.top - rootRect.top;
                    if (!isDimsEqual(this.headerHeight, headerHeight)) {
                        this.headerHeight = headerHeight;
                        setRef(props.headerHeightRef, headerHeight);
                    }
                    /*
                    Reported in every mode, even though only a liquid cell's placement
                    consumes it. The body keeps the same element and the same observer when
                    `fgLiquidHeight` flips, and switching it between `grow` and `liquid`
                    need not change its height at all, so a mode-conditional report would
                    leave a newly liquid cell waiting for an unrelated resize before it
                    ever learned its own ceiling.
                    */
                    setRef(props.mainHeightRef, bodyHeight);
                });
            }
        };
    }
    render() {
        let { props, context } = this;
        let { options, dateEnv } = context;
        const { tableMode } = props;
        // TODO: memoize this
        const isMonthStart = props.showDayNumber &&
            shouldDisplayMonthStart(props.date, props.dateProfile.currentRange, dateEnv);
        const dateMeta = this.getDateMeta(props.date, dateEnv, props.dateProfile, props.todayRange, props.isDisabled);
        const baseClassName = joinClassNames(classNames.borderlessTop, classNames.borderlessEnd, !props.borderStart && classNames.borderlessStart, !(tableMode && props.borderBottom) && classNames.borderlessBottom, !tableMode && props.width == null && classNames.liquid, !tableMode && classNames.flexCol, classNames.rel, classNames.noMargin, classNames.noPadding);
        const CellTag = tableMode ? 'td' : 'div';
        const cellStyle = tableMode ? undefined : { width: props.width };
        const hasNavLink = options.navLinks;
        const renderProps = this.refineRenderProps({
            date: props.date,
            isMajor: props.isMajor,
            isNarrow: props.isNarrow,
            dateMeta: dateMeta,
            hasLabel: props.showDayNumber,
            hasMonthLabel: isMonthStart,
            hasNavLink,
            renderProps: props.renderProps,
            viewApi: context.viewApi,
            dateEnv: context.dateEnv,
            monthStartFormat: options.monthStartFormat,
            dayCellFormat: options.dayCellFormat,
            businessHours: Boolean(options.businessHours),
        });
        if (dateMeta.isDisabled) {
            return (jsx(CellTag, { role: 'gridcell', "aria-disabled": true, className: joinClassNames(generateClassName(options.dayCellClass, renderProps), props.className, baseClassName), style: cellStyle, children: props.fills }));
        }
        const fullDateStr = buildDateStr(context, props.date);
        return (jsx(ContentContainer, { tag: CellTag, elRef: this.rootElRef, className: joinClassNames(props.className, baseClassName), attrs: {
                ...props.attrs,
                role: 'gridcell',
                'aria-label': fullDateStr,
                ...(renderProps.isToday ? { 'aria-current': 'date' } : {}),
                'data-date': formatDayString(props.date),
            }, style: cellStyle, renderProps: renderProps, generatorName: "dayCellTopContent" // !!! for top
            , customGenerator: options.dayCellTopContent /* !!! for top */, defaultGenerator: renderTopInner, classNameGenerator: options.dayCellClass, didMount: options.dayCellDidMount, willUnmount: options.dayCellWillUnmount, children: (InnerContent) => (jsxs(Fragment, { children: [props.fills, jsx("div", { className: joinClassNames(classNames.rel, // puts it above bg-fills, which are positioned on TOP of this component :|
                        DAY_GRID_CELL_CONTENT_Z_CLASS, generateClassName(options.dayCellTopClass, renderProps)), children: props.showDayNumber && (jsx(InnerContent // the dayCellTopContent
                        , { tag: 'div', attrs: hasNavLink
                                ? buildNavLinkAttrs(context, props.date, undefined, fullDateStr)
                                : { 'aria-hidden': true } // label already on cell
                            , className: generateClassName(options.dayCellTopInnerClass, renderProps) })) }), jsxs("div", { className: joinClassNames(!tableMode && classNames.flexCol, !tableMode && (props.fgLiquidHeight ? classNames.liquid : classNames.grow), tableMode && classNames.printCellContentMinHeight), ref: this.handleBodyEl, children: [jsx("div", { className: joinClassNames(classNames.rel, // origin for this cell's foreground event wrappers
                                generateClassName(options.dayCellInnerClass, renderProps)), style: { minHeight: props.fgHeight }, children: props.fg }), jsx(DayGridMoreLink, { className: classNames.rel, allDayDate: props.date, segs: props.segs, hiddenSegs: props.hiddenSegs, alignElRef: this.rootElRef, alignParentTop: props.showDayNumber
                                    ? '[role=row]'
                                    : `.${classNames.internalView}`, dateSpanProps: props.dateSpanProps, dateProfile: props.dateProfile, eventSelection: props.eventSelection, eventDrag: props.eventDrag, eventResize: props.eventResize, todayRange: props.todayRange, isNarrow: props.isNarrow, isMicro: props.isMicro })] }), jsx("div", { className: joinClassNames(classNames.rel, // puts it above bg-fills
                        DAY_GRID_CELL_CONTENT_Z_CLASS, generateClassName(options.dayCellBottomClass, renderProps)) })] })) }));
    }
    componentDidMount() {
        this._isUnmounting = false;
    }
    componentWillUnmount() {
        this._isUnmounting = true;
    }
}
// Utils
// -------------------------------------------------------------------------------------------------
function getDayGridCellDateMeta(date, dateEnv, dateProfile, todayRange, isDisabled) {
    return {
        ...getDateMeta(date, dateEnv, dateProfile, todayRange),
        isDisabled,
    };
}
function renderTopInner(props) {
    return props.text || jsx(Fragment, { children: "\u00A0" }); // TODO: DRY?
}
function shouldDisplayMonthStart(date, currentRange, dateEnv) {
    const { start: currentStart, end: currentEnd } = currentRange;
    const currentEndIncl = addMs(currentEnd, -1);
    const currentFirstYear = dateEnv.getYear(currentStart);
    const currentFirstMonth = dateEnv.getMonth(currentStart);
    const currentLastYear = dateEnv.getYear(currentEndIncl);
    const currentLastMonth = dateEnv.getMonth(currentEndIncl);
    // spans more than one month?
    return !(currentFirstYear === currentLastYear && currentFirstMonth === currentLastMonth) &&
        Boolean(
        // first date in current view?
        date.valueOf() === currentStart.valueOf() ||
            // a month-start that's within the current range?
            (dateEnv.getDay(date) === 1 && date.valueOf() < currentEnd.valueOf()));
}
function refineRenderProps(raw) {
    let { date, dateEnv, hasLabel, hasMonthLabel, hasNavLink, businessHours } = raw;
    let textParts = [];
    let text = '';
    if (hasLabel) {
        textParts = dateEnv.formatToParts(date, hasMonthLabel ? raw.monthStartFormat : raw.dayCellFormat);
        text = joinDateTimeFormatParts(textParts);
    }
    return {
        ...raw.dateMeta,
        ...raw.renderProps,
        text,
        textParts,
        isMajor: raw.isMajor,
        isNarrow: raw.isNarrow,
        inPopover: false,
        hasNavLink,
        get weekdayText() { return findWeekdayText(textParts); },
        get dayNumberText() { return findDayNumberText(textParts); },
        get monthText() { return findMonthText(textParts); },
        options: { businessHours },
        view: raw.viewApi,
    };
}

class MeasuredHeightHarness extends Component {
    constructor() {
        super(...arguments);
        this.rootElRef = createRef();
        this._isUnmounting = false;
    }
    render() {
        const { props } = this;
        return (jsx("div", { className: props.className, style: props.style, ref: this.rootElRef, children: props.children }));
    }
    componentDidMount() {
        this._isUnmounting = false;
        const rootEl = this.rootElRef.current; // TODO: make dynamic with useEffect
        this.disconnectHeight = watchHeight(rootEl, (height) => {
            if (this._isUnmounting)
                return;
            this.height = height;
            setRef(this.props.heightRef, height);
        });
    }
    /*
    A wrapper can gain or lose measurement responsibility without remounting,
    because a row switches placement routes (screen<->print, for example) while
    reusing the same keyed nodes. The size observer only fires on an actual size
    change, so hand the newly attached ref what was already observed, and release
    the detached one.
    */
    componentDidUpdate(prevProps) {
        const { heightRef } = this.props;
        if (prevProps.heightRef !== heightRef) {
            setRef(prevProps.heightRef, null);
            if (this.height != null) {
                setRef(heightRef, this.height);
            }
        }
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.disconnectHeight?.();
        setRef(this.props.heightRef, null);
    }
}

/**
 * Pure lateral-span geometry shared by the seg-placement engine.
 *
 * A span is a half-open interval `[start, end)` on the lateral axis. The axis
 * can be discrete (DayGrid columns) or continuous (Timeline pixels). Exactly
 * adjacent spans never intersect.
 */
function doSpansIntersect(a, b) {
    return a.start < b.end && b.start < a.end;
}
/** Returns the strict intersection; exactly adjacent spans do not intersect. */
function intersectSpans(a, b) {
    const start = Math.max(a.start, b.start);
    const end = Math.min(a.end, b.end);
    return start < end ? { start, end } : null;
}
function getSpanLength(span) {
    return span.end - span.start;
}
/**
 * Finds every intersection within entries sorted by `start`. When the entries
 * are also pairwise non-intersecting, only the single entry before the lower
 * bound can straddle the span's start, so the scan begins one entry early.
 */
function findIntersections(entries, span) {
    let index = findLowerBoundByStart(entries, span.start);
    if (index > 0) {
        index--;
    }
    const matches = [];
    for (; index < entries.length; index++) {
        const entry = entries[index];
        if (entry.start >= span.end) {
            break;
        }
        if (doSpansIntersect(entry, span)) {
            matches.push(entry);
        }
    }
    return matches;
}
/**
 * Computes the coverage set difference `span - covered`. The covered spans
 * must be sorted by `start` and pairwise non-overlapping.
 */
function subtractCoveredSpans(span, covered) {
    const result = [];
    let cursor = span.start;
    for (const item of covered) {
        if (item.end <= cursor) {
            continue;
        }
        if (item.start >= span.end) {
            break;
        }
        if (item.start > cursor) {
            result.push({ start: cursor, end: Math.min(item.start, span.end) });
        }
        cursor = Math.max(cursor, item.end);
        if (cursor >= span.end) {
            break;
        }
    }
    if (cursor < span.end) {
        result.push({ start: cursor, end: span.end });
    }
    return result;
}
/** Maintains a sorted strict-overlap union; adjacent spans remain separate. */
function addToUnion(spans, addition) {
    const result = [];
    let pending = { ...addition };
    let inserted = false;
    for (const span of spans) {
        if (span.end <= pending.start) {
            result.push(span);
        }
        else if (pending.end <= span.start) {
            if (!inserted) {
                result.push(pending);
                inserted = true;
            }
            result.push(span);
        }
        else {
            pending = {
                start: Math.min(pending.start, span.start),
                end: Math.max(pending.end, span.end),
            };
        }
    }
    if (!inserted) {
        result.push(pending);
    }
    spans.splice(0, spans.length, ...result);
}
/** Preserves increasing lateral-start order within a sorted entry list. */
function insertLaterally(entries, entry) {
    entries.splice(findLowerBoundByStart(entries, entry.start), 0, entry);
}
function findLowerBoundByStart(entries, start) {
    let low = 0;
    let high = entries.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (entries[middle].start < start) {
            low = middle + 1;
        }
        else {
            high = middle;
        }
    }
    return low;
}

/**
 * Pure event-positioning kernel implementing measured logical repacking.
 *
 * Source segs own identity and event order. Slices own only lateral geometry,
 * while their outer array index is their dimensionless level. Limiting stays
 * primarily in logical slice-level space; the pixel path admits speculative
 * slices only through occupied logical territory, then monotonically prunes
 * the measured result against exact pixel and more-link boundaries.
 */
/** Permissive epsilon for geometric coordinate and budget comparisons. */
const GEOMETRY_TOLERANCE = 0.000001;
/** Shared estimate for an event wrapper that has not reported a thickness. */
const DEFAULT_UNMEASURED_EVENT_THICKNESS = 20;
/** Shared estimate for a more-link wrapper that has not reported a thickness. */
const DEFAULT_UNMEASURED_MORE_LINK_THICKNESS = 20;
/**
 * Streams at most `maxLevels` into the initial structure and fires every
 * rejected slice back at those levels in event order.
 *
 * With slicing disabled, a failed slice hides whole. With slicing enabled,
 * every level independently offers its maximal free runs and the winning plan
 * balances exposed length against fragmentation. Every hidden slice grows a
 * coverage accumulator; with a level tax, only newly covered runs reserve the
 * bottom event level for a more link, evicting any slice already there.
 */
function buildLevelLimitedLayout(segs, eventOrderStrict, eventSlicing, maxLevels, moreLinkLevelTax, sliceHeights) {
    const { segLevels, excludedSegs } = buildSegLevels(segs, eventOrderStrict, maxLevels);
    const placement = placeExtraSlicesInLevels(convertSegLevelsToWholeSlices(segLevels), convertSegsToWholeSlices(excludedSegs), eventOrderStrict, eventSlicing, moreLinkLevelTax);
    const resolution = resolveLevelCoords(placement.sliceLevels, sliceHeights);
    return {
        renderSlices: flatArray(placement.sliceLevels),
        hiddenSlices: placement.hiddenSlices,
        sliceLevels: placement.sliceLevels,
        sliceCoords: resolution.sliceCoords,
        isSettled: resolution.isSettled,
    };
}
/**
 * Resolves the bounded whole-slice frontier, then offers excluded slices back
 * to its occupied logical territory through slicing. Exact pixel pruning hides
 * any measured result that crosses the canvas or an existing more-link band.
 * Placement-only slices remain mounted as invisible measurement donors until
 * measured, preventing mount-measure cycles.
 *
 * `levelCapacity` bounds the initial DOM whole-slice candidates; later
 * slices begin hidden and unmeasured.
 */
function buildPixelLimitedLayout(segs, eventOrderStrict, eventSlicing, sliceHeights, canvasHeight, levelCapacity, moreLinkHeight) {
    const { segLevels, excludedSegs } = buildSegLevels(segs, eventOrderStrict, levelCapacity);
    const domWholeSliceLevels = convertSegLevelsToWholeSlices(segLevels);
    const domExcludedWholeSlices = convertSegsToWholeSlices(excludedSegs);
    const wholeResolution = resolveLevelCoords(domWholeSliceLevels, sliceHeights, canvasHeight);
    // Until the canvas and the link probe report a size, mount only the bounded
    // whole-slice frontier so its measurements can arrive.
    if (canvasHeight == null || moreLinkHeight == null) {
        return {
            renderSlices: flatArray(domWholeSliceLevels),
            hiddenSlices: domExcludedWholeSlices,
            sliceLevels: domWholeSliceLevels,
            sliceCoords: wholeResolution.sliceCoords,
            isSettled: wholeResolution.isSettled,
        };
    }
    // Pending frontier wholes stay out of links until measured; beyond-frontier
    // wholes are definite logical exclusions and hide without measurement.
    const excludedWholeSlices = wholeResolution.excludedSlices.concat(domExcludedWholeSlices);
    excludedWholeSlices.sort(compareByEventOrder);
    // With slicing, the level tax punches link holes while preserving event
    // remainders; otherwise measured pruning makes the smarter pixel choice.
    const placement = placeExtraSlicesInLevels(wholeResolution.placementSliceLevels, excludedWholeSlices, eventOrderStrict, eventSlicing, 
    /* moreLinkLevelTax = */ eventSlicing ? 1 : 0, 
    /* requiresSlicing = */ true, 
    /* taxDeepestOccupiedLevel = */ true);
    const sliceResolution = resolveLevelCoords(placement.sliceLevels, sliceHeights);
    // More links always render. When one consumes the full budget or more, zero
    // is the deepest coordinate an intersecting event may reach.
    const moreLinkEventMax = Math.max(0, canvasHeight - moreLinkHeight);
    // Remove exact canvas and more-link overflows from the coordinated layout.
    const pixelPrunedSlices = prunePixelLimitedSliceLevels(placement.sliceLevels, placement.hiddenSlices, sliceResolution.sliceCoords, sliceHeights, canvasHeight, moreLinkEventMax);
    // Keep all frontier wholes and placement-added slices mounted as measurement
    // donors; missing coordinates make rejected or pending slices invisible.
    // Disjoint: requiresSlicing bars whole re-insertion, so every added slice is
    // a freshly cut object, never a frontier whole.
    const renderSlices = flatArray(domWholeSliceLevels).concat(placement.addedSlices);
    // Frontier wholes resolve in the whole pass and every placement-added slice
    // resolves in the placement pass, so together the two cover the render set.
    const isSettled = wholeResolution.isSettled && sliceResolution.isSettled;
    return {
        renderSlices,
        hiddenSlices: pixelPrunedSlices.concat(placement.hiddenSlices),
        sliceLevels: placement.sliceLevels,
        sliceCoords: sliceResolution.sliceCoords,
        isSettled,
    };
}
/* ========================================================================
 * Whole-source level construction
 * ===================================================================== */
/** Builds whole-source logical levels without consulting any dimensions. */
function buildSegLevels(segs, eventOrderStrict, maxLevels = Infinity) {
    const segLevels = [];
    const excludedSegs = [];
    for (const seg of segs) {
        const levelIndex = findPackedLevelIndex(segLevels, seg, eventOrderStrict);
        if (levelIndex >= maxLevels) {
            excludedSegs.push(seg);
        }
        else {
            while (segLevels.length <= levelIndex) {
                segLevels.push([]);
            }
            insertLaterally(segLevels[levelIndex], seg);
        }
    }
    return { segLevels, excludedSegs };
}
/**
 * The packed level a span belongs to: the shallowest vacant level, or with
 * gap reuse forbidden, directly below the deepest intersecting occupant.
 * `levels.length` means a new level must open.
 */
function findPackedLevelIndex(levels, span, orderStrict) {
    let levelIndex = 0;
    if (orderStrict) {
        for (let i = 0; i < levels.length; i++) {
            if (findIntersections(levels[i], span).length) {
                levelIndex = i + 1;
            }
        }
    }
    else {
        while (levelIndex < levels.length &&
            findIntersections(levels[levelIndex], span).length) {
            levelIndex++;
        }
    }
    return levelIndex;
}
function convertSegLevelsToWholeSlices(segLevels) {
    return segLevels.map((level) => convertSegsToWholeSlices(level));
}
function convertSegsToWholeSlices(segs) {
    return segs.map(createWholeSlice);
}
/* ========================================================================
 * Slice-level coordinate resolution
 * ===================================================================== */
/**
 * Resolves fixed logical levels without changing the input or its slices.
 * An unmeasured slice leaves the resolution unsettled; a measured bounded
 * rejection is final. Neither blocks later traversal entries, so excluding a
 * lower slice can let a later slice move upward. The returned placement
 * structure re-levels the admitted slices from scratch, compacted around
 * pending and excluded slices exactly like the coordinates. Each admitted
 * slice files below every admitted slice it intersects — never into a
 * shallower gap — so level order mirrors pixel stacking and strict input
 * order survives without consulting it.
 */
function resolveLevelCoords(sliceLevels, sliceHeights, maxPixels = Infinity) {
    const placementSliceLevels = [];
    const sliceCoords = new Map();
    let isSettled = true;
    const excludedSlices = [];
    for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
        for (const slice of sliceLevels[levelIndex]) {
            const sliceHeight = sliceHeights.get(getSliceKey(slice));
            if (sliceHeight === undefined) {
                isSettled = false;
                continue;
            }
            const { bottom: levelCoord, levelIndex: packedLevelIndex, } = computeLateralSpanPlacement(placementSliceLevels, slice, sliceCoords, sliceHeights);
            if (levelCoord + sliceHeight <=
                maxPixels + GEOMETRY_TOLERANCE) {
                // Repacking admitted slices merges levels, so keep lateral sort.
                while (placementSliceLevels.length <= packedLevelIndex) {
                    placementSliceLevels.push([]);
                }
                insertLaterally(placementSliceLevels[packedLevelIndex], slice);
                sliceCoords.set(getSliceKey(slice), levelCoord);
            }
            else {
                excludedSlices.push(slice);
            }
        }
    }
    return { placementSliceLevels, sliceCoords, isSettled, excludedSlices };
}
/** Deepest measured, coordinated bottom and level among slices touching the span. */
function computeLateralSpanPlacement(sliceLevels, span, sliceCoords, sliceHeights) {
    let bottom = 0;
    let levelIndex = 0;
    for (let i = 0; i < sliceLevels.length; i++) {
        const level = sliceLevels[i];
        for (const slice of findIntersections(level, span)) {
            const key = getSliceKey(slice);
            const sliceTop = sliceCoords.get(key);
            const sliceHeight = sliceHeights.get(key);
            if (sliceTop !== undefined && sliceHeight !== undefined) {
                bottom = Math.max(bottom, sliceTop + sliceHeight);
                levelIndex = i + 1;
            }
        }
    }
    return { bottom, levelIndex };
}
/** Deepest measured, coordinated bottom among slices touching the span. */
function computeLateralSpanBottom(sliceLevels, span, sliceCoords, sliceHeights) {
    return computeLateralSpanPlacement(sliceLevels, span, sliceCoords, sliceHeights).bottom;
}
/** Recomputes every coordinated slice against the compacted visible set. */
function recomputeVisibleCoords(sliceLevels, sliceHeights, sliceCoords) {
    const visibleLevels = sliceLevels.map((level) => level.filter((slice) => sliceCoords.has(getSliceKey(slice))));
    const freshCoords = resolveLevelCoords(visibleLevels, sliceHeights).sliceCoords;
    for (const [key, coord] of freshCoords) {
        sliceCoords.set(key, coord);
    }
}
/** Returns a measured slice's bottom, or `undefined` while it is pending. */
function getSliceBottom(slice, sliceCoords, sliceHeights) {
    const key = getSliceKey(slice);
    const coord = sliceCoords.get(key);
    const height = sliceHeights.get(key);
    return coord === undefined || height === undefined
        ? undefined
        : coord + height;
}
/**
 * Monotonically removes measured slices that cross either the canvas boundary
 * or an active more-link boundary. Hiding a slice grows the more-link coverage;
 * only newly covered spans are fired through the remaining slices, so every
 * removal can expose more link-band intruders without reconsidering old spans.
 *
 * SIDE EFFECT: mutates `sliceCoords`. A removed coordinate is the renderer's
 * signal that the still-mounted slice is invisible. After every removal,
 * surviving coordinates are resolved again so later queue entries are tested
 * against the compacted pixel structure. Slices without a proposed coordinate
 * are ignored. Existing hidden slices seed the more-link coverage before the
 * first removal is considered.
 *
 * Returns the slices whose coordinates this pass removed, with no ordering
 * guarantee.
 */
function prunePixelLimitedSliceLevels(sliceLevels, initialHiddenSlices, sliceCoords, sliceHeights, maxPixelHeight, moreLinkMaxPixelHeight) {
    const moreLinkGroups = [];
    const pixelPrunedSlices = [];
    const sliceHideQueue = [];
    let sliceHideIndex = 0;
    // Build the more-link coverage already established by logical placement.
    for (const hiddenSlice of initialHiddenSlices) {
        addHiddenSliceToGroups(moreLinkGroups, hiddenSlice);
    }
    // Seed the queue with canvas overflows and existing more-link intruders.
    enqueueViolators();
    // A head index preserves FIFO without shift()'s O(n) reindexing; pop() is LIFO.
    while (sliceHideIndex < sliceHideQueue.length) {
        const slice = sliceHideQueue[sliceHideIndex++];
        const sliceBottom = getSliceBottom(slice, sliceCoords, sliceHeights);
        // A missing coordinate means a prior queue entry already processed it, and
        // compaction from earlier removals can make a queued slice compliant again.
        if (sliceBottom === undefined ||
            !violatesPixelBoundary(slice, sliceBottom)) {
            continue;
        }
        // Removing the coordinate hides the still-mounted slice. The shared
        // coordinate primitive then compacts later visible slices around it.
        sliceCoords.delete(getSliceKey(slice));
        pixelPrunedSlices.push(slice);
        const newMoreLinkSpans = addHiddenSliceToGroups(moreLinkGroups, slice);
        recomputeVisibleCoords(sliceLevels, sliceHeights, sliceCoords);
        for (const newMoreLinkSpan of newMoreLinkSpans) {
            enqueueViolators(newMoreLinkSpan);
        }
    }
    return pixelPrunedSlices;
    /** Whether a measured bottom crosses the canvas or an intersecting link band. */
    function violatesPixelBoundary(slice, sliceBottom) {
        return sliceBottom > maxPixelHeight + GEOMETRY_TOLERANCE ||
            (sliceBottom > moreLinkMaxPixelHeight + GEOMETRY_TOLERANCE &&
                findIntersections(moreLinkGroups, slice).length > 0);
    }
    /** Queues every measured violator, or only those touching one span. */
    function enqueueViolators(withinSpan) {
        for (const level of sliceLevels) {
            const candidates = withinSpan
                ? findIntersections(level, withinSpan)
                : level;
            for (const slice of candidates) {
                const sliceBottom = getSliceBottom(slice, sliceCoords, sliceHeights);
                if (sliceBottom !== undefined &&
                    violatesPixelBoundary(slice, sliceBottom)) {
                    sliceHideQueue.push(slice);
                }
            }
        }
    }
}
/**
 * Fires event-ordered extras into a fixed set of logical levels. Repacking may
 * reuse gaps in the received levels but never creates additional levels.
 * By default, a more-link tax reserves the globally final level. Pixel flows
 * can instead reserve the deepest occupied level local to each link span and
 * require initial extras to expose some hidden coverage before admission.
 *
 * PRECONDITION: `extraSlices` is sorted by event order.
 *
 * SIDE EFFECT: mutates `sliceLevels`; callers transfer ownership of its outer
 * array and level arrays to this placement operation.
 */
function placeExtraSlicesInLevels(sliceLevels, extraSlices, eventOrderStrict, eventSlicing, moreLinkLevelTax, 
/** Whether initial extras must leave hidden coverage before admission. */
requiresSlicing = false, 
/** Whether each link taxes its deepest locally occupied level. */
taxDeepestOccupiedLevel = false) {
    const addedSliceSet = new Set();
    // Hidden membership remains flat for whole-layout operations. More-link
    // groups duplicate that membership locally while also recording which
    // lateral territory has already fired its link tax.
    const hiddenSlices = [];
    const moreLinkGroups = [];
    const moreLinkReservations = [];
    const placementState = {
        levels: sliceLevels,
        moreLinkReservations,
        eventOrderStrict,
    };
    const work = [];
    pushFire(extraSlices, requiresSlicing);
    // LIFO runs newly created link reservations before older unrelated extras,
    // so an extra cannot insert into space that a fresh reservation will claim.
    while (work.length) {
        const item = work.pop();
        if (item.type === 'fire') {
            fire(item.slice, item.requiresSlicing);
        }
        else {
            fireMoreLink(item.span);
        }
    }
    return {
        sliceLevels,
        hiddenSlices,
        addedSlices: [...addedSliceSet],
    };
    /** Tries an allowed whole insertion before scored same-level slice plans. */
    function fire(slice, requiresSlicing) {
        if (!requiresSlicing) {
            const levelIndex = findInsertionLevel(slice, placementState);
            if (levelIndex !== null) {
                insertLaterally(sliceLevels[levelIndex], slice);
                addedSliceSet.add(slice);
                return;
            }
        }
        if (!eventSlicing) {
            hide(slice);
            return;
        }
        const plan = findBestSlicePlan(slice, placementState, requiresSlicing);
        if (!plan) {
            hide(slice);
            return;
        }
        for (const visibleSlice of plan.slices) {
            insertLaterally(sliceLevels[plan.levelIndex], visibleSlice);
            addedSliceSet.add(visibleSlice);
        }
        for (const hiddenSlice of subtractSpansFromSlice(slice, plan.slices)) {
            hide(hiddenSlice);
        }
    }
    /** Adds hidden membership and fires links only over new accumulator coverage. */
    function hide(slice) {
        hiddenSlices.push(slice);
        // Only the set difference is fresh more-link territory; it can consist of
        // several disjoint runs.
        const newMoreLinkSpans = addHiddenSliceToGroups(moreLinkGroups, slice);
        if (moreLinkLevelTax) {
            for (let i = newMoreLinkSpans.length - 1; i >= 0; i--) {
                work.push({ type: 'moreLink', span: newMoreLinkSpans[i] });
            }
        }
    }
    /**
     * Reserves one logical level over fresh accumulator coverage. The ordinary
     * flow taxes the final level; span-local mode taxes the deepest level with
     * an intersecting occupant, ignoring unrelated deeper territory.
     */
    function fireMoreLink(span) {
        if (!sliceLevels.length) {
            return;
        }
        let taxedLevelIndex = sliceLevels.length - 1;
        let victims = findIntersections(sliceLevels[taxedLevelIndex], span);
        if (taxDeepestOccupiedLevel) {
            while (!victims.length && taxedLevelIndex > 0) {
                taxedLevelIndex--;
                victims = findIntersections(sliceLevels[taxedLevelIndex], span);
            }
        }
        insertLaterally(moreLinkReservations, {
            ...span,
            levelIndex: taxedLevelIndex,
        });
        const taxedLevel = sliceLevels[taxedLevelIndex];
        for (const victim of victims) {
            taxedLevel.splice(taxedLevel.indexOf(victim), 1);
            addedSliceSet.delete(victim);
            if (eventSlicing) {
                hide(intersectSlice(victim, span));
                // The remainder has already satisfied the slicing requirement.
                pushFire(subtractSpansFromSlice(victim, [span]), false);
            }
            else {
                hide(victim);
            }
        }
    }
    /** Reversing preserves received order on the LIFO work stack. */
    function pushFire(slices, requiresSlicing) {
        for (let i = slices.length - 1; i >= 0; i--) {
            work.push({ type: 'fire', slice: slices[i], requiresSlicing });
        }
    }
}
/** Returns the shallowest vacant level within the slice's fence, if any. */
function findInsertionLevel(slice, state) {
    const fence = computeLevelFence(slice, state);
    for (let levelIndex = fence.min; levelIndex < fence.maxExclusive; levelIndex++) {
        if (!findIntersections(state.levels[levelIndex], slice).length) {
            return levelIndex;
        }
    }
    return null;
}
/**
 * The level range where a slice may legally sit. The bottom reservation
 * closes its taxed level and everything deeper over link coverage; strict
 * event order additionally fences against intersecting neighbors' order.
 *
 * The pre-kernel SegHierarchy needed no upper fence: it inserted everything
 * in event order, so "stay below anything you touch" sufficed. Repacking
 * fires rejected extras after later-ordered slices are already committed,
 * which is what makes strict order two-sided here.
 */
function computeLevelFence(slice, state) {
    const { levels } = state;
    let min = 0;
    let maxExclusive = levels.length;
    for (const reservation of findIntersections(state.moreLinkReservations, slice)) {
        maxExclusive = Math.min(maxExclusive, reservation.levelIndex);
    }
    if (state.eventOrderStrict) {
        for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
            for (const other of findIntersections(levels[levelIndex], slice)) {
                if (other.sourceSeg.orderIndex < slice.sourceSeg.orderIndex) {
                    min = Math.max(min, levelIndex + 1);
                }
                else if (other.sourceSeg.orderIndex > slice.sourceSeg.orderIndex) {
                    maxExclusive = Math.min(maxExclusive, levelIndex);
                }
            }
        }
    }
    return { min, maxExclusive };
}
/* ========================================================================
 * Slice plans
 * ===================================================================== */
const MAX_SLICES_PER_PLAN = 3;
const EXTRA_SLICE_PENALTY = 0.15;
/**
 * Scores the best one-, two-, or three-run insertion offered by each level.
 * Runs from different levels are deliberately never mixed into one plan.
 */
function findBestSlicePlan(slice, state, requiresSlicing) {
    let selected = null;
    const sourceLength = getSpanLength(slice);
    for (let levelIndex = 0; levelIndex < state.levels.length; levelIndex++) {
        // findIntersections returns a fresh, start-sorted array, and addToUnion
        // replaces array contents without ever mutating a member, so link
        // reservations can be folded in without touching the actual level.
        const blockers = findIntersections(state.levels[levelIndex], slice);
        for (const reservation of state.moreLinkReservations) {
            if (levelIndex >= reservation.levelIndex) {
                addToUnion(blockers, reservation);
            }
        }
        const runs = subtractSpansFromSlice(slice, blockers)
            .filter((run) => isWithinLevelFence(run, levelIndex, state))
            .sort((a, b) => getSpanLength(b) - getSpanLength(a) || a.start - b.start);
        let visibleLength = 0;
        for (let sliceCount = 1; sliceCount <= Math.min(MAX_SLICES_PER_PLAN, runs.length); sliceCount++) {
            visibleLength += getSpanLength(runs[sliceCount - 1]);
            // Full exposure leaves no hidden coverage, and visible length only
            // grows with more runs, so no longer plan can satisfy slicing either.
            if (requiresSlicing &&
                visibleLength >= sourceLength - GEOMETRY_TOLERANCE) {
                break;
            }
            const candidate = {
                levelIndex,
                slices: runs.slice(0, sliceCount),
                score: visibleLength / sourceLength -
                    EXTRA_SLICE_PENALTY * (sliceCount - 1),
            };
            if (isBetterSlicePlan(candidate, selected)) {
                selected = candidate;
            }
        }
    }
    if (selected) {
        selected.slices.sort(compareByEventOrder);
    }
    return selected;
}
/** Whether a slice may legally sit at this level, per its own fence. */
function isWithinLevelFence(slice, levelIndex, state) {
    const fence = computeLevelFence(slice, state);
    return levelIndex >= fence.min && levelIndex < fence.maxExclusive;
}
/** Comparison: score, then less fragmentation, then the shallower level. */
function isBetterSlicePlan(candidate, current) {
    if (!current || candidate.score > current.score) {
        return true;
    }
    if (candidate.score < current.score) {
        return false;
    }
    if (candidate.slices.length !== current.slices.length) {
        return candidate.slices.length < current.slices.length;
    }
    return candidate.levelIndex < current.levelIndex;
}
/**
 * Merges strict lateral intersections into groups sorted by lateral start.
 * Each group's hidden slices are event-ordered.
 */
function groupLaterallyIntersecting(hiddenSlices) {
    const groups = [];
    for (const slice of hiddenSlices) {
        addHiddenSliceToGroups(groups, slice);
    }
    return finalizeHiddenGroups(groups);
}
/**
 * Adds one hidden slice to its strict-intersection component and returns only
 * the newly covered spans. Exactly adjacent groups deliberately stay separate
 * because each group corresponds to one independently rendered more link.
 * The group list remains sorted by lateral start.
 */
function addHiddenSliceToGroups(groups, slice) {
    const newSpans = subtractCoveredSpans(slice, groups);
    const untouchedGroups = [];
    const mergedSlices = [slice];
    let start = slice.start;
    let end = slice.end;
    for (const group of groups) {
        if (intersectSpans(group, slice)) {
            mergedSlices.push(...group.hiddenSlices);
            start = Math.min(start, group.start);
            end = Math.max(end, group.end);
        }
        else {
            untouchedGroups.push(group);
        }
    }
    mergedSlices.sort(compareByEventOrder);
    insertLaterally(untouchedGroups, {
        start,
        end,
        hiddenSlices: mergedSlices,
    });
    groups.splice(0, groups.length, ...untouchedGroups);
    return newSpans;
}
/**
 * Compiles internal accumulator groups for components: one entry per hidden
 * source event, in event order, spanning that source's fragment hull.
 */
function finalizeHiddenGroups(groups) {
    return groups.map((group) => {
        const hiddenSlices = mergeAdjacentSlices(group.hiddenSlices);
        return {
            key: getSliceKey(hiddenSlices[0]),
            start: group.start,
            end: group.end,
            hiddenSlices,
        };
    });
}
/* ========================================================================
 * Slice utilities
 * ===================================================================== */
/**
 * Identifies a whole or partial slice derived from a source seg. Partial keys
 * deliberately omit the lateral end so a fragment re-cut at the same start
 * keeps its DOM wrapper. The re-cut fragment transiently reuses the previous
 * cut's measurement, which can mis-prune one pass; the structure still settles
 * because every fragment cut depends only on logical geometry — the same
 * wrapper just re-reports at its new width and the next pass corrects the
 * decision.
 */
function getSliceKey(slice) {
    if (!isPartialSlice(slice)) {
        return slice.sourceSeg.key;
    }
    return `${slice.sourceSeg.key}:${slice.start}:slice`;
}
function isPartialSlice(slice) {
    return slice.start !== slice.sourceSeg.start ||
        slice.end !== slice.sourceSeg.end;
}
function compareByEventOrder(a, b) {
    return a.sourceSeg.orderIndex - b.sourceSeg.orderIndex ||
        a.start - b.start ||
        b.end - a.end; // longer events first
}
function sortByEventOrder(slices) {
    return [...slices].sort(compareByEventOrder);
}
/** Orders by axis start, then resolved event order. */
function compareByAxisOrder(a, b) {
    return a.start - b.start ||
        a.sourceSeg.orderIndex - b.sourceSeg.orderIndex;
}
function sortByAxisOrder(items) {
    return [...items].sort(compareByAxisOrder);
}
/**
 * Collapses same-source runs of an event-ordered slice list into one slice
 * per run spanning the run's lateral hull. The hull can bridge territory
 * where the source is actually visible; consumers derive start/end
 * continuity from the outermost hidden edges, not exact hidden coverage.
 */
function mergeAdjacentSlices(slices) {
    const merged = [];
    for (const slice of slices) {
        const previous = merged[merged.length - 1];
        if (previous && previous.sourceSeg === slice.sourceSeg) {
            merged[merged.length - 1] = createNarrowerSlice(createWholeSlice(previous.sourceSeg), previous.start, Math.max(previous.end, slice.end));
        }
        else {
            merged.push(slice);
        }
    }
    return merged;
}
/**
 * Removes covered spans from a slice, returning identity-preserving
 * remainders. Like `subtractCoveredSpans`, the covered spans must be sorted
 * by start and pairwise non-overlapping — every caller already holds them
 * that way (plan slices, union blockers, a single span).
 */
function subtractSpansFromSlice(slice, covered) {
    return subtractCoveredSpans(slice, covered).map((span) => createNarrowerSlice(slice, span.start, span.end));
}
/** Finds the strict intersection while retaining source identity. */
function intersectSlice(slice, barrier) {
    const intersection = intersectSpans(slice, barrier);
    return intersection
        ? createNarrowerSlice(slice, intersection.start, intersection.end)
        : null;
}
function createWholeSlice(sourceSeg) {
    return {
        sourceSeg,
        start: sourceSeg.start,
        end: sourceSeg.end,
        isStart: sourceSeg.isStart,
        isEnd: sourceSeg.isEnd,
    };
}
function createNarrowerSlice(parent, start, end) {
    return {
        sourceSeg: parent.sourceSeg,
        start,
        end,
        isStart: parent.isStart && start === parent.start,
        isEnd: parent.isEnd && end === parent.end,
    };
}

const DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT = 150;
/** Initial DOM candidate frontier, before any measurement can widen it. */
const DEFAULT_LEVEL_CAPACITY = estimateLevelCapacity(DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT, DEFAULT_UNMEASURED_EVENT_THICKNESS);
/** Converts sorted production ranges into the shared source vocabulary. */
function buildDayGridSegSources(eventOrderedSegs) {
    return eventOrderedSegs.map((seg, orderIndex) => ({
        ...seg,
        key: getDayGridSegKey(seg),
        orderIndex,
    }));
}
/**
 * Builds an immediately renderable kernel layout for unlimited and numeric
 * DayGrid modes. Boolean-auto uses the pixel-limited adapter below.
 */
function buildDayGridLevelPlacements(eventOrderedSegs, maxLevels, moreLinkLevelTax, orderStrict, eventSlicing, columnCount, sliceHeights) {
    const sourceSegs = buildDayGridSegSources(eventOrderedSegs);
    const layout = buildLevelLimitedLayout(sourceSegs, orderStrict, eventSlicing, maxLevels, moreLinkLevelTax, sliceHeights);
    return buildDayGridPlacementLayout(sourceSegs, layout, sliceHeights, columnCount);
}
/** Builds the boolean-auto DayGrid route with a real pixel ceiling. */
function buildDayGridPixelPlacements(eventOrderedSegs, orderStrict, eventSlicing, columnCount, canvasHeight, moreLinkHeight, levelCapacity, sliceHeights) {
    const sourceSegs = buildDayGridSegSources(eventOrderedSegs);
    const layout = buildPixelLimitedLayout(sourceSegs, orderStrict, eventSlicing, sliceHeights, canvasHeight, levelCapacity, moreLinkHeight);
    return buildDayGridPlacementLayout(sourceSegs, layout, sliceHeights, columnCount);
}
/** Projects ordered sources and event-ordered hidden slices into one cell. */
function buildDayGridPopoverSegs(eventOrderedSegs, hiddenSlices, column) {
    return {
        segs: flatMapArray(eventOrderedSegs, (source) => cutSegToColumn(source, column) ?? []),
        hiddenSegs: flatMapArray(hiddenSlices, (slice) => cutSegToColumn(slice.sourceSeg, column, slice) ?? []),
    };
}
/**
 * Projects one complete source onto a column when its relevant span intersects.
 *
 * The optional span lets a hidden slice control membership while real event
 * boundaries still control whether the projected entry reports "continues."
 */
function cutSegToColumn(source, column, intersectionSpan = source) {
    if (intersectionSpan.start >= column + 1 ||
        column >= intersectionSpan.end)
        return null;
    const { key, orderIndex, ...seg } = source;
    return {
        ...seg,
        start: column,
        end: column + 1,
        isStart: seg.isStart && source.start === column,
        isEnd: seg.isEnd && source.end - 1 === column,
    };
}
/**
 * Resolves which measured route a row takes from the two max options.
 *
 * This is the single definition of production's option precedence: a boolean
 * `true` on either option means auto, and only then does a number on either
 * one apply, `dayMaxEvents` first.
 */
function resolveDayGridPlacementMode(dayMaxEvents, dayMaxEventRows) {
    if (dayMaxEvents === true || dayMaxEventRows === true) {
        return 'auto';
    }
    if (typeof dayMaxEvents === 'number') {
        return 'maxEvents';
    }
    if (typeof dayMaxEventRows === 'number') {
        return 'maxEventRows';
    }
    return 'unlimited';
}
/**
 * Computes the dimensionless DOM frontier from an already-resolved mode,
 * without applying more-link tax. Numeric limits own their explicit cap;
 * unlimited rows mount all sources; boolean-auto rows consume their row-local
 * observed frontier.
 */
function computeDayGridDomCandidateMaxLevels(mode, dayMaxEvents, dayMaxEventRows, maxDomLevels) {
    switch (mode) {
        case 'auto': return maxDomLevels;
        case 'maxEvents': return dayMaxEvents;
        case 'maxEventRows': return dayMaxEventRows;
        default: return Infinity;
    }
}
/**
 * Logical levels an active more link charges its column. Only `dayMaxEventRows`
 * counts the link as one of its rows.
 */
function computeDayGridMoreLinkLevelTax(mode) {
    return mode === 'maxEventRows' ? 1 : 0;
}
function buildDayGridPlacementLayout(sourceSegs, layout, sliceHeights, columnCount) {
    const { hiddenSlices, renderSlices, sliceCoords, } = layout;
    const eventOrderedHiddenSlices = sortByEventOrder(hiddenSlices);
    const slicesByStart = federateSlicesByStart(renderSlices, columnCount);
    const columns = Array.from({ length: columnCount }, (_, column) => ({
        // Freshly built per column by federateSlicesByStart; owned outright.
        renderSlices: slicesByStart[column],
        contentHeight: 0,
        ...buildDayGridPopoverSegs(sourceSegs, eventOrderedHiddenSlices, column),
    }));
    // A mounted slice is visible exactly when it has a coordinate; a coordinate
    // in turn guarantees a measurement.
    for (const slice of renderSlices) {
        const key = getSliceKey(slice);
        const sliceTop = sliceCoords.get(key);
        if (sliceTop === undefined) {
            continue;
        }
        const sliceBottom = sliceTop + sliceHeights.get(key);
        for (let column = slice.start; column < slice.end; column += 1) {
            columns[column].contentHeight = Math.max(columns[column].contentHeight, sliceBottom);
        }
    }
    return {
        columns,
        sliceCoords,
    };
}
function federateSlicesByStart(renderSlices, columnCount) {
    const slicesByStart = Array.from({ length: columnCount }, () => []);
    for (const slice of renderSlices) {
        slicesByStart[slice.start].push(slice);
    }
    for (const slices of slicesByStart) {
        slices.sort(compareByEventOrder);
    }
    return slicesByStart;
}
function estimateLevelCapacity(eventAreaHeight, eventHeight) {
    return Math.max(1, Math.ceil(eventAreaHeight / eventHeight));
}

/** High but finite safety cap for event levels in either print view. */
const DEFAULT_PRINT_MAX_LEVELS = 200;
function planPrintDomCandidates(eventOrderedSegs, eventOrderStrict, eventSlicing) {
    const { segLevels, excludedSegs } = buildSegLevels(eventOrderedSegs, eventOrderStrict, DEFAULT_PRINT_MAX_LEVELS);
    const placement = placeExtraSlicesInLevels(convertSegLevelsToWholeSlices(segLevels), convertSegsToWholeSlices(excludedSegs), eventOrderStrict, eventSlicing, 0);
    return {
        sliceLevels: placement.sliceLevels,
        hiddenSlices: placement.hiddenSlices,
    };
}
/**
 * Projects dimensionless levels into independently page-breakable bands.
 *
 * The level entries may carry unit-thickness planning coordinates, but those
 * coordinates have no print meaning. Every print slice begins at level
 * coordinate zero in its own band, whose thickness is the largest current
 * slice-wrapper measurement. Missing measurements use the supplied fallback.
 * Empty or sparse levels do not create empty DOM bands. The key resolver lets
 * adapters retain their wrapper-level measurement identity.
 */
function buildPrintEventBands(levels, printEventThicknesses, getPrintEventKey = (slice) => slice.sourceSeg.key, defaultPrintEventThickness = DEFAULT_UNMEASURED_EVENT_THICKNESS) {
    const bands = [];
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
        const entries = levels[levelIndex];
        if (!entries?.length)
            continue;
        let thickness = 0;
        const slices = entries.map((slice) => {
            thickness = Math.max(thickness, printEventThicknesses.get(getPrintEventKey(slice)) ??
                defaultPrintEventThickness);
            return slice;
        });
        bands.push({
            levelIndex,
            slices,
            thickness,
        });
    }
    return bands;
}
/** Builds Timeline's one final print more-link band when hidden groups exist. */
function buildPrintMoreLinkBand(hiddenGroups, printMoreLinkHeights) {
    if (!hiddenGroups.length) {
        return null;
    }
    // Group members arrive event-ordered, with the first member defining the key.
    return {
        moreLinkGroups: hiddenGroups,
        thickness: Math.max(...hiddenGroups.map((group) => printMoreLinkHeights.get(group.key) ??
            DEFAULT_UNMEASURED_MORE_LINK_THICKNESS)),
    };
}

/** Plans one print row from its complete, resolved-order source list. */
function buildDayGridPrintPlan(eventOrderedSegs, orderStrict, eventSlicing, columnCount) {
    const sourceSegs = buildDayGridSegSources(eventOrderedSegs);
    const candidatePlan = planPrintDomCandidates(sourceSegs, orderStrict, eventSlicing);
    return {
        ...candidatePlan,
        hiddenSlices: sortByEventOrder(candidatePlan.hiddenSlices),
        sourceSegs,
        columnCount,
    };
}
/** Transposes row-wide print bands into one aligned slot sequence per cell. */
function buildDayGridPrintColumns(plan, printSegHeights) {
    const columns = Array.from({ length: plan.columnCount }, () => []);
    for (const band of buildPrintEventBands(plan.sliceLevels, printSegHeights, getDayGridPrintSliceKey)) {
        const slicesByColumn = Array(plan.columnCount).fill(null);
        for (const slice of band.slices) {
            slicesByColumn[slice.start] = slice;
        }
        for (let column = 0; column < plan.columnCount; column++) {
            columns[column].push({
                levelIndex: band.levelIndex,
                thickness: band.thickness,
                slice: slicesByColumn[column],
            });
        }
    }
    return columns;
}
/** Stable identity for one print wrapper when a source is split laterally. */
function getDayGridPrintSliceKey(slice) {
    return `${slice.sourceSeg.key}:${slice.start}:${slice.end}`;
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'narrow' });
class DayGridRow extends BaseComponent {
    constructor() {
        super(...arguments);
        // ref
        this.headerHeightRefMap = new RefMap(() => {
            afterSize(this.handleSegPositioning);
        });
        this.mainHeightRefMap = new RefMap(() => {
            // Recorded in every screen mode so a row that becomes liquid already knows its
            // ceiling, but only a liquid row's placement depends on it.
            const fgLiquidHeight = this.props.dayMaxEvents === true || this.props.dayMaxEventRows === true;
            if (fgLiquidHeight) {
                afterSize(this.handleSegPositioning);
            }
        });
        // Every screen slice (whole or partial) reports its occupied height here.
        this.sliceHeightRefMap = new RefMap(() => {
            afterSize(this.handleSegPositioning);
        });
        // print-only (band thickness is row-wide while slots render per-cell, so
        // this state must live here; see also buildPrintPlan, renderPrintBandSlots,
        // handlePrintSegHeights, and the reset in componentDidUpdate)
        this.handlePrintSegHeightChange = () => {
            afterSize(this.handlePrintSegHeights);
        };
        this.printSegHeightRefMap = new RefMap(this.handlePrintSegHeightChange);
        // memo
        this.buildWeekNumberRenderProps = memoize(buildWeekNumberRenderProps);
        this.buildPrintPlan = memoize(buildDayGridPrintPlan);
        this.sortEventSegs = memoize(sortEventSegs);
        this.levelCapacity = DEFAULT_LEVEL_CAPACITY;
        this.handleRootEl = (rootEl) => {
            this.disconnectHeight?.();
            this.disconnectHeight = undefined;
            setRef(this.props.rootElRef, rootEl);
            if (rootEl) {
                this.disconnectHeight = watchHeight(rootEl, (contentHeight) => {
                    setRef(this.props.heightRef, contentHeight);
                });
            }
        };
        this.handleSegPositioning = () => {
            if (this._isUnmounting || this.props.forPrint)
                return;
            this.updateAutoPlacementRatchets();
            this.forceUpdate();
        };
        this.handlePrintSegHeights = () => {
            if (this._isUnmounting || !this.props.forPrint)
                return;
            this.forceUpdate();
        };
    }
    render() {
        const { props, context, headerHeightRefMap, mainHeightRefMap } = this;
        const { cells, tableMode } = props;
        const { options } = context;
        const weekDateMarker = props.cells[0].date;
        const fgEventSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder);
        const screenFgLiquidHeight = props.dayMaxEvents === true || props.dayMaxEventRows === true;
        let printPlan = null;
        let printColumns = null;
        let screenColumns = null;
        let screenSliceCoords = new Map();
        let screenMainOffsetsByCol = [];
        let screenHeightsByCol = [];
        if (props.forPrint) {
            printPlan = this.buildPrintPlan(fgEventSegs, options.eventOrderStrict, options.eventSlicing, cells.length);
            printColumns = buildDayGridPrintColumns(printPlan, this.printSegHeightRefMap.current);
        }
        else {
            const placementMode = resolveDayGridPlacementMode(props.dayMaxEvents, props.dayMaxEventRows);
            const [maxMainTop, minMainHeight] = this.computeFgDims();
            const screenLayout = placementMode === 'auto'
                ? buildDayGridPixelPlacements(fgEventSegs, options.eventOrderStrict, options.eventSlicing, cells.length, minMainHeight, props.moreLinkHeight, this.levelCapacity, this.sliceHeightRefMap.current)
                : buildDayGridLevelPlacements(fgEventSegs, computeDayGridDomCandidateMaxLevels(placementMode, props.dayMaxEvents, props.dayMaxEventRows, Infinity), computeDayGridMoreLinkLevelTax(placementMode), options.eventOrderStrict, options.eventSlicing, cells.length, this.sliceHeightRefMap.current);
            screenColumns = screenLayout.columns;
            screenSliceCoords = screenLayout.sliceCoords;
            if (maxMainTop != null) {
                for (let col = 0; col < cells.length; col++) {
                    const cellHeaderHeight = headerHeightRefMap.current.get(cells[col].key);
                    const mainOffset = cellHeaderHeight != null
                        ? maxMainTop - cellHeaderHeight
                        : undefined;
                    screenMainOffsetsByCol.push(mainOffset);
                    screenHeightsByCol.push(mainOffset != null
                        ? screenColumns[col].contentHeight + mainOffset
                        : undefined);
                }
            }
        }
        const highlightSegs = this.getHighlightSegs();
        const hasNavLink = options.navLinks;
        const fullWeekStr = buildDateStr(context, weekDateMarker, 'week');
        const weekNumberRenderProps = this.buildWeekNumberRenderProps(weekDateMarker, context, props.cellIsNarrow, hasNavLink);
        const fillsByCol = cells.map(() => []);
        // Table mode gives this theme-positioned node a row-wide canvas hosted by the first cell.
        const weekNumberNode = (props.showWeekNumbers && !props.cellIsMicro) ? (jsx(ContentContainer, { tag: "div", attrs: {
                ...(hasNavLink
                    ? buildNavLinkAttrs(context, weekDateMarker, 'week', fullWeekStr, /* isTabbable = */ false)
                    : {}),
                'role': undefined, // HACK: a 'link' role can't be child of a 'row' role
                'aria-hidden': true, // HACK: never part of a11y tree because row already has label and role not allowed
            }, className: DAY_GRID_EVENT_Z_CLASS, renderProps: weekNumberRenderProps, generatorName: "inlineWeekNumberContent", customGenerator: options.inlineWeekNumberContent, defaultGenerator: renderText$1, classNameGenerator: options.inlineWeekNumberClass, didMount: options.inlineWeekNumberDidMount, willUnmount: options.inlineWeekNumberWillUnmount })) : null;
        if (tableMode && weekNumberNode) {
            fillsByCol[0].push(jsx("div", { className: joinClassNames(classNames.fillY, classNames.start0, classNames.pointerEventsNone), style: {
                    width: this.computeSpanWidth(0, cells.length),
                }, children: weekNumberNode }, "week-number"));
        }
        this.appendFillSegs(fillsByCol, props.businessHourSegs, 'non-business', DAY_GRID_NON_BUSINESS_Z_CLASS);
        this.appendFillSegs(fillsByCol, props.bgEventSegs, 'bg-event', DAY_GRID_BG_EVENT_Z_CLASS);
        this.appendFillSegs(fillsByCol, highlightSegs, 'highlight', DAY_GRID_HIGHLIGHT_Z_CLASS);
        const RowTag = tableMode ? 'tr' : 'div';
        return (jsxs(RowTag, { role: props.role /* !!! */, "aria-label": props.role === 'row' // HACK
                ? fullWeekStr
                : undefined // can't have label on non-role div
            , className: joinClassNames(options.dayRowClass, props.className, tableMode && classNames.borderless, !tableMode && classNames.flexRow, !tableMode && classNames.rel, // origin for the inline week number
            !tableMode && classNames.borderlessX, !tableMode && classNames.borderlessTop, (!tableMode && !props.borderBottom) && classNames.borderlessBottom, classNames.isolate), style: {
                flexBasis: tableMode ? undefined : props.basis,
            }, ref: this.handleRootEl, children: [!tableMode && weekNumberNode, props.cells.map((cell, col) => {
                    const printPopover = printPlan
                        ? buildDayGridPopoverSegs(printPlan.sourceSegs, printPlan.hiddenSlices, col)
                        : null;
                    let fg;
                    if (printPlan) {
                        fg = this.renderPrintBandSlots(printColumns[col]);
                    }
                    else {
                        fg = [
                            ...this.renderLevelFgSegs(screenMainOffsetsByCol[col], screenColumns[col].renderSlices, screenSliceCoords),
                            ...this.renderMirrorFgSegs(col, screenMainOffsetsByCol[col], screenSliceCoords),
                        ];
                    }
                    return (jsx(DayGridCell, { dateProfile: props.dateProfile, todayRange: props.todayRange, date: cell.date, isMajor: cell.isMajor, isDisabled: cell.isDisabled, showDayNumber: props.showDayNumbers, isNarrow: props.cellIsNarrow, isMicro: props.cellIsMicro, borderStart: Boolean(col), borderBottom: props.borderBottom, tableMode: tableMode, 
                        // content
                        fills: fillsByCol[col], segs: printPopover ? printPopover.segs : screenColumns[col].segs, hiddenSegs: printPopover ? printPopover.hiddenSegs : screenColumns[col].hiddenSegs, fgLiquidHeight: printPlan ? false : screenFgLiquidHeight, fg: fg, eventDrag: printPlan ? null : props.eventDrag, eventResize: printPlan ? null : props.eventResize, eventSelection: props.eventSelection, 
                        // render hooks
                        renderProps: cell.renderProps, dateSpanProps: cell.dateSpanProps, attrs: cell.attrs, className: cell.className, 
                        // dimensions
                        fgHeight: printPlan ? undefined : screenHeightsByCol[col], width: props.colWidth, 
                        // refs
                        headerHeightRef: printPlan ? undefined : headerHeightRefMap.createRef(cell.key), mainHeightRef: printPlan ? undefined : mainHeightRefMap.createRef(cell.key) }, cell.key));
                })] }));
    }
    /** Mirrors align with kernel coordinates but bypass admission and measurement. */
    renderMirrorFgSegs(col, mainOffset, sliceCoords) {
        const { props } = this;
        const { eventSelection } = props;
        const nodes = [];
        for (const seg of this.getMirrorSegs()) {
            if (seg.start !== col) {
                continue;
            }
            const key = getDayGridSegKey(seg);
            const { eventRange } = seg;
            const { instanceId } = eventRange.instance;
            const top = mainOffset != null
                ? mainOffset + (sliceCoords.get(key) ?? 0)
                : undefined;
            const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId]);
            const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId]);
            const isSelected = instanceId === eventSelection;
            nodes.push(jsx(MeasuredHeightHarness, { className: joinClassNames(classNames.abs, classNames.start0, DAY_GRID_INTERACTION_Z_CLASS), style: {
                    top,
                    width: this.computeSpanWidth(seg.start, seg.end),
                }, heightRef: null, children: this.renderEventContent(seg, eventRange, {
                    isDragging,
                    isResizing,
                    isMirror: true,
                    isSelected,
                }) }, `mirror:${key}`));
        }
        return nodes;
    }
    /** Renders every kernel slice with its own measurement ref. */
    renderLevelFgSegs(mainOffset, slices, sliceCoords) {
        const { props } = this;
        const { eventSelection } = props;
        const nodes = [];
        for (const slice of slices) {
            const key = getSliceKey(slice);
            const sliceTop = sliceCoords.get(key);
            const { eventRange } = slice.sourceSeg;
            const { instanceId } = eventRange.instance;
            const top = mainOffset != null && sliceTop != null
                ? mainOffset + sliceTop
                : undefined;
            const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId]);
            const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId]);
            const isInvisible = isDragging || isResizing || top == null;
            const isSelected = instanceId === eventSelection;
            nodes.push(jsx(MeasuredHeightHarness, { className: joinClassNames(classNames.abs, classNames.start0, isSelected ? DAY_GRID_INTERACTION_Z_CLASS : DAY_GRID_EVENT_Z_CLASS), style: {
                    visibility: isInvisible ? 'hidden' : undefined,
                    top,
                    width: this.computeSpanWidth(slice.start, slice.end),
                }, heightRef: this.sliceHeightRefMap.createRef(key), children: this.renderEventContent(slice, eventRange, {
                    isDragging,
                    isResizing,
                    isSelected,
                }) }, key));
        }
        return nodes;
    }
    /**
     * The inner event, identical on both placement routes. Only the wrapper
     * around it differs: the screen route positions it, print lets it sit at the
     * static top of its band slot.
    */
    renderEventContent(range, eventRange, interaction) {
        const { props } = this;
        const isListItem = hasListItemDisplay(range, eventRange);
        return (jsx(StandardEvent, { display: isListItem ? 'list-item' : 'row', eventRange: eventRange, isStart: range.isStart, isEnd: range.isEnd, isDragging: Boolean(interaction.isDragging), isResizing: Boolean(interaction.isResizing), isMirror: Boolean(interaction.isMirror), isSelected: Boolean(interaction.isSelected), isNarrow: props.cellIsNarrow, defaultTimeFormat: DEFAULT_TABLE_EVENT_TIME_FORMAT, defaultDisplayEventEnd: props.cells.length === 1, disableResizing: isListItem, forcedTimeText: props.cellIsMicro ? '' : undefined, ...getEventRangeMeta(eventRange, props.todayRange) }));
    }
    /** Renders aligned print slots with in-flow event wrappers that can paginate with their bands. */
    renderPrintBandSlots(slots) {
        const { printSegHeightRefMap } = this;
        return slots.map((slot) => {
            const { slice } = slot;
            let eventNode = null;
            if (slice) {
                const sliceKey = getDayGridPrintSliceKey(slice);
                eventNode = (jsx(MeasuredHeightHarness, { className: joinClassNames(classNames.rel, classNames.flowRoot, DAY_GRID_EVENT_Z_CLASS), style: {
                        width: this.computeSpanWidth(slice.start, slice.end),
                    }, heightRef: printSegHeightRefMap.createRef(sliceKey), children: this.renderEventContent(slice, slice.sourceSeg.eventRange, {}) }, sliceKey));
            }
            return (jsx("div", { className: classNames.breakInsideAvoid, style: { height: slot.thickness }, children: eventNode }, slot.levelIndex));
        });
    }
    computeSpanWidth(start, end) {
        const span = end - start;
        const percentWidth = `${span * 100}%`;
        // Flex cells have uniform inner widths, so spans must add crossed borders.
        // Fixed-table cells have uniform outer widths; the borderless first cell's inner
        // width already includes that space, so no border compensation is needed.
        const crossedBorderWidth = this.props.tableMode && start === 0
            ? 0
            : Math.max(0, span - 1) * COL_BORDER_WIDTH;
        return crossedBorderWidth
            ? `calc(${percentWidth} + ${crossedBorderWidth}px)`
            : percentWidth;
    }
    /** Places each fill in its first cell while allowing its wrapper to span subsequent cells. */
    appendFillSegs(fillsByCol, segs, fillType, zClassName) {
        const { props, context } = this;
        const { todayRange } = props;
        for (const seg of segs) {
            fillsByCol[seg.start].push(jsx("div", { className: joinClassNames(classNames.fillY, classNames.start0, zClassName), style: {
                    width: this.computeSpanWidth(seg.start, seg.end),
                }, children: fillType === 'bg-event' ?
                    jsx(BgEvent, { eventRange: seg.eventRange, isStart: seg.isStart, isEnd: seg.isEnd, isNarrow: props.cellIsNarrow, isVertical: false, ...getEventRangeMeta(seg.eventRange, todayRange) }) : (renderFill(fillType, context.options)) }, `${fillType}:${buildEventRangeKey(seg.eventRange)}:${seg.start}:${seg.end}`));
        }
    }
    // Sizing
    // -----------------------------------------------------------------------------------------------
    componentDidMount() {
        this._isUnmounting = false;
    }
    componentDidUpdate(prevProps) {
        if (prevProps.forPrint && !this.props.forPrint) {
            this.printSegHeightRefMap = new RefMap(this.handlePrintSegHeightChange);
        }
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.disconnectHeight?.();
        setRef(this.props.heightRef, null);
    }
    computeFgDims() {
        const { cells } = this.props;
        const headerHeightMap = this.headerHeightRefMap.current;
        const mainHeightMap = this.mainHeightRefMap.current;
        let maxMainTop;
        let minMainBottom;
        let isComplete = true;
        for (const cell of cells) {
            if (cell.isDisabled) {
                continue;
            }
            const mainTop = headerHeightMap.get(cell.key);
            const mainHeight = mainHeightMap.get(cell.key);
            if (mainTop == null || mainHeight == null) {
                isComplete = false;
            }
            if (mainTop != null) {
                if (maxMainTop === undefined || mainTop > maxMainTop) {
                    maxMainTop = mainTop;
                }
                if (mainHeight != null) {
                    const mainBottom = mainTop + mainHeight;
                    if (minMainBottom === undefined || mainBottom < minMainBottom) {
                        minMainBottom = mainBottom;
                    }
                }
            }
        }
        return [
            maxMainTop,
            isComplete && minMainBottom != null && maxMainTop != null
                ? minMainBottom - maxMainTop
                : undefined,
        ];
    }
    /**
     * Grows the row-local DOM candidate frontier from one post-size snapshot.
     * This is the only monotone state auto placement needs: the engine itself
     * consumes exact measurements and never predicts a thickness.
     */
    updateAutoPlacementRatchets() {
        if (resolveDayGridPlacementMode(this.props.dayMaxEvents, this.props.dayMaxEventRows) !== 'auto')
            return;
        const [, canvasHeight] = this.computeFgDims();
        if (canvasHeight != null) {
            const smallestSliceHeight = Math.min(...this.sliceHeightRefMap.current.values());
            this.levelCapacity = Math.max(this.levelCapacity, estimateLevelCapacity(canvasHeight, smallestSliceHeight));
        }
    }
    // Internal Utils
    // -----------------------------------------------------------------------------------------------
    getMirrorSegs() {
        let { props } = this;
        if (props.eventResize && props.eventResize.segs.length) { // messy check
            return props.eventResize.segs;
        }
        return [];
    }
    getHighlightSegs() {
        let { props } = this;
        if (props.eventDrag && props.eventDrag.segs.length) { // messy check
            return props.eventDrag.segs;
        }
        if (props.eventResize && props.eventResize.segs.length) { // messy check
            return props.eventResize.segs;
        }
        return props.dateSelectionSegs;
    }
}
function buildWeekNumberRenderProps(weekDateMarker, context, isNarrow, hasNavLink) {
    const { dateEnv, options } = context;
    const weekNum = dateEnv.computeWeekNumber(weekDateMarker);
    const weekNumTextParts = dateEnv.formatToParts(weekDateMarker, options.weekNumberFormat || DEFAULT_WEEK_NUM_FORMAT);
    const weekNumText = joinDateTimeFormatParts(weekNumTextParts);
    const weekDateZoned = dateEnv.toDate(weekDateMarker);
    return {
        num: weekNum,
        text: weekNumText,
        textParts: weekNumTextParts,
        date: weekDateZoned,
        isNarrow,
        hasNavLink,
    };
}

class DaySeriesModel {
    constructor(range, dateProfileGenerator) {
        let date = range.start;
        let { end } = range;
        let entries = [];
        let dates = [];
        let dayIndex = -1;
        while (date < end) { // loop each day from start to end
            if (dateProfileGenerator.isHiddenDay(date)) {
                entries.push({
                    kind: 'hidden',
                    previousIndex: dayIndex,
                    nextIndex: dayIndex + 1,
                });
            }
            else {
                dayIndex += 1;
                entries.push({ kind: 'visible', index: dayIndex });
                dates.push(date);
            }
            date = addDays(date, 1);
        }
        this.rangeStart = range.start;
        this.dates = dates;
        this.entries = entries;
        this.cnt = dates.length;
    }
    sliceRange(range) {
        let firstResult = this.getDateIndex(range.start);
        let lastResult = this.getDateIndex(addDays(range.end, -1));
        let firstIndex = getFirstVisibleIndex(firstResult);
        let lastIndex = getLastVisibleIndex(lastResult);
        let clippedFirstIndex = Math.max(0, firstIndex);
        let clippedLastIndex = Math.min(this.cnt - 1, lastIndex);
        if (clippedFirstIndex <= clippedLastIndex) {
            return {
                start: clippedFirstIndex,
                end: clippedLastIndex + 1, // make exclusive
                isStart: firstResult.kind === 'visible' && firstIndex === clippedFirstIndex,
                isEnd: lastResult.kind === 'visible' && lastIndex === clippedLastIndex,
            };
        }
        return null;
    }
    getDateIndex(date) {
        let dayOffset = Math.floor(diffDays(this.rangeStart, date));
        if (dayOffset < 0) {
            return { kind: 'before', index: -1 };
        }
        if (dayOffset >= this.entries.length) {
            return { kind: 'after', index: this.cnt };
        }
        return this.entries[dayOffset];
    }
}
function getFirstVisibleIndex(result) {
    return result.kind === 'hidden' ? result.nextIndex : result.index;
}
function getLastVisibleIndex(result) {
    return result.kind === 'hidden' ? result.previousIndex : result.index;
}

function buildDayTableModel(dateProfile, dateProfileGenerator, dateEnv) {
    const daySeries = new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator);
    const breakOnWeeks = /year|month|week/.test(dateProfile.currentRangeUnit);
    const majorUnit = !breakOnWeeks && computeMajorUnit(dateProfile, dateEnv);
    // Exclude 'day': when cells are themselves days, all would match and the boundary
    // distinction is meaningless (unlike timeline slots which can be sub-day).
    return new DayTableModel(daySeries, breakOnWeeks, dateEnv, majorUnit !== 'day' ? majorUnit : undefined, dateProfile.activeRange);
}
function computeColWidth(colCount, colMinWidth, viewportWidth) {
    if (viewportWidth == null) {
        return [undefined, undefined];
    }
    const colTempWidth = viewportWidth / colCount;
    if (colTempWidth < colMinWidth) {
        return [colMinWidth * colCount, colMinWidth];
    }
    return [viewportWidth, undefined];
}
// Positioning
// -------------------------------------------------------------------------------------------------
/*
TODO: handle hidden-days better. If current day is hidden day, scrolls to way bottom
*/
function computeTopFromDate(date, cellRows, rowHeightMap) {
    let top = 0;
    for (const cells of cellRows) {
        const key = cells[0].key;
        const start = cells[0].date;
        const end = cells[cells.length - 1].date; // inclusive end
        if (date >= start && date <= end) {
            return top;
        }
        const rowHeight = rowHeightMap.get(key);
        if (rowHeight == null) {
            return; // denote unknown
        }
        top += rowHeight;
    }
    return top;
}
function computeColFromPosition(positionLeft, elWidth, colWidth, colCount, isRtl) {
    const realColWidth = colWidth != null ? colWidth : elWidth / colCount;
    const colFromLeft = Math.floor(positionLeft / realColWidth);
    const col = isRtl ? (colCount - colFromLeft - 1) : colFromLeft;
    const left = colFromLeft * realColWidth;
    const right = left + realColWidth;
    return { col, left, right };
}
function computeRowFromPosition(positionTop, cellRows, rowHeightMap) {
    let row = 0;
    let top = 0;
    let bottom = 0;
    for (const cells of cellRows) {
        const key = cells[0].key;
        top = bottom;
        bottom = top + rowHeightMap.get(key);
        if (positionTop < bottom) {
            break;
        }
        row++;
    }
    return { row, top, bottom };
}
// Hit Element
// -------------------------------------------------------------------------------------------------
function getRowEl(rootEl, row) {
    return rootEl.querySelectorAll('[role=row]')[row];
}
function getCellEl(rowEl, col) {
    return rowEl.querySelectorAll('[role=gridcell]')[col];
}
// Header Formatting
// -------------------------------------------------------------------------------------------------
const dayMicroWidth = 60;
const dayHeaderMicroFormat = createFormatter({
    weekday: 'narrow'
});
function createDayHeaderFormatter(explicitFormat, datesRepDistinctDays, dateCnt) {
    return explicitFormat || computeFallbackHeaderFormat(datesRepDistinctDays, dateCnt);
}
// Computes a default column header formatting string if `colFormat` is not explicitly defined
function computeFallbackHeaderFormat(datesRepDistinctDays, dayCnt) {
    // if more than one week row, or if there are a lot of columns with not much space,
    // put just the day numbers will be in each cell
    if (!datesRepDistinctDays) {
        return createFormatter({ weekday: 'short' }); // "Sat"
    }
    if (dayCnt > 1) {
        return createFormatter({
            weekday: 'short',
            weekdayJustify: 'start',
            day: 'numeric',
            omitCommas: true,
            omitTrailing: true,
        });
    }
    return createFormatter({
        weekday: 'long',
        weekdayJustify: 'start',
        day: 'numeric',
        omitCommas: true,
        omitTrailing: true,
    });
}

class DayGridRows extends DateComponent {
    constructor() {
        super(...arguments);
        this.state = {};
        // memo
        this.splitBusinessHourSegs = memoize(splitSegsByRow);
        this.splitBgEventSegs = memoize(splitAllDaySegsByRow);
        this.splitFgEventSegs = memoize(splitSegsByRow);
        this.splitDateSelectionSegs = memoize(splitSegsByRow);
        this.splitEventDrag = memoize(splitInteractionByRow);
        this.splitEventResize = memoize(splitInteractionByRow);
        this.rowHeightRefMap = new RefMap((height, key) => {
            // HACKy way of syncing RefMap results with prop
            const { rowHeightRefMap } = this.props;
            if (rowHeightRefMap) {
                rowHeightRefMap.handleValue(height, key);
            }
        });
        this.handleMoreLinkEl = (el) => {
            this.disconnectMoreLinkHeight?.();
            this.disconnectMoreLinkHeight = undefined;
            if (el) {
                this.disconnectMoreLinkHeight = watchHeight(el, (height) => {
                    if (this._isUnmounting)
                        return;
                    this.setState({ moreLinkHeight: height });
                });
            }
        };
        this.handleRootEl = (rootEl) => {
            this.rootEl = rootEl;
            if (rootEl) {
                this.context.registerInteractiveComponent(this, {
                    el: rootEl,
                    isHitComboAllowed: this.props.isHitComboAllowed,
                });
            }
            else {
                this.context.unregisterInteractiveComponent(this);
            }
        };
    }
    render() {
        let { props, state, context, rowHeightRefMap } = this;
        let { options } = context;
        let { cellRows, tableMode } = props;
        let rowCount = cellRows.length;
        // Will cause rows to not be reused across months
        let firstCellKey = cellRows[0]?.[0]?.key || '';
        let fgEventSegsByRow = this.splitFgEventSegs(props.fgEventSegs, rowCount);
        let bgEventSegsByRow = this.splitBgEventSegs(props.bgEventSegs, rowCount);
        let businessHourSegsByRow = this.splitBusinessHourSegs(props.businessHourSegs, rowCount);
        let dateSelectionSegsByRow = this.splitDateSelectionSegs(props.dateSelectionSegs, rowCount);
        let eventDragByRow = this.splitEventDrag(props.eventDrag, rowCount);
        let eventResizeByRow = this.splitEventResize(props.eventResize, rowCount);
        let isHeightAuto = getIsHeightAuto(options);
        let rowHeightsRedistribute = !props.forPrint && !isHeightAuto;
        let rowBasis = computeRowBasis(props.visibleWidth, rowCount, isHeightAuto, options);
        const needsMoreLinkProbe = !props.forPrint && resolveDayGridPlacementMode(props.dayMaxEvents, props.dayMaxEventRows) === 'auto';
        const RowsTag = tableMode ? 'tbody' : 'div';
        return (jsxs(Fragment, { children: [jsx(RowsTag, { role: "rowgroup", className: joinClassNames(props.className, 
                    // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
                    // https://stackoverflow.com/a/60256345
                    !tableMode && !props.forPrint && classNames.flexCol), style: tableMode ? undefined : { width: props.width }, ref: this.handleRootEl, children: cellRows.map((cells, row) => (jsx(DayGridRow, { role: "row", dateProfile: props.dateProfile, todayRange: props.todayRange, cells: cells, cellIsNarrow: props.cellIsNarrow, cellIsMicro: props.cellIsMicro, showDayNumbers: rowCount > 1, showWeekNumbers: rowCount > 1 && options.weekNumbers, forPrint: props.forPrint, tableMode: tableMode, borderBottom: row < rowCount - 1, 
                        // if not auto-height, distribute height of container somewhat evently to rows
                        className: rowHeightsRedistribute ? classNames.grow : undefined, 
                        // content
                        fgEventSegs: fgEventSegsByRow[row], bgEventSegs: bgEventSegsByRow[row], businessHourSegs: businessHourSegsByRow[row], dateSelectionSegs: dateSelectionSegsByRow[row], eventSelection: props.eventSelection, eventDrag: eventDragByRow[row], eventResize: eventResizeByRow[row], dayMaxEvents: props.dayMaxEvents, dayMaxEventRows: props.dayMaxEventRows, 
                        // dimensions
                        colWidth: props.colWidth, basis: rowBasis, moreLinkHeight: state.moreLinkHeight, 
                        // refs
                        heightRef: rowHeightRefMap.createRef(cells[0].key) }, firstCellKey + ':' + cells[0].key))) }), needsMoreLinkProbe && (jsx(MoreLinkTrigger, { num: 1, display: 'row', isNarrow: props.cellIsNarrow, isMicro: props.cellIsMicro, elRef: this.handleMoreLinkEl, className: classNames.offscreen, attrs: {
                        'aria-hidden': true,
                        inert: '',
                    } }))] }));
    }
    componentDidMount() {
        this._isUnmounting = false;
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.disconnectMoreLinkHeight?.();
    }
    // Hit System
    // -----------------------------------------------------------------------------------------------
    queryHit(isRtl, positionLeft, positionTop, elWidth) {
        const { props } = this;
        const colCount = props.cellRows[0].length;
        const { col, left, right } = computeColFromPosition(positionLeft, elWidth, props.colWidth, colCount, isRtl);
        const { row, top, bottom } = computeRowFromPosition(positionTop, props.cellRows, this.rowHeightRefMap.current);
        const cell = props.cellRows[row][col];
        const cellStartDate = cell.date;
        const cellEndDate = addDays(cellStartDate, 1);
        return {
            dateProfile: props.dateProfile,
            dateSpan: {
                range: {
                    start: cellStartDate,
                    end: cellEndDate,
                },
                allDay: true,
                ...cell.dateSpanProps,
            },
            getDayEl: () => getCellEl(getRowEl(this.rootEl, row), col),
            rect: {
                left,
                right,
                top,
                bottom,
            },
            layer: 0,
        };
    }
}
// Utils
// -------------------------------------------------------------------------------------------------
function isSegAllDay(seg) {
    return seg.eventRange.def.allDay;
}
function splitAllDaySegsByRow(segs, rowCnt) {
    return splitSegsByRow(segs.filter(isSegAllDay), rowCnt);
}
/*
Amount of height a row should consume prior to expanding
We don't want to use min-height with flexbox because we leverage min-height:auto,
which yields value based on natural height of events
*/
function computeRowBasis(visibleWidth, // should INCLUDE any scrollbar width to avoid oscillation
rowCount, isHeightAuto, options) {
    if (visibleWidth != null) {
        // ensure a consistent row min-height modelled after a month with 6 rows respecting aspectRatio
        // will result in same minHeight regardless of weekends, dayMinWidth, height:auto
        const rowBasis = visibleWidth / options.aspectRatio / 6;
        // don't give minHeight when single-month non-auto-height
        // TODO: better way to detect this with DateProfile?
        return (rowCount > 6 || isHeightAuto) ? rowBasis : 0;
    }
    return 0;
}

class DayGridHeaderCell extends BaseComponent {
    constructor() {
        super(...arguments);
        this.state = {};
        // memo
        this.buildDayHeaderText = memoize(buildDayHeaderText);
        this.handleInnerEl = (innerEl) => {
            if (this.disconnectSize) {
                this.disconnectSize();
                this.disconnectSize = undefined;
            }
            if (innerEl) {
                this.disconnectSize = watchSize(innerEl, (width, height) => {
                    if (this._isUnmounting)
                        return;
                    setRef(this.props.innerHeightRef, height);
                    this.setState({ innerWidth: width });
                });
            }
            else {
                setRef(this.props.innerHeightRef, null);
            }
        };
    }
    render() {
        const { props, state, context } = this;
        const { renderConfig, dataConfig, tableMode } = props;
        const colSpan = dataConfig.colSpan || 1;
        const totalColWidth = props.colWidth != null
            ? props.colWidth * colSpan
            : undefined;
        const isLiquid = !tableMode && totalColWidth == null;
        /*
        A liquid cell that spans multiple columns can't use the .liquid class, which gives every
        cell an equal share regardless of colSpan. Instead, grow proportionally to the columns
        covered. Like the body cells, use a zero basis so borders remain within the distributed
        border-box width.
        */
        const isSpanning = isLiquid && colSpan > 1;
        const style = tableMode ? undefined : isSpanning ? {
            flexGrow: colSpan,
            flexBasis: 0,
            minWidth: 0,
        } : {
            width: totalColWidth,
        };
        // HACK
        const isDisabled = dataConfig.renderProps.isDisabled;
        const finalRenderProps = renderConfig.dayHeaderFormat
            ? this.buildDayHeaderRenderProps(dataConfig.renderProps, props.cellIsNarrow, props.rowLevel, props.cellIsMicro, dataConfig.dateMarker, renderConfig.dayHeaderFormat, Boolean(renderConfig.datesRepDistinctDays), context.dateEnv)
            : {
                ...dataConfig.renderProps,
                isNarrow: props.cellIsNarrow,
                level: props.rowLevel,
            };
        /*
        TODO: DRY with TimelineHeaderCell
        */
        const alignInput = renderConfig.align;
        const align = // normalized string-enum value
         typeof alignInput === 'function'
            ? alignInput({ level: props.rowLevel, inPopover: dataConfig.renderProps.inPopover, isNarrow: props.cellIsNarrow })
            : alignInput;
        const stickyInput = renderConfig.sticky;
        const isSticky = !tableMode &&
            props.rowLevel > 0 &&
            stickyInput !== false && (
        // if center-aligned, and wants to be sticky, must be >75% viewport width,
        // to avoid looking awkwardly aligned
        align !== 'center' || (totalColWidth != null &&
            props.viewportWidth != null &&
            totalColWidth > props.viewportWidth * 0.75));
        let edgeCoord;
        if (isSticky) {
            if (align === 'center') {
                if (state.innerWidth != null) {
                    edgeCoord = `calc(50% - ${state.innerWidth / 2}px)`;
                }
            }
            else {
                edgeCoord = (typeof stickyInput === 'number' ||
                    typeof stickyInput === 'string') ? stickyInput : 0;
            }
        }
        /*
        In screen mode, alignment belongs on the outer flex cell so the inner element
        remains shrink-wrapped for sticky positioning measurements. In table mode, the
        <th> must remain a table cell, so alignment moves to its full-width inner flex
        element. That width cannot support sticky positioning, which table mode disables.
        */
        const alignClassName = align === 'center' ? classNames.alignCenter :
            align === 'end' ? classNames.alignEnd :
                classNames.alignStart;
        const CellTag = tableMode ? 'th' : 'div';
        return (jsx(ContentContainer, { tag: CellTag, attrs: {
                role: 'columnheader',
                'aria-colspan': dataConfig.colSpan,
                colSpan: tableMode ? colSpan : undefined,
                ...dataConfig.attrs,
            }, className: joinClassNames(dataConfig.className, classNames.noMargin, classNames.noPadding, !tableMode && classNames.flexCol, classNames.borderlessTop, classNames.borderlessEnd, !props.borderStart && classNames.borderlessStart, !(tableMode && props.borderBottom) && classNames.borderlessBottom, !tableMode && alignClassName, isLiquid && !isSpanning && classNames.liquid, !isSticky && classNames.crop), style: style, renderProps: finalRenderProps, generatorName: renderConfig.generatorName, customGenerator: renderConfig.customGenerator, defaultGenerator: renderText$1, classNameGenerator: 
            // don't use custom classNames if disabled
            // TODO: make DRY with DayCellContainer
            isDisabled ? undefined : renderConfig.classNameGenerator, didMount: renderConfig.didMount, willUnmount: renderConfig.willUnmount, children: (InnerContainer) => (jsx("div", { ref: this.handleInnerEl, className: joinClassNames(classNames.flexCol, classNames.noShrink, classNames.whiteSpaceNoWrap, tableMode && alignClassName, isSticky && classNames.sticky), style: {
                    left: edgeCoord,
                    right: edgeCoord,
                }, children: jsx(InnerContainer, { tag: 'div', attrs: dataConfig.innerAttrs, className: generateClassName(renderConfig.innerClassNameGenerator, finalRenderProps) }) })) }));
    }
    componentDidMount() {
        this._isUnmounting = false;
    }
    componentWillUnmount() {
        this._isUnmounting = true;
    }
    buildDayHeaderRenderProps(renderProps, cellIsNarrow, rowLevel, cellIsMicro, dateMarker, dayHeaderFormat, datesRepDistinctDays, dateEnv) {
        const baseText = this.buildDayHeaderText(datesRepDistinctDays ? dateMarker : renderProps.date, dayHeaderFormat, datesRepDistinctDays, dateEnv);
        const textData = cellIsMicro
            ? this.buildDayHeaderText(dateMarker, dayHeaderMicroFormat, false, dateEnv)
            : baseText;
        return {
            ...renderProps,
            isNarrow: cellIsNarrow,
            level: rowLevel,
            text: textData.text,
            textParts: textData.textParts,
            weekdayText: cellIsMicro ? textData.text : baseText.weekdayText,
            dayNumberText: baseText.dayNumberText,
        };
    }
}
function buildDayHeaderText(date, formatter, includeDayNumber, dateEnv) {
    const textParts = dateEnv.formatToParts(date, formatter);
    return {
        text: joinDateTimeFormatParts(textParts),
        textParts,
        weekdayText: findWeekdayText(textParts),
        dayNumberText: includeDayNumber ? findDayNumberText(textParts) : '',
    };
}

class DayGridHeaderRow extends BaseComponent {
    constructor() {
        super(...arguments);
        // ref
        this.innerHeightRefMap = new RefMap(() => {
            afterSize(this.handleInnerHeights);
        });
        this.handleInnerHeights = () => {
            if (this._isUnmounting)
                return;
            const innerHeightMap = this.innerHeightRefMap.current;
            let max = 0;
            for (const innerHeight of innerHeightMap.values()) {
                max = Math.max(max, innerHeight);
            }
            if (this.currentInnerHeight !== max) {
                this.currentInnerHeight = max;
                setRef(this.props.innerHeightRef, max);
            }
        };
    }
    render() {
        const { props, context } = this;
        const { tableMode } = props;
        const { options } = context;
        const RowTag = tableMode ? 'tr' : 'div';
        return (jsx(RowTag, { role: props.role /* !!! */, "aria-rowindex": props.rowIndex != null ? 1 + props.rowIndex : undefined, className: joinClassNames(options.dayHeaderRowClass, props.className, tableMode && classNames.borderless, !tableMode && classNames.flexRow, !tableMode && classNames.contentBox, !tableMode && classNames.borderlessX, !tableMode && classNames.borderlessTop, (!tableMode && !props.borderBottom) && classNames.borderlessBottom), style: {
                height: props.height,
            }, children: props.dataConfigs.map((dataConfig, cellI) => (jsx(DayGridHeaderCell, { renderConfig: props.renderConfig, dataConfig: dataConfig, borderStart: Boolean(cellI), colWidth: props.colWidth, viewportWidth: props.viewportWidth, innerHeightRef: this.innerHeightRefMap.createRef(dataConfig.key), cellIsNarrow: props.cellIsNarrow, cellIsMicro: props.cellIsMicro, rowLevel: props.rowLevel, tableMode: tableMode, borderBottom: props.borderBottom }, dataConfig.key))) }));
    }
    componentDidMount() {
        this._isUnmounting = false;
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.currentInnerHeight = undefined;
        setRef(this.props.innerHeightRef, null);
    }
}

class DayGridHeaderRows extends BaseComponent {
    render() {
        const { props } = this;
        const { headerTiers, tableMode } = props;
        return headerTiers.map((rowConfig, i) => (createElement(DayGridHeaderRow, { ...rowConfig, key: i, role: 'row', borderBottom: i < headerTiers.length - 1, colWidth: props.colWidth, viewportWidth: props.viewportWidth, cellIsNarrow: props.cellIsNarrow, cellIsMicro: props.cellIsMicro, rowLevel: headerTiers.length - i - 1, tableMode: tableMode })));
    }
}

class DayGridLayoutPrint extends BaseComponent {
    render() {
        const { props, context } = this;
        const { options } = context;
        const tableDisplayInfo = {
            borderlessX: props.borderlessX,
            borderlessTop: props.borderlessTop,
            borderlessBottom: props.borderlessBottom,
            multiMonthColumns: props.multiMonthColumns,
        };
        return (jsxs("table", { role: "presentation", className: joinClassNames(generateClassName(options.tableClass, tableDisplayInfo), classNames.printTable), style: props.style, children: [jsx("colgroup", { children: props.cellRows[0].map((cell) => jsx("col", {}, cell.key)) }), props.showHeader && (jsxs("thead", { ref: props.headerElRef, role: "rowgroup", className: generateClassName(options.tableHeaderClass, {
                        ...tableDisplayInfo,
                        isSticky: false,
                    }), children: [jsx(DayGridHeaderRows, { tableMode: true, headerTiers: props.headerTiers, cellIsNarrow: props.cellIsNarrow, cellIsMicro: props.cellIsMicro }), jsx("tr", { role: "presentation", children: jsx("th", { role: "presentation", colSpan: props.cellRows[0].length, className: joinClassNames(classNames.noPadding, generateClassName(options.dayHeaderDividerClass, {
                                    isSticky: false,
                                    multiMonthColumns: props.multiMonthColumns,
                                    options: { allDaySlot: Boolean(options.allDaySlot) },
                                })) }) })] })), jsx(DayGridRows, { dateProfile: props.dateProfile, todayRange: props.todayRange, cellRows: props.cellRows, forPrint: true, tableMode: true, className: generateClassName(options.tableBodyClass, tableDisplayInfo), dayMaxEvents: undefined, dayMaxEventRows: props.dayMaxEventRows, fgEventSegs: props.fgEventSegs, bgEventSegs: props.bgEventSegs, businessHourSegs: props.businessHourSegs, dateSelectionSegs: [], eventDrag: null, eventResize: null, eventSelection: props.eventSelection, visibleWidth: props.visibleWidth, cellIsNarrow: props.cellIsNarrow, cellIsMicro: props.cellIsMicro, rowHeightRefMap: props.rowHeightRefMap })] }));
    }
}

export { buildLevelLimitedLayout as A, BgEvent as B, computeLateralSpanBottom as C, DayTableSlicer as D, getSliceKey as E, buildPrintEventBands as F, planPrintDomCandidates as G, buildPrintMoreLinkBand as H, DayTableModel as I, MeasuredHeightHarness as J, buildDateRenderConfig as K, buildDateDataConfigs as L, MoreLinkTrigger as M, RefMap as R, Slicer as S, buildDateRowConfigs as a, buildDayTableModel as b, createDayHeaderFormatter as c, DaySeriesModel as d, DaySeriesSlicer as e, buildDateRowConfig as f, Ruler as g, DayGridLayoutPrint as h, DayGridHeaderRow as i, DayGridRows as j, dayMicroWidth as k, DayGridHeaderRows as l, computeColWidth as m, computeTopFromDate as n, DayGridRow as o, computeColFromPosition as p, getCellEl as q, resolveDayGridPlacementMode as r, buildSegLevels as s, groupLaterallyIntersecting as t, convertSegsToWholeSlices as u, sortByAxisOrder as v, findIntersections as w, MoreLinkContainer as x, renderFill as y, DEFAULT_UNMEASURED_EVENT_THICKNESS as z };
