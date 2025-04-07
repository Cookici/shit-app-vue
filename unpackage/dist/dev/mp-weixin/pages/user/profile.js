"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      userId: "",
      userInfo: {
        nickname: "",
        avatar_url: ""
      }
    };
  },
  onLoad() {
    try {
      const userInfoStr = common_vendor.index.getStorageSync("userInfo");
      if (userInfoStr) {
        this.userInfo = JSON.parse(userInfoStr);
        if (this.userInfo.id) {
          this.userId = this.userInfo.id;
          common_vendor.index.__f__("log", "at pages/user/profile.vue:46", "从本地存储获取到用户ID:", this.userId);
        }
      }
    } catch (e) {
      common_vendor.index.__f__("error", "at pages/user/profile.vue:50", "获取用户信息失败", e);
    }
  },
  methods: {
    // 选择头像
    chooseAvatar() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.userInfo.avatar_url = tempFilePath;
          this.uploadAvatar(tempFilePath);
        }
      });
    },
    // 上传头像
    uploadAvatar(filePath) {
      common_vendor.index.showLoading({
        title: "上传中..."
      });
      common_vendor.index.uploadFile({
        url: "http://localhost:8080/api/v1/auth/upload",
        filePath,
        name: "file",
        header: {
          "Authorization": "Bearer " + common_vendor.index.getStorageSync("token")
        },
        success: (uploadRes) => {
          common_vendor.index.hideLoading();
          if (uploadRes.statusCode === 200) {
            try {
              const result = JSON.parse(uploadRes.data);
              this.userInfo.avatar_url = result.url;
              common_vendor.index.showToast({
                title: "上传成功",
                icon: "success"
              });
            } catch (e) {
              common_vendor.index.__f__("error", "at pages/user/profile.vue:101", "解析响应数据失败", e);
              common_vendor.index.showToast({
                title: "上传失败，响应格式错误",
                icon: "none"
              });
            }
          } else {
            let errorMsg = "上传失败";
            try {
              const result = JSON.parse(uploadRes.data);
              errorMsg = result.error || "上传失败";
            } catch (e) {
            }
            common_vendor.index.showToast({
              title: errorMsg,
              icon: "none"
            });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/user/profile.vue:122", "上传头像失败", err);
          common_vendor.index.showToast({
            title: "上传失败，请检查网络",
            icon: "none"
          });
        }
      });
    },
    // 保存用户信息
    saveUserInfo() {
      if (!this.userInfo.nickname) {
        common_vendor.index.showToast({
          title: "请输入昵称",
          icon: "none"
        });
        return;
      }
      if (!this.userId) {
        common_vendor.index.__f__("error", "at pages/user/profile.vue:143", "用户ID不存在，尝试从userInfo获取");
        if (this.userInfo.id) {
          this.userId = this.userInfo.id;
        } else {
          common_vendor.index.showToast({
            title: "用户信息不完整，请重新登录",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/login/login"
            });
          }, 1e3);
          return;
        }
      }
      common_vendor.index.showLoading({
        title: "保存中..."
      });
      common_vendor.index.__f__("log", "at pages/user/profile.vue:164", "保存用户信息，用户ID:", this.userId);
      utils_request.request.put(`/auth/user/${this.userId}/info`, {
        nickname: this.userInfo.nickname,
        avatar_url: this.userInfo.avatar_url
      }).then((data) => {
        common_vendor.index.setStorageSync("userInfo", JSON.stringify(data.user || this.userInfo));
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.switchTab({
            url: "/pages/index/index"
          });
        }, 1e3);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/user/profile.vue:187", "保存用户信息失败", err);
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.userInfo.avatar_url || "/static/logo.png",
    b: common_vendor.o((...args) => $options.chooseAvatar && $options.chooseAvatar(...args)),
    c: $data.userInfo.nickname,
    d: common_vendor.o(($event) => $data.userInfo.nickname = $event.detail.value),
    e: common_vendor.o((...args) => $options.saveUserInfo && $options.saveUserInfo(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/profile.js.map
