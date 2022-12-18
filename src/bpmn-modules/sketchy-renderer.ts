// Stolen from bpmn-js-sketchy, widdling it down to only what i need

import rough from 'roughjs/bin/rough';

import { assign } from 'min-dash';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import { getSemantic, getFillColor, getStrokeColor } from 'bpmn-js/lib/draw/BpmnRenderUtil';

import { query as domQuery } from 'min-dom';

import { append as svgAppend, attr as svgAttr, create as svgCreate, classes as svgClasses } from 'tiny-svg';

import Ids from 'ids';
import { is } from 'bpmn-js/lib/util/ModelUtil';

const RENDERER_IDS = new Ids();

class BpmnRenderer extends BaseRenderer {
  constructor(config: any, eventBus: any, styles: any, private canvas: any, private textRenderer: any, priority: any) {
    super(eventBus, 2);

    this.defaultFillColor = config.bpmnRenderer && config.bpmnRenderer.defaultFillColor;
    this.defaultStrokeColor = config.bpmnRenderer && config.bpmnRenderer.defaultStrokeColor;

    this.rc = rough.svg(canvas._svg);

    this.rendererId = RENDERER_IDS.next();

    this.markers = {} as any;

    this.computeStyle = styles.computeStyle;

    this.handlers = {
      'bpmn:SequenceFlow': function (parentGfx: any, element: any) {
        const pathData = this.createPathFromConnection(element);

        const fill = getFillColor(element, this.defaultFillColor),
          stroke = getStrokeColor(element, this.defaultStrokeColor);

        const attrs = {
          strokeLinejoin: 'round',
          markerEnd: this.marker('sequenceflow-end', fill, stroke),
          stroke: getStrokeColor(element, this.defaultStrokeColor),
          roughness: 0.1,
        };

        const path = this.drawPath(parentGfx, pathData, attrs, { isConnection: true });

        const sequenceFlow = getSemantic(element);

        let source: any;

        if (element.source) {
          source = element.source.businessObject;

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
      },
    };
  }

  addMarker(id: any, options: any) {
    const attrs = assign(
      {
        fill: 'black',
        strokeWidth: 1,
        strokeLinecap: 'round',
        strokeDasharray: 'none',
      },
      options.attrs
    );

    const ref = options.ref || { x: 0, y: 0 };

    const scale = options.scale || 1;

    // fix for safari / chrome / firefox bug not correctly
    // resetting stroke dash array
    if (attrs.strokeDasharray === 'none') {
      attrs.strokeDasharray = [10000, 1];
    }

    const marker = svgCreate('marker');

    svgAttr(options.element, attrs);

    svgAppend(marker, options.element);

    svgAttr(marker, {
      id: id,
      viewBox: '0 0 20 20',
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: 'auto',
    });

    let defs = domQuery('defs', this.canvas._svg);

    if (!defs) {
      defs = svgCreate('defs');

      svgAppend(this.canvas._svg, defs);
    }

    svgAppend(defs, marker);

    this.markers[id] = marker;
  }

  marker(type: any, fill: any, stroke: any) {
    const id = type + '-' + fill + '-' + stroke + '-' + this.rendererId;

    if (!this.markers[id]) {
      this.createMarker(type, fill, stroke);
    }

    return 'url(#' + id + ')';
  }

  createMarker(type: any, fill: any, stroke: any) {
    const id = type + '-' + fill + '-' + stroke + '-' + this.rendererId;

    if (type === 'sequenceflow-end') {
      const sequenceflowEnd = this.rc.path('M 1 5 L 11 10 L 1 15 Z', {
        roughness: 0.3,
        fillStyle: 'solid',
        fill: stroke,
        stroke: stroke,
      });

      this.addMarker(id, {
        element: sequenceflowEnd,
        ref: { x: 11, y: 10 },
        scale: 0.5,
        attrs: {
          fill: stroke,
          stroke: stroke,
        },
      });
    }

    if (type === 'messageflow-start') {
      const messageflowStart = this.rc.circle(6, 6, 5, {
        roughness: 0.3,
        fillStyle: 'solid',
        fill: fill,
        stroke: stroke,
      });

      this.addMarker(id, {
        element: messageflowStart,
        attrs: {
          fill: fill,
          stroke: stroke,
        },
        ref: { x: 6, y: 6 },
      });
    }

    if (type === 'messageflow-end') {
      const messageflowEnd = this.rc.path('m 1 5 l 0 -3 l 7 3 l -7 3 z', {
        roughness: 0.5,
        fillStyle: 'solid',
        fill: fill,
        stroke: stroke,
      });

      this.addMarker(id, {
        element: messageflowEnd,
        attrs: {
          fill: fill,
          stroke: stroke,
          strokeLinecap: 'butt',
        },
        ref: { x: 8.5, y: 5 },
      });
    }

    if (type === 'association-start') {
      const associationStart = this.rc.path('M 11 5 L 1 10 L 11 15', {
        roughness: 0.5,
        stroke: stroke,
      });

      this.addMarker(id, {
        element: associationStart,
        attrs: {
          fill: 'none',
          stroke: stroke,
          strokeWidth: 1.5,
        },
        ref: { x: 1, y: 10 },
        scale: 0.5,
      });
    }

    if (type === 'association-end') {
      const associationEnd = this.rc.path('M 1 5 L 11 10 L 1 15', {
        roughness: 0.5,
        stroke: stroke,
      });

      this.addMarker(id, {
        element: associationEnd,
        attrs: {
          fill: 'none',
          stroke: stroke,
          strokeWidth: 1.5,
        },
        ref: { x: 12, y: 10 },
        scale: 0.5,
      });
    }

    if (type === 'conditional-flow-marker') {
      const conditionalflowMarker = this.rc.path('M 0 10 L 8 6 L 16 10 L 8 14 Z', {
        roughness: 0.5,
        stroke: stroke,
      });

      this.addMarker(id, {
        element: conditionalflowMarker,
        attrs: {
          fill: fill,
          stroke: stroke,
        },
        ref: { x: -1, y: 10 },
        scale: 0.5,
      });
    }

    if (type === 'conditional-default-flow-marker') {
      const conditionaldefaultflowMarker = this.rc.path('M 6 4 L 10 16', {
        roughness: 0.5,
        stroke: stroke,
      });

      this.addMarker(id, {
        element: conditionaldefaultflowMarker,
        attrs: {
          stroke: stroke,
        },
        ref: { x: 0, y: 10 },
        scale: 0.5,
      });
    }
  }

  drawPath(parentGfx: any, d: any, attrs: any) {
    attrs = this.computeStyle(attrs, ['no-fill'], {
      strokeWidth: 2,
      stroke: 'black',
      fillStyle: 'solid',
    });

    const path = this.rc.path(d, attrs);

    svgAttr(path, attrs);

    svgAppend(parentGfx, path);

    return path;
  }

  renderer(type: any) {
    return this.handlers[type];
  }

  renderLabel(parentGfx: any, label: any, options: any) {
    options = assign(
      {
        size: {
          width: 100,
        },
      },
      options
    );

    const text = this.textRenderer.createText(label || '', options);

    svgClasses(text).add('djs-label');
    svgAppend(parentGfx, text);

    return text;
  }

  createPathFromConnection(connection: any) {
    const waypoints = connection.waypoints;

    let pathData = 'm  ' + waypoints[0].x + ',' + waypoints[0].y;
    for (let i = 1; i < waypoints.length; i++) {
      pathData += 'L' + waypoints[i].x + ',' + waypoints[i].y + ' ';
    }
    return pathData;
  }
}

// BpmnRenderer.$inject = ['config', 'eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer'];
BpmnRenderer.$inject = ['config', 'eventBus', 'styles', 'canvas', 'textRenderer'];

BpmnRenderer.prototype.canRender = function (element: any) {
  const canRender = is(element, 'bpmn:BaseElement');
  return canRender;
};

// BpmnRenderer.prototype.drawShape = function (parentGfx, element) {
//   const type = element.type;
//   const h = this.handlers[type];

//   /* jshint -W040 */
//   return h(parentGfx, element);
// };

// BpmnRenderer.prototype.drawConnection = function (parentGfx, element) {
//   const type = element.type;
//   const h = this.handlers[type];

//   /* jshint -W040 */
//   return h(parentGfx, element);
// };

// BpmnRenderer.prototype.getShapePath = function (element) {
//   if (is(element, 'bpmn:Event')) {
//     return getCirclePath(element);
//   }

//   if (is(element, 'bpmn:Activity')) {
//     return getRoundRectPath(element, TASK_BORDER_RADIUS);
//   }

//   if (is(element, 'bpmn:Gateway')) {
//     return getDiamondPath(element);
//   }

//   return getRectPath(element);
// };
export default {
  __init__: ['bpmnRenderer'],
  bpmnRenderer: ['type', BpmnRenderer],
};
