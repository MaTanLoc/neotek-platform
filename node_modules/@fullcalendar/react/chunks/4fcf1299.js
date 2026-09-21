import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { B as BaseComponent, s as setRef, g as getIsHeightAuto, j as getTableHeaderSticky, a as generateClassName, w as watchHeight, k as getFooterScrollbarSticky, l as getScrollerSyncerClass, d as afterSize } from './8563f14c.js';
import { l as DayGridHeaderRows, h as DayGridLayoutPrint, j as DayGridRows, g as Ruler, k as dayMicroWidth, m as computeColWidth, R as RefMap, n as computeTopFromDate } from './9631f043.js';
import { d as Scroller, V as ViewContainer } from './bdcb9f0b.js';
import { j as joinClassNames } from './e3a08dde.js';
import { createRef } from 'react';
import { c as classNames } from './f408d713.js';
import { k as computeViewBorderless } from './1b9384f3.js';

/*
Used only for screen rendering. Print places DayGridHeaderRows directly inside a table header.
*/
class DayGridHeader extends BaseComponent {
    render() {
        const { props } = this;
        return (jsx("div", { role: 'rowgroup', className: joinClassNames(props.className, classNames.flexCol, props.width == null && classNames.liquid), style: {
                width: props.width,
            }, children: jsx(DayGridHeaderRows, { headerTiers: props.headerTiers, colWidth: props.colWidth, viewportWidth: props.viewportWidth, cellIsNarrow: props.cellIsNarrow, cellIsMicro: props.cellIsMicro }) }));
    }
}

class DayGridLayoutNormal extends BaseComponent {
    constructor() {
        super(...arguments);
        this.state = {};
        this.handleScroller = (scroller) => {
            setRef(this.props.scrollerRef, scroller);
        };
        this.handleTotalWidth = (totalWidth) => {
            if (this._isUnmounting)
                return;
            this.setState({ totalWidth });
        };
        this.handleClientWidth = (clientWidth) => {
            if (this._isUnmounting)
                return;
            this.setState({ clientWidth });
        };
    }
    render() {
        const { props, state, context } = this;
        const { options } = context;
        const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options);
        const { totalWidth, clientWidth } = state;
        let endScrollbarWidth = (totalWidth != null && clientWidth != null)
            ? totalWidth - clientWidth
            : undefined;
        // HACK when clientWidth does NOT include body-border, compared to totalWidth
        if (endScrollbarWidth < 3) {
            endScrollbarWidth = 0;
        }
        const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options);
        const tableHeaderSticky = !props.forPrint && getTableHeaderSticky(options);
        const colCount = props.cellRows[0].length;
        const measuredColWidth = clientWidth != null ? clientWidth / colCount : undefined;
        const cellIsMicro = measuredColWidth != null && measuredColWidth <= dayMicroWidth;
        const cellIsNarrow = cellIsMicro || (measuredColWidth != null && measuredColWidth <= options.dayNarrowWidth);
        if (props.forPrint) {
            return (jsx(DayGridLayoutPrint, { dateProfile: props.dateProfile, todayRange: props.todayRange, cellRows: props.cellRows, headerTiers: props.headerTiers, showHeader: Boolean(options.dayHeaders), fgEventSegs: props.fgEventSegs, bgEventSegs: props.bgEventSegs, businessHourSegs: props.businessHourSegs, eventSelection: props.eventSelection, dayMaxEventRows: options.dayMaxEventRows, borderlessX: borderlessX, borderlessTop: borderlessTop, borderlessBottom: borderlessBottom, multiMonthColumns: 0, visibleWidth: totalWidth, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro, rowHeightRefMap: props.rowHeightRefMap }));
        }
        return (jsxs(Fragment, { children: [options.dayHeaders && (jsxs("div", { className: joinClassNames(generateClassName(options.tableHeaderClass, {
                        isSticky: tableHeaderSticky,
                        borderlessX,
                        borderlessTop,
                        borderlessBottom,
                        multiMonthColumns: 0,
                    }), classNames.flexCol, tableHeaderSticky && classNames.tableHeaderSticky), children: [jsxs("div", { className: classNames.flexRow, children: [jsx(DayGridHeader, { headerTiers: props.headerTiers, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro }), Boolean(endScrollbarWidth) && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: true }), classNames.borderlessY, classNames.borderlessEnd), style: { minWidth: endScrollbarWidth } }))] }), jsx("div", { className: generateClassName(options.dayHeaderDividerClass, {
                                isSticky: tableHeaderSticky,
                                multiMonthColumns: 0,
                                options: { allDaySlot: Boolean(options.allDaySlot) },
                            }) })] })), jsx(Scroller, { vertical: verticalScrollbars, className: joinClassNames(generateClassName(options.tableBodyClass, {
                        borderlessX,
                        borderlessTop,
                        borderlessBottom,
                        multiMonthColumns: 0,
                    }), 
                    // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
                    // https://stackoverflow.com/a/60256345
                    !props.forPrint && classNames.flexCol, verticalScrollbars && classNames.liquid), ref: this.handleScroller, clientWidthRef: this.handleClientWidth, children: jsx(DayGridRows, { dateProfile: props.dateProfile, todayRange: props.todayRange, cellRows: props.cellRows, forPrint: props.forPrint, isHitComboAllowed: props.isHitComboAllowed, className: classNames.grow, dayMaxEvents: props.forPrint ? undefined : options.dayMaxEvents, dayMaxEventRows: options.dayMaxEventRows, 
                        // content
                        fgEventSegs: props.fgEventSegs, bgEventSegs: props.bgEventSegs, businessHourSegs: props.businessHourSegs, dateSelectionSegs: props.dateSelectionSegs, eventDrag: props.eventDrag, eventResize: props.eventResize, eventSelection: props.eventSelection, 
                        // dimensions
                        visibleWidth: totalWidth, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro, 
                        // refs
                        rowHeightRefMap: props.rowHeightRefMap }) }), jsx(Ruler, { widthRef: this.handleTotalWidth })] }));
    }
    componentDidMount() {
        this._isUnmounting = false;
    }
    componentWillUnmount() {
        this._isUnmounting = true;
    }
}

