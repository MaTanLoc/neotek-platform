export { z as EventImpl, aq as buildEventRangeKey, Q as buildValidInstanceRange, ar as combineEventUis, au as compareByFieldSpecs, k as computeViewBorderless, L as computeVisibleDayRange, d as createEventUi, c as createFormatter, f as filterHash, av as flexibleCompare, a6 as getDateSpanInstantEndMs, a5 as getDateSpanInstantStartMs, ad as getEventRangeMeta, S as getRangeInstantEndMs, T as getRangeInstantStartMs, g as guid, i as identity, j as isArraysEqual, u as isPropsEqualShallow, m as mapHash, P as mergeEventStores, at as parseFieldSpecs, U as refineClassName, ax as refineClassNameGenerator, r as refineProps, aw as removeExact, ac as sortEventSegs, w as warn } from './chunks/1b9384f3.js';
export { C as CalendarApiImpl, a as CalendarDataManager, d as CalendarInner, b as CalendarMediaRoot, c as computeRootClassName, p as parseBusinessHours } from './chunks/af2b51d5.js';
export { B as BaseComponent, C as ContentContainer, R as RenderId, d as afterSize, a as generateClassName, k as getFooterScrollbarSticky, g as getIsHeightAuto, j as getTableHeaderSticky, m as memoize, b as memoizeObjArg, s as setRef, w as watchHeight, h as watchSize, e as watchWidth } from './chunks/8563f14c.js';
export { h as computeEdges, c as computeInnerRect, d as getRectCenter } from './chunks/e030f505.js';
export { j as joinFuncishClassNames, m as mergeCalendarOptions, c as mergeContentInjectors, d as mergeLifecycleCallbacks, a as mergeViewOptionsMap } from './chunks/6906802e.js';
export { d as applyStyleProp, c as computeElIsRtl } from './chunks/300190e3.js';
export { A as AllDaySplitter, D as DayTimeColsSlicer, d as NowIndicatorDot, N as NowIndicatorHeaderContainer, c as NowIndicatorLineContainer, S as Splitter, T as TimeGridLayout, a as buildDayCols, b as buildDayColsFromSeries, o as organizeSegsByCol, s as splitInteractionByCol } from './chunks/fcbe493e.js';
export { D as DateComponent, h as DelayedRunner, N as NowTimer, d as Scroller, S as StandardEvent, V as ViewContainer, b as buildNavLinkAttrs, g as getDateMeta } from './chunks/bdcb9f0b.js';
export { e as requestJson, u as unpromisify } from './chunks/73bfce19.js';
export { E as Emitter } from './chunks/e5ccc110.js';
export { D as DateProfileGenerator, c as computeMajorUnit, i as isMajorUnit } from './chunks/1b1778bb.js';
export { B as BgEvent, z as DEFAULT_UNMEASURED_EVENT_THICKNESS, d as DaySeriesModel, e as DaySeriesSlicer, I as DayTableModel, D as DayTableSlicer, J as MeasuredHeightHarness, x as MoreLinkContainer, R as RefMap, g as Ruler, S as Slicer, L as buildDateDataConfigs, K as buildDateRenderConfig, f as buildDateRowConfig, b as buildDayTableModel, A as buildLevelLimitedLayout, F as buildPrintEventBands, H as buildPrintMoreLinkBand, C as computeLateralSpanBottom, c as createDayHeaderFormatter, E as getSliceKey, t as groupLaterallyIntersecting, G as planPrintDomCandidates, y as renderFill, v as sortByAxisOrder } from './chunks/9631f043.js';
export { E as ElementDragging, c as config, b as isPropsValid } from './chunks/a32bd821.js';
export { D as DayGridLayout, F as FooterScrollbar } from './chunks/4fcf1299.js';
export { DateEnv, addDays, addMs, asCleanDays, asRoughMinutes, asRoughMs, asRoughSeconds, createDuration, diffDayAndTime, diffWholeDays, diffWholeWeeks, formatDayString, greatestDurationDenominator, intersectRanges, isInt, isValidDate, multiplyDuration, padStart, parseMarker, rangeContainsMarker, rangesEqual, rangesIntersect, startOfDay, wholeDivideDurations } from '@full-ui/headless-calendar';

function debounce(fn, ms) {
    let timeoutStarted;
    let timeoutAdded;
    let timeoutId; // thruthiness indicates whether active timeout
    function runWithTimeout(timeout) {
        timeoutStarted = Date.now();
        timeoutAdded = 0;
        timeoutId = setTimeout(() => {
            if (timeoutAdded) {
                runWithTimeout(timeoutAdded);
            }
            else {
                timeoutId = undefined;
                fn();
            }
        }, timeout);
    }
    function request() {
        if (timeoutId) {
            timeoutAdded = Date.now() - timeoutStarted;
        }
        else {
            runWithTimeout(ms);
        }
    }
    function cancel() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    }
    return [request, cancel];
}

class Store {
    constructor() {
        this.handlers = [];
    }
    set(value) {
        this.currentValue = value;
        for (let handler of this.handlers) {
            handler(value);
        }
    }
    subscribe(handler) {
        this.handlers.push(handler);
        if (this.currentValue !== undefined) {
            handler(this.currentValue);
        }
    }
}

/*
Subscribers will get a LIST of CustomRenderings
*/
class CustomRenderingStore extends Store {
    constructor() {
        super(...arguments);
        this.map = new Map();
    }
    // for consistent order
    handle(customRendering) {
        const { map } = this;
        let updated = false;
        if (customRendering.isActive) {
            map.set(customRendering.id, customRendering);
            updated = true;
        }
        else if (map.has(customRendering.id)) {
            map.delete(customRendering.id);
            updated = true;
        }
        if (updated) {
            this.set(map);
        }
    }
}

export { CustomRenderingStore, debounce };
