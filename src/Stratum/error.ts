import * as Joi from 'joi'
import { is_natural_number } from './message'

export type error = null | [number, string]

export class Error {

  static valid(err: error): boolean {
    return err === null || (Array.isArray(err) && err.length === 2 && is_natural_number(err[0]) && typeof err[1] === 'string')
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

  public static REJECT_NO_REASON = 0

  public static JOB_NOT_FOUND_OR_STALE = 21
  public static DUPLICATE_SHARE = 22
  public static LOW_DIFFICULTY = 23
  public static UNAUTHORIZED = 24
  public static NOT_SUBSCRIBED = 25

  public static ILLEGAL_METHOD = 26
  public static ILLEGAL_PARARMS = 27
  public static IP_BANNED = 28
  public static INVALID_USERNAME = 29
  public static INTERNAL_ERROR = 30
  public static TIME_TOO_OLD = 31
  public static TIME_TOO_NEW = 32
  public static ILLEGAL_VERMASK = 33

  public static INVALID_SOLUTION = 34
  public static WRONG_NONCE_PREFIX = 35

  public static JOB_NOT_FOUND = 36
  public static STALE_SHARE = 37

  public static UNKNOWN = 2147483647 // bin(01111111 11111111 11111111 11111111)

  static message_from_code(code: number): string {
    if(code === Error.REJECT_NO_REASON) {
      return 'reject no reason'
    }

    if(code === Error.JOB_NOT_FOUND_OR_STALE) {
      return 'job not found or stale'
    }
    if(code === Error.DUPLICATE_SHARE) {
      return 'duplicate share'
    }
    if(code === Error.LOW_DIFFICULTY) {
      return 'low difficulty'
    }
    if(code === Error.UNAUTHORIZED) {
      return 'unauthorized'
    }
    if(code === Error.NOT_SUBSCRIBED) {
      return 'not subscribed'
    }

    if(code === Error.ILLEGAL_METHOD) {
      return 'illegal method'
    }
    if(code === Error.ILLEGAL_PARARMS) {
      return 'illegal params'
    }
    if(code === Error.IP_BANNED) {
      return 'ip banned'
    }
    if(code === Error.INVALID_USERNAME) {
      return 'invalid username'
    }
    if(code === Error.INTERNAL_ERROR) {
      return 'internal error'
    }
    if(code === Error.TIME_TOO_OLD) {
      return 'reject no reason'
    }
    if(code === Error.TIME_TOO_NEW) {
      return 'reject no reason'
    }
    if(code === Error.ILLEGAL_VERMASK) {
      return 'illegal version mask'
    }

    if(code === Error.INVALID_SOLUTION) {
      return 'invalid solution'
    }
    if(code === Error.WRONG_NONCE_PREFIX) {
      return 'wrong number prefix'
    }

    if(code === Error.JOB_NOT_FOUND) {
      return 'job not found'
    }
    if(code === Error.STALE_SHARE) {
      return 'stale shar'
    }

    return "unknown error"
  }

  static make(code?: number, message?: string): error {
    if (!code) {
      return null
    }

    if (!message) {
      return [code, Error.message_from_code(code)]
    }

    return [code, message]
  }
}
