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
      initialDate: ""
    };
  },
  onLoad(options) {
    if (options.date) {
      this.initialDate = options.date;
    }
  },
  methods: {
    // 保存记录
    saveRecord(recordData) {
      common_vendor.index.showLoading({
        title: "保存中..."
      });
      utils_request.request.post("/records", recordData).then(() => {
        common_vendor.index.showToast({
          title: "记录成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1e3);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/record/add.vue:56", "保存记录失败", err);
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
  return {
    a: common_vendor.o($options.saveRecord),
    b: common_vendor.p({
      mode: "add",
      ["initial-date"]: $data.initialDate,
      ["submit-button-text"]: "保存记录"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/add.js.map
