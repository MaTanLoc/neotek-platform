import { aH as valuesIdentical, aG as Dictionary, f as ViewOptions, d as CalendarOptions, q as ContentGenerator, o as ClassNameInput, aI as ViewContext, aJ as DateProfileGenerator, aK as DateProfile, aL as Emitter, aM as DateComponent, aN as ScrollerInterface, aO as EventRangeProps, aP as EventSegUiInteractionState, aQ as DateSpan, aR as CalendarContext, aS as EventStore, aT as EventInteractionState, aU as EventUiHash, aV as SplittableProps, aW as BaseComponent, aX as ElRef, c as EventRenderRange, aY as ViewOptionsRefined, l as CssDimValue, aZ as Splitter, a_ as EventDef, p as ClassNameGenerator, r as DidMountHandler, W as WillUnmountHandler, z as DayHeaderInfo, a$ as DateMeta, b0 as Hit } from './chunks/bb8fd4ea.js';
export { bA as Action, aW as BaseComponent, bU as CalendarApiImpl, bB as CalendarContentProps, aR as CalendarContext, bq as CalendarData, br as CalendarDataManager, bC as CalendarInner, e as CalendarListeners, b1 as CalendarListenersRefined, bW as CalendarMediaRoot, bI as Constraint, bY as ContentContainer, q as ContentGenerator, b_ as CustomRendering, ae as CustomRenderingStore, aM as DateComponent, a$ as DateMeta, aK as DateProfile, aJ as DateProfileGenerator, aQ as DateSpan, aG as Dictionary, r as DidMountHandler, by as ElementDragging, aL as Emitter, a_ as EventDef, b5 as EventDefHash, bV as EventImpl, b6 as EventInstanceHash, b7 as EventInstanceRange, aT as EventInteractionState, bH as EventMutation, b8 as EventRangeEdge, aO as EventRangeProps, bc as EventRefined, aP as EventSegUiInteractionState, aS as EventStore, bm as EventUi, aU as EventUiHash, b0 as Hit, b2 as Identity, bG as MinimalEventProps, bS as MoreLinkContainer, M as MountInfo, bQ as NowIndicatorHeaderContainer, bR as NowIndicatorLineContainer, be as OrderSpec, bx as PointerDragEvent, bN as ScrollerSyncerInterface, aV as SplittableProps, aZ as Splitter, bT as ViewContainer, aI as ViewContext, aY as ViewOptionsRefined, bs as ViewProps, bz as ViewPropsTransformer, W as WillUnmountHandler, bF as buildEventRangeKey, b9 as buildValidInstanceRange, bn as combineEventUis, bg as compareByFieldSpecs, bt as computeMajorUnit, bX as computeRootClassName, bj as computeViewBorderless, bo as createEventUi, b$ as createFormatter, bh as flexibleCompare, bZ as generateClassName, bp as getDateMeta, bw as getDateSpanInstantEndMs, bv as getDateSpanInstantStartMs, bE as getEventRangeMeta, bK as getFooterScrollbarSticky, bM as getIsHeightAuto, bb as getRangeInstantEndMs, ba as getRangeInstantStartMs, bk as getRectCenter, bL as getTableHeaderSticky, bi as guid, b3 as identity, bu as isMajorUnit, bl as mergeEventStores, bd as parseBusinessHours, bf as parseFieldSpecs, bO as refineClassName, bP as refineClassNameGenerator, b4 as refineProps, bJ as setRef, bD as sortEventSegs } from './chunks/bb8fd4ea.js';
import { OpenDateRange, Duration, DateMarker, DateRange, DateEnv, DateFormatter } from '@full-ui/headless-calendar';
export { DateEnv, DateFormatter, DateMarker, DateRange, addDays, addMs, asCleanDays, asRoughMinutes, asRoughMs, asRoughSeconds, createDuration, diffDayAndTime, diffWholeDays, diffWholeWeeks, formatDayString, greatestDurationDenominator, intersectRanges, isInt, isValidDate, multiplyDuration, padStart, parseMarker, rangeContainsMarker, rangesEqual, rangesIntersect, startOfDay, wholeDivideDurations } from '@full-ui/headless-calendar';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';
import { ReactNode, Ref, Component } from 'react';
export { r as requestJson } from './chunks/2240663d.js';

declare function warn(...args: any[]): void;

declare function computeVisibleDayRange(timedRange: OpenDateRange, nextDayThreshold?: Duration): OpenDateRange;

