import { DictionaryName } from './DictionaryName';
import { RequireAtLeastOne } from './RequireAtLeastOne';

export type GetDictionarySettingsResponse = {
  /**
   * TODO: Description
   */
  readonly disableStandardEntries: RequireAtLeastOne<
    Record<DictionaryName, Record<string, boolean>>
  >;
};
