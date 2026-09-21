import { addDays, rangeContainsMarker, intersectRanges, createDuration, asRoughMs, wholeDivideDurations, formatIsoTimeString, addDurations, startOfDay, formatDayString, multiplyDuration, joinDateTimeFormatParts, diffDays } from '@full-ui/headless-calendar';
import { i as isMajorUnit } from './1b1778bb.js';
import { d as DaySeriesModel, S as Slicer, r as resolveDayGridPlacementMode, o as DayGridRow, M as MoreLinkTrigger, p as computeColFromPosition, q as getCellEl, s as buildSegLevels, t as groupLaterallyIntersecting, u as convertSegsToWholeSlices, v as sortByAxisOrder, w as findIntersections, x as MoreLinkContainer, B as BgEvent, y as renderFill, R as RefMap, m as computeColWidth, i as DayGridHeaderRow, g as Ruler, k as dayMicroWidth } from './9631f043.js';
import { m as mapHash, n as createEmptyEventStore, ar as combineEventUis, as as hasBgRendering, ao as flatArray, c as createFormatter, ac as sortEventSegs, ad as getEventRangeMeta, aq as buildEventRangeKey, u as isPropsEqualShallow, k as computeViewBorderless, j as isArraysEqual } from './1b9384f3.js';
import { m as memoize, B as BaseComponent, C as ContentContainer, a as generateClassName, e as watchWidth, s as setRef, w as watchHeight, V as ViewContextType, h as watchSize, r as renderText, d as afterSize, g as getIsHeightAuto, j as getTableHeaderSticky, k as getFooterScrollbarSticky, l as getScrollerSyncerClass } from './8563f14c.js';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { D as DateComponent, S as StandardEvent, g as getDateMeta, c as buildDateStr, b as buildNavLinkAttrs, d as Scroller, V as ViewContainer } from './bdcb9f0b.js';
import { j as joinClassNames, f as fracToCssDim } from './e3a08dde.js';
import { createRef, createElement } from 'react';
import { c as classNames } from './f408d713.js';
import { F as FooterScrollbar } from './4fcf1299.js';

function buildDayCols(dateProfile, dateProfileGenerator, dateEnv, slotRange, majorUnit = '') {
    return buildDayColsFromSeries(new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator), dateEnv, {
        slotRange,
        majorUnit,
        activeRange: dateProfile.activeRange,
    });
}
function buildDayColsFromSeries(daySeries, dateEnv, config = {}) {
    const { slotRange, majorUnit = '', activeRange } = config;
    return daySeries.dates.map((date) => ({
        key: date.toISOString(),
        date,
        range: slotRange
            ? {
                start: dateEnv.add(date, slotRange.slotMinTime),
                end: dateEnv.add(date, slotRange.slotMaxTime),
            }
            : {
                start: date,
                end: addDays(date, 1),
            },
        isMajor: majorUnit ? isMajorUnit(date, majorUnit, dateEnv) : false,
        isDisabled: activeRange === null || (activeRange !== undefined && !rangeContainsMarker(activeRange, date)),
    }));
}

const EMPTY_EVENT_STORE = createEmptyEventStore(); // for purecomponents. TODO: keep elsewhere
class Splitter {
    constructor() {
        this.getKeysForEventDefs = memoize(this._getKeysForEventDefs);
        this.splitDateSelection = memoize(this._splitDateSpan);
        this.splitEventStore = memoize(this._splitEventStore);
        this.splitIndividualUi = memoize(this._splitIndividualUi);
        this.splitEventDrag = memoize(this._splitInteraction);
        this.splitEventResize = memoize(this._splitInteraction);
        this.eventUiBuilders = {}; // TODO: typescript protection
    }
    splitProps(props) {
        let keyInfos = this.getKeyInfo(props);
        let defKeys = this.getKeysForEventDefs(props.eventStore);
        let dateSelections = this.splitDateSelection(props.dateSelection);
        let individualUi = this.splitIndividualUi(props.eventUiBases, defKeys); // the individual *bases*
        let eventStores = this.splitEventStore(props.eventStore, defKeys);
        let eventDrags = this.splitEventDrag(props.eventDrag);
        let eventResizes = this.splitEventResize(props.eventResize);
        let splitProps = {};
        this.eventUiBuilders = mapHash(keyInfos, (info, key) => this.eventUiBuilders[key] || memoize(buildEventUiForKey));
        for (let key in keyInfos) {
            let keyInfo = keyInfos[key];
            let eventStore = eventStores[key] || EMPTY_EVENT_STORE;
            let buildEventUi = this.eventUiBuilders[key];
            splitProps[key] = {
                businessHours: keyInfo.businessHours || props.businessHours,
                dateSelection: dateSelections[key] || null,
                eventStore,
                eventUiBases: buildEventUi(props.eventUiBases[''], keyInfo.ui, individualUi[key]),
                eventDrag: eventDrags[key] || null,
                eventResize: eventResizes[key] || null,
                eventSelection: eventStore.instances[props.eventSelection] ? props.eventSelection : '',
            };
        }
        return splitProps;
    }
    _splitDateSpan(dateSpan) {
        let dateSpans = {};
        if (dateSpan) {
            let keys = this.getKeysForDateSpan(dateSpan);
            for (let key of keys) {
                dateSpans[key] = dateSpan;
            }
        }
        return dateSpans;
    }
    _getKeysForEventDefs(eventStore) {
        return mapHash(eventStore.defs, (eventDef) => this.getKeysForEventDef(eventDef));
    }
    _splitEventStore(eventStore, defKeys) {
        let { defs, instances } = eventStore;
        let splitStores = {};
        for (let defId in defs) {
            for (let key of defKeys[defId]) {
                if (!splitStores[key]) {
                    splitStores[key] = createEmptyEventStore();
                }
                splitStores[key].defs[defId] = defs[defId];
            }
        }
        for (let instanceId in instances) {
            let instance = instances[instanceId];
            for (let key of defKeys[instance.defId]) {
                if (splitStores[key]) { // must have already been created
                    splitStores[key].instances[instanceId] = instance;
                }
            }
        }
        return splitStores;
    }
    _splitIndividualUi(eventUiBases, defKeys) {
        let splitHashes = {};
        for (let defId in eventUiBases) {
            if (defId) { // not the '' key
                for (let key of defKeys[defId]) {
                    if (!splitHashes[key]) {
                        splitHashes[key] = {};
                    }
                    splitHashes[key][defId] = eventUiBases[defId];
                }
            }
        }
        return splitHashes;
    }
    _splitInteraction(interaction) {
        let splitStates = {};
        if (interaction) {
            let affectedStores = this._splitEventStore(interaction.affectedEvents, this._getKeysForEventDefs(interaction.affectedEvents));
            // can't rely on defKeys because event data is mutated
            let mutatedKeysByDefId = this._getKeysForEventDefs(interaction.mutatedEvents);
            let mutatedStores = this._splitEventStore(interaction.mutatedEvents, mutatedKeysByDefId);
            let populate = (key) => {
                if (!splitStates[key]) {
                    splitStates[key] = {
                        affectedEvents: affectedStores[key] || EMPTY_EVENT_STORE,
                        mutatedEvents: mutatedStores[key] || EMPTY_EVENT_STORE,
                        isEvent: interaction.isEvent,
                    };
                }
            };
            for (let key in affectedStores) {
                populate(key);
            }
            for (let key in mutatedStores) {
                populate(key);
            }
        }
        return splitStates;
    }
}
function buildEventUiForKey(allUi, eventUiForKey, individualUi) {
    let baseParts = [];
    if (allUi) {
        baseParts.push(allUi);
    }
    if (eventUiForKey) {
        baseParts.push(eventUiForKey);
    }
    let stuff = {
        '': combineEventUis(baseParts),
    };
    if (individualUi) {
        Object.assign(stuff, individualUi);
    }
    return stuff;
}

class AllDaySplitter extends Splitter {
    getKeyInfo() {
        return {
            allDay: {},
            timed: {},
        };
    }
    getKeysForDateSpan(dateSpan) {
        if (dateSpan.allDay) {
            return ['allDay'];
        }
        return ['timed'];
    }
    getKeysForEventDef(eventDef) {
        if (!eventDef.allDay) {
            return ['timed'];
        }
        if (hasBgRendering(eventDef)) {
            return ['timed', 'allDay'];
        }
        return ['allDay'];
    }
}

class DayTimeColsSlicer extends Slicer {
    sliceRange(range, dayRanges) {
        let segs = [];
        for (let col = 0; col < dayRanges.length; col += 1) {
            let segRange = intersectRanges(range, dayRanges[col]);
            if (segRange) {
                segs.push({
                    startDate: segRange.start,
                    endDate: segRange.end,
                    isStart: segRange.start.valueOf() === range.start.valueOf(),
                    isEnd: segRange.end.valueOf() === range.end.valueOf(),
                    col,
                });
            }
        }
        return segs;
    }
}

/*
TODO: more DRY with daygrid?
can be given null/undefined!
*/
function organizeSegsByCol(segs, colCount) {
    let segsByCol = [];
    let i;
    for (i = 0; i < colCount; i += 1) {
        segsByCol.push([]);
    }
    if (segs) {
        for (i = 0; i < segs.length; i += 1) {
            segsByCol[segs[i].col].push(segs[i]);
        }
    }
    return segsByCol;
}
/*
TODO: more DRY with daygrid?
can be given null/undefined!
*/
function splitInteractionByCol(ui, colCount) {
    let byRow = [];
    if (!ui) {
        for (let i = 0; i < colCount; i += 1) {
            byRow[i] = null;
        }
    }
    else {
        for (let i = 0; i < colCount; i += 1) {
            byRow[i] = {
                affectedInstances: ui.affectedInstances,
                isEvent: ui.isEvent,
                segs: [],
            };
        }
        for (let seg of ui.segs) {
            byRow[seg.col].segs.push(seg);
        }
    }
    return byRow;
}

// potential nice values for the slot-duration and interval-duration
// from largest to smallest
const STOCK_SUB_DURATIONS = [
    { hours: 1 },
    { minutes: 30 },
    { minutes: 15 },
    { seconds: 30 },
    { seconds: 15 },
];
function buildSlatMetas(slotMinTime, slotMaxTime, explicitLabelInterval, slotDuration, dateEnv) {
    let dayStart = new Date(0);
    let slatTime = slotMinTime;
    let slatIterator = createDuration(0);
    let labelInterval = explicitLabelInterval || computeLabelInterval(slotDuration);
    let metas = [];
    let i = 0;
    while (asRoughMs(slatTime) < asRoughMs(slotMaxTime)) {
        let date = dateEnv.add(dayStart, slatTime);
        let isLabeled = wholeDivideDurations(slatIterator, labelInterval) !== null;
        metas.push({
            date,
            time: slatTime,
            key: date.toISOString(), // we can't use the isoTimeStr for uniqueness when minTime/maxTime beyone 0h/24h
            isoTimeStr: formatIsoTimeString(date),
            isLabeled,
            isFirst: i === 0,
        });
        slatTime = addDurations(slatTime, slotDuration);
        slatIterator = addDurations(slatIterator, slotDuration);
        i += 1;
    }
    return metas;
}
// Computes an automatic value for slotHeaderInterval
function computeLabelInterval(slotDuration) {
    let i;
    let labelInterval;
    let slotsPerLabel;
    // find the smallest stock label interval that results in more than one slots-per-label
    for (i = STOCK_SUB_DURATIONS.length - 1; i >= 0; i -= 1) {
        labelInterval = createDuration(STOCK_SUB_DURATIONS[i]);
        slotsPerLabel = wholeDivideDurations(labelInterval, slotDuration);
        if (slotsPerLabel !== null && slotsPerLabel > 1) {
            return labelInterval;
        }
    }
    return slotDuration; // fall back
}

