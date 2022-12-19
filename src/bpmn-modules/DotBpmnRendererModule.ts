import { is } from 'bpmn-js/lib/util/ModelUtil';


import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';
import '../css/animation-keyframes.css';

class DotBpmnRenderer extends BpmnRenderer {
  constructor(
    config: any /* RendererOptions | null */,
    eventBus: any,
    styles: any /* Styles */,
    pathMap: any,
    canvas: any,
    textRenderer: any,
  ) {
    super(config, eventBus, styles, pathMap, canvas, textRenderer, 1500);
  }

  static $inject: string[] = ['config', 'eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer'];

  canRender(element: any) {
    return is(element, 'bpmn:SequenceFlow');
  }

  drawConnection(visuals: any, connection: any) {
    console.log('drawConnection');
    const pathElement = super.drawConnection(visuals, connection);
    const pathDefinition = pathElement.getAttribute('d');
    const dotId = `${connection.id}_dot`;
    //TOOD: use tiny-svg sugar here (like svgAttr, svgAppend, etc)
    const dotElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');;
    dotElement.setAttribute("id", dotId);
    dotElement.setAttribute('cx', '0%');
    dotElement.setAttribute('cy', '0%');
    dotElement.setAttribute('r', '15');
    dotElement.setAttribute('style', `fill: red; offset-path: path("${pathDefinition}"); animation: followpath 4s linear infinite;`);
    pathElement.parentElement?.appendChild(dotElement);
    return pathElement;
  }
}

export const DotBpmnRendererModule = {
  __init__: ['dotBpmnRenderer'],
  dotBpmnRenderer: ['type', DotBpmnRenderer],
};