declare function removeExact(array: any[], exactItem: any): number;
declare function isArraysEqual(array0: any[], array1: any[], itemsEqual?: typeof valuesIdentical): boolean;

declare function memoize<Args extends any[], Res>(workerFunc: (...args: Args) => Res, resEquality?: (res0: Res, res1: Res) => boolean, teardownFunc?: (res: Res) => void): (...args: Args) => Res;
declare function memoizeObjArg<Arg extends Dictionary, Res>(workerFunc: (arg: Arg) => Res, resEquality?: (res0: Res, res1: Res) => boolean, teardownFunc?: (res: Res) => void): (arg: Arg) => Res;

declare function filterHash(hash: any, func: any): {};
declare function mapHash<InputItem, OutputItem>(hash: {
    [key: string]: InputItem;
}, func: (input: InputItem, key: string) => OutputItem): {
    [key: string]: OutputItem;
};
declare function isPropsEqualShallow(props0: any, props1: any): boolean;

type FuncishClassNameInput = ((info: any) => ClassNameInput) | ClassNameInput;
declare function mergeViewOptionsMap(...hashes: {
    [view: string]: ViewOptions;
}[]): {
    [view: string]: ViewOptions;
};
declare function mergeCalendarOptions(...optionSets: CalendarOptions[]): any;
declare function joinFuncishClassNames(input0: FuncishClassNameInput, // added to string first
input1: FuncishClassNameInput, optionName: string): FuncishClassNameInput;
declare function mergeContentInjectors(contentGenerator0: ContentGenerator<any>, // fallback
contentGenerator1: ContentGenerator<any>): ContentGenerator<any>;
declare function mergeLifecycleCallbacks(fn0: (...args: any[]) => any, // called first
fn1: (...args: any[]) => any): (...args: any[]) => any;

declare function computeElIsRtl(el: HTMLElement): boolean;
declare function applyStyleProp(el: HTMLElement, name: string, val: any): void;

type SizeCallback = (width: number, height: number) => void;
type DisconnectSize = () => void;
declare function afterSize(callback: () => void): void;
declare function watchSize(el: HTMLElement, callback: SizeCallback, watchWidth?: boolean, watchHeight?: boolean): DisconnectSize;
declare function watchWidth(el: HTMLElement, callback: (width: number) => void): DisconnectSize;
declare function watchHeight(el: HTMLElement, callback: (height: number) => void): DisconnectSize;

declare function debounce(fn: () => void, ms: number): [
    request: () => void,
    cancel: () => void
];

declare function buildNavLinkAttrs(context: ViewContext, dateMarker: DateMarker, viewType?: string, dateStr?: string, isTabbable?: boolean): {
    tabIndex: number;
    onKeyDown(ev: KeyboardEvent): void;
    onClick: (ev: UIEvent) => void;
    role: any;
    'aria-label': any;
    className: string;
} | {
    onClick: (ev: UIEvent) => void;
    role: any;
    'aria-label': any;
    className: string;
};

interface EdgeInfo {
    borderLeft: number;
    borderRight: number;
    borderTop: number;
    borderBottom: number;
    scrollbarLeft: number;
    scrollbarRight: number;
    scrollbarBottom: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
}
declare function computeEdges(el: HTMLElement, getPadding?: boolean): EdgeInfo;
declare function computeInnerRect(el: any, goWithinPadding?: boolean, doFromWindowViewport?: boolean): {
    left: any;
    right: number;
    top: any;
    bottom: number;
};

declare function unpromisify<Res>(func: (successCallback: (res: Res) => void, failureCallback: (error: Error) => void) => Promise<Res> | void, normalizedSuccessCallback: (res: Res) => void, normalizedFailureCallback: (error: Error) => void): void;

/**
 * Pure lateral-span geometry shared by the seg-placement engine.
 *
 * A span is a half-open interval `[start, end)` on the lateral axis. The axis
 * can be discrete (DayGrid columns) or continuous (Timeline pixels). Exactly
 * adjacent spans never intersect.
 */