class TimeGridAllDayHeader extends BaseComponent {
    constructor() {
        super(...arguments);
        // ref
        this.innerElRef = createRef();
    }
    render() {
        let { props } = this;
        let { options, viewApi } = this.context;
        let renderProps = {
            text: options.allDayText,
            view: viewApi,
            isNarrow: props.isNarrow,
        };
        return (jsx(ContentContainer, { tag: "div", attrs: {
                role: 'rowheader',
            }, className: joinClassNames(classNames.flexRow, classNames.noMargin, classNames.noPadding, classNames.contentBox), style: {
                width: props.width,
            }, renderProps: renderProps, generatorName: "allDayHeaderContent", customGenerator: options.allDayHeaderContent, defaultGenerator: renderAllDayInner, classNameGenerator: options.allDayHeaderClass, didMount: options.allDayHeaderDidMount, willUnmount: options.allDayHeaderWillUnmount, children: (InnerContent) => (jsx("div", { className: joinClassNames(classNames.flexRow, classNames.noShrink, classNames.whiteSpacePre), ref: this.innerElRef, children: jsx(InnerContent, { tag: 'div', className: generateClassName(options.allDayHeaderInnerClass, renderProps) }) })) }));
    }
    componentDidMount() {
        this._isUnmounting = false;
        const { props } = this;
        const innerEl = this.innerElRef.current; // TODO: make dynamic with useEffect
        // TODO: only attach this if refs props present
        this.disconnectInnerWidth = watchWidth(innerEl, (width) => {
            if (this._isUnmounting)
                return;
            setRef(props.innerWidthRef, width);
        });
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.disconnectInnerWidth();
        setRef(this.props.innerWidthRef, null);
    }
}
function renderAllDayInner(renderProps) {
    return renderProps.text;
}

