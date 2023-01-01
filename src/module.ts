import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addNumberInput({
      path: 'animationDurationMultiple',
      name: 'Animation duration multiple',
      description: 'Mutliply animation durations (in millis) by this value before rendering',
      defaultValue: 20,
    })
    .addTextInput({
      name: "BPMN XML",
      path: "bpmnXmlContent",
    })
    .addNestedOptions({
      category: ['Dot Colors'],
      path: 'dotColorOpts',
      build: (builder, context) => {
        builder.addColorPicker({
          path: 'dotColor',
          name: 'Dot color',
        }).addFieldNamePicker({
          path: 'fieldName',
          name: 'Field name',
        })
      }
    })
});