interface LateralSpan {
    start: number;
    end: number;
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

/** Shared estimate for an event wrapper that has not reported a thickness. */
declare const DEFAULT_UNMEASURED_EVENT_THICKNESS = 20;
/**
 * What the kernel requires of a seg. Adapters satisfy it with the production
 * seg itself (DayGrid) or a projected copy of it carrying pixel geometry
 * (Timeline, TimeGrid) — never a wrapper around one.
 */
interface SourceSeg extends LateralSpan {
    /** Stable whole-source key. Partial-slice keys derive from it (getSliceKey). */
    key: string;
    isStart: boolean;
    isEnd: boolean;
    orderIndex: number;
}
interface Slice<S extends SourceSeg = SourceSeg> extends LateralSpan {
    sourceSeg: S;
    isStart: boolean;
    isEnd: boolean;
}
/**
 * One independently rendered more link and the hidden slices it represents.
 * Members are in event order, one entry per hidden source, each spanning the
 * lateral hull of that source's hidden fragments so components can derive
 * start/end continuity from its coordinates.
 */
interface HiddenSliceGroup<S extends SourceSeg = SourceSeg> extends LateralSpan {
    /** `getSliceKey(hiddenSlices[0])`; changes if the group's first slice changes. */
    key: string;
    hiddenSlices: Slice<S>[];
}
/** What every layout entry point returns, level-limited or pixel-limited. */
interface SliceLayout<S extends SourceSeg = SourceSeg> {
    /** Every slice to mount, including invisible donors; order has no meaning. */
    renderSlices: Slice<S>[];
    /** Exact hidden membership; order has no meaning. */
    hiddenSlices: Slice<S>[];
    /** Laterally sorted logical levels used as the coordinate spatial index. */
    sliceLevels: Slice<S>[][];
    /** A mounted slice is visible exactly when its key has a coordinate here. */
    sliceCoords: Map<string, number>;
    /**
     * Whether every render slice has a measurement, making this layout a fixed
     * point of the current heights: rerunning with the same inputs reproduces
     * it. Measurements themselves may still be re-reported later.
     */
    isSettled: boolean;
}
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
declare function buildLevelLimitedLayout<S extends SourceSeg>(segs: readonly S[], eventOrderStrict: boolean, eventSlicing: boolean, maxLevels: number, moreLinkLevelTax: number, sliceHeights: ReadonlyMap<string, number>): SliceLayout<S>;
/** Deepest measured, coordinated bottom among slices touching the span. */
declare function computeLateralSpanBottom<S extends SourceSeg>(sliceLevels: readonly (readonly Slice<S>[])[], span: LateralSpan, sliceCoords: ReadonlyMap<string, number>, sliceHeights: ReadonlyMap<string, number>): number;
/**
 * Merges strict lateral intersections into groups sorted by lateral start.
 * Each group's hidden slices are event-ordered.
 */
declare function groupLaterallyIntersecting<S extends SourceSeg>(hiddenSlices: readonly Slice<S>[]): HiddenSliceGroup<S>[];
/**
 * Identifies a whole or partial slice derived from a source seg. Partial keys
 * deliberately omit the lateral end so a fragment re-cut at the same start
 * keeps its DOM wrapper. The re-cut fragment transiently reuses the previous
 * cut's measurement, which can mis-prune one pass; the structure still settles
 * because every fragment cut depends only on logical geometry — the same
 * wrapper just re-reports at its new width and the next pass corrects the
 * decision.
 */
declare function getSliceKey<S extends SourceSeg>(slice: Slice<S>): string;
declare function sortByAxisOrder<T extends {
    start: number;
    sourceSeg: {
        orderIndex: number;
    };
}>(items: readonly T[]): T[];

/**
 * Selects print DOM candidates from the complete source list.
 *
 * Print must never inherit the screen candidate frontier: it plans directly
 * from every event-ordered source with unit thickness. The default 200-level
 * cap is an internal safety constant, not a public option.
 */
interface PrintCandidatePlan<S extends SourceSeg = SourceSeg> {
    sliceLevels: Slice<S>[][];
    /** Exact hidden membership, with no ordering guarantee. */
    hiddenSlices: Slice<S>[];
}
declare function planPrintDomCandidates<S extends SourceSeg>(eventOrderedSegs: readonly S[], eventOrderStrict: boolean, eventSlicing: boolean): PrintCandidatePlan<S>;
/**
 * One normal-flow print band backed by a single dimensionless event level.
 *
 * The band is a relatively positioned canvas. Its slices begin at level
 * coordinate zero because they never overlap laterally, while its explicit
 * thickness gives the renderer a page-breakable normal-flow box.
 */
interface PrintEventBand<S extends SourceSeg = SourceSeg> {
    levelIndex: number;
    slices: Slice<S>[];
    /** Tallest current or fallback occupied source thickness in this band. */
    thickness: number;
}
/**
 * Timeline's single final print band for every hidden-slice more link.
 *
 * It renders after all event bands and never counts against the 200 event-level
 * safety cap. Each link starts at `top: 0` within this band canvas: print gives
 * up screen skyline compaction so links paginate together. DayGrid does not
 * use this structure because it prints links outside the event bands.
 */
interface PrintMoreLinkBand<S extends SourceSeg = SourceSeg> {
    moreLinkGroups: readonly HiddenSliceGroup<S>[];
    /** Tallest current or fallback occupied link thickness in this band. */
    thickness: number;
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
declare function buildPrintEventBands<S extends SourceSeg>(levels: readonly (readonly Slice<S>[])[], printEventThicknesses: ReadonlyMap<string, number>, getPrintEventKey?: (slice: Slice<S>) => string, defaultPrintEventThickness?: number): PrintEventBand<S>[];
/** Builds Timeline's one final print more-link band when hidden groups exist. */
declare function buildPrintMoreLinkBand<S extends SourceSeg>(hiddenGroups: readonly HiddenSliceGroup<S>[], printMoreLinkHeights: ReadonlyMap<string, number>): PrintMoreLinkBand<S> | null;

declare const config: any;

interface CoordSpan {
    start: number;
    size: number;
}
interface CoordRange {
    start: number;
    end: number;
}
interface SlicedCoordRange extends CoordRange {
    isStart: boolean;
    isEnd: boolean;
}

declare class DaySeriesModel {
    cnt: number;
    dates: DateMarker[];
    private rangeStart;
    private entries;
    constructor(range: DateRange, dateProfileGenerator: DateProfileGenerator);
    sliceRange(range: DateRange): SlicedCoordRange | null;
    private getDateIndex;
}

interface DayGridRange extends SlicedCoordRange {
    row: number;
}
interface DayTableCell {
    key: string;
    date: DateMarker;
    isMajor: boolean;
    isDisabled: boolean;
    renderProps?: Dictionary;
    attrs?: Dictionary;
    className?: string;
    dateSpanProps?: Dictionary;
}
declare class DayTableModel {
    daySeries: DaySeriesModel;
    private dateEnv;
    private majorUnit;
    private activeRange?;
    rowCount: number;
    colCount: number;
    cellRows: DayTableCell[][];
    headerDates: DateMarker[];
    constructor(daySeries: DaySeriesModel, breakOnWeeks: boolean, dateEnv: DateEnv, majorUnit?: string, activeRange?: DateRange | null);
    buildCells(): any[];
    private buildCell;
    protected cellIsMajor(dateMarker: DateMarker): boolean;
    private buildHeaderDates;
}

interface DayCol {
    key: string;
    date: DateMarker;
    range: DateRange;
    isMajor: boolean;
    isDisabled: boolean;
    renderProps?: Dictionary;
    attrs?: Dictionary;
    className?: string;
    dateSpanProps?: Dictionary;
}
interface DayColSlotRange {
    slotMinTime: Duration;
    slotMaxTime: Duration;
}
interface BuildDayColsConfig {
    slotRange?: DayColSlotRange;
    majorUnit?: string;
    activeRange?: DateRange | null;
}
declare function buildDayCols(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, dateEnv: DateEnv, slotRange?: DayColSlotRange, majorUnit?: string): DayCol[];
declare function buildDayColsFromSeries(daySeries: DaySeriesModel, dateEnv: DateEnv, config?: BuildDayColsConfig): DayCol[];

declare class ScrollListener {
    el: HTMLElement;
    emitter: Emitter<{
        scrollStart: (isDevice: boolean) => void;
        scroll: (isDevice: boolean) => void;
        scrollEnd: (isDevice: boolean) => void;
    }>;
    private wheelWaiter;
    private scrollWaiter;
    private isScroll;
    private isScrollRecent;
    private isWheelRecent;
    private isMouseDown;
    private isTouchDown;
    private isMouse;
    private isTouch;
    private isWheel;
    constructor(el: HTMLElement);
    destroy(): void;
    private startScroll;
    endScroll(): void;
    private getIsDevice;
    private handleScroll;
    private handleScrollWait;
    private handleWheel;
    private handleWheelWait;
    private handleMouseDown;
    private handleMouseUp;
    private handleTouchStart;
    private handleTouchEnd;
}

interface ScrollerProps {
    vertical?: boolean;
    horizontal?: boolean;
    hideScrollbars?: boolean;
    children?: ReactNode;
    clientWidthRef?: Ref<number>;
    clientHeightRef?: Ref<number>;
    bottomScrollbarWidthRef?: Ref<number>;
    className?: string;
    style?: Dictionary;
}
declare class Scroller extends DateComponent<ScrollerProps> implements ScrollerInterface {
    private el?;
    private _isUnmounting;
    listener: ScrollListener;
    private disconnectHRuler?;
    private disconnectVRuler?;
    private clientWidth?;
    private clientHeight?;
    private bottomScrollbarWidth?;
    render(): react_jsx_runtime.JSX.Element;
    handleEl: (el: HTMLDivElement | null) => void;
    handleHRuler: (el: HTMLDivElement | null) => void;
    handleVRuler: (el: HTMLDivElement | null) => void;
    endScroll(): void;
    get x(): number;
    get y(): number;
    scrollTo({ x, y }: {
        x?: number;
        y?: number;
    }): void;
    addScrollStartListener(handler: () => void): void;
    removeScrollStartListener(handler: () => void): void;
    addScrollEndListener(handler: (isDevice: boolean) => void): void;
    removeScrollEndListener(handler: (isDevice: boolean) => void): void;
}

interface SliceableProps {
    dateSelection: DateSpan;
    businessHours: EventStore;
    eventStore: EventStore;
    eventDrag: EventInteractionState | null;
    eventResize: EventInteractionState | null;
    eventSelection: string;
    eventUiBases: EventUiHash;
}
interface SlicedProps<R> {
    fgEventSegs: (R & EventRangeProps)[];
    bgEventSegs: (R & EventRangeProps)[];
    businessHourSegs: (R & EventRangeProps)[];
    dateSelectionSegs: (R & EventRangeProps)[];
    eventDrag: EventSegUiInteractionState<R> | null;
    eventResize: EventSegUiInteractionState<R> | null;
    eventSelection: string;
}
declare abstract class Slicer<R, ExtraArgs extends any[] = []> {
    private sliceBusinessHours;
    private sliceDateSelection;
    private sliceEventStore;
    private sliceEventDrag;
    private sliceEventResize;
    abstract sliceRange(dateRange: DateRange, ...extraArgs: ExtraArgs): R[];
    protected intersectDateSpan(dateSpan: DateSpan, activeRange: DateRange, ...extraArgs: ExtraArgs): DateSpan | null;
    protected sliceDateSpan(dateSpan: DateSpan, ...extraArgs: ExtraArgs): R[];
    protected forceDayIfListItem: boolean;
    sliceProps(props: SliceableProps, dateProfile: DateProfile, nextDayThreshold: Duration | null, context: CalendarContext, ...extraArgs: ExtraArgs): SlicedProps<R>;
    sliceNowDate(// does not memoize
    date: DateMarker, dateProfile: DateProfile, nextDayThreshold: Duration | null, context: CalendarContext, ...extraArgs: ExtraArgs): R[];
    private _sliceBusinessHours;
    private _sliceEventStore;
    private _sliceInteraction;
    private _sliceDateSpan;
    private sliceEventRanges;
    private sliceEventRange;
}

declare function isPropsValid(state: SplittableProps, context: CalendarContext, dateSpanMeta?: {}, filterConfig?: any): boolean;

declare class DelayedRunner {
    private drainedOption?;
    private isRunning;
    private isDirty;
    private pauseDepths;
    private timeoutId;
    constructor(drainedOption?: () => void);
    request(delay?: number): void;
    pause(scope?: string): void;
    resume(scope?: string, force?: boolean): void;
    isPaused(): number;
    tryDrain(): void;
    clear(): void;
    private clearTimeout;
    protected drained(): void;
}

interface RulerProps {
    widthRef: Ref<number>;
}
declare class Ruler extends BaseComponent<RulerProps> {
    private elRef;
    private _isUnmounting;
    private disconnectWidth?;
    render(): react_jsx_runtime.JSX.Element;
    componentDidMount(): void;
    componentWillUnmount(): void;
}

declare class RefMap<K, V> {
    masterCallback?: (val: V, key: K, priorVal: V | null) => void;
    private ignoreDeletes;
    rev: string;
    current: Map<K, V>;
    private callbacks;
    constructor(masterCallback?: (val: V, key: K, priorVal: V | null) => void, ignoreDeletes?: boolean);
    createRef(key: K): (val: V | null) => void;
    handleValue: (val: V, key: K) => void;
}

interface NowTimerProps {
    unit: string;
    unitValue?: number;
    children?: (now: DateMarker, todayRange: DateRange, nowMs: number) => ReactNode;
}
declare class NowTimer extends Component<NowTimerProps> {
    static contextType: any;
    context: ViewContext;
    private runner;
    constructor(props: NowTimerProps, context: ViewContext);
    render(): ReactNode;
    componentWillUnmount(): void;
    private handleChange;
}

interface StandardEventProps {
    elRef?: ElRef;
    attrs?: any;
    className?: string;
    display: 'list-item' | 'row' | 'column';
    eventRange: EventRenderRange;
    slicedStart?: DateMarker;
    slicedEnd?: DateMarker;
    isStart: boolean;
    isEnd: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    isDragging: boolean;
    isResizing: boolean;
    isMirror: boolean;
    isSelected: boolean;
    isPast: boolean;
    isFuture: boolean;
    isToday: boolean;
    disableDragging?: boolean;
    disableResizing?: boolean;
    defaultTimeFormat: DateFormatter;
    defaultDisplayEventTime?: boolean;
    defaultDisplayEventEnd?: boolean;
    isNarrow?: boolean;
    isShort?: boolean;
    level?: number;
    forcedTimeText?: string;
    disableLiquid?: boolean;
    disableZindexes?: boolean;
}
declare class StandardEvent extends BaseComponent<StandardEventProps> {
    private buildPublicEvent;
    private el;
    render(): react_jsx_runtime.JSX.Element;
    handleEl: (el: HTMLElement | null) => void;
    componentDidUpdate(prevProps: StandardEventProps): void;
}

interface NowIndicatorDotProps {
    className?: string;
    style?: any;
}
declare const NowIndicatorDot: (props: NowIndicatorDotProps) => react_jsx_runtime.JSX.Element;

interface BgEventProps {
    eventRange: EventRenderRange;
    isStart: boolean;
    isEnd: boolean;
    isPast: boolean;
    isFuture: boolean;
    isToday: boolean;
    isNarrow?: boolean;
    isShort?: boolean;
    isVertical: boolean;
}
declare class BgEvent extends BaseComponent<BgEventProps> {
    private buildPublicEvent;
    private el;
    render(): react_jsx_runtime.JSX.Element;
    handleEl: (el: HTMLElement | null) => void;
    componentDidUpdate(prevProps: BgEventProps): void;
}
declare function renderFill(fillType: string, options: ViewOptionsRefined): react_jsx_runtime.JSX.Element;

interface MeasuredHeightHarnessProps {
    style: any;
    className?: string;
    children?: ReactNode;
    heightRef?: Ref<number>;
}
declare class MeasuredHeightHarness extends Component<MeasuredHeightHarnessProps> {
    private rootElRef;
    private _isUnmounting;
    private disconnectHeight?;
    private height?;
    render(): react_jsx_runtime.JSX.Element;
    componentDidMount(): void;
    componentDidUpdate(prevProps: MeasuredHeightHarnessProps): void;
    componentWillUnmount(): void;
}

declare const RenderId: react.Context<number>;

interface FooterScrollbarProps {
    isSticky?: boolean;
    canvasWidth: CssDimValue;
    scrollerRef?: Ref<Scroller>;
    scrollbarWidthRef?: Ref<number>;
}
declare class FooterScrollbar extends BaseComponent<FooterScrollbarProps> {
    rootElRef: react.RefObject<HTMLDivElement>;
    private _isUnmounting;
    disconnectHeight?: () => void;
    render(): react_jsx_runtime.JSX.Element;
    componentDidMount(): void;
    componentWillUnmount(): void;
}

interface TimeGridRange {
    col: number;
    startDate: DateMarker;
    endDate: DateMarker;
    isStart: boolean;
    isEnd: boolean;
    showDot?: boolean;
}
declare function organizeSegsByCol<S extends TimeGridRange>(segs: S[] | null, colCount: number): S[][];
declare function splitInteractionByCol(ui: EventSegUiInteractionState<TimeGridRange> | null, colCount: number): EventSegUiInteractionState<TimeGridRange>[];

declare class DayTimeColsSlicer extends Slicer<TimeGridRange, [DateRange[]]> {
    sliceRange(range: DateRange, dayRanges: DateRange[]): TimeGridRange[];
}

declare class AllDaySplitter extends Splitter {
    getKeyInfo(): {
        allDay: {};
        timed: {};
    };
    getKeysForDateSpan(dateSpan: DateSpan): string[];
    getKeysForEventDef(eventDef: EventDef): string[];
}

interface CellRenderConfig<BaseRenderProps, RenderProps = BaseRenderProps> {
    generatorName: string;
    customGenerator: ContentGenerator<RenderProps>;
    innerClassNameGenerator: ClassNameGenerator<RenderProps>;
    classNameGenerator: ClassNameGenerator<RenderProps>;
    didMount: DidMountHandler<RenderProps & {
        el: HTMLElement;
    }>;
    willUnmount: WillUnmountHandler<RenderProps & {
        el: HTMLElement;
    }>;
    align: 'start' | 'center' | 'end' | ((info: {
        level: number;
        inPopover: boolean;
        isNarrow: boolean;
    }) => 'start' | 'center' | 'end');
    sticky: boolean | number | string;
    dayHeaderFormat?: DateFormatter;
    datesRepDistinctDays?: boolean;
}
interface CellDataConfig<RenderProps> {
    key: string;
    dateMarker: DateMarker;
    renderProps: RenderProps;
    className?: string;
    attrs?: any;
    innerAttrs?: any;
    colSpan?: number;
    hasNavLink?: boolean;
}
interface RowConfig<BaseRenderProps, RenderProps = BaseRenderProps> {
    isDateRow: boolean;
    renderConfig: CellRenderConfig<BaseRenderProps, RenderProps>;
    dataConfigs: CellDataConfig<BaseRenderProps>[];
}
interface BaseDayHeaderData extends DateMeta {
    isMajor: DayHeaderInfo['isMajor'];
    isSticky: DayHeaderInfo['isSticky'];
    inPopover: DayHeaderInfo['inPopover'];
    hasNavLink: DayHeaderInfo['hasNavLink'];
    view: DayHeaderInfo['view'];
    [otherProp: string]: any;
}
declare function buildDateRowConfig(dateMarkers: DateMarker[], datesRepDistinctDays: boolean, dateProfile: DateProfile, todayRange: DateRange, dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
context: ViewContext, colSpan?: number, isMajorMod?: number, totalDateCnt?: number): RowConfig<BaseDayHeaderData, DayHeaderInfo>;
declare function buildDateRenderConfig(dayHeaderFormat: DateFormatter, datesRepDistinctDays: boolean, context: ViewContext): CellRenderConfig<BaseDayHeaderData, DayHeaderInfo>;
declare function buildDateDataConfigs(dateMarkers: DateMarker[], datesRepDistinctDays: boolean, dateProfile: DateProfile, todayRange: DateRange, dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
context: ViewContext, colSpan?: number, keyPrefix?: string, extraRenderProps?: Dictionary, // TODO
extraAttrs?: Dictionary, // TODO
className?: string, isMajorMod?: number, totalDateCnt?: number): CellDataConfig<BaseDayHeaderData>[];

interface TimeGridLayoutProps {
    labelId: string | undefined;
    labelStr: string | undefined;
    dateProfile: DateProfile;
    nowDate: DateMarker;
    nowMs?: number;
    todayRange: DateRange;
    cells: DayTableCell[];
    forPrint: boolean;
    isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean;
    className: string;
    headerTiers: RowConfig<any, {
        text: string;
        isDisabled: boolean;
    }>[];
    fgEventSegs: (SlicedCoordRange & EventRangeProps)[];
    bgEventSegs: (SlicedCoordRange & EventRangeProps)[];
    businessHourSegs: (SlicedCoordRange & EventRangeProps)[];
    dateSelectionSegs: (SlicedCoordRange & EventRangeProps)[];
    eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null;
    eventResize: EventSegUiInteractionState<SlicedCoordRange> | null;
    fgEventSegsByCol: (TimeGridRange & EventRangeProps)[][];
    bgEventSegsByCol: (TimeGridRange & EventRangeProps)[][];
    businessHourSegsByCol: (TimeGridRange & EventRangeProps)[][];
    nowIndicatorSegsByCol: TimeGridRange[][];
    dateSelectionSegsByCol: (TimeGridRange & EventRangeProps)[][];
    eventDragByCol: EventSegUiInteractionState<TimeGridRange>[];
    eventResizeByCol: EventSegUiInteractionState<TimeGridRange>[];
    eventSelection: string;
}
declare class TimeGridLayout extends BaseComponent<TimeGridLayoutProps> {
    private buildSlatMetas;
    private dayScrollerRef;
    private timeScrollerRef;
    private slatHeight?;
    private _isUnmounting;
    private currentSlatCnt?;
    private scrollState;
    render(): react_jsx_runtime.JSX.Element;
    componentDidMount(): void;
    componentDidUpdate(prevProps: TimeGridLayoutProps): void;
    componentWillUnmount(): void;
    private handleSlatHeight;
    private resetScroll;
    private handleTimeScrollRequest;
    private handleTimeScrollEnd;
    private applyTimeScroll;
}

declare class DayTableSlicer extends Slicer<DayGridRange, [DayTableModel]> {
    forceDayIfListItem: boolean;
    sliceRange(dateRange: DateRange, dayTableModel: DayTableModel): DayGridRange[];
}
declare class DaySeriesSlicer extends Slicer<DayGridRange, [DaySeriesModel]> {
    forceDayIfListItem: boolean;
    sliceRange(dateRange: DateRange, daySeries: DaySeriesModel): DayGridRange[];
}

declare function buildDayTableModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, dateEnv: DateEnv): DayTableModel;
declare function createDayHeaderFormatter(explicitFormat: DateFormatter, datesRepDistinctDays: boolean, dateCnt: number): DateFormatter;

interface DayGridLayoutProps {
    labelId: string | undefined;
    labelStr: string | undefined;
    dateProfile: DateProfile;
    todayRange: DateRange;
    cellRows: DayTableCell[][];
    forPrint: boolean;
    isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean;
    className: string;
    headerTiers: RowConfig<any, {
        text: string;
        isDisabled: boolean;
    }>[];
    fgEventSegs: (DayGridRange & EventRangeProps)[];
    bgEventSegs: (DayGridRange & EventRangeProps)[];
    businessHourSegs: (DayGridRange & EventRangeProps)[];
    dateSelectionSegs: (DayGridRange & EventRangeProps)[];
    eventDrag: EventSegUiInteractionState<DayGridRange> | null;
    eventResize: EventSegUiInteractionState<DayGridRange> | null;
    eventSelection: string;
}
declare class DayGridLayout extends BaseComponent<DayGridLayoutProps> {
    private scrollerRef;
    private rowHeightRefMap;
    private _isUnmounting;
    private scrollDate;
    render(): react_jsx_runtime.JSX.Element;
    componentDidMount(): void;
    componentDidUpdate(prevProps: DayGridLayoutProps): void;
    componentWillUnmount(): void;
    resetScroll(): void;
    updateScrollY: () => void;
    handleScrollEnd: (isDevice: boolean) => void;
}

export { AllDaySplitter, BgEvent, CellDataConfig, CellRenderConfig, CoordRange, CoordSpan, DEFAULT_UNMEASURED_EVENT_THICKNESS, DayCol, DayColSlotRange, DayGridLayout, DayGridRange, DaySeriesModel, DaySeriesSlicer, DayTableCell, DayTableModel, DayTableSlicer, DayTimeColsSlicer, DelayedRunner, FooterScrollbar, HiddenSliceGroup, MeasuredHeightHarness, NowIndicatorDot, NowTimer, PrintCandidatePlan, PrintEventBand, PrintMoreLinkBand, RefMap, RenderId, RowConfig, Ruler, Scroller, Slice, SlicedCoordRange, SlicedProps, Slicer, SourceSeg, StandardEvent, TimeGridLayout, TimeGridRange, afterSize, applyStyleProp, buildDateDataConfigs, buildDateRenderConfig, buildDateRowConfig, buildDayCols, buildDayColsFromSeries, buildDayTableModel, buildLevelLimitedLayout, buildNavLinkAttrs, buildPrintEventBands, buildPrintMoreLinkBand, computeEdges, computeElIsRtl, computeInnerRect, computeLateralSpanBottom, computeVisibleDayRange, config, createDayHeaderFormatter, debounce, filterHash, getSliceKey, groupLaterallyIntersecting, isArraysEqual, isPropsEqualShallow, isPropsValid, joinFuncishClassNames, mapHash, memoize, memoizeObjArg, mergeCalendarOptions, mergeContentInjectors, mergeLifecycleCallbacks, mergeViewOptionsMap, organizeSegsByCol, planPrintDomCandidates, removeExact, renderFill, sortByAxisOrder, splitInteractionByCol, unpromisify, warn, watchHeight, watchSize, watchWidth };
