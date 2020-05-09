import * as t from 'io-ts'
import { chain, fold } from 'fp-ts/lib/Either'
import { reporter } from 'io-ts-reporters'

export const objectIdRgx = new RegExp(/^[a-f\d]{24}$/i)
export const alphaNumRgx = new RegExp(/^[a-zA-Z\d]*$/)
export const uuidRgx = new RegExp(/^[a-z0-9-]{36}$/)

type ObjectId = string
type UUID = string

/**
 * Validator for an ObjectId string
 */
export const ObjectIdIO = new t.Type<ObjectId, string, unknown>(
  'ObjectIdString',
  (input): input is ObjectId => typeof input === 'string' && objectIdRgx.test(input),
  (input, context) =>
    chain<t.Errors, string, string>((value) => {
      return typeof input === 'string' && objectIdRgx.test(input) ? t.success(value) : t.failure(input, context)
    })(t.string.validate(input, context)),
  (value) => value
)

/**
 * Validators for Alphanumeric string
 */
export const AlphaNumIO = new t.Type<string, string, unknown>(
  'AlphaNumString',
  (input): input is ObjectId => typeof input === 'string' && alphaNumRgx.test(input),
  (input, context) =>
    chain<t.Errors, string, string>((value) => {
      return typeof input === 'string' && alphaNumRgx.test(input) ? t.success(value) : t.failure(input, context)
    })(t.string.validate(input, context)),
  (value) => value
)
/**
 * Validators for Alphanumeric string
 */
export const UuidIO = new t.Type<UUID, string, unknown>(
  'UuidString',
  (input): input is ObjectId => typeof input === 'string' && uuidRgx.test(input),
  (input, context) =>
    chain<t.Errors, string, string>((value) => {
      return typeof input === 'string' && uuidRgx.test(input) ? t.success(value) : t.failure(input, context)
    })(t.string.validate(input, context)),
  (value) => value
)

/**
 * Validate the input against the validator's type
 * @param validator A IO Type
 * @param input the raw payload received
 */
export function decodeIO<T, O, I> (
  validator: t.Type<T, O, I>,
  input: I
): Promise<T> {
  const result = validator.decode(input)
  return fold<t.Errors, T, Promise<T>>(
    errors => {
      return Promise.reject(new Error(reporter(result).join('\n')))
    },
    value => Promise.resolve(value)
  )(result)
}
