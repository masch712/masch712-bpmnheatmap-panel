import React, { useEffect, useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import Viewer from 'bpmn-js';
import { DotBpmnRendererModule, DotFlowModule } from 'bpmn-modules/DotBpmnRendererModule';

interface Props extends PanelProps<SimpleOptions> { }

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
  const bpmnViewer = useRef<Viewer|null>(null);

  useEffect(() => {
    (async () => {
      //TODO: this path is probably trash
      if (bpmnViewer != null) {
        bpmnViewer.current?.destroy();
      }
      const sampleBpmnResponse = await fetch('/public/plugins/masch712-bpmnheatmap-panel/static/simple.bpmn');
      const sampleBpmnXml = await sampleBpmnResponse.text();
      bpmnViewer.current = new Viewer({ container: bpmnContainer.current, additionalModules: [DotBpmnRendererModule, DotFlowModule, { data: ['value', data] }] });
      await bpmnViewer.current.importXML(sampleBpmnXml, 'BPMNDiagram_1');
      bpmnViewer.current.get('canvas').zoom('fit-viewport');
    })();
  }, [data]);
  // TODO: re-render on panel resize

  return (
    <div id='panel-wrapper'
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
      ref={bpmnContainer}
    />
  );
};
