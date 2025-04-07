"use strict";
const common_vendor = require("../common/vendor.js");
const baseURL = "http://localhost:8080/api/v1";
const request = (options) => {
  return new Promise((resolve, reject) => {
    options.url = baseURL + options.url;
    options.header = options.header || {};
    const token = common_vendor.index.getStorageSync("token");
    if (token) {
      options.header["Authorization"] = "Bearer " + token;
    }
    common_vendor.index.request({
      ...options,
      success: (res) => {
        if (res.statusCode === 401) {
          common_vendor.index.showToast({
            title: "登录已过期，请重新登录",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.navigateTo({
              url: "/pages/login/index"
            });
          }, 1500);
          reject(res);
          return;
        }
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          common_vendor.index.showToast({
            title: res.data.message || "请求失败",
            icon: "none"
          });
          reject(res);
          return;
        }
        resolve(res.data);
      },
      fail: (err) => {
        common_vendor.index.showToast({
          title: "网络请求失败，请检查网络",
          icon: "none"
        });
        reject(err);
      }
    });
  });
};
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: "GET",
    ...options
  });
};
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: "POST",
    ...options
  });
};
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: "PUT",
    ...options
  });
};
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: "DELETE",
    ...options
  });
};
const request$1 = {
  request,
  get,
  post,
  put,
  delete: del
};
exports.request = request$1;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
