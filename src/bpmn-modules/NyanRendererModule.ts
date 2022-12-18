import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import { dataURL } from './nyan-cat';

import { append as svgAppend, create as svgCreate } from 'tiny-svg';

class NyanRenderer extends BaseRenderer {
  constructor(eventBus: any) {
    super(eventBus, 1500);
  }

  canRender(element: any) {
    return is(element, 'bpmn:Task');
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
}

NyanRenderer.$inject = ['eventBus'];

export const NyanRendererModule = {
  __init__: ['nyanRenderer'],
  nyanRenderer: ['type', NyanRenderer],
};
