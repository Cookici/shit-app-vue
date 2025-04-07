"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      recordId: "",
      record: null,
      poopTypes: [],
      poopType: null,
      needRefresh: false
      // 添加刷新标志
    };
  },
  onLoad(options) {
    if (options.id) {
      this.recordId = options.id;
      this.loadRecord();
      this.loadPoopTypes();
    } else {
      common_vendor.index.showToast({
        title: "记录ID不存在",
        icon: "none"
      });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1500);
    }
  },
  onShow() {
    common_vendor.index.__f__("log", "at pages/record/detail.vue:81", "详情页onShow, needRefresh:", this.needRefresh);
    if (this.needRefresh) {
      this.loadRecord();
      this.loadPoopTypes();
      this.needRefresh = false;
    }
  },
  methods: {
    // 加载记录详情
    loadRecord() {
      common_vendor.index.showLoading({
        title: "加载中..."
      });
      utils_request.request.get(`/records/${this.recordId}`).then((data) => {
        this.record = data.record;
        if (this.record && this.poopTypes.length > 0) {
          this.poopType = this.poopTypes.find((t) => t.id === this.record.poop_type_id);
        }
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/record/detail.vue:104", "获取记录详情失败", err);
        common_vendor.index.showToast({
          title: "获取记录失败",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
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
        if (this.record && this.poopTypes.length > 0) {
          this.poopType = this.poopTypes.find((t) => t.id === this.record.poop_type_id);
        }
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/record/detail.vue:143", "获取便便类型失败", err);
        common_vendor.index.showToast({
          title: "拉取数据失败，请检查网络",
          icon: "none"
        });
      });
    },
    // 编辑记录
    editRecord() {
      common_vendor.index.navigateTo({
        url: `/pages/record/edit?id=${this.recordId}`
      });
    },
    // 确认删除
    confirmDelete() {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条记录吗？删除后无法恢复。",
        confirmColor: "#ff0000",
        success: (res) => {
          if (res.confirm) {
            this.deleteRecord();
          }
        }
      });
    },
    // 删除记录
    deleteRecord() {
      common_vendor.index.showLoading({
        title: "删除中..."
      });
      utils_request.request.delete(`/records/${this.recordId}`).then(() => {
        common_vendor.index.showToast({
          title: "删除成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1e3);
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/record/detail.vue:191", "删除记录失败", err);
      }).finally(() => {
        common_vendor.index.hideLoading();
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
    // 格式化日期时间
    formatDateTime(dateTimeStr) {
      const date = new Date(dateTimeStr);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    },
    // 格式化持续时间
    formatDuration(seconds) {
      if (!seconds)
        return "未记录";
      const minutes = Math.floor(seconds / 60);
      const remainSeconds = seconds % 60;
      return `${minutes}分${remainSeconds}秒`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.record
  }, $data.record ? common_vendor.e({
    b: common_vendor.t($options.formatDateTime($data.record.record_time)),
    c: common_vendor.t($options.getPoopTypeName($data.record.poop_type_id)),
    d: $options.getPoopTypeColor($data.record.poop_type_id),
    e: common_vendor.t($options.formatDuration($data.record.duration)),
    f: $data.record.tags && $data.record.tags.length > 0
  }, $data.record.tags && $data.record.tags.length > 0 ? {
    g: common_vendor.f($data.record.tags, (tag, index, i0) => {
      return {
        a: common_vendor.t(tag.name),
        b: index
      };
    })
  } : {}, {
    h: $data.record.note
  }, $data.record.note ? {
    i: common_vendor.t($data.record.note)
  } : {}, {
    j: $data.poopType
  }, $data.poopType ? {
    k: common_vendor.t($data.poopType.health_indication || "暂无健康提示")
  } : {}, {
    l: common_vendor.o((...args) => $options.editRecord && $options.editRecord(...args)),
    m: common_vendor.o((...args) => $options.confirmDelete && $options.confirmDelete(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/detail.js.map