class FooterScrollbar extends BaseComponent {
    constructor() {
        super(...arguments);
        this.rootElRef = createRef();
    }
    render() {
        const { props } = this;
        // NOTE: we need a wrapper around the Scroller because if scrollbars appear/hide,
        // the outer dimensions change, but the inner dimensions do not. The Scroller's
        // dimension-watching, when used in ponyfill-mode, can't fire on border-box change, so we
        // workaround it by monitoring dimensions of a wrapper instead
        return (jsx("div", { ref: this.rootElRef, className: joinClassNames(classNames.footerScrollbar, props.isSticky && classNames.footerScrollbarSticky), children: jsx(Scroller, { horizontal: true, ref: props.scrollerRef, children: jsx("div", { style: { minWidth: props.canvasWidth } }) }) }));
    }
    componentDidMount() {
        this._isUnmounting = false;
        this.disconnectHeight = watchHeight(this.rootElRef.current, (height) => {
            if (this._isUnmounting)
                return;
            setRef(this.props.scrollbarWidthRef, height);
        });
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.disconnectHeight();
        setRef(this.props.scrollbarWidthRef, null);
    }
}

class DayGridLayoutPannable extends BaseComponent {
    constructor() {
        super(...arguments);
        this.state = {};
        this.headerScrollerRef = createRef();
        this.bodyScrollerRef = createRef();
        this.footerScrollerRef = createRef();
        // Sizing
        // -----------------------------------------------------------------------------------------------
        this.handleTotalWidth = (totalWidth) => {
            if (this._isUnmounting)
                return;
            this.setState({ totalWidth });
        };
        this.handleClientWidth = (clientWidth) => {
            if (this._isUnmounting)
                return;
            this.setState({ clientWidth });
        };
    }
    render() {
        const { props, state, context } = this;
        const { options } = context;
        const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options);
        const { totalWidth, clientWidth } = state;
        const endScrollbarWidth = (totalWidth != null && clientWidth != null)
            ? totalWidth - clientWidth
            : undefined;
        const verticalScrollbars = !props.forPrint && !getIsHeightAuto(options);
        const tableHeaderSticky = !props.forPrint && getTableHeaderSticky(options);
        const footerScrollbarSticky = !props.forPrint && getFooterScrollbarSticky(options);
        const colCount = props.cellRows[0].length;
        const [canvasWidth, appliedColWidth] = computeColWidth(colCount, props.dayMinWidth, clientWidth);
        const measuredColWidth = appliedColWidth ?? (clientWidth != null ? clientWidth / colCount : undefined);
        const cellIsMicro = measuredColWidth != null && measuredColWidth <= dayMicroWidth;
        const cellIsNarrow = cellIsMicro || (measuredColWidth != null && measuredColWidth <= options.dayNarrowWidth);
        if (props.forPrint) {
            return (jsx(DayGridLayoutPrint, { dateProfile: props.dateProfile, todayRange: props.todayRange, cellRows: props.cellRows, headerTiers: props.headerTiers, showHeader: Boolean(options.dayHeaders), fgEventSegs: props.fgEventSegs, bgEventSegs: props.bgEventSegs, businessHourSegs: props.businessHourSegs, eventSelection: props.eventSelection, dayMaxEventRows: options.dayMaxEventRows, borderlessX: borderlessX, borderlessTop: borderlessTop, borderlessBottom: borderlessBottom, multiMonthColumns: 0, visibleWidth: totalWidth, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro, rowHeightRefMap: props.rowHeightRefMap }));
        }
        return (jsxs(Fragment, { children: [options.dayHeaders && (jsxs("div", { className: joinClassNames(generateClassName(options.tableHeaderClass, {
                        isSticky: tableHeaderSticky,
                        borderlessX,
                        borderlessTop,
                        borderlessBottom,
                        multiMonthColumns: 0,
                    }), classNames.flexCol, tableHeaderSticky && classNames.tableHeaderSticky), children: [jsxs(Scroller, { horizontal: true, hideScrollbars: true, className: classNames.flexRow, ref: this.headerScrollerRef, children: [jsx(DayGridHeader, { headerTiers: props.headerTiers, colWidth: appliedColWidth, viewportWidth: clientWidth, width: canvasWidth, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro }), Boolean(endScrollbarWidth) && (jsx("div", { className: joinClassNames(generateClassName(options.fillerClass, { inTableHeader: true }), classNames.borderlessY, classNames.borderlessEnd), style: { minWidth: endScrollbarWidth } }))] }), jsx("div", { className: generateClassName(options.dayHeaderDividerClass, {
                                isSticky: tableHeaderSticky,
                                multiMonthColumns: 0,
                                options: { allDaySlot: Boolean(options.allDaySlot) },
                            }) })] })), jsx(Scroller, { vertical: verticalScrollbars, horizontal: true, hideScrollbars: footerScrollbarSticky ||
                        props.forPrint // prevents blank space in print-view on Safari
                    , className: joinClassNames(generateClassName(options.tableBodyClass, {
                        borderlessX,
                        borderlessTop,
                        borderlessBottom,
                        multiMonthColumns: 0,
                    }), 
                    // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
                    // https://stackoverflow.com/a/60256345
                    !props.forPrint && classNames.flexCol, verticalScrollbars && classNames.liquid), ref: this.bodyScrollerRef, clientWidthRef: this.handleClientWidth, children: jsx(DayGridRows, { dateProfile: props.dateProfile, todayRange: props.todayRange, cellRows: props.cellRows, forPrint: props.forPrint, isHitComboAllowed: props.isHitComboAllowed, className: classNames.grow, dayMaxEvents: props.forPrint ? undefined : options.dayMaxEvents, dayMaxEventRows: options.dayMaxEventRows, 
                        // content
                        fgEventSegs: props.fgEventSegs, bgEventSegs: props.bgEventSegs, businessHourSegs: props.businessHourSegs, dateSelectionSegs: props.dateSelectionSegs, eventDrag: props.eventDrag, eventResize: props.eventResize, eventSelection: props.eventSelection, 
                        // dimensions
                        colWidth: appliedColWidth, width: canvasWidth, visibleWidth: totalWidth, cellIsNarrow: cellIsNarrow, cellIsMicro: cellIsMicro, 
                        // refs
                        rowHeightRefMap: props.rowHeightRefMap }) }), Boolean(footerScrollbarSticky) && (jsx(FooterScrollbar, { isSticky: true, canvasWidth: canvasWidth, scrollerRef: this.footerScrollerRef })), jsx(Ruler, { widthRef: this.handleTotalWidth })] }));
    }
    // Lifecycle
    // -----------------------------------------------------------------------------------------------
    componentDidMount() {
        this._isUnmounting = false;
        // scroller
        const ScrollerSyncer = getScrollerSyncerClass(this.context.pluginHooks);
        this.syncedScroller = new ScrollerSyncer(true); // horizontal=true
        setRef(this.props.scrollerRef, this.syncedScroller);
        this.updateSyncedScroller();
    }
    componentDidUpdate() {
        // scroller
        this.updateSyncedScroller();
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        // scroller
        this.syncedScroller.destroy();
    }
    // Scrolling
    // -----------------------------------------------------------------------------------------------
    updateSyncedScroller() {
        this.syncedScroller.handleChildren([
            this.headerScrollerRef.current,
            this.bodyScrollerRef.current,
            this.footerScrollerRef.current,
        ]);
    }
}

