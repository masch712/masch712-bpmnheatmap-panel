import React, { useEffect, useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import Viewer from 'bpmn-js';
import { DotBpmnRendererModule } from 'bpmn-modules/DotBpmnRendererModule';

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
    '@keyframes followpath': css`
      to {
        motion-offset: 100%;
        offset-distance: 100%;
      }
    `
  };
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  // const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const bpmnContainer = useRef(null);

  useEffect(() => {
    (async () => {
      //TODO: this path is probably trash
      const sampleBpmnResponse = await fetch('/public/plugins/masch712-bpmnheatmap-panel/static/sample.bpmn');
      const sampleBpmnXml = await sampleBpmnResponse.text();
      const viewer = new Viewer({ container: bpmnContainer.current, additionalModules: [ DotBpmnRendererModule ] });
      await viewer.importXML(sampleBpmnXml, 'BPMNDiagram_1');
      // Overlays seem sketchy.  They end up in a <div> sibling to the main bpmn <svg>.  Don't love it.
      // const overlays = viewer.get('overlays');
      // overlays.add('SequenceFlow_1', {
      //   position: {
      //     top: 0,
      //     left: 0
      //   },
      //   html: `<svg><circle id="SequenceFlow_1_dot" cx="0%" cy="0%" r="15"></circle></svg>`
      // });
      viewer.get('canvas').zoom('fit-viewport');
      console.log('loaded');
    })();
  }, []);

  return (
    <div
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
