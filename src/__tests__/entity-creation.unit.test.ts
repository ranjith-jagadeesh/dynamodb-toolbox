import Table from '../classes/Table'
import Entity from '../classes/Entity'
import { DocumentClient } from './bootstrap.test'

const tableAddEntity = jest.spyOn(Table.prototype, 'addEntity').mockReturnValue()

describe('Entity creation', () => {
  it('creates basic entity w/ defaults', async () => {
    // Create entity
    const TestEntity = new Entity({
      name: 'TestEntity',
      attributes: {
        pk: { partitionKey: true }
      }
    } as const)

    expect(TestEntity.name).toBe('TestEntity')
    expect(TestEntity.schema.attributes.pk).toEqual({
      partitionKey: true,
      type: 'string',
      coerce: true
    })
    expect(TestEntity.schema.keys).toEqual({ partitionKey: 'pk' })
    expect(TestEntity.schema.attributes.created).toHaveProperty('default')
    expect(TestEntity.schema.attributes.created.map).toBe('_ct')
    expect(TestEntity.schema.attributes.modified).toHaveProperty('default')
    expect(TestEntity.schema.attributes.modified.map).toBe('_md')
    expect(TestEntity.schema.attributes).toHaveProperty('_ct')
    expect(TestEntity.schema.attributes).toHaveProperty('_md')
    expect(TestEntity.defaults).toHaveProperty('_ct')
    expect(TestEntity.defaults).toHaveProperty('_md')
    expect(TestEntity._etAlias).toBe('entity')
    expect(TestEntity.typeHidden).toBe(false)
  })

  it('creates basic entity w/o timestamps', () => {
    const TestEntity = new Entity({
      name: 'TestEntity',
      timestamps: false,
      attributes: {
        pk: { partitionKey: true }
      }
    } as const)

    expect(TestEntity.name).toBe('TestEntity')
    expect(TestEntity.schema.attributes.pk).toEqual({
      partitionKey: true,
      type: 'string',
      coerce: true
    })
    expect(TestEntity.schema.keys).toEqual({ partitionKey: 'pk' })
    expect(TestEntity.schema.attributes).not.toHaveProperty('created')
    expect(TestEntity.schema.attributes).not.toHaveProperty('_ct')
    expect(TestEntity.schema.attributes).not.toHaveProperty('created')
    expect(TestEntity.schema.attributes).not.toHaveProperty('_md')
    expect(TestEntity.defaults).not.toHaveProperty('_ct')
    expect(TestEntity.defaults).not.toHaveProperty('_md')
    expect(TestEntity._etAlias).toBe('entity')
  })

  it('creates entity that overrides timestamp names', () => {
    const TestEntity = new Entity({
      name: 'TestEntity',
      created: 'createdAt',
      modified: 'modifiedAt',
      attributes: {
        pk: { partitionKey: true }
      }
    } as const)

    expect(TestEntity.schema.keys).toEqual({ partitionKey: 'pk' })
    expect(TestEntity.schema.attributes.createdAt).toHaveProperty('default')
    expect(TestEntity.schema.attributes.modifiedAt).toHaveProperty('default')
    expect(TestEntity.defaults).toHaveProperty('createdAt')
    expect(TestEntity.defaults).toHaveProperty('modifiedAt')
  })

  it('creates basic entity with typeHidden set to true', () => {
    const TestEntity = new Entity({
      name: 'TestEntity',
      typeHidden: true,
      attributes: {
        pk: { partitionKey: true }
      }
    } as const)

    expect(TestEntity.typeHidden).toBe(true)
  })

  it('creates basic entity w/ required fields', () => {
    const TestEntity = new Entity({
      name: 'TestEntity',
      attributes: {
        pk: { partitionKey: true },
        test: { type: 'string', required: true },
        test2: { type: 'string', required: 'always' }
      }
    } as const)

    expect(TestEntity.required.test).toEqual(false)
    expect(TestEntity.required.test2).toEqual(true)
  })

  it('creates entity w/ composite field type defaults and string assignment', () => {
    const TestEntity = new Entity({
      name: 'TestEntity',
      attributes: {
        pk: { partitionKey: true },
        test: ['pk', 0],
        test2: ['pk', 1, 'number']
      }
    } as const)

    expect(TestEntity.schema.attributes.test.type).toBe('string')
    expect(TestEntity.schema.attributes.test2.type).toBe('number')
    expect(TestEntity.linked).toEqual({ pk: ['test', 'test2'] })
  })

  it('creates entity w/ composite field alias', () => {
    const TestEntity = new Entity({
      name: 'TestEntity',
      attributes: {
        pk: { partitionKey: true },
        test: ['pk', 0, { alias: 'test2' }]
      }
    } as const)

    expect(TestEntity.schema.attributes.test2.map).toBe('test')
  })

  it('creates entity from shared config constant without modifying it', () => {
    const config = {
      name: 'TestEntity',
      attributes: {
        pk: { partitionKey: true },
        sk: { sortKey: true, default: 'some-default-sk-value' }
      },
      timestamps: true
    } as const

    new Entity({
      ...config,
      timestamps: false
    })

    expect(config.name).toBe('TestEntity')
    expect(config.attributes).toEqual({
      pk: { partitionKey: true },
      sk: { sortKey: true, default: 'some-default-sk-value' }
    })
    expect(config.timestamps).toBe(true)
  })

  it('invokes table.addEntity when created with a table', () => {
    const table = new Table({
      name: 'TestTable-2',
      partitionKey: 'pk',
      sortKey: 'sk',
      DocumentClient
    })


    const TestEntity = new Entity({
      name: 'TestEntity-3',
      attributes: {
        pk: { partitionKey: true },
        sk: { sortKey: true }
      },
      table
    } as const)

    expect(tableAddEntity).toHaveBeenCalledWith(TestEntity)
  })

  it('fails when creating a entity without a partitionKey', () => {
    const result = () =>
      new Entity({
        name: 'TestEntity',
        attributes: {}
      })
    expect(result).toThrow(`Entity requires a partitionKey attribute`)
  })

  it('fails when creating a entity without a name', () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        attributes: {
          pk: { partitionKey: true }
        }
      } as const)
    expect(result).toThrow(`'name' must be defined`)
  })

  it('fails when creating a entity with an invalid attributes object (array)', () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: [1, 2, 3]
      } as const)
    expect(result).toThrow(`Please provide a valid 'attributes' object`)
  })

  it('fails when creating a entity with an invalid attributes object (string)', () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: 'test'
      } as const)
    expect(result).toThrow(`Please provide a valid 'attributes' object`)
  })

  it('fails when attribute has an invalid type (string style)', () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: 'x'
        }
      } as const)
    expect(result).toThrow(
      `Invalid or missing type for 'pk'. Valid types are 'string', 'boolean', 'number', 'list', 'map', 'binary', and 'set'.`
    )
  })

  it('fails when attribute has an invalid type (object style)', () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { type: 'x' }
        }
      } as const)
    expect(result).toThrow(
      `Invalid or missing type for 'pk'. Valid types are 'string', 'boolean', 'number', 'list', 'map', 'binary', and 'set'.`
    )
  })

  it(`fails when an attribute has invalid 'onUpdate' setting`, () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: { type: 'string', onUpdate: 'x' }
        }
      } as const)
    expect(result).toThrow(`'onUpdate' must be a boolean`)
  })

  it(`fails when attribute alias duplicates existing property`, () => {
    const result = () =>
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: { type: 'string', alias: 'pk' }
        }
      } as const)
    expect(result).toThrow(`'alias' must be a unique string`)
  })

  it(`fails when an attribute uses 'setType' when not a 'set'`, () => {
    const result = () =>
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: { type: 'string', setType: 'string' }
        }
      } as const)
    expect(result).toThrow(`'setType' is only valid for type 'set'`)
  })

  it(`fails when attribute uses invalid 'setType'`, () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: { type: 'set', setType: 'test' }
        }
      } as const)
    expect(result).toThrow(`Invalid 'setType', must be 'string', 'number', or 'binary'`)
  })

  it(`fails when setting an invalid attribute property type`, () => {
    const result = () =>
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: { type: 'string', unknown: true }
        }
      } as const)
    expect(result).toThrow(`'unknown' is not a valid property type`)
  })

  it(`fails when setting an invalid required property`, () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: { type: 'string', required: 'x' }
        }
      } as const)
    expect(result).toThrow(`'required' must be a boolean or set to 'always'`)
  })

  it(`fails when composite references missing field`, () => {
    const result = () =>
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: ['x', 0]
        }
      } as const)
    expect(result).toThrow(`'test' must reference another field`)
  })

  it(`fails when composite uses non-numeric index`, () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: ['pk', 'x']
        }
      } as const)
    expect(result).toThrow(`'test' position value must be numeric`)
  })

  it(`fails when composite uses invalid type`, () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: ['pk', 1, 'x']
        }
      } as const)
    expect(result).toThrow(
      `'test' type must be 'string', 'number', 'boolean' or a configuration object`
    )
  })

  it(`fails when composite array length is incorrect`, () => {
    const result = () =>
      // @ts-expect-error
      new Entity({
        name: 'TestEntity',
        attributes: {
          pk: { partitionKey: true },
          test: ['pk']
        }
      } as const)
    expect(result).toThrow(`Composite key configurations must have 2 or 3 items`)
  })

  it(`fails when missing entity definition`, () => {
    // @ts-expect-error
    const result = () => new Entity()
    expect(result).toThrow(`Please provide a valid entity definition`)
  })

  it(`fails when providing an invalid entity definition`, () => {
    // @ts-expect-error
    const result = () => new Entity('test')
    expect(result).toThrow(`Please provide a valid entity definition`)
  })

  it(`fails when providing an array as the entity definition`, () => {
    // @ts-expect-error
    const result = () => new Entity([])
    expect(result).toThrow(`Please provide a valid entity definition`)
  })

  it('creates an attribute with an inverseTransformation function', async () => {
    const TestTable = new Table({
      name: 'test-table',
      partitionKey: 'pk',
      sortKey: 'sk',
      DocumentClient
    })

    const TestEntity = new Entity({
      name: 'TestEnt',
      attributes: {
        pk: {
          partitionKey: true,
          format: val => val.toUpperCase(),
          default: 'pkDef'
        },
        test: {
          format: (val: string, data: any) => {
            return val.toUpperCase()
          },
          default: () => 'defaultVal'
        },
        sk: { type: 'string', sortKey: true },
        testx: ['sk', 0],
        testy: [
          'sk',
          1,
          {
            default: () => 'testDefaultY',
            format: val => {
              return '__' + val.toUpperCase()
            }
          }
        ]
      },
      table: TestTable
    })
  })

  // it('creates entity w/ table', async () => {

  //   // Create basic table
  //   const TestTable = new Table({
  //     name: 'test-table',
  //     partitionKey: 'pk'
  //   })

  //   // Create basic entity
  //   const TestEntity = new Entity({
  //     name: 'TestEnt',
  //     attributes: {
  //       pk: { partitionKey: true }
  //     },
  //     table: TestTable
  //   })

  //   expect(TestTable instanceof Table).toBe(true)
  //   expect(TestTable.name).toBe('test-table')
  //   expect(TestTable.Table.partitionKey).toBe('pk')
  //   expect(TestTable.Table.sortKey).toBeNull()
  //   expect(TestTable.Table.entityField).toBe('_et')
  //   expect(TestTable.Table.indexes).toEqual({})
  //   expect(TestTable.Table.attributes).toEqual({
  //     _et: { type: 'string', mappings: {} },
  //     pk: { type: 'string', mappings: { TestEnt: { pk: 'string' } } },
  //     _ct: { mappings: { TestEnt: { created: 'string' } } },
  //     _md: { mappings: { TestEnt: { modified: 'string' } } }
  //   })
  //   expect(TestTable.autoExecute).toBe(true)
  //   expect(TestTable.autoParse).toBe(true)
  //   expect(TestTable.entities).toEqual(['TestEnt'])
  //   expect(TestEntity.schema.keys).toEqual({ partitionKey: 'pk' })
  //   expect(TestEntity.schema.attributes.created).toHaveProperty('default')
  //   expect(TestEntity.schema.attributes.created.map).toBe('_ct')
  //   expect(TestEntity.schema.attributes.modified).toHaveProperty('default')
  //   expect(TestEntity.schema.attributes.modified.map).toBe('_md')
  //   expect(TestEntity.schema.attributes).toHaveProperty('_ct')
  //   expect(TestEntity.schema.attributes).toHaveProperty('_md')
  //   expect(TestEntity.defaults).toHaveProperty('_ct')
  //   expect(TestEntity.defaults).toHaveProperty('_md')
  //   expect(TestEntity._etAlias).toBe('entity')
  // }) // creates entity w/ table

  // it('creates entity composite key delimiter, prefix and suffix', async () => {

  //   // Create basic table
  //   const TestTable = new Table({
  //     name: 'test-table',
  //     partitionKey: 'pk',
  //     DocumentClient
  //   })

  //   // Create basic entity
  //   const TestEntity = new Entity({
  //     name: 'TestEnt',
  //     attributes: {
  //       pk: { partitionKey: true },
  //       sk: { delimiter: '|', prefix: 'test---', suffix: '-end', map: 'skx' },
  //       test0: ['sk',0],
  //       test1: ['sk',1],
  //       test2: ['sk',2],
  //       comp1: {},
  //       test0c: ['comp1',0, { save: false }],
  //       test1c: ['comp1',1],
  //       test2c: ['comp1',2]
  //     },
  //     table: TestTable,
  //     timestamps: false
  //   })

  //   let result = TestEntity.putParams({
  //     pk: 'test',
  //     test0: '0',
  //     test1: '1',
  //     test2: '2',
  //     test0c: '0',
  //     test1c: 1,
  //     test2c: '2'
  //   })

  //   expect(result).toEqual({
  //     TableName: 'test-table',
  //     Item: {
  //       skx: 'test---0|1|2-end',
  //       comp1: '0#1#2',
  //       _et: 'TestEnt',
  //       pk: 'test',
  //       test0: '0',
  //       test1: '1',
  //       test2: '2',
  //       test1c: '1',
  //       test2c: '2'
  //     }
  //   })

  //   expect(TestEntity.parse({
  //     skx: 'test---0|1|2-end',
  //     comp1: '0#1#2',
  //     _et: 'TestEnt',
  //     pk: 'test',
  //     test0: '0',
  //     test1: '1',
  //     test2: '2',
  //     test1c: '1',
  //     test2c: '2'
  //   })).toEqual({
  //     sk: '0|1|2',
  //     test0c: '0',
  //     comp1: '0#1#2',
  //     entity: 'TestEnt',
  //     pk: 'test',
  //     test0: '0',
  //     test1: '1',
  //     test2: '2',
  //     test1c: '1',
  //     test2c: '2'
  //   })

  // })

  // it('creates an attribute with a prefix and suffix', async () => {

  //   // Create basic table
  //   const TestTable = new Table({
  //     name: 'test-table',
  //     partitionKey: 'pk',
  //     DocumentClient
  //   })

  //   // Create basic entity
  //   const TestEntity = new Entity({
  //     name: 'TestEnt',
  //     attributes: {
  //       pk: { partitionKey: true, prefix: '#user#' },
  //       test: { prefix: 'startX--', suffix: '--endX' },
  //       num: { type: 'number' }
  //     },
  //     table: TestTable,
  //     timestamps: false
  //   })

  //   let result = TestEntity.putParams({
  //     pk: 'test',
  //     test: 'testx',
  //     num: 5
  //   })

  //   expect(result).toEqual({
  //     TableName: 'test-table',
  //     Item: {
  //       _et: 'TestEnt',
  //       pk: '#user#test',
  //       test: 'startX--testx--endX',
  //       num: 5
  //     }
  //   })

  //   expect(TestEntity.parse({
  //       _et: 'TestEnt',
  //       pk: '#user#test',
  //       test: 'startX--testx--endX',
  //       num: 5
  //     })).toEqual({
  //       entity: 'TestEnt', pk: 'test', test: 'testx', num: 5
  //     })

  // }) // creates attribute with prefix/suffix

  // it('creates an attribute a transformation function', async () => {

  //   // Create basic table
  //   const TestTable = new Table({
  //     name: 'test-table',
  //     partitionKey: 'pk',
  //     sortKey: 'sk',
  //     DocumentClient
  //   })

  //   // Create basic entity
  //   const TestEntity = new Entity({
  //     name: 'TestEnt',
  //     attributes: {
  //       pk: { partitionKey: true, transform: (val) => val.toUpperCase(), default: 'pkDef' },
  //       test: {
  //         transform: (val,data) => {
  //           return val.toUpperCase()
  //         },
  //         default: () => 'defaultVal',
  //         prefix: 'pre-'
  //       },
  //       sk: { type: 'string', prefix: 'testprev-', sortKey: true, delimiter: '|' },
  //       testx: ['sk',0],
  //       testy: ['sk',1, {
  //         default: () => 'testDefaultX',
  //         transform: (val) => { return '__'+val.toUpperCase() }
  //       }]
  //     },
  //     table: TestTable,
  //     timestamps: false
  //   })

  //   let result = TestEntity.putParams({
  //     testx: 1
  //   })

  //   expect(result).toEqual({
  //     TableName: 'test-table',
  //     Item: {
  //       sk: 'testprev-1|__TESTDEFAULTX',
  //       pk: 'PKDEF',
  //       test: 'pre-DEFAULTVAL',
  //       testy: '__TESTDEFAULTX',
  //       _et: 'TestEnt',
  //       testx: '1'
  //     }
  //   })

  //   let result2 = TestEntity.getParams({
  //     testx: 'test',
  //     testy: 'testx'
  //   })

  //   expect(result2).toEqual({
  //     TableName: 'test-table',
  //     Key: { pk: 'PKDEF', sk: 'testprev-test|__TESTX' }
  //   })

  //   let result3 = TestEntity.updateParams({
  //     testx: 'test',
  //     testy: 'testx',
  //     test: 'uppercase'
  //   })

  //   expect(result3).toEqual({
  //     TableName: 'test-table',
  //     Key: { pk: 'PKDEF', sk: 'testprev-test|__TESTX' },
  //     UpdateExpression: 'SET #test = :test, #testy = :testy, #_et = if_not_exists(#_et,:_et), #testx = :testx',
  //     ExpressionAttributeNames: {
  //       '#test': 'test',
  //       '#testy': 'testy',
  //       '#_et': '_et',
  //       '#testx': 'testx'
  //     },
  //     ExpressionAttributeValues: {
  //       ':test': 'pre-UPPERCASE',
  //       ':testy': '__TESTX',
  //       ':_et': 'TestEnt',
  //       ':testx': 'test'
  //     }
  //   })

  //   // console.log(result);
  //   // console.log(result2);
  //   // console.log(result3);

  // }) // creates attribute with transformations
})