class DayGridLayout extends BaseComponent {
    constructor() {
        super(...arguments);
        // ref
        this.scrollerRef = createRef();
        this.rowHeightRefMap = new RefMap(() => {
            afterSize(this.updateScrollY);
        });
        this.scrollDate = null;
        this.updateScrollY = () => {
            if (this._isUnmounting)
                return;
            const rowHeightMap = this.rowHeightRefMap.current;
            const scroller = this.scrollerRef.current;
            // Since updateScrollY is called by rowHeightRefMap, could be called with null during cleanup,
            // and the scroller might not exist
            if (scroller && this.scrollDate) {
                let scrollTop = computeTopFromDate(this.scrollDate, this.props.cellRows, rowHeightMap);
                if (scrollTop != null) {
                    if (scrollTop) {
                        scrollTop++; // clear top border
                    }
                    scroller.scrollTo({ y: scrollTop });
                }
            }
        };
        this.handleScrollEnd = (isDevice) => {
            if (isDevice) {
                this.scrollDate = null;
            }
        };
    }
    render() {
        const { props, context } = this;
        const { options } = context;
        const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options);
        const dateSelectionSegs = props.forPrint ? [] : props.dateSelectionSegs;
        const eventDrag = props.forPrint ? null : props.eventDrag;
        const eventResize = props.forPrint ? null : props.eventResize;
        const commonLayoutProps = {
            ...props,
            dateSelectionSegs,
            eventDrag,
            eventResize,
            scrollerRef: this.scrollerRef,
            rowHeightRefMap: this.rowHeightRefMap,
        };
        return (jsx(ViewContainer, { viewSpec: context.viewSpec, attrs: {
                role: 'grid',
                'aria-rowcount': props.headerTiers.length + props.cellRows.length,
                'aria-colcount': props.cellRows[0].length,
                'aria-labelledby': props.labelId,
                'aria-label': props.labelStr,
            }, className: joinClassNames(props.className, !props.forPrint && classNames.flexCol, !props.forPrint && generateClassName(options.tableClass, {
                borderlessX,
                borderlessTop,
                borderlessBottom,
                multiMonthColumns: 0,
            })), children: options.dayMinWidth ? (jsx(DayGridLayoutPannable, { ...commonLayoutProps, dayMinWidth: options.dayMinWidth })) : (jsx(DayGridLayoutNormal, { ...commonLayoutProps })) }));
    }
    // Lifecycle
    // -----------------------------------------------------------------------------------------------
    componentDidMount() {
        this._isUnmounting = false;
        if (!this.props.forPrint) {
            this.resetScroll();
            this.scrollerRef.current?.addScrollEndListener(this.handleScrollEnd);
        }
    }
    componentDidUpdate(prevProps) {
        if (prevProps.forPrint && !this.props.forPrint) {
            this.scrollerRef.current?.addScrollEndListener(this.handleScrollEnd);
            this.resetScroll();
        }
        if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
            this.resetScroll();
        }
    }
    componentWillUnmount() {
        this._isUnmounting = true;
        this.scrollerRef.current?.removeScrollEndListener(this.handleScrollEnd);
    }
    // Scrolling
    // -----------------------------------------------------------------------------------------------
    resetScroll() {
        this.scrollDate = this.props.dateProfile.currentDate;
        this.updateScrollY();
        this.scrollerRef.current?.scrollTo({ x: 0 });
    }
}

export { DayGridLayout as D, FooterScrollbar as F };
