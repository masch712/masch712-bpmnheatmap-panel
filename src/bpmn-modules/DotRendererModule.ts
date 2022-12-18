import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import { dataURL } from './nyan-cat';

import { append as svgAppend, create as svgCreate } from 'tiny-svg';

class DotRenderer extends BaseRenderer {
  constructor(eventBus: any) {
    super(eventBus, 1501);
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

  drawConnection(visuals: any, connection: any, attrs: any) {
    //TODO: implement this, but first see if it even gets called?
  };
}

DotRenderer.$inject = ['eventBus'];

export const DotRendererModule = {
  __init__: ['dotRenderer'],
  dotRenderer: ['type', DotRenderer],
};