class TimeGridAllDayLane extends DateComponent {
    constructor() {
        super(...arguments);
        this.state = {};
        this.heightRef = createRef();
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
                });
            }
            else {
                this.context.unregisterInteractiveComponent(this);
            }
        };
    }
    render() {
        const { props, state } = this;
        const needsMoreLinkProbe = !props.forPrint && resolveDayGridPlacementMode(props.dayMaxEvents, props.dayMaxEventRows) === 'auto';
        return (jsxs(Fragment, { children: [jsx(DayGridRow, { ...props, moreLinkHeight: state.moreLinkHeight, 
                    /* BAD: these overwrite the props! caller might want to pass them */
                    rootElRef: this.handleRootEl, heightRef: this.heightRef }), needsMoreLinkProbe && (jsx(MoreLinkTrigger, { num: 1, display: 'row', isNarrow: props.cellIsNarrow, isMicro: props.cellIsMicro, elRef: this.handleMoreLinkEl, className: classNames.offscreen, attrs: {
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
    queryHit(isRtl, positionLeft, positionTop, elWidth) {
        const { props, heightRef } = this;
        const colCount = props.cells.length;
        const { col, left, right } = computeColFromPosition(positionLeft, elWidth, props.colWidth, colCount, isRtl);
        const cell = props.cells[col];
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
            getDayEl: () => getCellEl(this.rootEl, col),
            rect: {
                left,
                right,
                top: 0,
                bottom: heightRef.current,
            },
            layer: 0,
        };
    }
}

function computeSlatHeight(expandRows, slatCnt, explicitSlatMinHeight = 0, slatInnerHeight, // from the "inner" i think
scrollerHeight) {
    if (!slatInnerHeight || !scrollerHeight) {
        return [undefined, false];
    }
    const slatMinHeight = Math.max(slatInnerHeight + 1, explicitSlatMinHeight);
    const slatLiquidHeight = scrollerHeight / slatCnt;
    let slatLiquid;
    let slatHeight;
    if (expandRows && slatLiquidHeight >= slatMinHeight) {
        slatLiquid = true;
        slatHeight = slatLiquidHeight;
    }
    else {
        slatLiquid = false;
        slatHeight = slatMinHeight;
    }
    return [slatHeight, slatLiquid];
}
/*
A `startOfDayDate` must be given for avoiding ambiguity over how to treat midnight.
*/
function computeDateTopFrac(date, dateProfile, startOfDayDate) {
    if (!startOfDayDate) {
        startOfDayDate = startOfDay(date);
    }
    return computeTimeTopFrac(createDuration(date.valueOf() - startOfDayDate.valueOf()), dateProfile);
}
function computeTimeTopFrac(time, dateProfile) {
    const startMs = asRoughMs(dateProfile.slotMinTime);
    const endMs = asRoughMs(dateProfile.slotMaxTime);
    let frac = (time.milliseconds - startMs) / (endMs - startMs);
    frac = Math.max(0, frac);
    frac = Math.min(1, frac);
    return frac;
}

/**
 * Projects production's date range onto the slat canvas.
 *
 * This is TimeGrid's production-specific coordinate conversion: it owns hidden
 * days, DST, and `eventMinHeight`. The shared engine consumes only the numbers
 * it produces.
 *
 * The canvas height may be assumed rather than measured — callers substitute
 * `ESTIMATED_SLAT_HEIGHT` so the first paint contains events — in which case
 * they also pass no `eventMinHeight`. A null height still yields no verticals,
 * but no production caller passes one.
 */
function computeFgSegVerticals(segs, dateProfile, colDate, slatCnt, slatHeight, // in pixels
eventMinHeight, // in pixels
eventShortHeight) {
    const res = [];
    if (slatHeight != null) {
        const totalHeight = slatHeight * slatCnt;
        for (const seg of segs) {
            const startFrac = computeDateTopFrac(seg.startDate, dateProfile, colDate);
            const endFrac = computeDateTopFrac(seg.endDate, dateProfile, colDate);
            const startCoord = startFrac * totalHeight;
            let endCoord = endFrac * totalHeight;
            let height = endCoord - startCoord;
            if (eventMinHeight != null && height < eventMinHeight) {
                height = eventMinHeight;
                endCoord = startCoord + height;
            }
            res.push({
                start: startCoord,
                end: endCoord,
                size: height,
                isShort: height <= eventShortHeight,
            });
        }
    }
    return res;
}
/**
 * Adapts production TimeGrid segs to and from the shared placement engine.
 *
 * The caller owns vertical geometry: `segVerticals` already incorporates
 * clipping, and `eventMinHeight` too once the slat height is measured — the
 * caller withholds that floor while the height is only assumed. Any missing
 * entry is excluded. The engine owns only admission and normalized horizontal
 * placement. `slotEventOverlap` remains a final CSS concern, and mirrors
 * deliberately stay outside this normal-event admission path.
 */
function buildTimeGridSegPlacements(segs, segVerticals, eventOrderStrict, eventMaxStack) {
    const sourceSegs = [];
    const segVerticalBySeg = new Map();
    for (let orderIndex = 0; orderIndex < segs.length; orderIndex += 1) {
        const seg = segs[orderIndex];
        const segVertical = segVerticals[orderIndex];
        if (segVertical) {
            const sourceSeg = {
                ...seg,
                key: seg.eventRange.instance.instanceId,
                start: segVertical.start,
                end: segVertical.end,
                orderIndex,
            };
            sourceSegs.push(sourceSeg);
            segVerticalBySeg.set(sourceSeg, segVertical);
        }
    }
    const layout = layoutTimeGridColumnByMaxLevel(sourceSegs, eventMaxStack ?? Infinity, { orderStrict: eventOrderStrict ?? false });
    return {
        placements: layout.domOrderedPlacements.map((placement) => {
            const seg = placement.sourceSeg;
            return {
                seg,
                segVertical: segVerticalBySeg.get(seg),
                levelCoord: placement.levelCoord,
                thickness: placement.thickness,
                stackDepth: placement.backwardDepth,
                stackForward: placement.forwardDepth,
            };
        }),
        hiddenGroups: layout.moreLinkGroups.map((group) => {
            const groupSegs = group.hiddenSlices.map((slice) => slice.sourceSeg);
            return {
                key: group.key,
                start: group.start,
                end: group.end,
                segs: groupSegs,
            };
        }),
    };
}
/**
 * Builds, limits, and expands one TimeGrid day/resource column.
 *
 * TimeGrid rotates the visual meaning of the shared kernel's level structure.
 * A seg's lateral span runs down the time axis, while logical levels proceed
 * across the column. The retained levels become a normalized collision web:
 * connected components get equal base columns, and events widen through empty
 * deeper columns until their first collider.
 */
function layoutTimeGridColumnByMaxLevel(eventOrderedSegs, maxLevels, options) {
    const { segLevels, excludedSegs } = buildSegLevels(eventOrderedSegs, options.orderStrict, maxLevels);
    const placements = positionTimeGridPlacements(segLevels);
    const moreLinkGroups = groupLaterallyIntersecting(convertSegsToWholeSlices(excludedSegs));
    return {
        domOrderedPlacements: sortByAxisOrder(placements),
        moreLinkGroups,
    };
}
/**
 * Turns retained dimensionless levels into normalized placement rectangles.
 *
 * Each connected collision component shares equal-width base columns. An
 * event then expands through consecutive deeper columns until the first one
 * containing a collider. A single intersection sweep supplies component
 * membership, expansion stops, and backward/forward longest-chain depths.
 */
function positionTimeGridPlacements(levels) {
    const placementLevels = levels.map((level, levelIndex) => level.map((sourceSeg) => ({
        sourceSeg,
        start: sourceSeg.start,
        end: sourceSeg.end,
        isStart: sourceSeg.isStart,
        isEnd: sourceSeg.isEnd,
        levelIndex,
    })));
    // Level order matters below: every placement precedes its deeper colliders.
    const placements = flatArray(placementLevels);
    const collidersByKey = new Map();
    const parentByKey = new Map(placements.map((placement) => [
        placement.sourceSeg.key,
        placement.sourceSeg.key,
    ]));
    for (const placement of placements) {
        const colliders = [];
        for (let levelIndex = placement.levelIndex + 1; levelIndex < levels.length; levelIndex += 1) {
            colliders.push(...findIntersections(placementLevels[levelIndex], placement));
        }
        collidersByKey.set(placement.sourceSeg.key, colliders);
        for (const collider of colliders) {
            unionPlacementKeys(parentByKey, placement.sourceSeg.key, collider.sourceSeg.key);
        }
    }
    const maxLevelByRoot = new Map();
    for (const placement of placements) {
        const root = findPlacementRoot(parentByKey, placement.sourceSeg.key);
        maxLevelByRoot.set(root, Math.max(maxLevelByRoot.get(root) ?? 0, placement.levelIndex));
    }
    // Longest chains through the collision graph, as dynamic programming over
    // the adjacency. The passes run in opposite level orders so each dependency
    // is final before it contributes to the next placement.
    const backwardDepthByKey = new Map(placements.map((placement) => [
        placement.sourceSeg.key,
        0,
    ]));
    const forwardDepthByKey = new Map(placements.map((placement) => [
        placement.sourceSeg.key,
        0,
    ]));
    for (const placement of placements) {
        const depth = backwardDepthByKey.get(placement.sourceSeg.key) + 1;
        for (const collider of collidersByKey.get(placement.sourceSeg.key)) {
            backwardDepthByKey.set(collider.sourceSeg.key, Math.max(backwardDepthByKey.get(collider.sourceSeg.key), depth));
        }
    }
    for (let index = placements.length - 1; index >= 0; index -= 1) {
        const placement = placements[index];
        let depth = 0;
        for (const collider of collidersByKey.get(placement.sourceSeg.key)) {
            depth = Math.max(depth, forwardDepthByKey.get(collider.sourceSeg.key) + 1);
        }
        forwardDepthByKey.set(placement.sourceSeg.key, depth);
    }
    return placements.map((placement) => {
        const key = placement.sourceSeg.key;
        const levelCount = maxLevelByRoot.get(findPlacementRoot(parentByKey, key)) + 1;
        // Expand until the shallowest deeper collider. Colliders always share the
        // component, so their levels stay within its column count.
        let farLevel = levelCount;
        for (const collider of collidersByKey.get(key)) {
            farLevel = Math.min(farLevel, collider.levelIndex);
        }
        const levelCoord = placement.levelIndex / levelCount;
        const thickness = (farLevel - placement.levelIndex) / levelCount;
        return {
            ...placement,
            levelCoord,
            thickness,
            levelEndCoord: levelCoord + thickness,
            backwardDepth: backwardDepthByKey.get(key),
            forwardDepth: forwardDepthByKey.get(key),
        };
    });
}
function findPlacementRoot(parentByKey, key) {
    const parent = parentByKey.get(key);
    if (parent === key)
        return key;
    const root = findPlacementRoot(parentByKey, parent);
    parentByKey.set(key, root);
    return root;
}
function unionPlacementKeys(parentByKey, first, second) {
    const firstRoot = findPlacementRoot(parentByKey, first);
    const secondRoot = findPlacementRoot(parentByKey, second);
    if (firstRoot !== secondRoot)
        parentByKey.set(secondRoot, firstRoot);
}

/**
 * Slat height assumed on the first render, before the real one is measured.
 *
 * Without it, `computeFgSegVerticals` has no canvas to project onto and returns
 * nothing, so the view paints a frame containing no events at all and the
 * calendar looks empty until measurement lands. Projecting against an assumed
 * height instead means events are present in that very first paint.
 *
 * A flat constant is enough, and deliberately so. Placement compares segs
 * against each other and never against the axis length, so scaling every
 * coordinate by the same factor leaves collisions and level assignment
 * untouched. Guessing wrong rescales the raw geometry; it does not reorganize
 * it. That is why the caller withholds `eventMinHeight` while assuming — a
 * pixel floor applied at the wrong scale would stretch the wrong segs, and
 * stretching is what creates collisions.
 *
 * This is a claim about the raw coordinates only. The measured pass turns
 * `eventMinHeight` back on, and stretching a sub-minimum seg there can make it
 * collide with a neighbor it previously cleared, changing levels and
 * `eventMaxStack` admission. Expect the assumed pass to agree in the common
 * case; do not treat it as final.
 *
 * TimeGrid's caveat list stops there, unlike Timeline's: it places with unit
 * thickness and measures no event wrappers, so nothing about the rendered size
 * can feed back into placement. `isShort` also differs across passes, but that
 * is a styling decision rather than geometry.
 */
const ESTIMATED_SLAT_HEIGHT = 50;

// Firefox is terrible at rendering absolute elements that span across multiple print pages
const isBrowserPrintQuirky = /* true || */ (typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('firefox'));
function computeTimeGridPrintMode(forPrint, eventPrintLayout) {
    if (!forPrint) {
        return 'positioned';
    }
    return eventPrintLayout === 'stack' || (eventPrintLayout !== 'grid' && isBrowserPrintQuirky)
        ? 'stack'
        : 'positioned';
}

const DEFAULT_TIME_FORMAT = createFormatter({
    hour: 'numeric',
    minute: '2-digit',
    meridiem: false,
});
class TimeGridEvent extends BaseComponent {
    render() {
        const { props } = this;
        return (jsx(StandardEvent, { ...props, display: 'column', level: props.level, isNarrow: props.isNarrow, isShort: props.isShort, className: 
            // see note in TimeGridCol on why we use flexbox
            props.isLiquid ? classNames.liquid : '', disableLiquid: !props.isLiquid, defaultTimeFormat: DEFAULT_TIME_FORMAT }));
    }
}

class TimeGridMoreLink extends BaseComponent {
    render() {
        let { props } = this;
        return (jsx("div", { className: joinClassNames(classNames.abs, classNames.flexCol, classNames.end0, classNames.z9999), style: {
                top: props.top,
                height: props.height,
            }, children: jsx(MoreLinkContainer, { className: classNames.liquid, display: 'column', allDayDate: null, segs: props.hiddenSegs, hiddenSegs: props.hiddenSegs, dateSpanProps: props.dateSpanProps, dateProfile: props.dateProfile, todayRange: props.todayRange, popoverContent: () => renderPlainFgSegs(props.hiddenSegs, props, /* isMirror = */ false), forceTimed: true, isNarrow: props.isNarrow, isMicro: props.isMicro }) }));
    }
}

const NowIndicatorDot = (props) => (jsx(ViewContextType.Consumer, { children: (context) => {
        let { options } = context;
        return (jsx("div", { className: joinClassNames(props.className, options.nowIndicatorDotClass), style: props.style }));
    } }));

const NowIndicatorLineContainer = (props) => (jsx(ViewContextType.Consumer, { children: (context) => {
        let { options } = context;
        let renderProps = {
            date: context.dateEnv.toDate(props.date),
            view: context.viewApi,
        };
        return (jsx(ContentContainer, { elRef: props.elRef, tag: props.tag || 'div', attrs: props.attrs, className: props.className, style: props.style, renderProps: renderProps, generatorName: "nowIndicatorLineContent", customGenerator: options.nowIndicatorLineContent, classNameGenerator: options.nowIndicatorLineClass, didMount: options.nowIndicatorLineDidMount, willUnmount: options.nowIndicatorLineWillUnmount, children: props.children }));
    } }));

/*
Renders both the line AND the dot
TODO: DRY with other NowIndicator components
*/
function TimeGridNowIndicatorLine(props) {
    const top = props.totalHeight != null
        ? props.totalHeight * computeDateTopFrac(props.nowDate, props.dateProfile, props.dayDate)
        : undefined;
    return (jsxs("div", { className: joinClassNames(classNames.fill, classNames.pointerEventsNone, classNames.z2), children: [jsx(NowIndicatorLineContainer, { className: joinClassNames(classNames.fillX, classNames.noMarginX, classNames.borderlessX), style: { top }, date: props.nowDate }), (props.showDot ?? true) && (jsx(NowIndicatorDot, { className: joinClassNames(classNames.abs, classNames.start0), style: { top } }))] }));
}

class TimeGridCol extends BaseComponent {
    constructor() {
        super(...arguments);
        this.sortEventSegs = memoize(sortEventSegs);
        this.getDateMeta = memoize(getDateMeta);
    }
    render() {
        let { props, context } = this;
        let { options, dateEnv } = context;
        let isSelectMirror = options.selectMirror;
        let mirrorSegs = // yuck
         (props.eventDrag && props.eventDrag.segs) ||
            (props.eventResize && props.eventResize.segs) ||
            (isSelectMirror && props.dateSelectionSegs) ||
            [];
        let dateMeta = this.getDateMeta(props.date, dateEnv, props.dateProfile, props.todayRange);
        const baseClassName = joinClassNames(classNames.borderlessY, classNames.borderlessEnd, !props.borderStart && classNames.borderlessStart, props.width == null && classNames.liquid, classNames.rel, // origin for abs-positioned children within
        classNames.z1);
        const baseStyle = {
            width: props.width,
        };
        const isStack = this.getIsStack();
        const renderProps = {
            ...dateMeta,
            ...props.renderProps,
            isStack,
            isNarrow: props.isNarrow,
            isMajor: props.isMajor,
            view: context.viewApi,
        };
        if (dateMeta.isDisabled) {
            return (jsx("div", { role: 'gridcell', "aria-disabled": true, className: joinClassNames(generateClassName(options.dayLaneClass, renderProps), baseClassName), style: baseStyle }));
        }
        const innerClassName = joinClassNames(generateClassName(options.dayLaneInnerClass, renderProps), !isStack && classNames.fill, classNames.z1);
        const sortedFgSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder);
        return (jsx(ContentContainer, { tag: "div", attrs: {
                ...props.attrs,
                role: 'gridcell',
                ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}),
                'data-date': formatDayString(props.date),
            }, className: baseClassName, style: baseStyle, renderProps: renderProps, generatorName: undefined, classNameGenerator: options.dayLaneClass, didMount: options.dayLaneDidMount, willUnmount: options.dayLaneWillUnmount, children: () => (jsxs(Fragment, { children: [this.renderFillSegs(props.businessHourSegs, 'non-business'), this.renderFillSegs(props.bgEventSegs, 'bg-event'), this.renderFillSegs(props.dateSelectionSegs, 'highlight'), jsx("div", { className: innerClassName, children: this.renderFgSegs(sortedFgSegs, 
                        /* isMirror = */ false) }), Boolean(mirrorSegs.length) && (
                    // but only show it when there are actual mirror events, to avoid blocking clicks
                    jsx("div", { className: innerClassName, children: this.renderFgSegs(mirrorSegs, 
                        /* isMirror = */ true) })), this.renderNowIndicator(props.nowIndicatorSegs)] })) }));
    }
    renderFgSegs(sortedFgSegs, isMirror) {
        const { props } = this;
        if (this.getIsStack()) {
            return renderPlainFgSegs(sortedFgSegs, props, isMirror);
        }
        if (isMirror) {
            return this.renderPositionedMirrorSegs(sortedFgSegs);
        }
        return this.renderPositionedFgSegs(sortedFgSegs);
    }
    renderPositionedFgSegs(segs) {
        let { eventMaxStack, eventOrderStrict } = this.context.options;
        let segVerticals = this.computeSegVerticals(segs);
        let { placements, hiddenGroups } = buildTimeGridSegPlacements(segs, segVerticals, eventOrderStrict, eventMaxStack);
        return (jsxs(Fragment, { children: [placements.map((placement) => this.renderPositionedSeg(placement.seg, placement.segVertical, this.computeSegHStyle(placement), placement.stackDepth, 
                /* isMirror = */ false)), this.renderHiddenGroups(hiddenGroups)] }));
    }
    // Mirrors bypass normal-event admission so limits cannot hide them or create more links.
    renderPositionedMirrorSegs(segs) {
        let segVerticals = this.computeSegVerticals(segs);
        return segs.map((seg, index) => this.renderPositionedSeg(seg, segVerticals[index] || {}, { left: 0, right: 0, zIndex: 0 }, // full column width
        /* level = */ 0, 
        /* isMirror = */ true));
    }
    renderPositionedSeg(seg, segVertical, hStyle, level, isMirror) {
        let { props } = this;
        let { eventRange } = seg;
        let { instanceId } = eventRange.instance; // guaranteed because it's an fg event
        let isSelected = instanceId === props.eventSelection;
        if (isSelected) {
            hStyle.zIndex += 1000; // HACK: relies on hardcoded z-index offset; fragile if stacking context changes
        }
        let isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId]);
        let isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId]);
        let isInvisible = !isMirror && (isDragging || isResizing);
        return (jsx("div", { 
            // we would have used classNames.fill, but multi-page spanning breaks in Firefox
            // we would have used height:100%, but multi-page spanning breaks in Safari
            className: joinClassNames(classNames.abs, classNames.flexCol), style: {
                visibility: isInvisible ? 'hidden' : undefined,
                top: segVertical.start,
                height: segVertical.size,
                ...hStyle,
            }, children: jsx(TimeGridEvent, { eventRange: eventRange, slicedStart: seg.startDate, slicedEnd: seg.endDate, isStart: seg.isStart, isEnd: seg.isEnd, isDragging: isDragging, isResizing: isResizing, isMirror: isMirror, isSelected: isSelected, level: level, isNarrow: props.isNarrow, isShort: segVertical.isShort || false, isLiquid: true, ...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs) }) }, instanceId));
    }
    /*
    A pixel floor is only meaningful against a real slat height, so it stays off
    while the height is assumed. See ESTIMATED_SLAT_HEIGHT for why, and for what
    the assumed pass does and does not guarantee.
    */
    // TODO: memoize this?
    computeSegVerticals(segs) {
        let { props, context } = this;
        let isMeasured = props.slatHeight != null;
        return computeFgSegVerticals(segs, props.dateProfile, props.date, props.slatCnt, props.slatHeight ?? ESTIMATED_SLAT_HEIGHT, isMeasured ? context.options.eventMinHeight : undefined, context.options.eventShortHeight);
    }
    /*
    NOTE: a group's coordinates come from computeFgSegVerticals, so eventMinHeight
    has already been applied to the segs it was formed from
    */
    renderHiddenGroups(hiddenGroups) {
        let { dateSpanProps, dateProfile, todayRange, nowDate, nowMs, eventSelection, eventDrag, eventResize, isNarrow, isMicro } = this.props;
        return (jsx(Fragment, { children: hiddenGroups.map((hiddenGroup) => {
                return (jsx(TimeGridMoreLink, { hiddenSegs: hiddenGroup.segs, top: hiddenGroup.start, height: hiddenGroup.end - hiddenGroup.start, isNarrow: isNarrow, isMicro: isMicro, dateSpanProps: dateSpanProps, dateProfile: dateProfile, todayRange: todayRange, nowDate: nowDate, nowMs: nowMs, eventSelection: eventSelection, eventDrag: eventDrag, eventResize: eventResize }, hiddenGroup.key));
            }) }));
    }
    renderFillSegs(segs, fillType) {
        let { props, context } = this;
        let segVerticals = this.computeSegVerticals(segs);
        return (jsx(Fragment, { children: segs.map((seg, index) => {
                const { eventRange } = seg;
                const segVertical = segVerticals[index] || {};
                return (jsx("div", { className: classNames.fillX, style: {
                        top: segVertical.start,
                        height: segVertical.size,
                        // HACK to get bg fills to overlap cell-start border
                        // which matches how dayGrid looks,
                        // which is important because all-day background events, in TimeGrid,
                        // will render on both at the same time
                        marginInlineStart: -1,
                    }, children: fillType === 'bg-event' ?
                        jsx(BgEvent, { eventRange: eventRange, isStart: seg.isStart, isEnd: seg.isEnd, isNarrow: props.isNarrow, isShort: segVertical.isShort || false, isVertical: true, ...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs) }) :
                        renderFill(fillType, context.options) }, buildEventRangeKey(eventRange)));
            }) }));
    }
    renderNowIndicator(segs) {
        let { props } = this;
        if (props.forPrint || this.getIsStack()) {
            return;
        }
        return segs.map((seg, i) => (jsx(TimeGridNowIndicatorLine, { nowDate: seg.startDate, dayDate: props.date, dateProfile: props.dateProfile, totalHeight: props.slatHeight != null ? props.slatHeight * props.slatCnt : undefined, showDot: seg.showDot ?? true }, i)));
    }
    /*
    TODO: eventually move to width, not left+right
    */
    computeSegHStyle(segRect) {
        let { options } = this.context;
        let shouldOverlap = options.slotEventOverlap;
        let nearCoord = segRect.levelCoord; // the left side if LTR. the right side if RTL. floating-point
        let farCoord = segRect.levelCoord + segRect.thickness; // the right side if LTR. the left side if RTL. floating-point
        if (shouldOverlap) {
            // double the width, but don't go beyond the maximum forward coordinate (1.0)
            farCoord = Math.min(1, nearCoord + (farCoord - nearCoord) * 2);
        }
        let props = {
            zIndex: segRect.stackDepth + 1, // convert from 0-base to 1-based
            insetInlineStart: fracToCssDim(nearCoord),
            insetInlineEnd: fracToCssDim(1 - farCoord),
            marginInlineEnd: undefined,
        };
        if (shouldOverlap && segRect.stackForward) {
            // add padding to the edge so that forward stacked events don't cover the resizer's icon
            props.marginInlineEnd = 10 * 2; // 10 is a guesstimate of the icon's width
        }
        return props;
    }
    getIsStack() {
        const { eventPrintLayout } = this.context.options;
        return computeTimeGridPrintMode(this.props.forPrint, eventPrintLayout) === 'stack';
    }
}
function renderPlainFgSegs(sortedFgSegs, { todayRange, nowDate, nowMs, eventSelection, eventDrag, eventResize }, isMirror) {
    return (jsx(Fragment, { children: sortedFgSegs.map((seg) => {
            let { eventRange } = seg;
            let { instanceId } = eventRange.instance;
            let isDragging = Boolean(eventDrag && eventDrag.affectedInstances[instanceId]);
            let isResizing = Boolean(eventResize && eventResize.affectedInstances[instanceId]);
            let isInvisible = isDragging || isResizing;
            return (jsx("div", { className: classNames.breakInsideAvoid, style: { visibility: isInvisible ? 'hidden' : undefined }, children: jsx(TimeGridEvent, { eventRange: eventRange, slicedStart: seg.startDate, slicedEnd: seg.endDate, isStart: seg.isStart, isEnd: seg.isEnd, isDragging: isDragging, isResizing: isResizing, isMirror: isMirror, isSelected: instanceId === eventSelection, level: 0, isShort: false, isNarrow: false, disableResizing: true, ...getEventRangeMeta(eventRange, todayRange, nowDate, nowMs) }) }, instanceId));
        }) }));
}

