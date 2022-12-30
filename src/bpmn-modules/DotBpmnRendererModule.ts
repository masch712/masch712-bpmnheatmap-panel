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
    const {dotFlowConfigs} = this.dotFlowProvider.getFlowForConnection(connection.id);
    //TOOD: use tiny-svg sugar here (like svgAttr, svgAppend, etc)
    for (let iDot = 0; iDot < dotFlowConfigs.length; iDot++) {
      const dotFlowConfig = dotFlowConfigs[iDot];
        const animationLengthSecs = dotFlowConfig.animationDurationMillis / 1000;
      const dotElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');;
      dotElement.setAttribute("id", dotId);
      dotElement.setAttribute('cx', '0%');
      dotElement.setAttribute('cy', '0%');
      dotElement.setAttribute('r', dotFlowConfig.radius.toString());
      // TODO: is there a chance this animation-delay can overlap dots?
      dotElement.setAttribute('style', `fill: red; offset-path: path("${pathDefinition}"); animation: followpath ${animationLengthSecs}s linear infinite; animation-delay: -${iDot*animationLengthSecs/dotFlowConfigs.length}s`);
      pathElement.parentElement?.appendChild(dotElement);
    }
    return pathElement;
  }
}

export const DotBpmnRendererModule = {
  __init__: ['dotBpmnRenderer'],
  dotBpmnRenderer: ['type', DotBpmnRenderer],
};

type percentiles = 25 | 50 | 75 | 90; //TODO: can i must name bhtis a number type?
type elasticsearchPercentileDataframeFieldName = `p${percentiles}.0 processVariables._millisSinceLastTransition`;
class DotFlowProvider {
  dataFrameViewOfTransitionCounts: DataFrameView<{'currentTransitionId.keyword': string, 'Count': number}>;
  dataFrameViewOfTransitionDurations: DataFrameView<{[key in elasticsearchPercentileDataframeFieldName]: number} & { 'currentTransitionId.keyword': string}>;
  countByTransitionId: {[transitionId: string]: number};
  millisPercentilesByTransitionId: {[transitionId: string]: {[key in percentiles]: number}} = {};
  maxCount: number;
  constructor(data: PanelData) {
    // map connection IDs to dot sizes
    this.dataFrameViewOfTransitionCounts = new DataFrameView(data.series[0]);
    this.dataFrameViewOfTransitionDurations = new DataFrameView(data.series[1]);
    
    this.maxCount = 0;
    this.countByTransitionId = {};
    this.dataFrameViewOfTransitionCounts.forEach(entry => {
      this.maxCount = max([entry.Count, this.maxCount])!;
      this.countByTransitionId[entry['currentTransitionId.keyword']] = entry.Count; //TODO: make this configurable
    });
    this.dataFrameViewOfTransitionDurations.forEach(entry => {
      this.millisPercentilesByTransitionId[entry['currentTransitionId.keyword']] = {
        "25": entry['p25.0 processVariables._millisSinceLastTransition'],
        "50": entry['p50.0 processVariables._millisSinceLastTransition'],
        "75": entry['p75.0 processVariables._millisSinceLastTransition'],
        "90": entry['p90.0 processVariables._millisSinceLastTransition'],
      }
    })
  }
  getFlowForConnection(connectionId: string) {
    //TODO: calculate size and speed for each dot
    const numDots = this.countByTransitionId[connectionId];
    const dotFlowConfigs: Array<{radius: number, animationDurationMillis: number}> = [];
    for (let iDot = 0; iDot < numDots; iDot++) {
      let animationDurationMillis = 0;
      const animationDurationFactor = 10; //TODO: parameterize
      //TODO: think about this:
      if (iDot >= .9 * numDots) {
        animationDurationMillis = this.millisPercentilesByTransitionId[connectionId][90];
      } else if (iDot >= .75 * numDots) {
        animationDurationMillis = this.millisPercentilesByTransitionId[connectionId][75];
      } else if (iDot >= .5 * numDots) {
        animationDurationMillis = this.millisPercentilesByTransitionId[connectionId][50];
      } else {
        animationDurationMillis = this.millisPercentilesByTransitionId[connectionId][25];
      } 
      dotFlowConfigs.push({
        radius: 3, //TODO: normalize based on maxCount?
        animationDurationMillis: animationDurationMillis * animationDurationFactor
      });
    }
    return {
      dotFlowConfigs,
    }
  }
}

export const DotFlowModule = {
  __init__: ['dotFlowProvider'], //TODO: what's all these __init__ s for? 
  dotFlowProvider: ['type', DotFlowProvider]
}
