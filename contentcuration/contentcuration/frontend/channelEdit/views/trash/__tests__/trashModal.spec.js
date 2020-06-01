import { mount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import VueRouter from 'vue-router';
import TrashModal from '../TrashModal';
import { RouterNames } from '../../../constants';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(VueRouter);

const currentChannelGetters = {
  currentChannel: jest.fn(),
  trashId: jest.fn(),
};
const contentNodeGetters = {
  getContentNodeChildren: jest.fn(),
};
const contentNodeActions = {
  deleteContentNodes: jest.fn(),
  loadTrashTree: jest.fn(),
  loadContentNodes: jest.fn(),
};
const contentNodeMutations = {
  SET_MOVE_NODES: jest.fn(),
};

const store = new Store({
  modules: {
    currentChannel: {
      namespaced: true,
      getters: currentChannelGetters,
    },
    contentNode: {
      namespaced: true,
      getters: contentNodeGetters,
      mutations: contentNodeMutations,
      actions: contentNodeActions,
    },
  },
});

const testChildren = [
  {
    id: 'test1',
    title: 'Item',
    kind: 'video',
    modified: new Date(2020, 1, 20),
  },
  {
    id: 'test2',
    title: 'Item',
    kind: 'audio',
    modified: new Date(2020, 2, 1),
  },
  {
    id: 'test3',
    title: 'Topic',
    kind: 'topic',
    modified: new Date(2020, 1, 1),
  },
];

const router = new VueRouter({
  routes: [
    {
      name: 'PARENT_ROUTE',
      path: '/',
      children: [
        {
          name: RouterNames.TRASH,
          path: 'trash',
          component: TrashModal,
          props: true,
        },
      ],
    },
  ],
});

function makeWrapper(items) {
  return mount(TrashModal, {
    store,
    router,
    computed: {
      currentChannel() {
        return {
          id: 'current channel',
        };
      },
      trashId() {
        return 'trash';
      },
      items() {
        return items || testChildren;
      },
    },
    stubs: {
      ResourceDrawer: true,
    },
  });
}

describe('trashModal', () => {
  let wrapper;
  beforeEach(() => {
    router.push({ name: RouterNames.TRASH });
    wrapper = makeWrapper();
    wrapper.setData({ loading: false });
  });
  describe('on load', () => {
    it('should show loading indicator if content is loading', () => {
      wrapper.setData({ loading: true });
      expect(wrapper.find('[data-test="loading"]').exists()).toBe(true);
    });
    it('should show empty text if there are no items', () => {
      let emptyWrapper = makeWrapper([]);
      emptyWrapper.setData({ loading: false });
      expect(emptyWrapper.find('[data-test="empty"]').exists()).toBe(true);
    });
    it('should show items in list', () => {
      expect(wrapper.find('[data-test="list"]').exists()).toBe(true);
    });
  });
  describe('on topic tree selection', () => {
    it('clicking item should set previewNodeId', () => {
      wrapper.find('[data-test="item"]').trigger('click');
      expect(wrapper.vm.previewNodeId).toBe(testChildren[0].id);
    });
    it('checking item in list should set selected', () => {
      wrapper.find('[data-test="checkbox"]').vm.$emit('change', ['selected']);
      expect(wrapper.vm.selected).toEqual(['selected']);
    });
    it('checking select all checkbox should check all items', () => {
      wrapper.find('[data-test="selectall"]').vm.$emit('change', true);
      expect(wrapper.vm.selected).toEqual(testChildren.map(c => c.id));
    });
  });
  describe('on close', () => {
    it('clicking close button should go back to parent route', () => {
      wrapper.find('[data-test="close"]').trigger('click');
      expect(wrapper.vm.$route.name).toBe('PARENT_ROUTE');
    });
  });
  describe('on delete', () => {
    it('DELETE button should be disabled if no items are selected', () => {
      expect(wrapper.find('[data-test="delete"]').vm.disabled).toBe(true);
    });
    it('clicking DELETE button should open delete confirmation dialog', () => {
      wrapper.setData({ selected: testChildren.map(c => c.id) });
      wrapper.find('[data-test="delete"]').trigger('click');
      expect(wrapper.vm.showConfirmationDialog).toBe(true);
    });
    it('clicking CLOSE on delete confirmation dialog should close the dialog', () => {
      wrapper.setData({ showConfirmationDialog: true });
      wrapper.find('[data-test="closeconfirm"]').trigger('click');
      expect(wrapper.vm.showConfirmationDialog).toBe(false);
    });
    it('clicking DELETE PERMANENTLY on delete confirmation dialog should trigger deletion', () => {
      const deleteContentNodeMock = jest.fn();
      function deleteContentNodes() {
        return new Promise(resolve => {
          deleteContentNodeMock();
          resolve();
        });
      }
      wrapper.setMethods({ deleteContentNodes });
      wrapper.setData({ selected: testChildren.map(c => c.id) });
      wrapper.setData({ showConfirmationDialog: true });
      wrapper.find('[data-test="deleteconfirm"]').trigger('click');
      expect(deleteContentNodeMock).toHaveBeenCalled();
    });
  });
  describe('on restore', () => {
    it('RESTORE button should be disabled if no items are selected', () => {
      expect(wrapper.find('[data-test="restore"]').vm.disabled).toBe(true);
    });
    it('RESTORE should set moveNodes', () => {
      const selected = testChildren.map(c => c.id);
      const setMoveNodes = jest.fn();
      wrapper.setData({ selected });
      wrapper.setMethods({ setMoveNodes });
      wrapper.find('[data-test="restore"]').trigger('click');
      expect(setMoveNodes).toHaveBeenCalledWith(selected);
    });
    it('RESTORE should clear selected and previewNodeId', () => {
      wrapper.setData({ selected: testChildren.map(c => c.id) });
      wrapper.setMethods({ setMoveNodes: jest.fn() });
      wrapper.find('[data-test="restore"]').trigger('click');
      expect(wrapper.vm.selected).toEqual([]);
      expect(wrapper.vm.previewNodeId).toBe(null);
    });
  });
});