class TimeGridCols extends DateComponent {
    constructor() {
        super(...arguments);
        // memo
        this.processSlotOptions = memoize(processSlotOptions);
        this.handleRootEl = (el) => {
            this.rootEl = el;
            if (el) {
                this.context.registerInteractiveComponent(this, {
                    el,
                    isHitComboAllowed: this.props.isHitComboAllowed,
                });
            }
            else {
                this.context.unregisterInteractiveComponent(this);
            }
        };
    }
    render() {
        const { props } = this;
        return (jsx("div", { role: props.role /* !!! */, className: joinClassNames(props.className, classNames.flexRow), ref: this.handleRootEl, children: props.cells.map((cell, col) => (jsx(TimeGridCol, { dateProfile: props.dateProfile, nowDate: props.nowDate, nowMs: props.nowMs, todayRange: props.todayRange, date: cell.date, isMajor: cell.isMajor, slatCnt: props.slatCnt, renderProps: cell.renderProps, attrs: cell.attrs, dateSpanProps: cell.dateSpanProps, forPrint: props.forPrint, borderStart: Boolean(col), isNarrow: props.cellIsNarrow, isMicro: props.cellIsMicro, 
                // content
                fgEventSegs: props.fgEventSegsByCol[col], bgEventSegs: props.bgEventSegsByCol[col], businessHourSegs: props.businessHourSegsByCol[col], nowIndicatorSegs: props.nowIndicatorSegsByCol[col], dateSelectionSegs: props.dateSelectionSegsByCol[col], eventDrag: props.eventDragByCol[col], eventResize: props.eventResizeByCol[col], eventSelection: props.eventSelection, 
                // dimensions
                width: props.colWidth, slatHeight: props.slatHeight }, cell.key))) }));
    }
    queryHit(isRtl, positionLeft, positionTop, elWidth) {
        const { dateProfile, cells, colWidth, slatHeight } = this.props;
        const { dateEnv, options } = this.context;
        const { snapDuration, snapsPerSlot } = this.processSlotOptions(options.slotDuration, options.snapDuration);
        const colCount = cells.length;
        const { col, left, right } = computeColFromPosition(positionLeft, elWidth, colWidth, colCount, isRtl);
        const cell = cells[col];
        const slatIndex = Math.floor(positionTop / slatHeight);
        const slatTop = slatIndex * slatHeight;
        const partial = (positionTop - slatTop) / slatHeight; // floating point number between 0 and 1
        const localSnapIndex = Math.floor(partial * snapsPerSlot); // the snap # relative to start of slat
        const snapIndex = slatIndex * snapsPerSlot + localSnapIndex;
        const time = addDurations(dateProfile.slotMinTime, multiplyDuration(snapDuration, snapIndex));
        const start = dateEnv.add(cell.date, time);
        const end = dateEnv.add(start, snapDuration);
        return {
            dateProfile,
            dateSpan: {
                range: { start, end },
                allDay: false,
                ...cell.dateSpanProps,
            },
            getDayEl: () => getCellEl(this.rootEl, col),
            rect: {
                left,
                right,
                top: slatTop,
                bottom: slatTop + slatHeight,
            },
            layer: 0,
        };
    }
}
TimeGridCols.addPropsEquality({
    style: isPropsEqualShallow,
});
// Utils
// -------------------------------------------------------------------------------------------------
function processSlotOptions(slotDuration, snapDurationOverride) {
    let snapDuration = snapDurationOverride || slotDuration;
    let snapsPerSlot = wholeDivideDurations(slotDuration, snapDuration);
    if (snapsPerSlot === null) {
        snapDuration = slotDuration;
        snapsPerSlot = 1;
        // TODO: say warning?
    }
    return { snapDuration, snapsPerSlot };
}

const NowIndicatorHeaderContainer = (props) => (jsx(ViewContextType.Consumer, { children: (context) => {
        let { options } = context;
        let renderProps = {
            date: context.dateEnv.toDate(props.date),
            view: context.viewApi,
        };
        return (jsx(ContentContainer, { elRef: props.elRef, tag: props.tag || 'div', attrs: props.attrs, className: props.className, style: props.style, renderProps: renderProps, generatorName: "nowIndicatorHeaderContent", customGenerator: options.nowIndicatorHeaderContent, classNameGenerator: options.nowIndicatorHeaderClass, didMount: options.nowIndicatorHeaderDidMount, willUnmount: options.nowIndicatorHeaderWillUnmount, children: props.children }));
    } }));

/*
TODO: DRY with other NowIndicator components
*/
function TimeGridNowIndicatorArrow(props) {
    return (jsx("div", { 
        // crop any overflow that the arrow/line might cause
        // TODO: just do this on the entire canvas within the scroller
        className: joinClassNames(classNames.fill, classNames.crop, classNames.pointerEventsNone, classNames.z2), children: jsx(NowIndicatorHeaderContainer, { className: classNames.abs, style: {
                top: props.totalHeight != null
                    ? props.totalHeight * computeDateTopFrac(props.nowDate, props.dateProfile)
                    : undefined
            }, date: props.nowDate }) }));
}

