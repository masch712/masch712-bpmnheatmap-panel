import { is } from 'bpmn-js/lib/util/ModelUtil';


import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';
import '../css/animation-keyframes.css';
import { DataFrameView, PanelData } from '@grafana/data';
import { max } from 'lodash';

class DotBpmnRenderer extends BpmnRenderer {
  constructor(
    config: any /* RendererOptions | null */,
    eventBus: any,
    styles: any /* Styles */,
    pathMap: any,
    canvas: any,
    textRenderer: any,
    private dotFlowProvider: DotFlowProvider
  ) {
    super(config, eventBus, styles, pathMap, canvas, textRenderer, 1500);
  }

  static $inject: string[] = ['config', 'eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer', 'dotFlowProvider'];

  canRender(element: any) {
    return is(element, 'bpmn:SequenceFlow');
  }

  drawConnection(visuals: any, connection: any) {
    console.log('drawConnection');
    const pathElement = super.drawConnection(visuals, connection);
    const pathDefinition = pathElement.getAttribute('d');
    const dotId = `${connection.id}_dot`;
    const dotFlow = this.dotFlowProvider.getFlowForConnection(connection.id);
    const animationLengthSecs = 5;
    //TOOD: use tiny-svg sugar here (like svgAttr, svgAppend, etc)
    for (let iDot = 0; iDot < dotFlow.numDots; iDot++) {
      
      const dotElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');;
      dotElement.setAttribute("id", dotId);
      dotElement.setAttribute('cx', '0%');
      dotElement.setAttribute('cy', '0%');
      dotElement.setAttribute('r', dotFlow.dotRadius.toString());
      dotElement.setAttribute('style', `fill: red; offset-path: path("${pathDefinition}"); animation: followpath ${animationLengthSecs}s linear infinite; animation-delay: -${iDot*animationLengthSecs/dotFlow.numDots}s`);
      pathElement.parentElement?.appendChild(dotElement);
    }
    return pathElement;
  }
}

export const DotBpmnRendererModule = {
  __init__: ['dotBpmnRenderer'],
  dotBpmnRenderer: ['type', DotBpmnRenderer],
};

class DotFlowProvider {
  dataFrameView: DataFrameView<{'currentTransitionId.keyword': string, 'Count': number}>;
  countByTransitionId: {[transitionId: string]: number};
  maxCount: number;
  constructor(data: PanelData) {
    // map connection IDs to dot sizes
    this.dataFrameView = new DataFrameView(data.series[0]);
    
    this.maxCount = 0;
    this.countByTransitionId = {};
    this.dataFrameView.forEach(entry => {
      this.maxCount = max([entry.Count, this.maxCount])!;
      this.countByTransitionId[entry['currentTransitionId.keyword']] = entry.Count; //TODO: make this configurable
    });
  }
  getFlowForConnection(connectionId: string) {
    console.log();
    return {
      // dotRadius: (this.countByTransitionId[connectionId] / this.maxCount) * 10,
      dotRadius: 3,
      numDots: this.countByTransitionId[connectionId]
    };
  }
}

export const DotFlowModule = {
  __init__: ['dotFlowProvider'], //TODO: what's all these __init__ s for? 
  dotFlowProvider: ['type', DotFlowProvider]
}
