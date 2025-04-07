"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      weekdays: ["日", "一", "二", "三", "四", "五", "六"],
      currentDate: /* @__PURE__ */ new Date(),
      currentYear: (/* @__PURE__ */ new Date()).getFullYear(),
      currentMonth: (/* @__PURE__ */ new Date()).getMonth(),
      days: [],
      selectedDate: /* @__PURE__ */ new Date(),
      dayRecords: [],
      poopTypes: [],
      tags: [],
      // 分页相关数据
      currentPage: 1,
      pageSize: 3,
      totalPages: 1,
      totalRecords: 0
    };
  },
  computed: {
    displayedPages() {
      const pages = [];
      const maxVisiblePages = 3;
      if (this.totalPages <= maxVisiblePages) {
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;
        if (endPage > this.totalPages) {
          endPage = this.totalPages;
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
      }
      return pages;
    }
  },
  onLoad() {
    const token = common_vendor.index.getStorageSync("token");
    if (!token) {
      common_vendor.index.redirectTo({
        url: "/pages/login/login"
      });
      return;
    }
    this.initCalendar();
    this.loadPoopTypes();
    this.loadTags();
    this.loadDayRecords(this.selectedDate);
  },
  onShow() {
    const token = common_vendor.index.getStorageSync("token");
    if (!token) {
      common_vendor.index.redirectTo({
        url: "/pages/login/login"
      });
      return;
    }
    if (this.selectedDate) {
      this.loadDayRecords(this.selectedDate);
    }
    this.initCalendar();
  },
  methods: {
    // 初始化日历
    initCalendar() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = [];
      for (let i = 0; i < firstDay; i++) {
        days.push({ date: null });
      }
      const today = /* @__PURE__ */ new Date();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        days.push({
          date,
          isToday: date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear(),
          hasRecord: false,
          // 默认没有记录，后面会更新
          recordColor: null
        });
      }
      this.days = days;
    },
    // 切换月份
    changeMonth(delta) {
      const newMonth = this.currentMonth + delta;
      if (newMonth < 0) {
        this.currentYear--;
        this.currentMonth = 11;
      } else if (newMonth > 11) {
        this.currentYear++;
        this.currentMonth = 0;
      } else {
        this.currentMonth = newMonth;
      }
      this.initCalendar();
    },
    // 选择日期
    selectDate(date) {
      this.selectedDate = date;
      this.loadDayRecords(date);
    },
    // 加载某天的记录
    loadDayRecords(date, page = 1) {
      const userInfo = JSON.parse(common_vendor.index.getStorageSync("userInfo"));
      const startDate = this.formatDateForAPI(date);
      this.currentPage = page;
      utils_request.request.get("/records/date-range", {
        user_id: userInfo.id,
        start: startDate,
        end: startDate,
        page: this.currentPage,
        page_size: this.pageSize
      }).then((data) => {
        this.dayRecords = data.records || [];
        this.totalRecords = data.total || this.dayRecords.length;
        this.totalPages = data.total_pages || Math.ceil(this.totalRecords / this.pageSize);
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.changePage(this.totalPages);
        }
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/index/index.vue:268", "获取日记录失败", err);
        this.dayRecords = [];
        this.totalRecords = 0;
        this.totalPages = 1;
        common_vendor.index.showToast({
          title: "获取记录失败",
          icon: "none"
        });
      });
    },
    changePage(page) {
      if (page === this.currentPage)
        return;
      this.loadDayRecords(this.selectedDate, page);
    },
    // 加载便便类型
    loadPoopTypes() {
      utils_request.request.get("/poop-types").then((data) => {
        if (data && Array.isArray(data.types)) {
          this.poopTypes = data.types.map((type) => {
            type.color = this.getPoopTypeColor(type);
            return type;
          });
        } else if (data) {
          this.poopTypes = data.map((type) => {
            type.color = this.getPoopTypeColor(type);
            return type;
          });
        } else {
          this.poopTypes = [];
        }
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/index/index.vue:307", "获取便便类型失败", err);
      });
    },
    // 加载标签
    loadTags() {
      utils_request.request.get("/tags").then((data) => {
        this.tags = data.tags || [];
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/index/index.vue:318", "获取标签失败", err);
      });
    },
    // 添加记录
    addRecord() {
      common_vendor.index.navigateTo({
        url: `/pages/record/add?date=${this.formatDateForAPI(this.selectedDate)}`
      });
    },
    // 查看记录详情
    viewRecord(record) {
      common_vendor.index.navigateTo({
        url: `/pages/record/detail?id=${record.id}`
      });
    },
    // 获取便便类型名称
    getPoopTypeName(typeId) {
      const type = this.poopTypes.find((t) => t.id === typeId);
      return type ? type.name : "未知类型";
    },
    // 获取便便类型颜色
    getPoopTypeColor(typeOrId) {
      if (typeof typeOrId === "number") {
        const type2 = this.poopTypes.find((t) => t.id === typeOrId);
        if (!type2)
          return "#cccccc";
        return this.getPoopTypeColor(type2);
      }
      const type = typeOrId;
      if (type.color && type.color.startsWith("#")) {
        return type.color;
      }
      if (type.color) {
        switch (type.color) {
          case "深棕色":
            return "#8B4513";
          case "棕色":
            return "#A0522D";
          case "浅棕色":
            return "#DEB887";
          case "黄色或浅棕色":
            return "#F4A460";
          default:
            return "#A0522D";
        }
      }
      switch (type.id) {
        case 1:
          return "#8B4513";
        case 2:
          return "#A0522D";
        case 3:
          return "#A52A2A";
        case 4:
          return "#CD853F";
        case 5:
          return "#D2691E";
        case 6:
          return "#DEB887";
        case 7:
          return "#F4A460";
        default:
          return "#A0522D";
      }
    },
    // 格式化日期显示
    formatDate(date) {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    // 格式化时间显示
    formatTime(dateTimeStr) {
      const date = new Date(dateTimeStr);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    },
    // 格式化持续时间
    formatDuration(seconds) {
      if (!seconds)
        return "未记录";
      const minutes = Math.floor(seconds / 60);
      const remainSeconds = seconds % 60;
      return `${minutes}分${remainSeconds}秒`;
    },
    // 格式化日期为API格式
    formatDateForAPI(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    // 格式化备注，根据宽度调整展示字数
    formatNote(note) {
      if (!note)
        return "";
      const maxLength = 15;
      if (note.length <= maxLength)
        return note;
      return note.substring(0, maxLength) + "...";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o(($event) => $options.changeMonth(-1)),
    b: common_vendor.t($data.currentYear),
    c: common_vendor.t($data.currentMonth + 1),
    d: common_vendor.o(($event) => $options.changeMonth(1)),
    e: common_vendor.f($data.weekdays, (day, index, i0) => {
      return {
        a: common_vendor.t(day),
        b: index
      };
    }),
    f: common_vendor.f($data.days, (day, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(day.date ? day.date.getDate() : ""),
        b: day.hasRecord
      }, day.hasRecord ? {
        c: day.recordColor || "#07c160"
      } : {}, {
        d: index,
        e: !day.date ? 1 : "",
        f: day.isToday ? 1 : "",
        g: day.hasRecord ? 1 : "",
        h: common_vendor.o(($event) => day.date && $options.selectDate(day.date), index)
      });
    }),
    g: $data.selectedDate
  }, $data.selectedDate ? common_vendor.e({
    h: common_vendor.t($options.formatDate($data.selectedDate)),
    i: common_vendor.o((...args) => $options.addRecord && $options.addRecord(...args)),
    j: $data.dayRecords.length === 0
  }, $data.dayRecords.length === 0 ? {} : {
    k: common_vendor.f($data.dayRecords, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t($options.formatTime(item.record.record_time)),
        b: common_vendor.t(item.poop_type.name),
        c: $options.getPoopTypeColor(item.poop_type.id),
        d: common_vendor.t($options.formatDuration(item.record.duration)),
        e: common_vendor.f(item.tags, (tag, k1, i1) => {
          return {
            a: common_vendor.t(tag.name),
            b: tag.id
          };
        }),
        f: item.record.note
      }, item.record.note ? {
        g: common_vendor.t($options.formatNote(item.record.note))
      } : {}, {
        h: item.record.id,
        i: common_vendor.o(($event) => $options.viewRecord(item.record), item.record.id)
      });
    })
  }, {
    l: $data.totalPages > 1
  }, $data.totalPages > 1 ? {
    m: common_vendor.t($data.totalRecords),
    n: common_vendor.t($data.totalPages),
    o: $data.currentPage <= 1 ? 1 : "",
    p: common_vendor.o(($event) => $data.currentPage > 1 && $options.changePage($data.currentPage - 1)),
    q: common_vendor.f($options.displayedPages, (page, k0, i0) => {
      return {
        a: common_vendor.t(page),
        b: page,
        c: page === $data.currentPage ? 1 : "",
        d: common_vendor.o(($event) => $options.changePage(page), page)
      };
    }),
    r: $data.currentPage >= $data.totalPages ? 1 : "",
    s: common_vendor.o(($event) => $data.currentPage < $data.totalPages && $options.changePage($data.currentPage + 1))
  } : {}) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