const DEFAULT_SLAT_LABEL_FORMAT = createFormatter({
    hour: 'numeric',
    minute: '2-digit',
    omitZeroMinute: true,
    meridiem: 'short',
});
/*
Always oriented in a column
*/
class TimeGridSlatHeader extends BaseComponent {
    constructor() {
        super(...arguments);
        // memo
        this.createRenderProps = memoize(createRenderProps);
        // ref
        this.innerElRef = createRef();
    }
    render() {
        let { props, context } = this;
        let { options } = context;
        let headerFormat = // TODO: fully pre-parse
         options.slotHeaderFormat == null ? DEFAULT_SLAT_LABEL_FORMAT :
            Array.isArray(options.slotHeaderFormat) ? createFormatter(options.slotHeaderFormat[0]) :
                createFormatter(options.slotHeaderFormat);
        let renderProps = this.createRenderProps(props.date, props.time, !props.isLabeled, props.isNarrow, props.isFirst, headerFormat, context);
        let className = joinClassNames(props.liquidHeight && classNames.liquid, classNames.flexRow, classNames.alignStart, classNames.noMargin, classNames.noPadding, classNames.borderlessX, classNames.borderlessBottom, !props.borderTop && classNames.borderlessTop);
        if (!props.isLabeled) {
            return (jsx("div", { className: joinClassNames(generateClassName(options.slotHeaderClass, renderProps), className), style: {
                    height: props.height,
                } }));
        }
        return (jsx(ContentContainer, { tag: "div", attrs: {
                'data-time': props.isoTimeStr,
            }, style: {
                height: props.height,
            }, className: className, renderProps: renderProps, generatorName: "slotHeaderContent", customGenerator: options.slotHeaderContent, defaultGenerator: renderInnerContent, classNameGenerator: options.slotHeaderClass, didMount: options.slotHeaderDidMount, willUnmount: options.slotHeaderWillUnmount, children: (InnerContent) => (jsx("div", { ref: this.innerElRef, className: joinClassNames(classNames.noShrink, classNames.whiteSpaceNoWrap, classNames.flexRow), children: jsx(InnerContent, { tag: "div", className: generateClassName(options.slotHeaderInnerClass, renderProps) }) })) }));
    }
    componentDidMount() {
        this._isUnmounting = false;
        const { props } = this;
        const innerEl = this.innerElRef.current; // TODO: make dynamic with useEffect
        if (innerEl) { // could be null if !isLabeled
            // TODO: only attach this if refs props present
            // TODO: fire width/height independently?
            this.disconnectInnerSize = watchSize(innerEl, (width, height) => {
                if (this._isUnmounting)
                    return;
                setRef(props.innerWidthRef, width);
                setRef(props.innerHeightRef, height);
            });
        }
    }
    componentWillUnmount() {
        const { props } = this;
        this._isUnmounting = true;
        if (this.disconnectInnerSize) {
            this.disconnectInnerSize();
            setRef(props.innerWidthRef, null);
            setRef(props.innerHeightRef, null);
        }
    }
}
function createRenderProps(date, time, isMinor, isNarrow, isFirst, headerFormat, context) {
    return {
        // this is a time-specific slot. not day-specific, so don't do today/nowRange
        ...getDateMeta(date, context.dateEnv),
        level: 0, // axis level (for when multiple axes)
        text: joinDateTimeFormatParts(context.dateEnv.formatToParts(date, headerFormat)),
        time: time,
        isMajor: false,
        isMinor,
        isTime: true,
        isNarrow,
        hasNavLink: false,
        isFirst,
        view: context.viewApi,
    };
}
function renderInnerContent(props) {
    return props.text;
}

class TimeGridSlatLane extends BaseComponent {
    constructor() {
        super(...arguments);
        // memo
        this.getDateMeta = memoize(getDateMeta);
    }
    render() {
        let { props, context } = this;
        let { options } = context;
        let renderProps = {
            // this is a time-specific slot. not day-specific, so don't do today/nowRange
            ...this.getDateMeta(props.date, context.dateEnv),
            time: props.time,
            isMajor: false,
            isMinor: !props.isLabeled,
            view: context.viewApi,
        };
        return (jsx(ContentContainer, { tag: "div", attrs: {
                'data-time': props.isoTimeStr,
            }, className: joinClassNames(classNames.noMargin, classNames.noPadding, classNames.liquid, classNames.borderlessX, classNames.borderlessBottom, !props.borderTop && classNames.borderlessTop), renderProps: renderProps, generatorName: undefined, classNameGenerator: options.slotLaneClass, didMount: options.slotLaneDidMount, willUnmount: options.slotLaneWillUnmount }));
    }
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'short' });
class TimeGridWeekNumber extends BaseComponent {
    constructor() {
        super(...arguments);
        // ref
        this.innerElRef = createRef();
    }
    render() {
        let { props, context } = this;
        let { options, dateEnv } = context;
        let range = props.dateProfile.renderRange;
        let dayCnt = diffDays(range.start, range.end);
        // HACK: only make week-number a nav-link when NOT in week-view
        let hasNavLink = dayCnt === 1 && options.navLinks;
        let weekDateMarker = range.start;
        let fullDateStr = buildDateStr(context, weekDateMarker, 'week');
        let weekNum = dateEnv.computeWeekNumber(weekDateMarker);
        let weekTextParts = dateEnv.formatToParts(weekDateMarker, options.weekNumberFormat || DEFAULT_WEEK_NUM_FORMAT);
        let weekText = joinDateTimeFormatParts(weekTextParts);
        let weekDateZoned = dateEnv.toDate(weekDateMarker);
        const weekNumberRenderProps = {
            num: weekNum,
            text: weekText,
            textParts: weekTextParts,
            date: weekDateZoned,
            isNarrow: props.isNarrow,
            hasNavLink,
            options: { dayMinWidth: options.dayMinWidth },
        };
        return (jsx(ContentContainer, { tag: 'div', attrs: {
                role: 'gridcell', // doesn't always describe other cells in row, so make generic
                'aria-label': fullDateStr,
            }, className: joinClassNames(classNames.flexRow, classNames.noMargin, classNames.noPadding, props.isLiquid ? classNames.liquid : classNames.contentBox), style: {
                width: props.width,
            }, renderProps: weekNumberRenderProps, generatorName: "weekNumberHeaderContent", customGenerator: options.weekNumberHeaderContent, defaultGenerator: renderText, classNameGenerator: options.weekNumberHeaderClass, didMount: options.weekNumberHeaderDidMount, willUnmount: options.weekNumberHeaderWillUnmount, children: (InnerContent) => (jsx("div", { ref: this.innerElRef, className: joinClassNames(classNames.flexRow, classNames.noShrink, classNames.whiteSpaceNoWrap), children: jsx(InnerContent, { tag: 'div', attrs: hasNavLink
                        ? buildNavLinkAttrs(context, range.start, 'week', fullDateStr)
                        : { 'aria-label': fullDateStr }, className: generateClassName(options.weekNumberHeaderInnerClass, weekNumberRenderProps) }) })) }));
    }
    componentDidMount() {
        this._isUnmounting = false;
        const { props } = this;
        const innerEl = this.innerElRef.current; // TODO: make dynamic with useEffect
        // TODO: only attach this if refs props present
        // TODO: handle width/height independently?
        this.disconnectInnerSize = watchSize(innerEl, (width, height) => {
            if (this._isUnmounting)
                return;
            setRef(props.innerWidthRef, width);
            setRef(props.innerHeightRef, height);
        });
    }
    componentWillUnmount() {
        const { props } = this;
        this._isUnmounting = true;
        this.disconnectInnerSize();
        setRef(props.innerWidthRef, null);
        setRef(props.innerHeightRef, null);
    }
}

function TimeGridAxisEmpty(props) {
    return (jsx("div", { role: 'gridcell' // is empty so can't be rowheader/columnheader
        , className: props.isLiquid ? classNames.liquid : classNames.contentBox, style: { width: props.width } }));
}

