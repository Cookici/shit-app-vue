// API请求封装
const baseURL = 'http://localhost:8080/api/v1';

// 请求拦截器
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 构建请求参数
    options.url = baseURL + options.url;
    options.header = options.header || {};
    
    // 添加token认证
    const token = uni.getStorageSync('token');
    if (token) {
      options.header['Authorization'] = 'Bearer ' + token;
    }
    
    // 发起请求
    uni.request({
      ...options,
      success: (res) => {
        // 请求成功但状态码异常
        if (res.statusCode === 401) {
          // token失效，跳转到登录页
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/login/index'
            });
          }, 1500);
          
          reject(res);
          return;
        }
        
        if (res.statusCode !== 200 && res.statusCode!== 201) {
          uni.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          });
          reject(res);
          return;
        }
        
        resolve(res.data);
      },
      fail: (err) => {
        uni.showToast({
          title: '网络请求失败，请检查网络',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

// 封装GET请求
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'GET',
    ...options
  });
};

// 封装POST请求
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'POST',
    ...options
  });
};

// 封装PUT请求
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'PUT',
    ...options
  });
};

// 封装DELETE请求
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'DELETE',
    ...options
  });
};

export default {
  request,
  get,
  post,
  put,
  delete: del
};