import * as Joi from "joi";

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONObject
  | JSONArray;

export interface JSONObject {
  [x: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

let natural_number_schema = Joi.number().integer().min(0).required();

export function is_natural_number(x): boolean {
  return !natural_number_schema.validate(x).error;
}