class TimeGridLayoutPannable extends BaseComponent {
    constructor() {
        super(...arguments);
        this.state = {
            headerTierHeights: [],
        };
        // refs
        this.headerLabelInnerWidthRefMap = new RefMap(() => {
            afterSize(this.handleAxisWidths);
        });
        this.headerLabelInnerHeightRefMap = new RefMap(() => {
            afterSize(this.handleHeaderHeights);
        });
        this.headerMainInnerHeightRefMap = new RefMap(() => {
            afterSize(this.handleHeaderHeights);
        });
        this.handleAllDayLabelInnerWidth = (width) => {
            this.allDayLabelInnerWidth = width;
            afterSize(this.handleAxisWidths);
        };
        this.slatLabelInnerWidthRefMap = new RefMap(() => {
            afterSize(this.handleAxisWidths);
        });
        this.slatLabelInnerHeightRefMap = new RefMap(() => {
            afterSize(this.handleSlatInnerHeights);
        });
        this.headerScrollerRef = createRef();
        this.allDayScrollerRef = createRef();
        this.mainScrollerRef = createRef();
        this.footScrollerRef = createRef();
        this.axisScrollerRef = createRef();
        // Sizing
        // -----------------------------------------------------------------------------------------------
        this.handleTotalWidth = (totalWidth) => {
            if (this._isUnmounting)
                return;
            this.setState({ totalWidth });
        };
        this.handleBodyHeight = (bodyHeight) => {
            if (this._isUnmounting)
                return;
            this.setState({ bodyHeight });
        };
        this.handleClientWidth = (clientWidth) => {
            if (this._isUnmounting)
                return;
            this.setState({ clientWidth });
        };
        this.handleClientHeight = (clientHeight) => {
            if (this._isUnmounting)
                return;
            this.setState({ clientHeight });
        };
        this.handleStickyBottomScrollbarWidth = (sticykBottomScrollbarWidth) => {
            if (this._isUnmounting)
                return;
            this.setState({ sticykBottomScrollbarWidth });
        };
        this.handleHeaderHeights = () => {
            if (this._isUnmounting)
                return;
            const headerLabelInnerHeightMap = this.headerLabelInnerHeightRefMap.current;
            const headerMainInnerHeightMap = this.headerMainInnerHeightRefMap.current;
            const heights = [];
            // important to loop using 'main' because 'label' might not be tracking height if empty
            for (const [tierNum, mainHeight] of headerMainInnerHeightMap.entries()) {
                heights[tierNum] = Math.max(headerLabelInnerHeightMap.get(tierNum) || 0, mainHeight);
            }
            this.setState({ headerTierHeights: heights });
        };
        this.handleSlatInnerHeights = () => {
            if (this._isUnmounting)
                return;
            const slatLabelInnerHeightMap = this.slatLabelInnerHeightRefMap.current;
            let max = 0;
            for (const slatLabelInnerHeight of slatLabelInnerHeightMap.values()) {
                max = Math.max(max, slatLabelInnerHeight);
            }
            if (this.state.slatInnerHeight !== max) {
                this.setState({ slatInnerHeight: max });
            }
        };
        this.handleAxisWidths = () => {
            if (this._isUnmounting)
                return;
            const headerLabelInnerWidthMap = this.headerLabelInnerWidthRefMap.current;
            const slatLabelInnerWidthMap = this.slatLabelInnerWidthRefMap.current;
            let max = this.allDayLabelInnerWidth || 0; // guard against all-day slot hidden
            for (const headerLabelInnerWidth of headerLabelInnerWidthMap.values()) {
                max = Math.max(max, headerLabelInnerWidth);
            }
            for (const slatLableInnerWidth of slatLabelInnerWidthMap.values()) {
                max = Math.max(max, slatLableInnerWidth);
            }
            if (this.state.axisWidth !== max) {
                this.setState({ axisWidth: max });
            }
        };
    }
    render() {
        const { props, state, context, headerLabelInnerWidthRefMap, headerLabelInnerHeightRefMap, headerMainInnerHeightRefMap, slatLabelInnerWidthRefMap, slatLabelInnerHeightRefMap, } = this;
        const { nowDate, headerTiers, forPrint } = props;
        const nowTimeMs = nowDate.valueOf() - startOfDay(nowDate).valueOf();
        const { axisWidth, totalWidth, clientWidth, clientHeight, bodyHeight, sticykBottomScrollbarWidth } = state;
        const { options } = context;
        const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options);
        const endScrollbarWidth = (totalWidth != null && clientWidth != null && axisWidth != null)
            ? totalWidth - clientWidth - (axisWidth + 1) // +1 for hardcoded divider!
            : undefined;
        const verticalScrolling = !forPrint && !getIsHeightAuto(options);
        const tableHeaderSticky = !forPrint && getTableHeaderSticky(options);
        const footerScrollbarSticky = !forPrint && getFooterScrollbarSticky(options);
        const printStackEnabled = computeTimeGridPrintMode(forPrint, options.eventPrintLayout) === 'stack';
        const absPrint = forPrint && !printStackEnabled;
        const simplePrint = forPrint && printStackEnabled;
        const colCount = props.cells.length;
        const [canvasWidth, appliedColWidth] = computeColWidth(colCount, props.dayMinWidth, clientWidth);
        const measuredColWidth = appliedColWidth ?? (clientWidth != null ? clientWidth / colCount : undefined);
        const cellIsMicro = measuredColWidth != null && measuredColWidth <= dayMicroWidth;
        const cellIsNarrow = cellIsMicro || (measuredColWidth != null && measuredColWidth <= options.dayNarrowWidth);
        const slatCnt = props.slatMetas.length;
        const [slatHeight, slatLiquidHeight] = computeSlatHeight(// TODO: memo?
        verticalScrolling && options.expandRows, slatCnt, options.slotMinHeight, state.slatInnerHeight, clientHeight);
        this.slatHeight = slatHeight;
        // TODO: have computeSlatHeight return?
        const totalSlatHeight = (slatHeight || 0) * slatCnt;
        const forcedBodyHeight = absPrint ? totalSlatHeight : undefined;
        const rowsNotExpanding = verticalScrolling && !options.expandRows &&
            clientHeight != null && clientHeight > totalSlatHeight;
        const firstBodyRowIndex = options.dayHeaders ? headerTiers.length + 1 : 1;
        const bottomScrollbarWidth = footerScrollbarSticky
            ? sticykBottomScrollbarWidth
            : (bodyHeight != null && clientHeight != null)
                ? (bodyHeight - clientHeight)
                : undefined;
        return (jsxs(Fragment, { children: [options.dayHeaders && (jsxs("div", { className: joinClassNames(generateClassName(options.tableHeaderClass, {
                        isSticky: tableHeaderSticky,
                        borderlessX,
                        borderlessTop,
                        borderlessBottom,
                        multiMonthColumns: 0,
                    }), 
                    // See the note in TimeGridLayout about why print doesn't use repeating headers.
                    classNames.flexCol, tableHeaderSticky && classNames.tableHeaderSticky, classNames.z1), children: [jsxs("div", { className: classNames.flexRow, children: [jsx("div", { role: 'rowgroup', className: classNames.contentBox, style: { width: axisWidth }, children: headerTiers.map((rowConfig, tierNum) => (jsx("div", { role: 'row', "aria-rowindex": tierNum + 1, className: joinClassNames(options.dayHeaderRowClass, classNames.flexRow, classNames.contentBox, classNames.borderlessX, classNames.borderlessTop, tierNum === props.headerTiers.length - 1 && classNames.borderlessBottom), style: {
                                            height: state.headerTierHeights[tierNum]
                                        }, children: (options.weekNumbers && rowConfig.isDateRow) ? (jsx(TimeGridWeekNumber, { dateProfile: props.dateProfile, innerWidthRef: headerLabelInnerWidthRefMap.createRef(tierNum), innerHeightRef: headerLabelInnerHeightRefMap.createRef(tierNum), width: undefined, isLiquid: true, isNarrow: cellIsNarrow })) : (jsx(TimeGridAxisEmpty, { width: undefined, isLiquid: true })) }, tierNum))) }), jsx("div", { className: generateClassName(options.slotHeaderDividerClass, {
                                        inTableHeader: true,
                                        options: { dayMinWidth: options.dayMinWidth },
                                    }) }), jsxs(Scroller, { horizontal: true, hideScrollbars: true, className: joinClassNames(classNames.flexRow, classNames.liquid), ref: this.headerScrollerRef, children: [jsx("div", { role: 'rowgroup', className: canvasWidth == null ? classNames.liquid : '', style: { width: canvasWidth }, children: props.headerTiers.map((rowConfig, tierNum) => (createElement(DayGridHeaderRow, { ...rowConfig, key: tierNum, role: 'row', rowIndex: tierNum, borderBottom: tierNum < props.headerTiers.length - 1, height: state.headerTierHeights[tierNum], colWidth: appliedColWidth, viewportWidth: clientWidth, innerHeightRef: headerMainInnerHeightRefMap.createRef(tierNum), cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro, rowLevel: props.headerTiers.length - tierNum - 1 }))) }), Boolean(endScrollbarWidth) && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: true }), classNames.borderlessY, classNames.borderlessEnd), style: { minWidth: endScrollbarWidth } }))] })] }), jsx("div", { className: generateClassName(options.dayHeaderDividerClass, {
                                isSticky: tableHeaderSticky,
                                multiMonthColumns: 0,
                                options: { allDaySlot: Boolean(options.allDaySlot) },
                            }) })] })), jsxs("div", { role: 'rowgroup', className: joinClassNames(generateClassName(options.tableBodyClass, {
                        borderlessX,
                        borderlessTop,
                        borderlessBottom,
                        multiMonthColumns: 0,
                    }), classNames.flexCol, verticalScrolling && classNames.liquid, classNames.isolate, classNames.z0), children: [options.allDaySlot && (jsxs(Fragment, { children: [jsxs("div", { role: 'row', "aria-rowindex": firstBodyRowIndex, className: joinClassNames(classNames.flexRow, classNames.z1), children: [jsx(TimeGridAllDayHeader, { width: axisWidth, innerWidthRef: this.handleAllDayLabelInnerWidth, isNarrow: cellIsNarrow }), jsx("div", { className: generateClassName(options.slotHeaderDividerClass, {
                                                inTableHeader: false,
                                                options: { dayMinWidth: options.dayMinWidth },
                                            }) }), jsxs(Scroller, { horizontal: true, hideScrollbars: true, 
                                            // fill remaining width
                                            className: joinClassNames(classNames.flexRow, classNames.liquidX), ref: this.allDayScrollerRef, children: [jsx("div", { className: classNames.flexRow, style: { width: canvasWidth }, children: jsx(TimeGridAllDayLane, { dateProfile: props.dateProfile, todayRange: props.todayRange, cells: props.cells, showDayNumbers: false, forPrint: forPrint, isHitComboAllowed: props.isHitComboAllowed, className: joinClassNames(classNames.borderless, classNames.liquidX), cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro, 
                                                        // content
                                                        fgEventSegs: props.fgEventSegs, bgEventSegs: props.bgEventSegs, businessHourSegs: props.businessHourSegs, dateSelectionSegs: props.dateSelectionSegs, eventSelection: props.eventSelection, eventDrag: props.eventDrag, eventResize: props.eventResize, dayMaxEvents: props.dayMaxEvents, dayMaxEventRows: props.dayMaxEventRows, 
                                                        // dimensions
                                                        colWidth: appliedColWidth }) }), Boolean(endScrollbarWidth) && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: false }), classNames.borderlessY, classNames.borderlessEnd), style: { minWidth: endScrollbarWidth } }))] })] }), jsx("div", { className: joinClassNames(options.allDayDividerClass, classNames.z2) })] })), jsxs("div", { role: 'row', "aria-rowindex": firstBodyRowIndex + (options.allDaySlot ? 1 : 0), className: joinClassNames(classNames.flexRow, classNames.rel, // for Ruler.fillStart
                            verticalScrolling && classNames.liquid, classNames.z0), children: [jsx(Scroller, { vertical: verticalScrolling, hideScrollbars: true, className: joinClassNames(classNames.flexCol, classNames.contentBox), style: {
                                        width: axisWidth,
                                    }, ref: this.axisScrollerRef, clientHeightRef: this.handleBodyHeight, children: !simplePrint && (jsx(Fragment, { children: jsxs("div", { role: 'rowheader', "aria-label": options.timedText, className: joinClassNames(classNames.flexCol, classNames.grow, classNames.rel), style: {
                                                height: forcedBodyHeight,
                                            }, children: [jsx("div", { "aria-hidden": true, className: joinClassNames(classNames.flexCol, (verticalScrolling && options.expandRows) && classNames.grow, absPrint && classNames.fillX), children: props.slatMetas.map((slatMeta, slatI) => (createElement(TimeGridSlatHeader, { ...slatMeta /* FYI doesn't need isoTimeStr */, key: slatMeta.key, innerWidthRef: slatLabelInnerWidthRefMap.createRef(slatMeta.key), innerHeightRef: slatLabelInnerHeightRefMap.createRef(slatMeta.key), borderTop: Boolean(slatI), isNarrow: cellIsNarrow, height: slatLiquidHeight ? undefined : slatHeight, liquidHeight: slatLiquidHeight }))) }), !forPrint && options.nowIndicator && rangeContainsMarker(props.dateProfile.currentRange, nowDate) &&
                                                    nowTimeMs >= props.dateProfile.slotMinTime.milliseconds &&
                                                    nowTimeMs < props.dateProfile.slotMaxTime.milliseconds && (jsx(TimeGridNowIndicatorArrow, { nowDate: nowDate, dateProfile: props.dateProfile, totalHeight: slatHeight != null ? slatHeight * slatCnt : undefined })), Boolean(rowsNotExpanding || bottomScrollbarWidth) && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: false }), classNames.borderlessX, classNames.borderlessBottom, rowsNotExpanding && classNames.liquid), style: {
                                                        minHeight: bottomScrollbarWidth
                                                    } }))] }) })) }), jsx("div", { className: generateClassName(options.slotHeaderDividerClass, {
                                        inTableHeader: false,
                                        options: { dayMinWidth: options.dayMinWidth },
                                    }) }), jsxs("div", { 
                                    // we need this div because it's bad for Scroller to have left/right borders,
                                    // AND because we need to containt the FooterScrollbar
                                    className: joinClassNames(classNames.flexCol, classNames.liquid), children: [jsx(Scroller, { vertical: verticalScrolling, horizontal: true, hideScrollbars: footerScrollbarSticky || // also means height:auto, so won't need vertical scrollbars anyway
                                                forPrint, className: joinClassNames(classNames.flexCol, classNames.rel, // for Ruler.fillStart
                                            verticalScrolling && classNames.liquid), ref: this.mainScrollerRef, clientWidthRef: this.handleClientWidth, clientHeightRef: this.handleClientHeight, children: jsxs("div", { className: joinClassNames(classNames.flexCol, classNames.grow, classNames.rel), style: {
                                                    width: canvasWidth,
                                                    height: forcedBodyHeight,
                                                }, children: [jsx(TimeGridCols, { dateProfile: props.dateProfile, nowDate: props.nowDate, nowMs: props.nowMs, todayRange: props.todayRange, cells: props.cells, slatCnt: slatCnt, forPrint: forPrint, isHitComboAllowed: props.isHitComboAllowed, className: simplePrint ? '' : classNames.fill, 
                                                        // content
                                                        fgEventSegsByCol: props.fgEventSegsByCol, bgEventSegsByCol: props.bgEventSegsByCol, businessHourSegsByCol: props.businessHourSegsByCol, nowIndicatorSegsByCol: props.nowIndicatorSegsByCol, dateSelectionSegsByCol: props.dateSelectionSegsByCol, eventDragByCol: props.eventDragByCol, eventResizeByCol: props.eventResizeByCol, eventSelection: props.eventSelection, 
                                                        // dimensions
                                                        colWidth: appliedColWidth, slatHeight: slatHeight, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro }), !simplePrint && (jsxs(Fragment, { children: [jsx("div", { "aria-hidden": true, className: joinClassNames(classNames.flexCol, (verticalScrolling && options.expandRows) && classNames.grow, absPrint ? classNames.fillX : classNames.rel), children: props.slatMetas.map((slatMeta, slatI) => (jsx("div", { className: joinClassNames(classNames.flexRow, slatLiquidHeight && classNames.liquid), style: {
                                                                        height: slatLiquidHeight ? '' : slatHeight
                                                                    }, children: createElement(TimeGridSlatLane, { ...slatMeta /* FYI doesn't need isoTimeStr */, key: slatMeta.key, borderTop: Boolean(slatI) }) }, slatMeta.key))) }), rowsNotExpanding && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: false }), classNames.borderlessX, classNames.borderlessBottom, classNames.liquid) }))] }))] }) }), Boolean(footerScrollbarSticky) && (jsx(FooterScrollbar, { isSticky: true, canvasWidth: canvasWidth, scrollerRef: this.footScrollerRef, scrollbarWidthRef: this.handleStickyBottomScrollbarWidth }))] })] })] }), jsx(Ruler, { widthRef: this.handleTotalWidth })] }));
    }
    // Lifecycle
    // -----------------------------------------------------------------------------------------------
    componentDidMount() {
        this._isUnmounting = false;
        this.initScrollers();
        this.updateSlatHeight();
    }
    componentDidUpdate() {
        this.updateScrollers();
        this.updateSlatHeight();
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.destroyScrollers();
        this.prevSlatHeight = undefined;
        setRef(this.props.slatHeightRef, null);
    }
    updateSlatHeight() {
        if (this.prevSlatHeight !== this.slatHeight) {
            setRef(this.props.slatHeightRef, this.prevSlatHeight = this.slatHeight);
        }
    }
    // Scrolling
    // -----------------------------------------------------------------------------------------------
    initScrollers() {
        const ScrollerSyncer = getScrollerSyncerClass(this.context.pluginHooks);
        this.dayScroller = new ScrollerSyncer(true); // horizontal=true
        this.timeScroller = new ScrollerSyncer(); // horizontal=false
        setRef(this.props.dayScrollerRef, this.dayScroller);
        setRef(this.props.timeScrollerRef, this.timeScroller);
        this.updateScrollers();
    }
    updateScrollers() {
        this.dayScroller.handleChildren([
            this.headerScrollerRef.current,
            this.allDayScrollerRef.current,
            this.mainScrollerRef.current,
            this.footScrollerRef.current,
        ]);
        this.timeScroller.handleChildren([
            this.axisScrollerRef.current,
            this.mainScrollerRef.current,
        ]);
    }
    destroyScrollers() {
        setRef(this.props.dayScrollerRef, null);
        setRef(this.props.timeScrollerRef, null);
    }
}
TimeGridLayoutPannable.addPropsEquality({
    headerTierHeights: isArraysEqual,
});

