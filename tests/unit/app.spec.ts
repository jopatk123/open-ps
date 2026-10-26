import { mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import App from '../../src/app/App.vue';

let wrapper: VueWrapper;

function key(code: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init }),
  );
  return nextTick();
}

function namedKey(keyName: string, target: EventTarget = document.activeElement ?? document.body) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true }),
  );
  return nextTick();
}

function pointer(el: Element, type: string, init: PointerEventInit = {}) {
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }));
  return nextTick();
}

const activeTool = () => wrapper.find('.tool.active').attributes('data-tool');
const dialog = () => wrapper.find('[role="dialog"]');
const dialogTitle = () => dialog().find('.title').text();

beforeEach(() => {
  document.body.innerHTML = '';
  wrapper = mount(App, { global: { plugins: [createPinia()] }, attachTo: document.body });
});

afterEach(() => wrapper.unmount());

describe('菜单栏', () => {
  it('6 个菜单，点击打开、悬停切换、Esc 与点击外部关闭', async () => {
    const titles = wrapper.findAll('.menu-title');
    expect(titles.map((t) => t.text())).toEqual(['文件', '编辑', '图像', '图层', '选择', '特效']);

    await pointer(titles[0]!.element, 'pointerdown');
    expect(wrapper.find('.dropdown').text()).toContain('新建…');
    expect(wrapper.find('[data-command="file.new"] .shortcut').text()).toBe('Alt+Ctrl+N');

    await pointer(titles[1]!.element, 'pointerenter');
    expect(wrapper.find('.dropdown').attributes('aria-label')).toBe('编辑');

    await namedKey('Escape', window);
    expect(wrapper.find('.dropdown').exists()).toBe(false);

    await pointer(titles[2]!.element, 'pointerdown');
    expect(wrapper.find('.dropdown').exists()).toBe(true);
    await pointer(document.body, 'pointerdown');
    expect(wrapper.find('.dropdown').exists()).toBe(false);
  });

  it('没有打开菜单时，悬停不会打开', async () => {
    await pointer(wrapper.findAll('.menu-title')[1]!.element, 'pointerenter');
    expect(wrapper.find('.dropdown').exists()).toBe(false);
  });

  it('禁用项置灰且点击无效；可用的未实现命令弹出提示', async () => {
    await pointer(wrapper.findAll('.menu-title')[1]!.element, 'pointerdown');
    const fill = wrapper.find('[data-command="edit.contentAwareFill"]');
    expect(fill.classes()).toContain('disabled');
    await fill.trigger('click');
    expect(wrapper.find('.dropdown').exists()).toBe(true);

    await wrapper.find('[data-command="edit.freeTransform"]').trigger('click');
    expect(wrapper.find('.dropdown').exists()).toBe(false);
    expect(wrapper.find('.toast').text()).toBe('该功能将在后续版本提供');
  });

  it('文件 › 新建… 打开对话框', async () => {
    await pointer(wrapper.findAll('.menu-title')[0]!.element, 'pointerdown');
    await wrapper.find('[data-command="file.new"]').trigger('click');
    expect(dialogTitle()).toBe('新建');
    expect((dialog().find('#new-name').element as HTMLInputElement).value).toBe('未命名-3');
  });
});

describe('对话框', () => {
  it.each([
    [{ code: 'KeyN', ctrlKey: true, altKey: true }, '新建'],
    [{ code: 'KeyO', ctrlKey: true }, '打开'],
    [{ code: 'KeyS', ctrlKey: true, shiftKey: true }, '导出（另存为）'],
  ])('快捷键 %o 打开「%s」，Esc 关闭', async (init, title) => {
    await key(init.code, init);
    expect(dialogTitle()).toBe(title);
    await namedKey('Escape');
    expect(dialog().exists()).toBe(false);
  });

  it('Enter 确定并关闭', async () => {
    await key('KeyN', { ctrlKey: true, altKey: true });
    expect(document.activeElement?.id).toBe('new-name');
    await namedKey('Enter');
    expect(dialog().exists()).toBe(false);
  });

  it('确定 / 取消 按钮都只关闭', async () => {
    await key('KeyO', { ctrlKey: true });
    await dialog().find('[data-dialog-ok]').trigger('click');
    expect(dialog().exists()).toBe(false);
    await key('KeyS', { ctrlKey: true });
    await dialog().find('[data-dialog-cancel]').trigger('click');
    expect(dialog().exists()).toBe(false);
  });

  it('拖动标题栏移动对话框', async () => {
    await key('KeyO', { ctrlKey: true });
    const bar = dialog().find('.titlebar').element;
    await pointer(bar, 'pointerdown', { clientX: 100, clientY: 100 });
    await pointer(bar, 'pointermove', { clientX: 160, clientY: 130 });
    await pointer(bar, 'pointerup', { clientX: 160, clientY: 130 });
    expect((dialog().element as HTMLElement).style.transform).toBe('translate(60px, 30px)');
  });

  it('对话框打开时字母键不切换工具', async () => {
    await key('KeyO', { ctrlKey: true });
    await key('KeyB', {}, document.body);
    expect(activeTool()).toBe('move');
  });

  it('前景色色块打开拾色器，十六进制可修改颜色', async () => {
    await wrapper.find('.fg-swatch').trigger('click');
    expect(dialogTitle()).toBe('拾色器（前景色）');
    const hex = dialog().find('.hex input');
    await hex.setValue('ff0000');
    await dialog().find('[data-dialog-ok]').trigger('click');
    expect(wrapper.find('.fg-swatch').attributes('style')).toContain('rgb(255, 0, 0)');

    await key('KeyD');
    expect(wrapper.find('.fg-swatch').attributes('style')).toContain('rgb(0, 0, 0)');
  });
});

