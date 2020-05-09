import * as t from 'io-ts'
import { fold } from 'fp-ts/lib/Either'
import { reporter } from 'io-ts-reporters'

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