class TimeGridLayoutNormal extends BaseComponent {
    constructor() {
        super(...arguments);
        this.state = {};
        // refs
        this.headerLabelInnerWidthRefMap = new RefMap(() => {
            afterSize(this.handleAxisInnerWidths);
        });
        this.handleAllDayLabelInnerWidth = (width) => {
            this.allDayLabelInnerWidth = width;
            afterSize(this.handleAxisInnerWidths);
        };
        this.handleWeekNumberInnerWidth = (width) => {
            this.weekNumberInnerWidth = width;
            afterSize(this.handleAxisInnerWidths);
        };
        this.slatLabelInnerWidthRefMap = new RefMap(() => {
            afterSize(this.handleAxisInnerWidths);
        });
        this.slatLabelInnerHeightRefMap = new RefMap(() => {
            afterSize(this.handleSlatInnerHeights);
        });
        // Sizing
        // -----------------------------------------------------------------------------------------------
        this.handleTotalWidth = (totalWidth) => {
            if (this._isUnmounting)
                return;
            // Must delay the rerender because might change the width of the all-day DayGridRow events,
            // which shows a ResizeObserver loop warning
            requestAnimationFrame(() => {
                if (this._isUnmounting)
                    return;
                this.setState({ totalWidth });
            });
        };
        this.handleClientWidth = (clientWidth) => {
            if (this._isUnmounting)
                return;
            this.setState({ clientWidth });
        };
        this.handleClientHeight = (clientHeight) => {
            if (this._isUnmounting)
                return;
            this.setState({ clientHeight });
        };
        this.handleAxisInnerWidths = () => {
            if (this._isUnmounting)
                return;
            const headerLabelInnerWidthMap = this.headerLabelInnerWidthRefMap.current;
            const slatLabelInnerWidthMap = this.slatLabelInnerWidthRefMap.current;
            let max = Math.max(this.weekNumberInnerWidth || 0, // might not exist
            this.allDayLabelInnerWidth || 0 // guard against all-day slot hidden
            );
            for (const headerLabelInnerWidth of headerLabelInnerWidthMap.values()) {
                max = Math.max(max, headerLabelInnerWidth);
            }
            for (const slatLabelInnerWidth of slatLabelInnerWidthMap.values()) {
                max = Math.max(max, slatLabelInnerWidth);
            }
            if (this.state.axisWidth !== max) {
                this.setState({ axisWidth: max });
            }
        };
        this.handleSlatInnerHeights = () => {
            if (this._isUnmounting)
                return;
            const slatLabelInnerHeightMap = this.slatLabelInnerHeightRefMap.current;
            let max = 0;
            for (const slatLabelInnerHeight of slatLabelInnerHeightMap.values()) {
                max = Math.max(max, slatLabelInnerHeight);
            }
            if (this.state.slatInnerHeight !== max) {
                this.setState({ slatInnerHeight: max });
            }
        };
    }
    render() {
        const { props, state, context, slatLabelInnerWidthRefMap, slatLabelInnerHeightRefMap, headerLabelInnerWidthRefMap } = this;
        const { nowDate, forPrint } = props;
        const nowTimeMs = nowDate.valueOf() - startOfDay(nowDate).valueOf();
        const { axisWidth, clientWidth, totalWidth } = state;
        const { options } = context;
        const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options);
        const endScrollbarWidth = (totalWidth != null && clientWidth != null && !forPrint)
            ? totalWidth - clientWidth
            : undefined;
        const verticalScrolling = !forPrint && !getIsHeightAuto(options);
        const tableHeaderSticky = !forPrint && getTableHeaderSticky(options);
        const slatCnt = props.slatMetas.length;
        const [slatHeight, slatLiquidHeight] = computeSlatHeight(verticalScrolling && options.expandRows, slatCnt, options.slotMinHeight, state.slatInnerHeight, state.clientHeight);
        this.slatHeight = slatHeight;
        // TODO: have computeSlatHeight return?
        const totalSlatHeight = (slatHeight || 0) * slatCnt;
        const rowsNotExpanding = verticalScrolling && !options.expandRows &&
            state.clientHeight != null && state.clientHeight > totalSlatHeight;
        const printStackEnabled = computeTimeGridPrintMode(forPrint, options.eventPrintLayout) === 'stack';
        const absPrint = forPrint && !printStackEnabled;
        const simplePrint = forPrint && printStackEnabled;
        // for printing
        // in Chrome, slats and columns both need abs positioning within a relative container for them
        // to sync across pages, and the relative container needs an explicit height
        // in Firefox, same applies, but the flex-row for the cells has trouble spanning across page,
        // so we need to set explicit height on flex-row and all parents
        const forcedBodyHeight = absPrint ? totalSlatHeight : undefined;
        const colCount = props.cells.length;
        const measuredColWidth = clientWidth != null ? clientWidth / colCount : undefined;
        const cellIsMicro = measuredColWidth != null && measuredColWidth <= dayMicroWidth;
        const cellIsNarrow = cellIsMicro || (measuredColWidth != null && measuredColWidth <= options.dayNarrowWidth);
        return (jsxs(Fragment, { children: [options.dayHeaders && (jsxs("div", { role: 'rowgroup', className: joinClassNames(generateClassName(options.tableHeaderClass, {
                        isSticky: tableHeaderSticky,
                        borderlessX,
                        borderlessTop,
                        borderlessBottom,
                        multiMonthColumns: 0,
                    }), 
                    // See the note in TimeGridLayout about why print doesn't use repeating headers.
                    classNames.flexCol, tableHeaderSticky && classNames.tableHeaderSticky, classNames.z1), children: [props.headerTiers.map((rowConfig, tierNum) => (jsxs("div", { role: 'row', className: classNames.flexRow, children: [jsx("div", { className: joinClassNames(options.dayHeaderRowClass, classNames.flexRow, classNames.borderlessX, classNames.borderlessTop, tierNum === props.headerTiers.length - 1 && classNames.borderlessBottom), children: (options.weekNumbers && rowConfig.isDateRow) ? (jsx(TimeGridWeekNumber, { dateProfile: props.dateProfile, innerWidthRef: this.handleWeekNumberInnerWidth, innerHeightRef: headerLabelInnerWidthRefMap.createRef(tierNum), width: axisWidth, isLiquid: false, isNarrow: cellIsNarrow })) : (jsx(TimeGridAxisEmpty, { width: axisWidth, isLiquid: false })) }), jsx("div", { className: generateClassName(options.slotHeaderDividerClass, {
                                        inTableHeader: true,
                                        options: { dayMinWidth: options.dayMinWidth },
                                    }) }), jsx(DayGridHeaderRow, { ...rowConfig, className: classNames.liquid, borderBottom: tierNum < props.headerTiers.length - 1, viewportWidth: clientWidth, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro, rowLevel: props.headerTiers.length - tierNum - 1 }), Boolean(endScrollbarWidth) && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: true }), classNames.borderlessY, classNames.borderlessEnd), style: { minWidth: endScrollbarWidth } }))] }, tierNum))), jsx("div", { className: generateClassName(options.dayHeaderDividerClass, {
                                isSticky: tableHeaderSticky,
                                multiMonthColumns: 0,
                                options: { allDaySlot: Boolean(options.allDaySlot) },
                            }) })] })), jsxs("div", { role: 'rowgroup', className: joinClassNames(generateClassName(options.tableBodyClass, {
                        borderlessX,
                        borderlessTop,
                        borderlessBottom,
                        multiMonthColumns: 0,
                    }), classNames.flexCol, verticalScrolling && classNames.liquid, classNames.isolate, classNames.z0), children: [options.allDaySlot && (jsxs(Fragment, { children: [jsxs("div", { role: 'row', className: joinClassNames(classNames.flexRow, classNames.z1), children: [jsx(TimeGridAllDayHeader, { width: axisWidth, innerWidthRef: this.handleAllDayLabelInnerWidth, isNarrow: cellIsNarrow }), jsx("div", { className: generateClassName(options.slotHeaderDividerClass, {
                                                inTableHeader: false,
                                                options: { dayMinWidth: options.dayMinWidth },
                                            }) }), jsx(TimeGridAllDayLane, { dateProfile: props.dateProfile, todayRange: props.todayRange, cells: props.cells, showDayNumbers: false, forPrint: forPrint, isHitComboAllowed: props.isHitComboAllowed, className: joinClassNames(classNames.liquidX, classNames.borderless), cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro, 
                                            // content
                                            fgEventSegs: props.fgEventSegs, bgEventSegs: props.bgEventSegs, businessHourSegs: props.businessHourSegs, dateSelectionSegs: props.dateSelectionSegs, eventDrag: props.eventDrag, eventResize: props.eventResize, eventSelection: props.eventSelection, dayMaxEvents: props.dayMaxEvents, dayMaxEventRows: props.dayMaxEventRows }), Boolean(endScrollbarWidth) && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: false }), classNames.borderlessY, classNames.borderlessEnd), style: { minWidth: endScrollbarWidth } }))] }), jsx("div", { className: joinClassNames(options.allDayDividerClass, classNames.z2) })] })), jsx(Scroller, { vertical: verticalScrolling, className: joinClassNames(classNames.flexCol, classNames.rel, // for Ruler.fillStart
                            verticalScrolling && classNames.liquid, classNames.z0), ref: props.timeScrollerRef, clientWidthRef: this.handleClientWidth, clientHeightRef: this.handleClientHeight, children: jsxs("div", { className: joinClassNames(classNames.flexCol, classNames.grow, classNames.rel), style: {
                                    // in print mode, this div creates the height and everything is absolutely positioned within
                                    // we need to do this so that slats positioning synces with events's positioning
                                    // otherwise, get out of sync on second page
                                    height: forcedBodyHeight,
                                }, children: [jsxs("div", { role: 'row', className: joinClassNames(classNames.flexRow, !simplePrint && classNames.fill), children: [jsx("div", { role: 'rowheader', "aria-label": options.timedText, className: classNames.contentBox, style: { width: axisWidth } }), jsx("div", { className: generateClassName(options.slotHeaderDividerClass, {
                                                    inTableHeader: false,
                                                    options: { dayMinWidth: options.dayMinWidth },
                                                }) }), jsx(TimeGridCols, { dateProfile: props.dateProfile, nowDate: props.nowDate, nowMs: props.nowMs, todayRange: props.todayRange, cells: props.cells, slatCnt: slatCnt, forPrint: forPrint, isHitComboAllowed: props.isHitComboAllowed, className: classNames.liquid, 
                                                // content
                                                fgEventSegsByCol: props.fgEventSegsByCol, bgEventSegsByCol: props.bgEventSegsByCol, businessHourSegsByCol: props.businessHourSegsByCol, nowIndicatorSegsByCol: props.nowIndicatorSegsByCol, dateSelectionSegsByCol: props.dateSelectionSegsByCol, eventDragByCol: props.eventDragByCol, eventResizeByCol: props.eventResizeByCol, eventSelection: props.eventSelection, 
                                                // dimensions
                                                slatHeight: slatHeight, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro })] }), !simplePrint && (jsxs(Fragment, { children: [jsx("div", { "aria-hidden": true, className: joinClassNames(classNames.flexCol, (verticalScrolling && options.expandRows) && classNames.grow, absPrint
                                                    ? classNames.fillX // will assume top:0, height will be decided naturally
                                                    : classNames.rel), children: props.slatMetas.map((slatMeta, slatI) => (jsxs("div", { className: joinClassNames(slatLiquidHeight && classNames.liquid, classNames.flexRow), style: {
                                                        height: slatLiquidHeight ? undefined : slatHeight
                                                    }, children: [jsx("div", { 
                                                            // the pannable version of TimeGrid has axis labels all consecutive in one column
                                                            // simulate this for the non-pannable version
                                                            className: classNames.flexCol, style: { width: axisWidth }, children: createElement(TimeGridSlatHeader, { ...slatMeta /* FYI doesn't need isoTimeStr */, key: slatMeta.key, innerWidthRef: slatLabelInnerWidthRefMap.createRef(slatMeta.key), innerHeightRef: slatLabelInnerHeightRefMap.createRef(slatMeta.key), borderTop: Boolean(slatI), isNarrow: cellIsNarrow }) }), jsx("div", { className: generateClassName(options.slotHeaderDividerClass, {
                                                                inTableHeader: false,
                                                                options: { dayMinWidth: options.dayMinWidth },
                                                            }), style: { visibility: 'hidden' } }), createElement(TimeGridSlatLane, { ...slatMeta /* FYI doesn't need isoTimeStr */, key: slatMeta.key, borderTop: Boolean(slatI) })] }, slatMeta.key))) }), rowsNotExpanding && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: false }), classNames.borderlessX, classNames.borderlessBottom, classNames.liquid) })), !forPrint && options.nowIndicator && rangeContainsMarker(props.dateProfile.currentRange, nowDate) &&
                                                nowTimeMs >= props.dateProfile.slotMinTime.milliseconds &&
                                                nowTimeMs < props.dateProfile.slotMaxTime.milliseconds && (jsx(TimeGridNowIndicatorArrow, { nowDate: nowDate, dateProfile: props.dateProfile, totalHeight: slatHeight != null ? slatHeight * slatCnt : undefined }))] }))] }) })] }), jsx(Ruler, { widthRef: this.handleTotalWidth })] }));
    }
    // Lifecycle
    // -----------------------------------------------------------------------------------------------
    componentDidMount() {
        this._isUnmounting = false;
        this.updateSlatHeight();
    }
    componentDidUpdate() {
        this.updateSlatHeight();
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.prevSlatHeight = undefined;
        setRef(this.props.slatHeightRef, null);
    }
    updateSlatHeight() {
        if (this.prevSlatHeight !== this.slatHeight) {
            setRef(this.props.slatHeightRef, this.prevSlatHeight = this.slatHeight);
        }
    }
}

