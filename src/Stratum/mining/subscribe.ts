import { Request, request } from "../request";
import { response, Response, BooleanResponse } from "../response";
import { SessionID } from "../sessionID";
import { message_id } from "../messageID";
import { method, Method } from "../method";
import { error } from "../error";
import { result } from "../message";
import { is_natural_number } from "../../json";
import * as boostpow from "boostpow";

export type subscribe_request = {
  id: message_id;
  method: method;
  params: [] | [string] | [string, string];
};

export class SubscribeRequest extends Request {
  static valid(message: subscribe_request): boolean {
    if (!(message["method"] === "mining.subscribe")) {
      return false;
    }

    let params = message["params"];
    return (
      params.length === 0 ||
      (typeof params[0] === "string" &&
        (params.length === 1 ||
          (params.length === 2 && SessionID.valid(params[1]))))
    );
  }

  static read(message: request): subscribe_request | undefined {
    if (message.params.length > 2) return;

    if (SubscribeRequest.valid(<subscribe_request>message))
      return <subscribe_request>message;
  }

  static userAgent(message: subscribe_request): string | undefined {
    if (SubscribeRequest.valid(message)) {
      if (message.params.length < 1) return;
      return message.params[0];
    }

    throw "invalid subscribe request";
  }

  static extranonce1(
    message: subscribe_request
  ): boostpow.UInt32Big | undefined {
    if (SubscribeRequest.valid(message)) {
      if (message["params"].length == 2) {
        return boostpow.UInt32Big.fromHex(message["params"][1]);
      } else {
        return;
      }
    }

    throw "invalid subscribe response";
  }

  static make(
    id: message_id,
    user_agent: string,
    extranonce1?: boostpow.UInt32Big
  ): subscribe_request {
    if (extranonce1 === undefined) {
      return { id: id, method: "mining.subscribe", params: [user_agent] };
    }

    return {
      id: id,
      method: "mining.subscribe",
      params: [user_agent, extranonce1.hex],
    };
  }
}

export type subscription = [string, string];
export type subscriptions = subscription[];

export type subscribe_response = {
  id: message_id;
  result: null | [subscriptions, string, number];
  err: error;
};

export class SubscribeResponse extends Response {
  static #valid_result(r: result): boolean {
    if (
      !Array.isArray(r) ||
      r.length !== 3 ||
      !is_natural_number(r[2]) ||
      !SessionID.valid(r[1])
    )
      return false;

    for (let subscription of r[0]) {
      if (
        !Array.isArray(subscription) ||
        subscription.length !== 2 ||
        !Method.valid(subscription[0])
      )
        return false;
    }

    return true;
  }

  static valid(message: response): boolean {
    if (!Response.valid(message)) return false;

    let result = message["result"];
    if (Response.is_error(message) && result === null) return true;

    return this.#valid_result(result);
  }

  static subscriptions(message: subscribe_response): string[][] {
    if (SubscribeResponse.valid(message)) {
      let result = message["result"];
      if (result === null) {
        return;
      }

      return message["result"][0];
    }

    throw "invalid subscribe response";
  }

  static extranonce1(
    message: subscribe_response
  ): boostpow.UInt32Big | undefined {
    if (SubscribeResponse.valid(message)) {
      let result = message["result"];
      if (result === null) {
        return;
      }

      return boostpow.UInt32Big.fromHex(message["result"][1]);
    }

    throw "invalid subscribe response";
  }

  static extranonce2size(message: subscribe_response): number | undefined {
    if (SubscribeResponse.valid(message)) {
      let result = message["result"];
      if (result === null) {
        return;
      }

      return message["result"][2];
    }

    throw "invalid set_extranonce";
  }

  static random_subscription_id(): string {
    return SessionID.random();
  }

  static make_subscribe(
    id: message_id,
    subscriptions: subscriptions,
    extranonce1: boostpow.UInt32Big,
    extranonce2size: number
  ): subscribe_response {
    return {
      id: id,
      result: [subscriptions, extranonce1.hex, extranonce2size],
      err: null,
    };
  }

  static make_error(id: message_id, err: [number, string]): subscribe_response {
    return { id: id, result: null, err: err };
  }
}
