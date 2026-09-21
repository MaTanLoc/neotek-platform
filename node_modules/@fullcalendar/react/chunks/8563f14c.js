import { j as isArraysEqual, u as isPropsEqualShallow, K as isPropsEqualWithMap, g as guid } from './1b9384f3.js';
import { createContext, Component, isValidElement, createElement } from 'react';
import { b as isNonHandlerPropsEqual } from './6906802e.js';
import { j as joinClassNames } from './e3a08dde.js';
import { createDuration, startOfDay, addDays } from '@full-ui/headless-calendar';
import { flushSync } from 'react-dom';

function memoize(workerFunc, resEquality, teardownFunc) {
    let currentArgs;
    let currentRes;
    return function (...newArgs) {
        if (!currentArgs) {
            currentRes = workerFunc.apply(this, newArgs);
        }
        else if (!isArraysEqual(currentArgs, newArgs)) {
            if (teardownFunc) {
                teardownFunc(currentRes);
            }
            let res = workerFunc.apply(this, newArgs);
            if (!resEquality || !resEquality(res, currentRes)) {
                currentRes = res;
            }
        }
        currentArgs = newArgs;
        return currentRes;
    };
}
function memoizeObjArg(workerFunc, resEquality, teardownFunc) {
    let currentArg;
    let currentRes;
    return (newArg) => {
        if (!currentArg) {
            currentRes = workerFunc.call(this, newArg);
        }
        else if (!isPropsEqualShallow(currentArg, newArg)) {
            if (teardownFunc) {
                teardownFunc(currentRes);
            }
            let res = workerFunc.call(this, newArg);
            if (!resEquality || !resEquality(res, currentRes)) {
                currentRes = res;
            }
        }
        currentArg = newArg;
        return currentRes;
    };
}

const ViewContextType = createContext({}); // for Components
function buildViewContext(viewSpec, viewApi, viewOptions, dateProfileGenerator, dateEnv, nowManager, pluginHooks, dispatch, getCurrentData, emitter, calendarApi, baseId, registerInteractiveComponent, unregisterInteractiveComponent) {
    return {
        dateEnv,
        nowManager,
        options: viewOptions,
        pluginHooks,
        emitter,
        dispatch,
        getCurrentData,
        calendarApi,
        viewSpec,
        viewApi,
        dateProfileGenerator,
        baseId,
        registerInteractiveComponent,
        unregisterInteractiveComponent,
    };
}

/* eslint max-classes-per-file: off */
class PureComponent extends Component {
    // debug: boolean
    shouldComponentUpdate(nextProps, nextState) {
        return !isPropsEqualWithMap(this.props, nextProps, this.propEquality /*, this.debug && 'props' */) ||
            !isPropsEqualWithMap(this.state, nextState, this.stateEquality /*, this.debug && 'state' */);
    }
}
PureComponent.addPropsEquality = addPropsEquality;
PureComponent.addStateEquality = addStateEquality;
PureComponent.contextType = ViewContextType;
PureComponent.prototype.propEquality = {};
PureComponent.prototype.stateEquality = {};
class BaseComponent extends PureComponent {
}
BaseComponent.contextType = ViewContextType;
function addPropsEquality(propEquality) {
    let hash = Object.create(this.prototype.propEquality);
    Object.assign(hash, propEquality);
    this.prototype.propEquality = hash;
}
function addStateEquality(stateEquality) {
    let hash = Object.create(this.prototype.stateEquality);
    Object.assign(hash, stateEquality);
    this.prototype.stateEquality = hash;
}
// use other one
function setRef(ref, current) {
    if (typeof ref === 'function') {
        ref(current);
    }
    else if (ref) {
        // see https://github.com/facebook/react/issues/13029
        ref.current = current;
    }
}