function buildEmptySegCols(segsByCol) {
    return segsByCol.map(() => []);
}
function buildEmptyInteractionCols(interactionsByCol) {
    return interactionsByCol.map(() => null);
}
class TimeGridLayout extends BaseComponent {
    constructor() {
        super(...arguments);
        // memo
        this.buildSlatMetas = memoize(buildSlatMetas);
        // refs
        this.dayScrollerRef = createRef();
        this.timeScrollerRef = createRef();
        this.scrollState = {}; // updated in-place
        // Sizing
        // -----------------------------------------------------------------------------------------------
        this.handleSlatHeight = (slatHeight) => {
            if (this._isUnmounting)
                return;
            this.slatHeight = slatHeight;
            if (slatHeight != null) {
                afterSize(this.applyTimeScroll);
            }
        };
        this.handleTimeScrollRequest = (scrollTime) => {
            this.scrollState.time = scrollTime;
            this.scrollState.y = undefined;
            this.applyTimeScroll();
        };
        /*
        Captures current values
        */
        this.handleTimeScrollEnd = (isDevice) => {
            if (isDevice) {
                const y = this.timeScrollerRef.current.y;
                // record, but only if not forPrint, which could give bogus values in the case of
                // TimeGridLayoutPannable, which kills y-scrolling, but retains x-scrolling,
                // which reports as a 0 y-scroll.
                if (!this.props.forPrint) {
                    this.scrollState.y = y;
                    this.scrollState.time = undefined;
                }
            }
        };
        this.applyTimeScroll = () => {
            const timeScroller = this.timeScrollerRef.current;
            const { slatHeight, scrollState } = this;
            let { y, time } = scrollState;
            if (y == null &&
                time &&
                slatHeight != null &&
                // Since applyTimeScroll is called by handleSlatHeight, could be called with null during cleanup,
                // and the timeScroller might not exist
                timeScroller) {
                y = computeTimeTopFrac(time, this.props.dateProfile)
                    * (slatHeight * this.currentSlatCnt);
                if (y) {
                    y++; // overcome top border
                }
                scrollState.y = y; // HACK: store raw pixel value
            }
            if (y != null) {
                timeScroller.scrollTo({ y });
            }
        };
    }
    render() {
        const { props, context } = this;
        const { dateProfile } = props;
        const { options, dateEnv } = context;
        const { dayMinWidth } = options;
        const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options);
        const slatMetas = this.buildSlatMetas(dateProfile.slotMinTime, dateProfile.slotMaxTime, options.slotHeaderInterval, options.slotDuration, dateEnv);
        this.currentSlatCnt = slatMetas.length;
        const dateSelectionSegs = props.forPrint ? [] : props.dateSelectionSegs;
        const eventDrag = props.forPrint ? null : props.eventDrag;
        const eventResize = props.forPrint ? null : props.eventResize;
        const dateSelectionSegsByCol = props.forPrint ? buildEmptySegCols(props.dateSelectionSegsByCol) : props.dateSelectionSegsByCol;
        const eventDragByCol = props.forPrint ? buildEmptyInteractionCols(props.eventDragByCol) : props.eventDragByCol;
        const eventResizeByCol = props.forPrint ? buildEmptyInteractionCols(props.eventResizeByCol) : props.eventResizeByCol;
        const commonLayoutProps = {
            dateProfile: dateProfile,
            nowDate: props.nowDate,
            nowMs: props.nowMs,
            todayRange: props.todayRange,
            cells: props.cells,
            slatMetas,
            forPrint: props.forPrint,
            isHitComboAllowed: props.isHitComboAllowed,
            // header content
            headerTiers: props.headerTiers,
            // all-day content
            fgEventSegs: props.fgEventSegs,
            bgEventSegs: props.bgEventSegs,
            businessHourSegs: props.businessHourSegs,
            dateSelectionSegs,
            eventDrag,
            eventResize,
            ...getAllDayMaxEventProps(options),
            // timed content
            fgEventSegsByCol: props.fgEventSegsByCol,
            bgEventSegsByCol: props.bgEventSegsByCol,
            businessHourSegsByCol: props.businessHourSegsByCol,
            nowIndicatorSegsByCol: props.nowIndicatorSegsByCol,
            dateSelectionSegsByCol,
            eventDragByCol,
            eventResizeByCol,
            // universal content
            eventSelection: props.eventSelection,
            // refs
            timeScrollerRef: this.timeScrollerRef,
            timeScrollState: this.scrollState,
            slatHeightRef: this.handleSlatHeight,
            borderlessX,
            borderlessBottom,
        };
        return (jsx(ViewContainer, { attrs: {
                role: 'grid',
                'aria-colcount': props.cells.length,
                'aria-labelledby': props.labelId,
                'aria-label': props.labelStr,
            }, className: joinClassNames(props.className, generateClassName(options.tableClass, {
                borderlessX,
                borderlessTop,
                borderlessBottom,
                multiMonthColumns: 0,
            }), 
            // We don't use the repeating-header print treatment here because it works poorly:
            // - Firefox >85ish CAN have flexboxes within it, but those cannot do absolute positioning
            // - Chrome works okay, but abs-positioned events cover the repeated header
            //   Also, there's weird padding on the last page at bottom of container, which matches
            //   the height of the repeated header
            // - Safari was never able to do repeated headers in the first place
            !props.forPrint && classNames.flexCol, classNames.isolate), viewSpec: context.viewSpec, children: dayMinWidth ? (jsx(TimeGridLayoutPannable, { ...commonLayoutProps, dayMinWidth: dayMinWidth, dayScrollerRef: this.dayScrollerRef })) : (jsx(TimeGridLayoutNormal, { ...commonLayoutProps })) }));
    }
    // Lifecycle
    // -----------------------------------------------------------------------------------------------
    componentDidMount() {
        this._isUnmounting = false;
        this.resetScroll();
        this.context.emitter.on('_timeScrollRequest', this.handleTimeScrollRequest);
        const timeScroller = this.timeScrollerRef.current;
        if (timeScroller) {
            timeScroller.addScrollEndListener(this.handleTimeScrollEnd);
        }
    }
    componentDidUpdate(prevProps) {
        if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
            this.resetScroll();
        }
        else if (prevProps.forPrint && !this.props.forPrint) {
            // returning from print
            // reapply scrolling because scroll-divs were probably restored
            this.applyTimeScroll();
        }
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.context.emitter.off('_timeScrollRequest', this.handleTimeScrollRequest);
        const timeScroller = this.timeScrollerRef.current;
        if (timeScroller) {
            timeScroller.removeScrollEndListener(this.handleTimeScrollEnd);
        }
    }
    // Scrolling
    // -----------------------------------------------------------------------------------------------
    resetScroll() {
        this.handleTimeScrollRequest(this.context.options.scrollTime);
        // also resets day scroll
        const dayScroller = this.dayScrollerRef.current;
        if (dayScroller) {
            dayScroller.scrollTo({ x: 0 });
        }
    }
}
// Utils
// -----------------------------------------------------------------------------------------------
const AUTO_ALL_DAY_MAX_EVENT_ROWS = 5;
function getAllDayMaxEventProps(options) {
    let { dayMaxEvents, dayMaxEventRows } = options;
    if (dayMaxEvents === true || dayMaxEventRows === true) { // is auto?
        dayMaxEvents = undefined;
        dayMaxEventRows = AUTO_ALL_DAY_MAX_EVENT_ROWS; // make sure "auto" goes to a real number
    }
    return { dayMaxEvents, dayMaxEventRows };
}

export { AllDaySplitter as A, DayTimeColsSlicer as D, NowIndicatorHeaderContainer as N, Splitter as S, TimeGridLayout as T, buildDayCols as a, buildDayColsFromSeries as b, NowIndicatorLineContainer as c, NowIndicatorDot as d, organizeSegsByCol as o, splitInteractionByCol as s };
