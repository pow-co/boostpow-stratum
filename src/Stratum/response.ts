import { message_id, MessageID } from "./messageID";
import { method } from "./method";
import { error, Error } from "./error";
import { result } from "./message";
import { JSONValue } from "../json";

// A response is a reply to a request.
export interface response {
  id: message_id;
  result: result;
  err: error;
}

export class Response {
  static valid(message: response): boolean {
    return message["result"] !== undefined && Error.valid(message["err"]);
  }

  static read(message: JSONValue): response | undefined {
    if (
      typeof message == "object" &&
      MessageID.valid(message["id"]) &&
      Error.valid(message["err"]) &&
      Response.valid(<response>(<unknown>message))
    )
      return <response>(<unknown>message);
  }

  static id(message: response): message_id {
    if (Response.valid(message)) {
      return message["id"];
    }

    throw "invalid response";
  }

  static method(message: response): method {
    if (Response.valid(message)) {
      return message["method"];
    }

    throw "invalid response";
  }

  static result(message: response): result {
    if (Response.valid(message)) {
      return message["result"];
    }

    throw "invalid response";
  }

  static error(message: response): error {
    if (Response.valid(message)) {
      return message["err"];
    }

    throw "invalid response";
  }

  static is_error(message: response): boolean {
    return Response.error(message) !== null;
  }

  static make(id: message_id, result: result, err?: error): response {
    if (err === undefined) {
      return { id: id, result: result, err: null };
    }

    return { id: id, result: result, err: err };
  }
}

export interface boolean_response {
  id: message_id;
  result: null | boolean;
  err: error;
}

export class BooleanResponse extends Response {
  static valid(message: response): boolean {
    return (
      Response.valid(message) &&
      (typeof message["result"] === "boolean" || Response.is_error(message))
    );
  }

  static result(message: response): boolean | undefined {
    if (BooleanResponse.valid(message)) {
      if (typeof message["result"] === "boolean") {
        return message["result"];
      }
      return;
    }

    throw "invalid response";
  }

  static make(id: message_id, result: boolean, err?: error): boolean_response {
    return <boolean_response>Response.make(id, result, err);
  }
}
