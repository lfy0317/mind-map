import {MindReact} from '../lib';
export const generateChildren = (num = 10) => {
  const result: MindReact.Node[] = []
  for (let counter = 0; counter < num; counter++) {
    const id = Math.floor(Math.random() * 1000000000).toString()
    result.push({
      attachData: id,
      draggable: true,
      type: 'CASE',
      id,
    })
  }
  return result
}
export const root: MindReact.TreeRoot = {
  attachData: 'root',
  id: 'root',

  children: [
    {
      attachData: 'p-1',
      id: 'p-1',
      type: 'DIR',
      children: [
        {
          attachData: 'p-1-1',
          id: 'p-1-1',
          type: 'CASE',
          children: [
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
              children: [
                {
                  attachData: Math.random().toFixed(6),
                  type: 'CASE',
                  id: Math.random().toString(),
                },
                ...generateChildren()
              ]
            },
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
              children: [
                {
                  attachData: Math.random().toFixed(6),
                  type: 'CASE',
                  id: Math.random().toString(),
                },
                ...generateChildren()
              ]
            },
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
              children: [
                {
                  attachData: Math.random().toFixed(6),
                  type: 'CASE',
                  id: Math.random().toString(),
                },
                ...generateChildren()
              ]
            },
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
            }
          ]
        },
        {
          attachData: 'p-1-2',
          id: 'p-1-2',
          type: 'CASE',
          children: [
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
            },
            ...generateChildren()
          ]
        },
        {
          attachData: 'p-1-3',
          id: 'p-1-3',
          type: 'CASE',
          children: [
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
            },
            ...generateChildren()
          ]
        },
      ]
    },
    {
      attachData: 'p-2',
      id: 'p-2',
      type: 'CASE',
      children: [
        {
          attachData: Math.random().toFixed(6),
          type: 'CASE',
          id: Math.random().toString(),
          children: [
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
              children: [
                {
                  attachData: Math.random().toFixed(6),
                  type: 'CASE',
                  id: Math.random().toString(),
                  children: [
                    {
                      attachData: Math.random().toFixed(6),
                      type: 'CASE',
                      id: Math.random().toString(),
                    },
                    ...generateChildren(20)
                  ]
                },
              ]
            },
          ]
        },
      ]
    },
    {
      attachData: 'p-3',
      id: 'p-3',
      type: 'CASE',
      children: [
        ...generateChildren(5),
        {
          attachData: Math.random().toFixed(6),
          type: 'CASE',
          id: Math.random().toString(),
          children: [
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
              children: [
                {
                  attachData: Math.random().toFixed(6),
                  type: 'CASE',
                  id: Math.random().toString(),
                  children: [
                    {
                      attachData: Math.random().toFixed(6),
                      type: 'CASE',
                      id: Math.random().toString(),
                    },
                    ...generateChildren(20)
                  ]
                },
              ]
            },
          ]
        },
      ]
    },
    {
      attachData: 'p-4',
      id: 'p-4',
      type: 'CASE',
      children: [
        ...generateChildren(5),
        {
          attachData: Math.random().toFixed(6),
          type: 'CASE',
          id: Math.random().toString(),
          children: [
            {
              attachData: Math.random().toFixed(6),
              type: 'CASE',
              id: Math.random().toString(),
              children: [
                {
                  attachData: Math.random().toFixed(6),
                  type: 'CASE',
                  id: Math.random().toString(),
                  children: [
                    {
                      attachData: Math.random().toFixed(6),
                      type: 'CASE',
                      id: Math.random().toString(),
                    },
                    ...generateChildren(20)
                  ]
                },
              ]
            },
          ]
        },
      ]
    }
  ]
}