class ContentInjector extends BaseComponent {
    constructor() {
        super(...arguments);
        this.id = guid();
        this.queuedDomNodes = [];
        this.currentDomNodes = [];
        this.handleEl = (el) => {
            this.el = el;
            if (this.props.elRef) {
                setRef(this.props.elRef, el);
            }
        };
    }
    render() {
        const { props, context } = this;
        const { options } = context;
        const { customGenerator, defaultGenerator, renderProps } = props;
        const attrs = buildElAttrs(props, '', this.handleEl);
        let useDefault = false;
        let innerContent;
        let queuedDomNodes = [];
        let currentGeneratorMeta;
        if (customGenerator != null) {
            const customGeneratorRes = typeof customGenerator === 'function' ?
                customGenerator(renderProps) :
                customGenerator;
            if (customGeneratorRes === true) {
                useDefault = true;
                // NOTE: see how mergeContentInjectors also uses `true` to signal useDefault
            }
            else {
                const isObject = customGeneratorRes && typeof customGeneratorRes === 'object'; // non-null
                if (isObject && ('html' in customGeneratorRes)) {
                    attrs.dangerouslySetInnerHTML = { __html: customGeneratorRes.html };
                }
                else if (isObject && ('domNodes' in customGeneratorRes)) {
                    queuedDomNodes = Array.prototype.slice.call(customGeneratorRes.domNodes);
                }
                else if (isObject
                    ? isValidElement(customGeneratorRes) // vdom node
                    : typeof customGeneratorRes !== 'function' // primitive value (like string or number)
                ) {
                    // use in vdom
                    innerContent = customGeneratorRes;
                }
                else {
                    // an exotic object for handleCustomRendering
                    currentGeneratorMeta = customGeneratorRes;
                }
            }
        }
        else {
            useDefault = !hasCustomRenderingHandler(props.generatorName, options);
        }
        if (useDefault && defaultGenerator) {
            innerContent = defaultGenerator(renderProps);
        }
        this.queuedDomNodes = queuedDomNodes;
        this.currentGeneratorMeta = currentGeneratorMeta;
        return createElement(props.tag, attrs, innerContent);
    }
    componentDidMount() {
        this.applyQueueudDomNodes();
        this.triggerCustomRendering(true);
    }
    componentDidUpdate() {
        this.applyQueueudDomNodes();
        this.triggerCustomRendering(true);
    }
    componentWillUnmount() {
        this.triggerCustomRendering(false); // TODO: different API for removal?
    }
    triggerCustomRendering(isActive) {
        const { props, context } = this;
        const { handleCustomRendering, customRenderingMetaMap } = context.options;
        if (handleCustomRendering) {
            const generatorMeta = this.currentGeneratorMeta ??
                customRenderingMetaMap?.[props.generatorName];
            if (generatorMeta) {
                handleCustomRendering({
                    id: this.id,
                    isActive,
                    containerEl: this.el,
                    generatorMeta,
                    renderProps: props.renderProps,
                });
            }
        }
    }
    applyQueueudDomNodes() {
        const { queuedDomNodes, currentDomNodes } = this;
        const { el } = this;
        if (!isArraysEqual(queuedDomNodes, currentDomNodes)) {
            for (const domNode of currentDomNodes) {
                domNode.remove();
            }
            for (let newNode of queuedDomNodes) {
                el.appendChild(newNode);
            }
            this.currentDomNodes = queuedDomNodes;
        }
    }
}
ContentInjector.addPropsEquality({
    renderProps: isPropsEqualShallow,
    attrs: isNonHandlerPropsEqual,
    style: isPropsEqualShallow,
});
// Util
/*
Does UI-framework provide custom way of rendering that does not use Preact VDOM
AND does the calendar's options define custom rendering?
AKA. Should we NOT render the default content?
*/
function hasCustomRenderingHandler(generatorName, options) {
    return Boolean(options.handleCustomRendering &&
        generatorName &&
        options.customRenderingMetaMap?.[generatorName]);
}
function buildElAttrs(props, className, elRef) {
    const attrs = { ...props.attrs, ref: elRef };
    if (props.className || className) {
        attrs.className = joinClassNames(className, props.className, attrs.className);
    }
    if (props.style) {
        attrs.style = props.style;
    }
    return attrs;
}

const RenderId = createContext(0);

