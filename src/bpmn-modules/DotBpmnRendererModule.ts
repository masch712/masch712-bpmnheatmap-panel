import { is } from 'bpmn-js/lib/util/ModelUtil';

import { dataURL } from './nyan-cat';

import { append as svgAppend, create as svgCreate, attr as svgAttr } from 'tiny-svg';
import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';
import { getSemantic, getFillColor, getStrokeColor } from 'bpmn-js/lib/draw/BpmnRenderUtil';

class DotBpmnRenderer extends BpmnRenderer {
  constructor(
    config: any /* RendererOptions | null */,
    eventBus: any,
    styles: any /* Styles */,
    pathMap: any,
    canvas: any,
    textRenderer: any,
    rendererPriority?: number
  ) {
    super(config, eventBus, styles, pathMap, canvas, textRenderer, 1500);
    //TODO: https://usefulangle.com/post/39/adding-css-to-stylesheet-with-javascript#:~:text=Adding%20a%20New%20CSS%20Rule,rule%20to%20the%20stylesheet%20sheet.
  }

  static $inject: string[] = ['config', 'eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer'];

  canRender(element: any) {
    return is(element, 'bpmn:Task') || is(element, 'bpmn:SequenceFlow');
  }

  drawShape(parent: any, shape: any) {
    const url = dataURL;

    const catGfx = svgCreate('image', {
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      href: url,
    }) as SVGElement;

    svgAppend(parent, catGfx);

    return catGfx;
  }

  private createPathFromConnection(connection: any) {
    const waypoints = connection.waypoints;

    let pathData = 'm  ' + waypoints[0].x + ',' + waypoints[0].y;
    for (let i = 1; i < waypoints.length; i++) {
      pathData += 'L' + waypoints[i].x + ',' + waypoints[i].y + ' ';
    }
    return pathData;
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

    // EventBus.js makes it clear that it stops calling renderers when it encou ters a drawConnection function that returns something: https://github.com/bpmn-io/diagram-js/blob/v11.4.1/lib/core/EventBus.js#L373-L377
    // from https://github.com/bpmn-io/bpmn-js/blob/v11.1.0/lib/draw/BpmnRenderer.js#L1360-L1398
    const pathData = this.createPathFromConnection(connection);

    const fill = getFillColor(connection, this.defaultFillColor),
      stroke = getStrokeColor(connection, this.defaultStrokeColor);

    const attrs = {
      strokeLinejoin: 'round',
      markerEnd: this.marker('sequenceflow-end', fill, stroke),
      stroke: getStrokeColor(connection, this.defaultStrokeColor),
    };

    const path = this.drawPath(visuals, pathData, attrs);

    const sequenceFlow = getSemantic(connection);

    let source;

    if (connection.source) {
      source = connection.source.businessObject;

      // conditional flow marker
      if (sequenceFlow.conditionExpression && source.$instanceOf('bpmn:Activity')) {
        svgAttr(path, {
          markerStart: this.marker('conditional-flow-marker', fill, stroke),
        });
      }

      // default marker
      if (
        source.default &&
        (source.$instanceOf('bpmn:Gateway') || source.$instanceOf('bpmn:Activity')) &&
        source.default === sequenceFlow
      ) {
        svgAttr(path, {
          markerStart: this.marker('conditional-default-flow-marker', fill, stroke),
        });
      }
    }

    return path;
  }
}

export const DotBpmnRendererModule = {
  __init__: ['dotBpmnRenderer'],
  dotBpmnRenderer: ['type', DotBpmnRenderer],
};
