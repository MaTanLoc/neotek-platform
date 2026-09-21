import { FunctionComponent, PropsWithoutRef, Ref } from 'react';
import { a as CalendarApi, d as CalendarOptions } from './bb8fd4ea.js';

interface CalendarRef {
    getApi(): CalendarApi;
}
type CalendarPropsInternal = CalendarOptions & {
    id?: string;
};
type CalendarProps = PropsWithoutRef<CalendarPropsInternal> & {
    ref?: Ref<CalendarRef>;
};
declare const Calendar: FunctionComponent<CalendarProps>;

export { Calendar as C, CalendarRef as a };
