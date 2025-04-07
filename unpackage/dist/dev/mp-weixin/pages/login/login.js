"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      hasLogin: false,
      userInfo: {}
    };
  },
  onLoad() {
    this.checkLoginStatus();
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (token) {
          this.hasLogin = true;
          common_vendor.index.reLaunch({
            url: "/pages/index/index"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:44", "检查登录状态失败", e);
      }
    },
    // 微信登录
    wxLogin() {
      common_vendor.index.showLoading({
        title: "登录中..."
      });
      common_vendor.index.login({
        provider: "weixin",
        success: (loginRes) => {
          if (loginRes.code) {
            this.getToken(loginRes.code);
          } else {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "登录失败，请重试",
              icon: "none"
            });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/login/login.vue:71", "微信登录失败", err);
          common_vendor.index.showToast({
            title: "登录失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 获取token
    getToken(code) {
      common_vendor.index.request({
        url: "http://localhost:8080/api/v1/auth/login",
        // 替换为您的实际API地址
        method: "POST",
        data: {
          code
        },
        header: {
          "content-type": "application/json"
        },
        success: (res) => {
          common_vendor.index.hideLoading();
          if (res.statusCode === 200) {
            const userData = res.data.user;
            const token = res.data.token;
            common_vendor.index.setStorageSync("token", token);
            common_vendor.index.setStorageSync("userInfo", JSON.stringify(userData));
            common_vendor.index.showToast({
              title: "登录成功",
              icon: "success"
            });
            setTimeout(() => {
              common_vendor.index.switchTab({
                url: "/pages/index/index"
              });
            }, 1e3);
          } else {
            common_vendor.index.showToast({
              title: res.data.error || "登录失败，请重试",
              icon: "none"
            });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/login/login.vue:123", "获取token失败", err);
          common_vendor.index.showToast({
            title: "登录失败，请重试",
            icon: "none"
          });
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0,
    b: common_vendor.o((...args) => $options.wxLogin && $options.wxLogin(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