class ContentContainer extends Component {
    constructor() {
        super(...arguments);
        this.InnerContent = InnerContentInjector.bind(undefined, this);
        this.handleEl = (el) => {
            this.el = el;
            if (this.props.elRef) {
                setRef(this.props.elRef, el);
                if (el && this.didMountMisfire) {
                    this.componentDidMount();
                }
            }
        };
    }
    render() {
        const { props } = this;
        const generatedClassName = generateClassName(props.classNameGenerator, props.renderProps);
        if (props.children) {
            const attrs = buildElAttrs(props, generatedClassName, this.handleEl);
            const children = props.children(this.InnerContent, props.renderProps, attrs);
            if (props.tag) {
                return createElement(props.tag, attrs, children);
            }
            else {
                return children;
            }
        }
        else {
            return createElement((ContentInjector), {
                ...props,
                elRef: this.handleEl,
                tag: props.tag || 'div',
                className: joinClassNames(props.className, generatedClassName),
                renderId: this.context,
            });
        }
    }
    componentDidMount() {
        if (this.el) {
            this.props.didMount?.({
                ...this.props.renderProps,
                el: this.el,
            });
        }
        else {
            this.didMountMisfire = true;
        }
    }
    componentWillUnmount() {
        this.props.willUnmount?.({
            ...this.props.renderProps,
            el: this.el,
        });
    }
}
ContentContainer.contextType = RenderId;
function InnerContentInjector(containerComponent, props) {
    const parentProps = containerComponent.props;
    return createElement((ContentInjector), {
        renderProps: parentProps.renderProps,
        generatorName: parentProps.generatorName,
        customGenerator: parentProps.customGenerator,
        defaultGenerator: parentProps.defaultGenerator,
        renderId: containerComponent.context,
        ...props,
    });
}
// Utils
function generateClassName(classNameGenerator, renderProps) {
    return (typeof classNameGenerator === 'function' ?
        classNameGenerator(renderProps) :
        classNameGenerator) || ''; // handles undefined
}
function renderText(renderProps) {
    return renderProps.text;
}

function getIsHeightAuto(options) {
    return options.height === 'auto' || options.contentHeight === 'auto';
}
function getTableHeaderSticky(options) {
    let { tableHeaderSticky } = options;
    if (tableHeaderSticky == null || tableHeaderSticky === 'auto') {
        tableHeaderSticky = getIsHeightAuto(options);
    }
    return tableHeaderSticky;
}
function getFooterScrollbarSticky(options) {
    const isHeightAuto = getIsHeightAuto(options);
    let { footerScrollbarSticky } = options;
    if (footerScrollbarSticky == null || footerScrollbarSticky === 'auto') {
        footerScrollbarSticky = isHeightAuto;
    }
    return Boolean(footerScrollbarSticky) && isHeightAuto;
}
function getScrollerSyncerClass(pluginHooks) {
    const ScrollerSyncer = pluginHooks.scrollerSyncerClass;
    if (!ScrollerSyncer) {
        throw new RangeError('Must import @fullcalendar/scrollgrid');
    }
    return ScrollerSyncer;
}

