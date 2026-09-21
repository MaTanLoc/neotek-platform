import { jsx } from 'react/jsx-runtime';
import { C as Calendar$1 } from './chunks/7c9b34a3.js';
import { i as interactionPlugin } from './chunks/fb68b555.js';
import { d as dayGridPlugin } from './chunks/403aa806.js';
import { t as timeGridPlugin } from './chunks/34f44281.js';
import { l as listPlugin } from './chunks/0e278f28.js';
import { m as multiMonthPlugin } from './chunks/861c7662.js';

const plugins = [
    interactionPlugin,
    dayGridPlugin,
    timeGridPlugin,
    listPlugin,
    multiMonthPlugin,
];
function Calendar(options = {}) {
    return (jsx(Calendar$1, { ...options, plugins: [
            ...plugins,
            ...(options.plugins || []),
        ] }));
}

export { Calendar, Calendar as default, plugins };
