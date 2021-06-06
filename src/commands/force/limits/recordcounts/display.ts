/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags, FlagsConfig, SfdxCommand, SfdxResult } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-limits', 'recordcounts');

export interface RecordCount {
  name: string;
  count: number;
}

interface Result {
  sObjects: RecordCount[];
}

export class LimitsRecordCountsDisplayCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('commandDescription');
  public static readonly examples = messages.getMessage('examples').split(os.EOL);
  public static readonly requiresUsername = true;
  public static readonly result: SfdxResult = {
    tableColumnData: {
      columns: [
        { key: 'name', label: 'sObject' },
        { key: 'count', label: 'Record Count' },
      ],
    },
    display() {
      if (Array.isArray(this.data) && this.data.length) {
        this.ux.table(this.data, this.tableColumnData);
      }
    },
  };

  protected static readonly flagsConfig: FlagsConfig = {
    sobjecttype: flags.array({
      char: 's',
      required: true,
      description: messages.getMessage('sobjecttypeFlagDescription'),
    }),
  };

  public async run(): Promise<RecordCount[]> {
    try {
      const sobjectSet = new Set(this.flags.sobjecttype as string[]);
      const conn = this.org.getConnection();
      const geturl = `${conn.baseUrl()}/limits/recordCount?sObjects=${[...sobjectSet.values()].join())}`;
      const result = (await conn.request(geturl)) as unknown as Result;
      const nonZeroSobjects = new Set(result.sObjects.map(record => record.name));

      // if an object is requested, but there's 0 of them on the server, append that object to the result
      const zeroCountSobjects = [...sobjectSet.values()]
        .filter(name => !nonZeroSobject.has(name))
        .map(name => ({ name, count: 0 }));
 
      return [...result.sObjects, ...zeroCountSobjects];
    } catch (err) {
      throw SfdxError.wrap(err);
    }
  }
}
