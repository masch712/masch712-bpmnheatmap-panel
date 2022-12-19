import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { black, getFillColor, getStrokeColor } from 'bpmn-js/lib/draw/BpmnRenderUtil';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import { dataURL } from './nyan-cat';

import { append as svgAppend, create as svgCreate, attr as svgAttr } from 'tiny-svg';

function colorEscape(str) {

  // only allow characters and numbers
  return str.replace(/[^0-9a-zA-z]+/g, '_');
}
class DotRenderer extends BaseRenderer {
  constructor(eventBus: any, private styles: any, private config: any) {
    super(eventBus, 1501);
    this.defaultFillColor = this.config && this.config.defaultFillColor;
    this.defaultStrokeColor = this.config && this.config.defaultStrokeColor;
    this.defaultLabelColor = this.config && this.config.defaultLabelColor;
    this.rendererId = RENDERER_IDS.next();
  }

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

  private marker(type: any, fill: any, stroke: any) {
    const id = type + '-' + colorEscape(fill) + '-' + colorEscape(stroke) + '-' + rendererId;

    if (!markers[id]) {
      createMarker(id, type, fill, stroke);
    }

    return 'url(#' + id + ')';
  }

  private drawPath(parentGfx: any, d: any, attrs: any) {
    attrs = this.styles.computeStyle(attrs, ['no-fill'], {
      strokeWidth: 2,
      stroke: black,
    });

    const path = svgCreate('path');
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(parentGfx, path);

    return path;
  }

  drawConnection(visuals: any, connection: any) {
    console.log('drawConnection');
    // EventBus.js makes it clear that it stops calling renderers when it encou ters a drawConnection function that returns something: https://github.com/bpmn-io/diagram-js/blob/v11.4.1/lib/core/EventBus.js#L373-L377
    // from https://github.com/bpmn-io/bpmn-js/blob/v11.1.0/lib/draw/BpmnRenderer.js#L1360-L1398
    const pathData = this.createPathFromConnection(connection);

    const fill = getFillColor(connection, this.defaultFillColor),
      stroke = getStrokeColor(connection, this.defaultStrokeColor);

    const attrs = {
      strokeLinejoin: 'round',
      markerEnd: marker('sequenceflow-end', fill, stroke),
      stroke: getStrokeColor(connection, this.defaultStrokeColor),
    };

    const path = drawPath(parentGfx, pathData, attrs);

    const sequenceFlow = getSemantic(connection);

    let source;

    if (connection.source) {
      source = connection.source.businessObject;

      // conditional flow marker
      if (sequenceFlow.conditionExpression && source.$instanceOf('bpmn:Activity')) {
        svgAttr(path, {
          markerStart: marker('conditional-flow-marker', fill, stroke),
        });
      }

      // default marker
      if (
        source.default &&
        (source.$instanceOf('bpmn:Gateway') || source.$instanceOf('bpmn:Activity')) &&
        source.default === sequenceFlow
      ) {
        svgAttr(path, {
          markerStart: marker('conditional-default-flow-marker', fill, stroke),
        });
      }
    }

    return path;
  }
}

DotRenderer.$inject = ['eventBus', 'styles', 'config'];

export const DotRendererModule = {
  __init__: ['dotRenderer'],
  dotRenderer: ['type', DotRenderer],
};
