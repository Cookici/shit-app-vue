"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const recordForm = () => "../../components/record-form.js";
const _sfc_main = {
  components: {
    "record-form": recordForm
  },
  data() {
    return {
      recordId: ""
    };
  },
  onLoad(options) {
    if (options.id) {
      this.recordId = options.id;
    } else {
      common_vendor.index.showToast({
        title: "记录ID不存在",
        icon: "none"
      });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1e3);
    }
  },
  methods: {
    // 更新记录
    updateRecord(recordData) {
      common_vendor.index.showLoading({
        title: "保存中..."
      });
      utils_request.request.put(`/records/${this.recordId}`, recordData).then(() => {
        common_vendor.index.showToast({
          title: "更新成功",
          icon: "success"
        });
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.$vm) {
          prevPage.$vm.needRefresh = true;
        }
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1e3);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/record/edit.vue:75", "更新记录失败", err);
        common_vendor.index.showToast({
          title: "更新失败，请重试",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    }
  }
};
if (!Array) {
  const _easycom_record_form2 = common_vendor.resolveComponent("record-form");
  _easycom_record_form2();
}
const _easycom_record_form = () => "../../components/record-form.js";
if (!Math) {
  _easycom_record_form();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.recordId
  }, $data.recordId ? {
    b: common_vendor.o($options.updateRecord),
    c: common_vendor.p({
      mode: "edit",
      ["record-id"]: $data.recordId,
      ["submit-button-text"]: "保存修改"
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/edit.js.map
