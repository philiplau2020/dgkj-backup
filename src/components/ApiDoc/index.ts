/**
 * API 文档参数组件
 */
export const ApiParam = defineComponent({
  name: 'ApiParam',
  props: {
    name: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false },
    desc: { type: String, default: '' },
  },
  setup(props) {
    return () => h('div', { class: 'api-param' }, [
      h('span', { class: 'param-name' }, props.name),
      h('code', { class: 'param-type' }, props.type),
      props.required && h('span', { class: 'param-required' }, '*'),
      h('span', { class: 'param-desc' }, props.desc),
    ]);
  },
});

/**
 * API 文档组件
 */
export const ApiDoc = defineComponent({
  name: 'ApiDoc',
  props: {
    title: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    description: { type: String, default: '' },
  },
  setup(props, { slots }) {
    const methodColor = computed(() => {
      const colors: Record<string, string> = {
        GET: '#1890ff',
        POST: '#52c41a',
        PUT: '#faad14',
        DELETE: '#ff4d4f',
        PATCH: '#722ed1',
      };
      return colors[props.method] || '#1890ff';
    });

    return () => h(Card, { 
      class: 'api-doc-card',
      size: 'small',
      title: [
        h('div', { class: 'api-doc-header' }, [
          h('span', { 
            class: 'api-method',
            style: { backgroundColor: methodColor.value }
          }, props.method),
          h('code', { class: 'api-path' }, props.path),
          h('span', { class: 'api-title' }, props.title),
        ]),
      ],
    }, () => [
      props.description && h('div', { class: 'api-doc-desc' }, props.description),
      slots.params && h('div', { class: 'api-doc-section' }, [
        h('h4', '请求参数'),
        h('div', { class: 'api-params' }, slots.params()),
      ]),
      slots.response && h('div', { class: 'api-doc-section' }, [
        h('h4', '响应示例'),
        h('pre', { class: 'api-response' }, slots.response()),
      ]),
    ]);
  },
});
