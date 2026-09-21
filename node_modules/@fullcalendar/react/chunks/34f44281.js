import { d as dayGridPlugin } from './403aa806.js';
import { jsx } from 'react/jsx-runtime';
import { D as DateComponent, N as NowTimer } from './bdcb9f0b.js';
import { m as memoize } from './8563f14c.js';
import { c as createDayHeaderFormatter, d as DaySeriesModel, a as buildDateRowConfigs, e as DaySeriesSlicer } from './9631f043.js';
import { b as buildDayColsFromSeries, o as organizeSegsByCol, s as splitInteractionByCol, A as AllDaySplitter, D as DayTimeColsSlicer, T as TimeGridLayout } from './fcbe493e.js';

class TimeGridView extends DateComponent {
    constructor() {
        super(...arguments);
        // memo
        this.createDayHeaderFormatter = memoize(createDayHeaderFormatter);
        this.buildDaySeries = memoize((dateProfile, dateProfileGenerator) => (new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator)));
        this.buildDayCols = memoize(buildDayColsFromSeries);
        this.extractColDates = memoize((cols) => cols.map((col) => col.date));
        this.extractColRanges = memoize((cols) => cols.map((col) => col.range));
        this.buildDateRowConfigs = memoize(buildDateRowConfigs);
        this.splitFgEventSegs = memoize((organizeSegsByCol));
        this.splitBgEventSegs = memoize((organizeSegsByCol));
        this.splitBusinessHourSegs = memoize((organizeSegsByCol));
        this.splitNowIndicatorSegs = memoize((organizeSegsByCol));
        this.splitDateSelectionSegs = memoize((organizeSegsByCol));
        this.splitEventDrag = memoize(splitInteractionByCol);
        this.splitEventResize = memoize(splitInteractionByCol);
        // internal
        this.allDaySplitter = new AllDaySplitter();
        this.daySeriesSlicer = new DaySeriesSlicer();
        this.dayTimeColsSlicer = new DayTimeColsSlicer();
    }
    render() {
        const { props, context } = this;
        const { dateProfile } = props;
        const { options, dateProfileGenerator } = context;
        const daySeries = this.buildDaySeries(dateProfile, dateProfileGenerator);
        const cols = this.buildDayCols(daySeries, context.dateEnv, {
            slotRange: dateProfile,
            activeRange: dateProfile.activeRange,
        });
        const colDates = this.extractColDates(cols);
        const dayRanges = this.extractColRanges(cols);
        const splitProps = this.allDaySplitter.splitProps(props);
        const allDayProps = this.daySeriesSlicer.sliceProps(splitProps.allDay, dateProfile, options.nextDayThreshold, context, daySeries);
        const timedProps = this.dayTimeColsSlicer.sliceProps(splitProps.timed, dateProfile, null, context, dayRanges);
        const dayHeaderFormat = this.createDayHeaderFormatter(context.options.dayHeaderFormat, true, // datesRepDistinctDays
        cols.length);
        return (jsx(NowTimer, { unit: options.nowIndicator ? 'minute' : 'day' /* hacky */, children: (nowDate, todayRange, nowMs) => {
                const colCount = cols.length;
                const nowIndicatorSeg = !props.forPrint && options.nowIndicator &&
                    this.dayTimeColsSlicer.sliceNowDate(nowDate, dateProfile, options.nextDayThreshold, context, dayRanges);
                const fgEventSegsByCol = this.splitFgEventSegs(timedProps.fgEventSegs, colCount);
                const bgEventSegsByCol = this.splitBgEventSegs(timedProps.bgEventSegs, colCount);
                const businessHourSegsByCol = this.splitBusinessHourSegs(timedProps.businessHourSegs, colCount);
                const nowIndicatorSegsByCol = this.splitNowIndicatorSegs(nowIndicatorSeg, colCount);
                const dateSelectionSegsByCol = this.splitDateSelectionSegs(timedProps.dateSelectionSegs, colCount);
                const eventDragByCol = this.splitEventDrag(timedProps.eventDrag, colCount);
                const eventResizeByCol = this.splitEventResize(timedProps.eventResize, colCount);
                const headerTiers = this.buildDateRowConfigs(colDates, true, // datesRepDistinctDays
                props.dateProfile, todayRange, dayHeaderFormat, context);
                return (jsx(TimeGridLayout, { labelId: props.labelId, labelStr: props.labelStr, dateProfile: dateProfile, nowDate: nowDate, nowMs: nowMs, todayRange: todayRange, cells: cols, forPrint: props.forPrint, className: props.className, 
                    // header content
                    headerTiers: headerTiers, 
                    // all-day content
                    fgEventSegs: allDayProps.fgEventSegs, bgEventSegs: allDayProps.bgEventSegs, businessHourSegs: allDayProps.businessHourSegs, dateSelectionSegs: allDayProps.dateSelectionSegs, eventDrag: allDayProps.eventDrag, eventResize: allDayProps.eventResize, 
                    // timed content
                    fgEventSegsByCol: fgEventSegsByCol, bgEventSegsByCol: bgEventSegsByCol, businessHourSegsByCol: businessHourSegsByCol, nowIndicatorSegsByCol: nowIndicatorSegsByCol, dateSelectionSegsByCol: dateSelectionSegsByCol, eventDragByCol: eventDragByCol, eventResizeByCol: eventResizeByCol, 
                    // universal content
                    eventSelection: props.eventSelection }));
            } }));
    }
}

var timeGridPlugin = {
    name: 'timegrid',
    initialView: 'timeGridWeek',
    deps: [dayGridPlugin],
    views: {
        timeGrid: {
            component: TimeGridView,
            usesMinMaxTime: true, // indicates that slotMinTime/slotMaxTime affects rendering
            allDaySlot: true,
            slotDuration: '00:30:00',
            slotEventOverlap: true, // a bad name. confused with overlap/constraint system
        },
        timeGridDay: {
            type: 'timeGrid',
            duration: { days: 1 },
        },
        timeGridWeek: {
            type: 'timeGrid',
            duration: { weeks: 1 },
        },
    },
};

export { timeGridPlugin as t };
