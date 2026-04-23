import React from 'react'
import { Database, Leaf, Server } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const dbNodes: NodeDefinition[] = [
  {
    type: 'db-postgres',
    name: 'PostgreSQL',
    description: 'Execute a SQL query against a PostgreSQL database',
    category: 'Database',
    color: 'from-blue-700 to-blue-800',
    icon: React.createElement(Database, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Params', dataType: 'any'   }],
    outputs: [{ id: 'out', label: 'Rows',   dataType: 'array' }],
    fields: [
      { key: 'connectionString', label: 'Connection String', type: 'password',
        placeholder: 'postgresql://user:pass@host:5432/db', required: true },
      { key: 'query',     label: 'SQL Query',    type: 'code',   rows: 6,
        placeholder: 'SELECT * FROM users WHERE active = $1', required: true },
      { key: 'params',    label: 'Query Params', type: 'json',   rows: 2,
        placeholder: '[true]', hint: 'Array of positional params' },
      { key: 'operation', label: 'Operation',    type: 'select', options: [
        { value: 'query',       label: 'Query (SELECT)' },
        { value: 'execute',     label: 'Execute (DML)'  },
        { value: 'transaction', label: 'Transaction'    },
      ], defaultValue: 'query' },
      { key: 'timeout', label: 'Timeout (ms)', type: 'number', placeholder: '10000', defaultValue: 10000 },
    ],
    defaultConfig: { operation: 'query', timeout: 10000 },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 300 + Math.random() * 400))
      return {
        rows: [{ id: 1, name: 'Alice', active: true }, { id: 2, name: 'Bob', active: true }],
        rowCount: 2,
        query: config.query,
        duration: `${Math.round(300 + Math.random() * 400)}ms`,
      }
    },
  },
  {
    type: 'db-mongodb',
    name: 'MongoDB',
    description: 'Query or write documents in a MongoDB collection',
    category: 'Database',
    color: 'from-green-700 to-green-800',
    icon: React.createElement(Leaf, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Filter', dataType: 'object' }],
    outputs: [{ id: 'out', label: 'Docs',   dataType: 'array'  }],
    fields: [
      { key: 'uri',        label: 'MongoDB URI',  type: 'password', placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net/db', required: true },
      { key: 'collection', label: 'Collection',   type: 'text',     placeholder: 'users', required: true },
      { key: 'operation',  label: 'Operation',    type: 'select',   options: [
        { value: 'find',       label: 'find'       }, { value: 'findOne',    label: 'findOne'    },
        { value: 'insertOne',  label: 'insertOne'  }, { value: 'insertMany', label: 'insertMany' },
        { value: 'updateOne',  label: 'updateOne'  }, { value: 'updateMany', label: 'updateMany' },
        { value: 'deleteOne',  label: 'deleteOne'  }, { value: 'aggregate',  label: 'aggregate'  },
      ], defaultValue: 'find' },
      { key: 'filter',   label: 'Filter',   type: 'json', rows: 3, placeholder: '{"active": true}' },
      { key: 'update',   label: 'Update',   type: 'json', rows: 3, placeholder: '{"$set": {"status": "done"}}', hint: 'Update / updateMany only' },
      { key: 'pipeline', label: 'Pipeline', type: 'json', rows: 5, placeholder: '[{"$match": {}}, {"$group": {}}]', hint: 'Aggregate only' },
      { key: 'limit',    label: 'Limit',    type: 'number', placeholder: '100', defaultValue: 100 },
    ],
    defaultConfig: { operation: 'find', limit: 100 },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 250 + Math.random() * 350))
      return {
        documents: [{ _id: '64a1b2c3', name: 'Alice' }, { _id: '64a1b2c4', name: 'Bob' }],
        count: 2,
        collection: config.collection,
        operation: config.operation,
      }
    },
  },
  {
    type: 'db-redis',
    name: 'Redis Cache',
    description: 'Get, set, or delete keys in Redis',
    category: 'Database',
    color: 'from-red-600 to-red-700',
    icon: React.createElement(Server, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Value',  dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'any' }],
    fields: [
      { key: 'url',       label: 'Redis URL',  type: 'password', placeholder: 'redis://localhost:6379', required: true },
      { key: 'operation', label: 'Operation',  type: 'select',   options: [
        { value: 'get',    label: 'GET'    }, { value: 'set',    label: 'SET'    },
        { value: 'del',    label: 'DEL'    }, { value: 'exists', label: 'EXISTS' },
        { value: 'expire', label: 'EXPIRE' }, { value: 'hget',   label: 'HGET'   },
        { value: 'hset',   label: 'HSET'   }, { value: 'lpush',  label: 'LPUSH'  },
        { value: 'lrange', label: 'LRANGE' },
      ], defaultValue: 'get' },
      { key: 'key',   label: 'Key',            type: 'text',   placeholder: 'cache:user:{{id}}', required: true },
      { key: 'value', label: 'Value',           type: 'text',   placeholder: 'Value to store (SET only)' },
      { key: 'ttl',   label: 'TTL (seconds)',   type: 'number', placeholder: '3600', hint: 'SET only' },
    ],
    defaultConfig: { operation: 'get' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 50 + Math.random() * 100))
      if (config.operation === 'get')    return { key: config.key, value: input ?? null, hit: input !== null }
      if (config.operation === 'set')    return { key: config.key, ok: true }
      if (config.operation === 'del')    return { key: config.key, deleted: 1 }
      if (config.operation === 'exists') return { key: config.key, exists: true }
      return { ok: true }
    },
  },
]

dbNodes.forEach(registerNode)
