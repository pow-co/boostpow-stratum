export type error = null | [number, string]

export class Error {

  static valid(err: error): boolean {
    return err === null || (Array.isArray(err) && err.length == 2 &&
      Number.isInteger(err[0]) && typeof err[1] === 'string')
  }

  static is_error(err: error): boolean {
    return Error.valid(err) && err !== null
  }

  static error_code(err: error): number {
    if (!Error.is_error(err)) {
      throw "no error"
    }

    return err[0]
  }

  static error_message(err: error): string {
    if (!Error.is_error(err)) {
      throw "no error"
    }

    return err[1]
  }
}
