"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      timeRange: "week",
      // 默认显示本周
      friendRankings: [],
      loading: true
    };
  },
  onLoad() {
    this.loadRankingData();
  },
  onShow() {
    this.loadRankingData();
  },
  methods: {
    // 切换时间范围
    changeTimeRange(range) {
      this.timeRange = range;
      this.loadRankingData();
    },
    // 加载排行榜数据
    loadRankingData() {
      this.loading = true;
      const { startDate, endDate } = this.getDateRange(this.timeRange);
      utils_request.request.get("/rankings", {
        start_date: this.formatDateForAPI(startDate),
        end_date: this.formatDateForAPI(endDate)
      }).then((data) => {
        this.friendRankings = data.rankings || [];
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/ranking/index.vue:81", "获取排行榜失败", err);
      }).finally(() => {
        this.loading = false;
      });
    },
    // 格式化时长显示
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor(seconds % 3600 / 60);
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
      } else {
        return `${minutes}分钟`;
      }
    },
    // 获取日期范围
    getDateRange(range) {
      const now = /* @__PURE__ */ new Date();
      let startDate = /* @__PURE__ */ new Date();
      let endDate = /* @__PURE__ */ new Date();
      if (range === "week") {
        const day = now.getDay();
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
      } else if (range === "month") {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(now.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
      } else if (range === "year") {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setFullYear(now.getFullYear() + 1);
        endDate.setMonth(0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      return { startDate, endDate };
    },
    // 格式化日期为API需要的格式
    formatDateForAPI(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    // 跳转到好友管理页面
    goToFriendPage() {
      common_vendor.index.navigateTo({
        url: "/pages/friends/index"
      });
    },
    // 添加跳转到好友排行榜的方法
    goToFriendRanking() {
      common_vendor.index.navigateTo({
        url: "/pages/ranking/friends"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.timeRange === "week" ? 1 : "",
    b: common_vendor.o(($event) => $options.changeTimeRange("week")),
    c: $data.timeRange === "month" ? 1 : "",
    d: common_vendor.o(($event) => $options.changeTimeRange("month")),
    e: $data.loading
  }, $data.loading ? {} : {
    f: common_vendor.f($data.friendRankings, (item, index, i0) => {
      return {
        a: common_vendor.t(index + 1),
        b: index < 3 ? 1 : "",
        c: item.avatar_url,
        d: common_vendor.t(item.nickname),
        e: common_vendor.t(item.record_count),
        f: common_vendor.t($options.formatDuration(item.total_duration)),
        g: item.user_id
      };
    })
  }, {
    g: common_vendor.o((...args) => $options.goToFriendRanking && $options.goToFriendRanking(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/ranking/index.js.map
