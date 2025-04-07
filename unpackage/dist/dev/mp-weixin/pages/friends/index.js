"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      activeTab: "friends",
      loading: true,
      searching: false,
      loadingRequests: true,
      hasSearched: false,
      // 我的好友
      friends: [],
      filteredFriends: [],
      friendKeyword: "",
      currentFriendPage: 1,
      totalFriendPages: 1,
      friendPageSize: 10,
      friendStats: {},
      // 存储好友的拉屎记录统计
      // 搜索用户
      searchKeyword: "",
      searchResults: [],
      currentSearchPage: 1,
      totalSearchPages: 1,
      searchPageSize: 10,
      // 好友申请
      friendRequests: [],
      pendingRequests: 0,
      currentRequestPage: 1,
      totalRequestPages: 1,
      requestPageSize: 10
    };
  },
  onLoad() {
    this.loadFriends();
    this.loadFriendRequests();
  },
  onShow() {
    this.loadFriends();
    this.loadFriendRequests();
  },
  methods: {
    // 添加跳转到排行榜的方法
    goToRanking() {
      common_vendor.index.navigateTo({
        url: "/pages/ranking/friends"
      });
    },
    // 切换标签页
    switchTab(tab) {
      this.activeTab = tab;
      if (tab === "friends" && this.friends.length === 0) {
        this.loadFriends();
      } else if (tab === "requests" && this.friendRequests.length === 0) {
        this.loadFriendRequests();
      }
    },
    // 加载好友列表
    // 在 methods 中添加下拉刷新方法
    onPullDownRefresh() {
      if (this.activeTab === "friends") {
        this.loadFriends();
      } else if (this.activeTab === "requests") {
        this.loadFriendRequests();
      } else if (this.activeTab === "search") {
        common_vendor.index.stopPullDownRefresh();
      }
    },
    // 搜索用户
    searchUsers() {
      if (this.searchKeyword.trim() === "") {
        common_vendor.index.showToast({
          title: "请输入搜索关键词",
          icon: "none"
        });
        return;
      }
      this.searching = true;
      this.hasSearched = true;
      common_vendor.index.showLoading({
        title: "搜索中..."
      });
      utils_request.request.get("/users/search", {
        keyword: this.searchKeyword,
        page: this.currentSearchPage,
        page_size: this.searchPageSize
      }).then((data) => {
        this.searchResults = data.users || [];
        this.totalSearchPages = Math.ceil(data.total / this.searchPageSize) || 1;
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/friends/index.vue:242", "搜索用户失败", err);
        common_vendor.index.showToast({
          title: "搜索失败，请重试",
          icon: "none"
        });
      }).finally(() => {
        this.searching = false;
        common_vendor.index.hideLoading();
      });
    },
    loadFriends() {
      this.loading = true;
      utils_request.request.get("/friends", {
        page: this.currentFriendPage,
        page_size: this.friendPageSize,
        keyword: this.friendKeyword
      }).then((data) => {
        this.friends = data.friends || [];
        this.filteredFriends = this.friends;
        this.totalFriendPages = Math.ceil(data.total / this.friendPageSize) || 1;
        this.loadFriendsStats();
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/friends/index.vue:270", "获取好友列表失败", err);
        common_vendor.index.showToast({
          title: "获取好友列表失败",
          icon: "none"
        });
      }).finally(() => {
        this.loading = false;
        common_vendor.index.stopPullDownRefresh();
      });
    },
    // 加载好友的拉屎记录统计
    loadFriendsStats() {
      if (this.friends.length === 0)
        return;
      const friendIds = this.friends.map((friend) => friend.friend_id);
      const queryParams = friendIds.map((id) => `user_ids=${id}`).join("&");
      const today = /* @__PURE__ */ new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      utils_request.request.get(`/records/daily-stats?${queryParams}&date=${dateStr}`).then((data) => {
        const statsMap = {};
        (data.stats || []).forEach((stat) => {
          statsMap[stat.user_id] = stat;
        });
        this.friendStats = statsMap;
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/friends/index.vue:308", "获取好友记录统计失败", err);
      });
    },
    // 格式化时长显示
    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + "分钟" : ""}`;
      } else if (minutes > 0) {
        return `${minutes}分钟`;
      } else {
        return `${seconds}秒`;
      }
    },
    // 修改 loadFriendRequests 方法，确保与后端接口匹配
    changeRequestPage(page) {
      if (page !== this.currentRequestPage) {
        this.currentRequestPage = page;
        this.loadFriendRequests();
      }
    },
    // 修改 loadFriendRequests 方法
    loadFriendRequests() {
      this.loadingRequests = true;
      utils_request.request.get("/friends/requests", {
        page: this.currentRequestPage,
        page_size: this.requestPageSize
      }).then((data) => {
        this.friendRequests = data.requests || [];
        this.pendingRequests = this.friendRequests.length;
        this.totalRequestPages = Math.ceil(data.total / this.requestPageSize) || 1;
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/friends/index.vue:348", "获取好友申请失败", err);
        common_vendor.index.showToast({
          title: "获取好友申请失败",
          icon: "none"
        });
      }).finally(() => {
        this.loadingRequests = false;
        common_vendor.index.stopPullDownRefresh();
      });
    },
    // 修改 addFriend 方法，确保与后端接口匹配
    addFriend(user) {
      common_vendor.index.showLoading({
        title: "处理中..."
      });
      utils_request.request.post("/friends", {
        friend_id: user.id
      }).then(() => {
        common_vendor.index.showToast({
          title: "好友申请已发送",
          icon: "success"
        });
        this.searchResults = this.searchResults.filter((item) => item.id !== user.id);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/friends/index.vue:379", "添加好友失败", err);
        common_vendor.index.showToast({
          title: err.data.error,
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    // 修改 handleRequest 方法，确保与后端接口匹配
    handleRequest(requestId, user_id, friend_id, status) {
      common_vendor.index.showLoading({
        title: "处理中..."
      });
      if (!utils_request.request) {
        common_vendor.index.showToast({
          title: "请求数据错误",
          icon: "none"
        });
        common_vendor.index.hideLoading();
        return;
      }
      common_vendor.index.__f__("log", "at pages/friends/index.vue:405", this.friendRequests);
      utils_request.request.put("/friends/" + requestId, {
        user_id,
        // 申请方的用户ID
        friend_id,
        // 被申请方的用户ID
        status
        // 1-接受, 2-拒绝
      }).then(() => {
        common_vendor.index.showToast({
          title: status === 1 ? "已接受好友申请" : "已拒绝好友申请",
          icon: "success"
        });
        this.friendRequests = this.friendRequests.filter((req) => req.id !== requestId);
        this.pendingRequests = this.friendRequests.length;
        if (status === 1) {
          this.loadFriends();
        }
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/friends/index.vue:429", "处理好友申请失败", err);
        common_vendor.index.showToast({
          title: "处理失败，请重试",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    // 修改 deleteFriend 方法，确保与后端接口匹配
    deleteFriend(friendId) {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要删除这个好友吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({
              title: "处理中..."
            });
            const userInfo = JSON.parse(common_vendor.index.getStorageSync("userInfo"));
            utils_request.request.delete("/friends/" + friendId, {
              user_id: userInfo.id,
              id: friendId
            }).then(() => {
              common_vendor.index.showToast({
                title: "已删除好友",
                icon: "success"
              });
              this.friends = this.friends.filter((friend) => friend.id !== friendId);
              this.filteredFriends = this.filteredFriends.filter((friend) => friend.id !== friendId);
            }).catch((err) => {
              common_vendor.index.__f__("error", "at pages/friends/index.vue:467", "删除好友失败", err);
              common_vendor.index.showToast({
                title: "删除失败，请重试",
                icon: "none"
              });
            }).finally(() => {
              common_vendor.index.hideLoading();
            });
          }
        }
      });
    },
    // 获取好友操作按钮文本
    getFriendActionText(relation) {
      switch (relation) {
        case 0:
          return "添加";
        case 1:
          return "待确认";
        case 2:
          return "已添加";
        default:
          return "添加";
      }
    },
    // 格式化时间
    formatTime(timeStr) {
      const date = new Date(timeStr);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.activeTab === "friends" ? 1 : "",
    b: common_vendor.o(($event) => $options.switchTab("friends")),
    c: $data.activeTab === "search" ? 1 : "",
    d: common_vendor.o(($event) => $options.switchTab("search")),
    e: $data.pendingRequests > 0
  }, $data.pendingRequests > 0 ? {
    f: common_vendor.t($data.pendingRequests)
  } : {}, {
    g: $data.activeTab === "requests" ? 1 : "",
    h: common_vendor.o(($event) => $options.switchTab("requests")),
    i: $data.activeTab === "friends"
  }, $data.activeTab === "friends" ? common_vendor.e({
    j: common_vendor.o((...args) => $options.goToRanking && $options.goToRanking(...args)),
    k: common_vendor.o([($event) => $data.friendKeyword = $event.detail.value, (...args) => _ctx.searchFriends && _ctx.searchFriends(...args)]),
    l: $data.friendKeyword,
    m: $data.loading
  }, $data.loading ? {} : $data.filteredFriends.length === 0 ? {} : {
    o: common_vendor.f($data.filteredFriends, (friend, k0, i0) => {
      return common_vendor.e({
        a: friend.friend_user.avatar_url,
        b: common_vendor.t(friend.friend_user.nickname),
        c: $data.friendStats[friend.friend_id]
      }, $data.friendStats[friend.friend_id] ? {
        d: common_vendor.t($data.friendStats[friend.friend_id].count || 0),
        e: common_vendor.t($options.formatDuration($data.friendStats[friend.friend_id].total_time || 0))
      } : {}, {
        f: common_vendor.o(($event) => $options.deleteFriend(friend.id), friend.id),
        g: friend.id
      });
    })
  }, {
    n: $data.filteredFriends.length === 0,
    p: $data.totalFriendPages > 1
  }, $data.totalFriendPages > 1 ? {
    q: $data.currentFriendPage <= 1 ? 1 : "",
    r: common_vendor.o(($event) => $data.currentFriendPage > 1 && _ctx.changeFriendPage($data.currentFriendPage - 1)),
    s: common_vendor.t($data.currentFriendPage),
    t: common_vendor.t($data.totalFriendPages),
    v: $data.currentFriendPage >= $data.totalFriendPages ? 1 : "",
    w: common_vendor.o(($event) => $data.currentFriendPage < $data.totalFriendPages && _ctx.changeFriendPage($data.currentFriendPage + 1))
  } : {}) : {}, {
    x: $data.activeTab === "search"
  }, $data.activeTab === "search" ? common_vendor.e({
    y: $data.searchKeyword,
    z: common_vendor.o(($event) => $data.searchKeyword = $event.detail.value),
    A: common_vendor.o((...args) => $options.searchUsers && $options.searchUsers(...args)),
    B: $data.searching
  }, $data.searching ? {} : $data.searchResults.length === 0 && $data.hasSearched ? {} : $data.searchResults.length > 0 ? {
    E: common_vendor.f($data.searchResults, (user, k0, i0) => {
      return {
        a: user.avatar_url,
        b: common_vendor.t(user.nickname),
        c: common_vendor.o(($event) => $options.addFriend(user), user.id),
        d: user.id
      };
    })
  } : {}, {
    C: $data.searchResults.length === 0 && $data.hasSearched,
    D: $data.searchResults.length > 0,
    F: $data.totalSearchPages > 1
  }, $data.totalSearchPages > 1 ? {
    G: $data.currentSearchPage <= 1 ? 1 : "",
    H: common_vendor.o(($event) => $data.currentSearchPage > 1 && _ctx.changeSearchPage($data.currentSearchPage - 1)),
    I: common_vendor.t($data.currentSearchPage),
    J: common_vendor.t($data.totalSearchPages),
    K: $data.currentSearchPage >= $data.totalSearchPages ? 1 : "",
    L: common_vendor.o(($event) => $data.currentSearchPage < $data.totalSearchPages && _ctx.changeSearchPage($data.currentSearchPage + 1))
  } : {}) : {}, {
    M: $data.activeTab === "requests"
  }, $data.activeTab === "requests" ? common_vendor.e({
    N: $data.loadingRequests
  }, $data.loadingRequests ? {} : $data.friendRequests.length === 0 ? {} : {
    P: common_vendor.f($data.friendRequests, (request, k0, i0) => {
      return {
        a: request.friend_user.avatar_url,
        b: common_vendor.t(request.friend_user.nickname),
        c: common_vendor.t($options.formatTime(request.created_at)),
        d: common_vendor.o(($event) => $options.handleRequest(request.id, request.user_id, request.friend_id, 1), request.id),
        e: common_vendor.o(($event) => $options.handleRequest(request.id, request.user_id, request.friend_id, 2), request.id),
        f: request.id
      };
    })
  }, {
    O: $data.friendRequests.length === 0,
    Q: $data.totalRequestPages > 1
  }, $data.totalRequestPages > 1 ? {
    R: $data.currentRequestPage <= 1 ? 1 : "",
    S: common_vendor.o(($event) => $data.currentRequestPage > 1 && $options.changeRequestPage($data.currentRequestPage - 1)),
    T: common_vendor.t($data.currentRequestPage),
    U: common_vendor.t($data.totalRequestPages),
    V: $data.currentRequestPage >= $data.totalRequestPages ? 1 : "",
    W: common_vendor.o(($event) => $data.currentRequestPage < $data.totalRequestPages && $options.changeRequestPage($data.currentRequestPage + 1))
  } : {}) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/friends/index.js.map
