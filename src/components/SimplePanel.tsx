import React, { useEffect, useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import Viewer from 'bpmn-js';
import { DotBpmnRendererModule, DotFlowModule } from 'bpmn-modules/DotBpmnRendererModule';

interface Props extends PanelProps<SimpleOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
  };
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  // const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const bpmnContainer = useRef(null);

  useEffect(() => {
    (async () => {
      //TODO: this path is probably trash
      const sampleBpmnResponse = await fetch('/public/plugins/masch712-bpmnheatmap-panel/static/simple.bpmn');
      const sampleBpmnXml = await sampleBpmnResponse.text();
      const viewer = new Viewer({ container: bpmnContainer.current, additionalModules: [ DotBpmnRendererModule, DotFlowModule, { data: ['value', data] } ] });
      await viewer.importXML(sampleBpmnXml, 'BPMNDiagram_1');
      viewer.get('canvas').zoom('fit-viewport');
      console.log('loaded');
    })();
  }, [data]);

  return (
    <div id='panel-wrapper'
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <div ref={bpmnContainer} />
      {/* <svg
        className={styles.svg}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`-${width / 2} -${height / 2} ${width} ${height}`}
      >
        <g>
          <circle style={{ fill: theme.colors.secondary.main }} r={100} />
        </g>
      </svg>

      <div className={styles.textBox}>
        {options.showSeriesCount && <div>Number of series: {data.series.length}</div>}
        <div>Text option value: {options.text}</div>
      </div> */}
    </div>
  );
};
