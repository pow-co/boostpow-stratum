export type JSONValue = null | string | number | boolean | JSONObject | JSONArray

export interface JSONObject {
    [x: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> { }
