"use strict";
const common_vendor = require("../common/vendor.js");
const utils_request = require("../utils/request.js");
const _sfc_main = {
  name: "RecordForm",
  props: {
    // 表单模式：add 或 edit
    mode: {
      type: String,
      default: "add"
    },
    // 编辑模式下的记录ID
    recordId: {
      type: String,
      default: ""
    },
    // 初始日期（可选）
    initialDate: {
      type: String,
      default: ""
    },
    // 提交按钮文本
    submitButtonText: {
      type: String,
      default: "保存记录"
    }
  },
  data() {
    return {
      formData: {
        recordDate: this.formatDate(/* @__PURE__ */ new Date()),
        recordTime: this.formatTime(/* @__PURE__ */ new Date()),
        minutes: "",
        seconds: "",
        selectedPoopType: null,
        selectedTags: [],
        note: ""
      },
      record: null,
      poopTypes: [],
      tags: [],
      loading: false
    };
  },
  computed: {
    selectedPoopTypeObj() {
      return this.poopTypes.find((type) => type.id === this.formData.selectedPoopType);
    }
  },
  created() {
    if (this.initialDate) {
      this.formData.recordDate = this.initialDate;
    }
    this.loadPoopTypes();
    this.loadTags();
    if (this.mode === "edit" && this.recordId) {
      this.loadRecord();
    }
  },
  methods: {
    // 加载记录详情（编辑模式）
    loadRecord() {
      this.loading = true;
      common_vendor.index.showLoading({
        title: "加载中..."
      });
      utils_request.request.get(`/records/${this.recordId}`).then((data) => {
        this.record = data.record;
        if (data.tags && Array.isArray(data.tags)) {
          this.record.tags = data.tags;
        }
        this.initFormData();
      }).catch((err) => {
        common_vendor.index.__f__("error", "at components/record-form.vue:183", "获取记录详情失败", err);
        common_vendor.index.showToast({
          title: "获取记录失败",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
        this.loading = false;
      });
    },
    // 初始化表单数据（编辑模式）
    initFormData() {
      if (!this.record)
        return;
      const recordDate = new Date(this.record.record_time);
      this.formData.recordDate = this.formatDate(recordDate);
      this.formData.recordTime = this.formatTime(recordDate);
      if (this.record.duration) {
        this.formData.minutes = Math.floor(this.record.duration / 60).toString();
        this.formData.seconds = (this.record.duration % 60).toString();
      }
      this.formData.selectedPoopType = this.record.poop_type_id;
      if (this.record.tags && Array.isArray(this.record.tags)) {
        this.formData.selectedTags = this.record.tags.map((tag) => tag.id);
      } else if (this.record.tag_ids && Array.isArray(this.record.tag_ids)) {
        this.formData.selectedTags = this.record.tag_ids;
      } else {
        this.formData.selectedTags = [];
      }
      this.formData.note = this.record.note || "";
    },
    // 加载便便类型
    loadPoopTypes() {
      common_vendor.index.showLoading({
        title: "加载中..."
      });
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
        if (this.mode === "add" && this.poopTypes.length > 0 && !this.formData.selectedPoopType) {
          this.formData.selectedPoopType = this.poopTypes[0].id;
        }
      }).catch((err) => {
        common_vendor.index.__f__("error", "at components/record-form.vue:255", "获取便便类型失败", err);
        common_vendor.index.showToast({
          title: "获取便便类型失败",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    // 获取便便类型对应的颜色
    getPoopTypeColor(type) {
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
    // 加载标签
    loadTags() {
      common_vendor.index.showLoading({
        title: "加载中..."
      });
      utils_request.request.get("/tags").then((data) => {
        this.tags = data || [];
      }).catch((err) => {
        common_vendor.index.__f__("error", "at components/record-form.vue:308", "获取标签失败", err);
        common_vendor.index.showToast({
          title: "获取标签失败",
          icon: "none"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    // 日期选择器变化
    onDateChange(e) {
      this.formData.recordDate = e.detail.value;
    },
    // 时间选择器变化
    onTimeChange(e) {
      this.formData.recordTime = e.detail.value;
    },
    // 选择便便类型
    selectPoopType(typeId) {
      this.formData.selectedPoopType = typeId;
    },
    // 限制分钟输入
    limitMinutesInput(e) {
      let value = e.detail.value;
      value = value.replace(/[^\d]/g, "");
      if (value !== "" && parseInt(value) > 60) {
        value = "60";
        common_vendor.index.showToast({
          title: "分钟不能超过60",
          icon: "none",
          duration: 1500
        });
      }
      this.formData.minutes = value;
    },
    // 限制秒数输入
    limitSecondsInput(e) {
      let value = e.detail.value;
      value = value.replace(/[^\d]/g, "");
      if (value !== "" && parseInt(value) > 59) {
        value = "59";
        common_vendor.index.showToast({
          title: "秒数不能超过59",
          icon: "none",
          duration: 1500
        });
      }
      this.formData.seconds = value;
    },
    // 切换标签选择
    toggleTag(tagId) {
      const index = this.formData.selectedTags.indexOf(tagId);
      if (index === -1) {
        this.formData.selectedTags.push(tagId);
      } else {
        this.formData.selectedTags.splice(index, 1);
      }
    },
    // 提交表单
    submitForm() {
      if (!this.formData.selectedPoopType) {
        common_vendor.index.showToast({
          title: "请选择便便类型",
          icon: "none"
        });
        return;
      }
      if (this.formData.selectedTags.length === 0) {
        common_vendor.index.showToast({
          title: "请至少选择一个心情标签",
          icon: "none"
        });
        return;
      }
      if (this.formData.minutes) {
        let minutes = parseInt(this.formData.minutes);
        if (minutes > 60) {
          this.formData.minutes = "60";
        }
      }
      if (this.formData.seconds) {
        let seconds = parseInt(this.formData.seconds);
        if (seconds > 59) {
          this.formData.seconds = "59";
        }
      }
      let duration = 0;
      if (this.formData.minutes) {
        duration += parseInt(this.formData.minutes) * 60;
      }
      if (this.formData.seconds) {
        duration += parseInt(this.formData.seconds);
      }
      const recordDate = /* @__PURE__ */ new Date(`${this.formData.recordDate}T${this.formData.recordTime}:00`);
      const recordDateTime = recordDate.toISOString();
      const userInfo = JSON.parse(common_vendor.index.getStorageSync("userInfo"));
      const recordData = {
        record: {
          user_id: userInfo.id,
          record_time: recordDateTime,
          duration: duration || null,
          note: this.formData.note,
          poop_type_id: this.formData.selectedPoopType
        },
        tag_ids: this.formData.selectedTags
      };
      this.$emit("submit", recordData);
    },
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    // 格式化时间
    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.formData.recordDate),
    b: $data.formData.recordDate,
    c: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    d: common_vendor.t($data.formData.recordTime),
    e: $data.formData.recordTime,
    f: common_vendor.o((...args) => $options.onTimeChange && $options.onTimeChange(...args)),
    g: common_vendor.o([($event) => $data.formData.minutes = $event.detail.value, (...args) => $options.limitMinutesInput && $options.limitMinutesInput(...args)]),
    h: $data.formData.minutes,
    i: common_vendor.o([($event) => $data.formData.seconds = $event.detail.value, (...args) => $options.limitSecondsInput && $options.limitSecondsInput(...args)]),
    j: $data.formData.seconds,
    k: common_vendor.f($data.poopTypes, (type, index, i0) => {
      return {
        a: type.color,
        b: common_vendor.t(type.name),
        c: $data.formData.selectedPoopType === type.id ? type.color : "#333",
        d: index,
        e: $data.formData.selectedPoopType === type.id ? 1 : "",
        f: type.color,
        g: common_vendor.o(($event) => $options.selectPoopType(type.id), index)
      };
    }),
    l: $options.selectedPoopTypeObj
  }, $options.selectedPoopTypeObj ? {
    m: common_vendor.t($options.selectedPoopTypeObj.name),
    n: $options.selectedPoopTypeObj.color,
    o: common_vendor.t($options.selectedPoopTypeObj.description || "暂无描述"),
    p: common_vendor.t($options.selectedPoopTypeObj.health_indication || "暂无健康指示")
  } : {}, {
    q: common_vendor.f($data.tags, (tag, index, i0) => {
      return {
        a: common_vendor.t(tag.name),
        b: index,
        c: $data.formData.selectedTags.includes(tag.id) ? 1 : "",
        d: common_vendor.o(($event) => $options.toggleTag(tag.id), index)
      };
    }),
    r: $data.formData.note,
    s: common_vendor.o(($event) => $data.formData.note = $event.detail.value),
    t: common_vendor.t($props.submitButtonText),
    v: common_vendor.o((...args) => $options.submitForm && $options.submitForm(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/record-form.js.map
