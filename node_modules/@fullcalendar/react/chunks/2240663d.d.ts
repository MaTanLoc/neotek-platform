import { aG as Dictionary } from './bb8fd4ea.js';

declare class JsonRequestError extends Error {
    response: Response;
    constructor(message: string, response: Response);
}
declare function requestJson<ParsedResponse>(method: string, url: string, params: Dictionary): Promise<[ParsedResponse, Response]>;

export { JsonRequestError as J, requestJson as r };