class NowTimerRunner {
    constructor(handleChange) {
        this.handleChange = handleChange;
        this.isMounted = false;
        this.handleRefresh = () => {
            let timing = this.computeTiming();
            if (timing.nowDate.valueOf() !== this.nowDate.valueOf() ||
                timing.nowMs !== this.nowMs // marker alone can't detect fold-hour changes
            ) {
                this.nowDate = timing.nowDate;
                this.nowMs = timing.nowMs;
                this.todayRange = timing.todayRange;
                this.handleChange();
            }
            this.clearTimeout();
            this.setTimeout(timing.waitMs);
        };
        this.handleVisibilityChange = () => {
            if (!document.hidden) {
                this.handleRefresh();
            }
        };
    }
    update(input) {
        if (!this.isMounted) {
            this.isMounted = true;
            // init inputs
            this.unit = input.unit;
            this.unitValue = input.unitValue;
            this.nowIndicatorSnap = input.nowIndicatorSnap;
            this.nowManager = input.nowManager;
            this.dateEnv = input.dateEnv;
            // init outputs
            const timing = this.computeTiming();
            this.nowDate = timing.nowDate;
            this.nowMs = timing.nowMs;
            this.todayRange = timing.todayRange;
            // init listeners
            this.setTimeout(timing.waitMs);
            this.nowManager.addResetListener(this.handleRefresh);
            // fired tab becomes visible after being hidden
            // SSR check. CalendarDataManager calls top-level sync :(
            if (typeof document !== 'undefined') {
                document.addEventListener('visibilitychange', this.handleVisibilityChange);
            }
        }
        else if (input.unit !== this.unit ||
            input.unitValue !== this.unitValue ||
            input.nowIndicatorSnap !== this.nowIndicatorSnap ||
            input.nowManager !== this.nowManager ||
            input.dateEnv !== this.dateEnv) {
            // update inputs
            this.unit = input.unit;
            this.unitValue = input.unitValue;
            this.nowIndicatorSnap = input.nowIndicatorSnap;
            this.nowManager = input.nowManager;
            this.dateEnv = input.dateEnv;
            // recompute outputs — a dateEnv (timezone) change re-projects the same exact "now"
            // to a different civil time. (the nowManager reset listener can't do this: it fires
            // before this runner receives the new dateEnv, so it recomputes with the old one)
            const timing = this.computeTiming();
            this.nowDate = timing.nowDate;
            this.nowMs = timing.nowMs;
            this.todayRange = timing.todayRange;
            this.clearTimeout();
            this.setTimeout(timing.waitMs);
        }
        return {
            nowDate: this.nowDate,
            nowMs: this.nowMs,
            todayRange: this.todayRange,
        };
    }
    destroy() {
        if (this.isMounted) {
            this.isMounted = false;
            this.clearTimeout();
            this.nowManager.removeResetListener(this.handleRefresh);
            // SSR check. CalendarDataManager calls top-level sync :(
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            }
        }
    }
    computeTiming() {
        let { unit, unitValue, nowIndicatorSnap, dateEnv } = this;
        let unroundedNowMs = this.nowManager.getEpochMs();
        let unroundedNow = dateEnv.timestampToMarker(unroundedNowMs);
        if (nowIndicatorSnap === 'auto') {
            nowIndicatorSnap =
                // large unit?
                /year|month|week|day/.test(unit) ||
                    // if slotDuration 30 mins for example, would NOT appear to snap (legacy behavior)
                    (unitValue || 1) === 1;
        }
        let nowDate;
        let nowMs;
        let waitMs;
        if (nowIndicatorSnap) {
            nowDate = dateEnv.startOf(unroundedNow, unit); // aka currentUnitStart
            nowMs = resolveSnappedInstant(nowDate, unroundedNowMs, dateEnv);
            let nextUnitStart = dateEnv.add(nowDate, createDuration(1, unit));
            waitMs = resolveNextSnappedInstant(nextUnitStart, unroundedNowMs, dateEnv) - unroundedNowMs;
        }
        else {
            nowDate = unroundedNow;
            nowMs = unroundedNowMs;
            waitMs = 1000 * 60; // 1 minute
        }
        // there is a max setTimeout ms value (https://stackoverflow.com/a/3468650/96342)
        // ensure no longer than a day
        waitMs = Math.min(1000 * 60 * 60 * 24, waitMs);
        return {
            nowDate,
            nowMs,
            todayRange: buildDayRange(nowDate),
            waitMs,
        };
    }
    setTimeout(waitMs = this.computeTiming().waitMs) {
        // NOTE: timeout could take longer than expected if tab sleeps,
        // which is why we listen to 'visibilitychange'
        this.timeoutId = setTimeout(() => {
            // NOTE: timeout could also return *earlier* than expected, and we need to wait like 2 ms more
            // This is why use use same waitMs from computeTiming
            const timing = this.computeTiming();
            this.nowDate = timing.nowDate;
            this.nowMs = timing.nowMs;
            this.todayRange = timing.todayRange;
            this.handleChange();
            this.setTimeout(timing.waitMs);
        }, waitMs);
    }
    clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }
}
/*
The instant of `snappedMarker` (a civil rounding of the time at `rawMs`), choosing the
occurrence on the same side of any DST transition as `rawMs` — during a fall-back fold, a
snapped civil time exists twice. Falls back to deterministic first-occurrence resolution
when the same-offset guess doesn't round-trip (e.g. snapping crossed the transition).
*/
function resolveSnappedInstant(snappedMarker, rawMs, dateEnv) {
    const offsetMs = dateEnv.timestampToMarker(rawMs).valueOf() - rawMs;
    const candidateMs = snappedMarker.valueOf() - offsetMs;
    if (dateEnv.timestampToMarker(candidateMs).valueOf() === snappedMarker.valueOf()) {
        return candidateMs;
    }
    return dateEnv.toDate(snappedMarker).valueOf();
}
/*
The instant of the next change to the snapped display: the next civil unit boundary, or any
DST transition before it — at a fall-back transition the clock jumps backward onto an earlier
unit start (no civil boundary is crossed), and waking there recomputes with fresh offsets, so
boundaries beyond a transition never need resolving here. Scenarios (NY fall-back, hour unit):
first fold pass (05:30Z): guess for 02:00 fails round-trip → falls back to 07:00Z; transition
06:00Z wins. Second pass (06:30Z): guess 07:00Z round-trips; no transition ahead. Spring
forward: the nonexistent next unit normalizes past the gap; the transition candidate fires at
the jump itself.
*/
function resolveNextSnappedInstant(nextUnitStart, rawMs, dateEnv) {
    const nextSnappedMs = resolveSnappedInstant(nextUnitStart, rawMs, dateEnv);
    const transitionMs = findNextOffsetTransitionMs(rawMs, dateEnv, Math.min(nextSnappedMs - rawMs, 48 * 60 * 60 * 1000));
    return transitionMs != null ? Math.min(nextSnappedMs, transitionMs) : nextSnappedMs;
}
// Finds the first instant whose UTC offset differs from rawMs within a short search horizon.
function findNextOffsetTransitionMs(rawMs, dateEnv, horizonMs) {
    if (horizonMs <= 0) {
        return undefined;
    }
    const startOffsetMs = offsetAt(rawMs, dateEnv);
    let lowerMs = rawMs;
    let upperMs = rawMs + horizonMs;
    if (offsetAt(upperMs, dateEnv) === startOffsetMs) {
        return undefined;
    }
    while (upperMs - lowerMs > 1) {
        const middleMs = Math.floor((lowerMs + upperMs) / 2);
        if (offsetAt(middleMs, dateEnv) === startOffsetMs) {
            lowerMs = middleMs;
        }
        else {
            upperMs = middleMs;
        }
    }
    return upperMs > rawMs ? upperMs : undefined;
}
function offsetAt(instantMs, dateEnv) {
    return dateEnv.timestampToMarker(instantMs).valueOf() - instantMs;
}
function buildDayRange(date) {
    let start = startOfDay(date);
    let end = addDays(start, 1);
    return { start, end };
}

