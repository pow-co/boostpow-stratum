import { message_id, MessageID } from "./messageID";
import { method } from "./method";
import { parameters } from "./message";
import { JSONValue } from "../json";
import * as Joi from "joi";

// every request sent must be replied to with a response.
export type request = {
  id: message_id;
  method: method;
  params: parameters;
};

export class Request {
  public static schema = Joi.object({
    id: MessageID.schema,
    method: Joi.string().required(),
    params: Joi.array().required(),
  });

  static read(message: JSONValue): request | undefined {
    if (Request.schema.validate(message).error) return;

    for (let x of (<request>message).params) if (x === undefined) return;

    return <request>message;
  }

  static id(message: request): message_id {
    return message["id"];
  }

  static method(message: request): method {
    return message["method"];
  }

  static params(message: request): parameters {
    return message["params"];
  }
}
