"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/login/login.js";
  "./pages/user/profile.js";
  "./pages/record/add.js";
  "./pages/record/detail.js";
  "./pages/record/edit.js";
  "./pages/ranking/index.js";
  "./pages/friends/index.js";
  "./pages/ranking/friends.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:4", "App Launch");
    this.checkLoginStatus();
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:8", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:11", "App Hide");
  },
  methods: {
    checkLoginStatus() {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          common_vendor.index.reLaunch({
            url: "/pages/login/login"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at App.vue:23", "检查登录状态失败", e);
      }
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