function isDimsEqual(v0, v1) {
    return v0 != null && (v0 === v1 || Math.abs(v0 - v1) < 0.01);
}

const nativeBorderBoxEnabled = true;
const configMap = new Map();
const afterSizeCallbacks = new Set();
let isHandling = false;
let isStalling = false;
let isAcquiringImmediately = false;
function afterSize(callback) {
    afterSizeCallbacks.add(callback);
    // batch & then flush when not within ResizeObserver handler loop
    // happens for watchers that die and report `null` as dimension
    if (!isHandling && !isStalling) {
        isStalling = true;
        requestAnimationFrame(() => {
            isStalling = false;
            flushAfterSize();
        });
    }
}
function flushAfterSize() {
    for (const flushedCallback of afterSizeCallbacks.values()) {
        afterSizeCallbacks.delete(flushedCallback);
        flushedCallback();
    }
}
/*
Commits synchronously while switching every watcher registered during the
commit to immediate acquisition: registration reads getBoundingClientRect()
on the spot and fires the callback before returning, instead of waiting for
the shared ResizeObserver's later delivery. This is the "measure now" path
required when print-only DOM mounts during the native beforeprint task —
observer delivery would arrive after the browser has already snapshotted.
(gBCR reflects transforms while the observer's border-box does not; for
print DOM that distinction is acceptable. Once components go functional, a
`useElementSize`-style hook performs this same acquire-then-observe.)

The afterSize work those callbacks (and any watcher deaths) queue
accumulates and drains ONCE after the commit, not once per registration —
so a commit mounting N measured wrappers costs one layout recomputation,
not N. The drain runs in its own flushSync so handler state updates still
settle within the calling task; additions made while draining are picked up
by the same loop. Preact flushes mount lifecycles after the root diff, so
the reads don't interleave with the commit's DOM writes.

Adopt this bracket a la carte, only for commits whose entire mounted-watcher
population tolerates a synchronous first report (currently: entering print
mode). Ordinary watchSize callers everywhere else keep their async-first
ResizeObserver semantics.
*/
function flushSyncWithSizeBatching(callback) {
    const wasHandling = isHandling;
    isHandling = true;
    isAcquiringImmediately = true;
    try {
        flushSync(callback);
        if (!wasHandling) {
            flushSync(() => {
                flushAfterSize();
                isHandling = false; // before drain's own commit, so late afterSize calls schedule a flush
            });
        }
    }
    finally {
        isHandling = wasHandling;
        isAcquiringImmediately = false;
    }
}
// Native
// -------------------------------------------------------------------------------------------------
// Single global ResizeObserver does batching and uses less memory than individuals
// Will always fire with delay after DOM mutation, but before repaint,
// thus doesn't need !isHandling check like checkConfigMap
const globalResizeObserver = typeof ResizeObserver !== 'undefined' && new ResizeObserver((entries) => {
    isHandling = true;
    // // debug
    // console.log('RESIZE-OBSERVER', entries.map((entry) => entry.target))
    for (let entry of entries) {
        const el = entry.target;
        const config = configMap.get(el);
        let width;
        let height;
        if (entry.borderBoxSize && nativeBorderBoxEnabled) {
            const borderBoxSize = entry.borderBoxSize[0] || entry.borderBoxSize; // HACK for Firefox
            width = borderBoxSize.inlineSize;
            height = borderBoxSize.blockSize;
        }
        else {
            ({ width, height } = el.getBoundingClientRect());
        }
        let shouldFire = false;
        if (!isDimsEqual(config.width, width)) {
            config.width = width;
            shouldFire = config.watchWidth;
        }
        if (!isDimsEqual(config.height, height)) {
            config.height = height;
            shouldFire || (shouldFire = config.watchHeight);
        }
        if (shouldFire) {
            config.callback(width, height);
        }
    }
    flushSync(() => {
        flushAfterSize();
        isHandling = false;
    });
});
/*
PRECONDITION: element can only have one listener attached
*/
function watchSize(el, callback, watchWidth = true, watchHeight = true) {
    const config = { callback, watchWidth, watchHeight };
    configMap.set(el, config);
    // within a flushSyncWithSizeBatching commit; see its comment.
    // the stored dims dedupe the observer's later initial delivery.
    if (isAcquiringImmediately) {
        const { width, height } = el.getBoundingClientRect();
        config.width = width;
        config.height = height;
        callback(width, height);
    }
    // if statement is for jsdom and other shim environments that execute component effects, but
    // haven't implemented ResizeObserver. Reference: https://github.com/jsdom/jsdom/issues/3368
    if (globalResizeObserver) {
        globalResizeObserver.observe(el, {
            box: 'border-box'
                 // default is 'content-box'
        });
    }
    return () => {
        configMap.delete(el);
        // same reasoning as above
        if (globalResizeObserver) {
            globalResizeObserver.unobserve(el);
        }
    };
}
function watchWidth(el, callback) {
    return watchSize(el, callback, 
    /* watchWidth = */ true);
}
function watchHeight(el, callback) {
    return watchSize(el, (_width, height) => callback(height), 
    /* watchWidth = */ false, 
    /* watchHeight = */ true);
}

export { BaseComponent as B, ContentContainer as C, NowTimerRunner as N, PureComponent as P, RenderId as R, ViewContextType as V, generateClassName as a, memoizeObjArg as b, buildViewContext as c, afterSize as d, watchWidth as e, flushSyncWithSizeBatching as f, getIsHeightAuto as g, watchSize as h, isDimsEqual as i, getTableHeaderSticky as j, getFooterScrollbarSticky as k, getScrollerSyncerClass as l, memoize as m, renderText as r, setRef as s, watchHeight as w };
