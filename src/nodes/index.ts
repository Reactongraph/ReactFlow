import InputNode      from './InputNode'
import OutputNode     from './OutputNode'
import ProcessingNode from './ProcessingNode'
import ApiNode        from './ApiNode'
import TransformNode  from './TransformNode'
import DecisionNode   from './DecisionNode'
import AiNode         from './AiNode'

export {
  InputNode,
  OutputNode,
  ProcessingNode,
  ApiNode,
  TransformNode,
  DecisionNode,
  AiNode,
}

export const nodeTypes = {
  input:      InputNode,
  output:     OutputNode,
  processing: ProcessingNode,
  api:        ApiNode,
  transform:  TransformNode,
  decision:   DecisionNode,
  ai:         AiNode,
}