describe('工具栏与选项栏', () => {
  it('字母键切换工具并高亮，选项栏随之变化', async () => {
    expect(activeTool()).toBe('move');
    await key('KeyW');
    expect(activeTool()).toBe('magicWand');
    expect(wrapper.find('.options-bar').text()).toContain('容差:');
    await key('KeyB');
    expect(wrapper.find('.options-bar').text()).toContain('硬度:');
    await key('KeyT');
    expect(wrapper.find('.options-bar').attributes('data-tool')).toBe('text');
  });

  it('悬停提示为「移动工具 (V)」格式，点击切换', async () => {
    const tools = wrapper.findAll('.tool');
    expect(tools).toHaveLength(10);
    expect(tools[0]!.attributes('title')).toBe('移动工具 (V)');
    await tools[3]!.trigger('click');
    expect(activeTool()).toBe('crop');
  });

  it('在选项栏输入框里打字不切换工具', async () => {
    await key('KeyW');
    const input = wrapper.find('.options-bar input[type="text"]').element;
    await key('KeyB', {}, input);
    expect(activeTool()).toBe('magicWand');
  });
});

describe('文档标签与图层面板（mock）', () => {
  it('标签切换与关闭', async () => {
    const tabs = () => wrapper.findAll('.tab');
    expect(tabs().map((t) => t.find('.title').text())).toEqual([
      '未命名-1 @ 100% (图层 2, RGB/8)',
      '未命名-2 @ 100% (图层 1, RGB/8)',
    ]);
    await pointer(tabs()[1]!.element, 'pointerdown');
    expect(tabs()[1]!.classes()).toContain('active');
    expect(wrapper.find('.status-bar').text()).toContain('1280 × 720 像素');
    await tabs()[1]!.find('.close').trigger('click');
    expect(tabs()).toHaveLength(1);
    expect(wrapper.find('.status-bar').text()).toContain('1920 × 1080 像素');
  });

  it('选中、显隐、新建、删除、重命名', async () => {
    const rows = () => wrapper.findAll('.layer-row');
    const rowNames = () => rows().map((r) => r.attributes('data-layer'));
    expect(rowNames()).toEqual(['图层 2', '文字', '背景']);

    await pointer(rows()[1]!.element, 'pointerdown');
    await pointer(window as unknown as Element, 'pointerup');
    expect(rows()[1]!.classes()).toContain('active');
    expect(wrapper.find('.tab.active .title').text()).toBe('未命名-1 @ 100% (文字, RGB/8)');

    await rows()[2]!.find('.eye').trigger('click');
    expect(rows()[2]!.find('.eye').attributes('aria-pressed')).toBe('false');

    await wrapper.find('[aria-label="创建新图层"]').trigger('click');
    expect(rowNames()).toEqual(['图层 2', '图层 3', '文字', '背景']);

    await wrapper.find('[aria-label="删除图层"]').trigger('click');
    expect(rowNames()).toEqual(['图层 2', '文字', '背景']);

    await rows()[0]!.find('.name').trigger('dblclick');
    await nextTick();
    const input = rows()[0]!.find('input.rename');
    expect(document.activeElement).toBe(input.element);
    await key('KeyB', {}, input.element);
    expect(activeTool()).toBe('move');
    await input.setValue('天空');
    await input.trigger('keydown', { key: 'Enter' });
    expect(rowNames()[0]).toBe('天空');
  });
});
