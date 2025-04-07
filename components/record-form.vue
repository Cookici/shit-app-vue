<template>
	<view class="form-container">
		<view class="form-item">
			<text class="label">日期时间</text>
			<view class="datetime-picker">
				<picker mode="date" :value="formData.recordDate" @change="onDateChange">
					<view class="picker-value">{{ formData.recordDate }}</view>
				</picker>
				<picker mode="time" :value="formData.recordTime" @change="onTimeChange">
					<view class="picker-value">{{ formData.recordTime }}</view>
				</picker>
			</view>
		</view>
		
		<view class="form-item">
			<text class="label">持续时间</text>
			<view class="duration-input">
				<input 
					type="digit" 
					v-model="formData.minutes" 
					placeholder="分钟" 
					class="time-input"
					@input="limitMinutesInput" 
					maxlength="2"
				/>
				<text class="time-unit">分</text>
				<input 
					type="digit" 
					v-model="formData.seconds" 
					placeholder="秒" 
					class="time-input"
					@input="limitSecondsInput"
					maxlength="2"
				/>
				<text class="time-unit">秒</text>
			</view>
		</view>
		
		<view class="form-item">
			<text class="label">便便类型</text>
			<view class="poop-types-container">
				<scroll-view scroll-x="true" class="poop-types-scroll">
					<view 
						v-for="(type, index) in poopTypes" 
						:key="index"
						class="poop-type-item"
						:class="{ 'selected': formData.selectedPoopType === type.id }"
						:style="{ borderColor: type.color }"
						@click="selectPoopType(type.id)">
						<view class="poop-type-color" :style="{ backgroundColor: type.color }"></view>
						<text class="poop-type-name" 
							:style="{ color: formData.selectedPoopType === type.id ? type.color : '#333' }">
							{{ type.name }}
						</text>
					</view>
				</scroll-view>
				
				<view class="poop-type-details" v-if="selectedPoopTypeObj">
					<view class="detail-header" :style="{ backgroundColor: selectedPoopTypeObj.color }">
						<text class="detail-title">{{ selectedPoopTypeObj.name }}</text>
					</view>
					<view class="detail-content">
						<view class="detail-item">
							<text class="detail-label">描述：</text>
							<text class="detail-value">{{ selectedPoopTypeObj.description || '暂无描述' }}</text>
						</view>
						<view class="detail-item">
							<text class="detail-label">健康指示：</text>
							<text class="detail-value">{{ selectedPoopTypeObj.health_indication || '暂无健康指示' }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<view class="form-item">
			<text class="label">心情标签</text>
			<view class="tags">
				<view 
					v-for="(tag, index) in tags" 
					:key="index"
					class="tag-item"
					:class="{ 'selected': formData.selectedTags.includes(tag.id) }"
					@click="toggleTag(tag.id)">
					<text class="tag-name">{{ tag.name }}</text>
				</view>
			</view>
		</view>
		
		<view class="form-item">
			<text class="label">备注</text>
			<textarea v-model="formData.note" placeholder="记录一下你的感受..." class="note-input" />
		</view>
		
		<button class="submit-btn" @click="submitForm">{{ submitButtonText }}</button>
	</view>
</template>

<script>
import request from '../utils/request.js';

export default {
	name: 'RecordForm',
	props: {
		// 表单模式：add 或 edit
		mode: {
			type: String,
			default: 'add'
		},
		// 编辑模式下的记录ID
		recordId: {
			type: String,
			default: ''
		},
		// 初始日期（可选）
		initialDate: {
			type: String,
			default: ''
		},
		// 提交按钮文本
		submitButtonText: {
			type: String,
			default: '保存记录'
		}
	},
	data() {
		return {
			formData: {
				recordDate: this.formatDate(new Date()),
				recordTime: this.formatTime(new Date()),
				minutes: '',
				seconds: '',
				selectedPoopType: null,
				selectedTags: [],
				note: ''
			},
			record: null,
			poopTypes: [],
			tags: [],
			loading: false
		}
	},
	computed: {
		selectedPoopTypeObj() {
			return this.poopTypes.find(type => type.id === this.formData.selectedPoopType);
		}
	},
	created() {
		// 如果有初始日期，则使用初始日期
		if (this.initialDate) {
			this.formData.recordDate = this.initialDate;
		}
		
		// 加载便便类型和标签
		this.loadPoopTypes();
		this.loadTags();
		
		// 如果是编辑模式，加载记录详情
		if (this.mode === 'edit' && this.recordId) {
			this.loadRecord();
		}
	},
	methods: {
		// 加载记录详情（编辑模式）
		loadRecord() {
			this.loading = true;
			uni.showLoading({
				title: '加载中...'
			});

			request.get(`/records/${this.recordId}`)
				.then(data => {
					this.record = data.record;
					
					// 确保标签数据正确
					if (data.tags && Array.isArray(data.tags)) {
						this.record.tags = data.tags;
					}
					
					this.initFormData();
				})
				.catch(err => {
					console.error('获取记录详情失败', err);
					uni.showToast({
						title: '获取记录失败',
						icon: 'none'
					});
				})
				.finally(() => {
					uni.hideLoading();
					this.loading = false;
				});
		},

		// 初始化表单数据（编辑模式）
		initFormData() {
			if (!this.record) return;

			// 设置日期和时间
			const recordDate = new Date(this.record.record_time);
			this.formData.recordDate = this.formatDate(recordDate);
			this.formData.recordTime = this.formatTime(recordDate);

			// 设置持续时间
			if (this.record.duration) {
				this.formData.minutes = Math.floor(this.record.duration / 60).toString();
				this.formData.seconds = (this.record.duration % 60).toString();
			}

			// 设置便便类型
			this.formData.selectedPoopType = this.record.poop_type_id;

			// 设置标签
			if (this.record.tags && Array.isArray(this.record.tags)) {
				this.formData.selectedTags = this.record.tags.map(tag => tag.id);
			} else if (this.record.tag_ids && Array.isArray(this.record.tag_ids)) {
				this.formData.selectedTags = this.record.tag_ids;
			} else {
				this.formData.selectedTags = [];
			}

			// 设置备注
			this.formData.note = this.record.note || '';
		},

		// 加载便便类型
		loadPoopTypes() {
			uni.showLoading({
				title: '加载中...'
			});
			
			request.get('/poop-types')
				.then(data => {
					// 确保数据结构正确，并处理颜色值
					if (data && Array.isArray(data.types)) {
						this.poopTypes = data.types.map(type => {
							type.color = this.getPoopTypeColor(type);
							return type;
						});
					} else if (data) {
						this.poopTypes = data.map(type => {
							type.color = this.getPoopTypeColor(type);
							return type;
						});
					} else {
						this.poopTypes = [];
					}
					
					// 默认选择第一个类型（仅添加模式）
					if (this.mode === 'add' && this.poopTypes.length > 0 && !this.formData.selectedPoopType) {
						this.formData.selectedPoopType = this.poopTypes[0].id;
					}
				})
				.catch(err => {
					console.error('获取便便类型失败', err);
					uni.showToast({
						title: '获取便便类型失败',
						icon: 'none'
					});
				})
				.finally(() => {
					uni.hideLoading();
				});
		},

		// 获取便便类型对应的颜色
		getPoopTypeColor(type) {
			// 如果已经是十六进制颜色，直接返回
			if (type.color && type.color.startsWith('#')) {
				return type.color;
			}

			// 根据颜色描述转换为十六进制
			if (type.color) {
				switch (type.color) {
					case '深棕色': return '#8B4513';
					case '棕色': return '#A0522D';
					case '浅棕色': return '#DEB887';
					case '黄色或浅棕色': return '#F4A460';
					default: return '#A0522D'; // 默认棕色
				}
			}

			// 如果没有颜色，根据ID设置默认颜色
			switch (type.id) {
				case 1: return '#8B4513'; // 深棕色
				case 2: return '#A0522D'; // 棕色
				case 3: return '#A52A2A'; // 棕色
				case 4: return '#CD853F'; // 棕色
				case 5: return '#D2691E'; // 棕色
				case 6: return '#DEB887'; // 浅棕色
				case 7: return '#F4A460'; // 黄色或浅棕色
				default: return '#A0522D'; // 默认棕色
			}
		},

		// 加载标签
		loadTags() {
			uni.showLoading({
				title: '加载中...'
			});
			
			request.get('/tags')
				.then(data => {				
					this.tags = data || [];
				})
				.catch(err => {
					console.error('获取标签失败', err);
					uni.showToast({
						title: '获取标签失败',
						icon: 'none'
					});
				})
				.finally(() => {
					uni.hideLoading();
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
			// 只允许输入数字
			value = value.replace(/[^\d]/g, '');
			
			// 限制最大值为60
			if (value !== '' && parseInt(value) > 60) {
				value = '60';
				uni.showToast({
					title: '分钟不能超过60',
					icon: 'none',
					duration: 1500
				});
			}
			
			// 更新值
			this.formData.minutes = value;
		},
		
		// 限制秒数输入
		limitSecondsInput(e) {
			let value = e.detail.value;
			// 只允许输入数字
			value = value.replace(/[^\d]/g, '');
			
			// 限制最大值为59
			if (value !== '' && parseInt(value) > 59) {
				value = '59';
				uni.showToast({
					title: '秒数不能超过59',
					icon: 'none',
					duration: 1500
				});
			}
			
			// 更新值
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
			// 验证必填项
			if (!this.formData.selectedPoopType) {
				uni.showToast({
					title: '请选择便便类型',
					icon: 'none'
				});
				return;
			}
			
			// 验证必须选择至少一个标签
			if (this.formData.selectedTags.length === 0) {
				uni.showToast({
					title: '请至少选择一个心情标签',
					icon: 'none'
				});
				return;
			}
			
			// 限制持续时间输入
			if (this.formData.minutes) {
				let minutes = parseInt(this.formData.minutes);
				if (minutes > 60) {
					this.formData.minutes = '60';
				}
			}
			
			if (this.formData.seconds) {
				let seconds = parseInt(this.formData.seconds);
				if (seconds > 59) {
					this.formData.seconds = '59';
				}
			}
			
			// 计算持续时间（秒）
			let duration = 0;
			if (this.formData.minutes) {
				duration += parseInt(this.formData.minutes) * 60;
			}
			if (this.formData.seconds) {
				duration += parseInt(this.formData.seconds);
			}
			
			// 构建记录时间
			const recordDate = new Date(`${this.formData.recordDate}T${this.formData.recordTime}:00`);
			const recordDateTime = recordDate.toISOString();
			
			// 获取用户信息
			const userInfo = JSON.parse(uni.getStorageSync('userInfo'));
			
			// 构建请求数据
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
			
			// 发送事件给父组件处理提交
			this.$emit('submit', recordData);
		},

		// 格式化日期
		formatDate(date) {
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			return `${year}-${month}-${day}`;
		},

		// 格式化时间
		formatTime(date) {
			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			return `${hours}:${minutes}`;
		}
	}
}
</script>

<style>
.form-container {
	background-color: #fff;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	padding: 30rpx;
}

.form-item {
	margin-bottom: 30rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 10rpx;
}

.datetime-picker {
	display: flex;
	justify-content: space-between;
}

.picker-value {
	height: 80rpx;
	line-height: 80rpx;
	padding: 0 20rpx;
	border: 1rpx solid #eee;
	border-radius: 8rpx;
	font-size: 28rpx;
	width: 300rpx;
	text-align: center;
}

.duration-input {
	display: flex;
	align-items: center;
}

.time-input {
	width: 120rpx;
	height: 80rpx;
	border: 1rpx solid #eee;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	text-align: center;
}

.time-unit {
	margin: 0 20rpx;
	font-size: 28rpx;
	color: #666;
}

.poop-types-container {
	margin-top: 10rpx;
}

.poop-types-scroll {
	white-space: nowrap;
	width: 100%;
}

.poop-type-item {
	display: inline-flex;
	align-items: center;
	padding: 15rpx 25rpx;
	border-radius: 30rpx;
	margin-right: 20rpx;
	margin-bottom: 20rpx;
	background-color: #fff;
	border: 2rpx solid #eee;
}

.poop-type-item.selected {
	background-color: #f8f8f8;
	border-width: 2rpx;
}

.poop-type-color {
	width: 24rpx;
	height: 24rpx;
	border-radius: 12rpx;
	margin-right: 10rpx;
}

.poop-type-name {
	font-size: 28rpx;
}

.poop-type-details {
	margin-top: 20rpx;
	border-radius: 12rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.detail-header {
	padding: 20rpx;
}

.detail-title {
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
}

.detail-content {
	padding: 20rpx;
	background-color: #fff;
}

.detail-item {
	margin-bottom: 15rpx;
}

.detail-label {
	font-size: 28rpx;
	color: #666;
	margin-right: 10rpx;
}

.detail-value {
	font-size: 28rpx;
	color: #333;
	line-height: 1.5;
}

.tags {
	display: flex;
	flex-wrap: wrap;
}

.tag-item {
	padding: 15rpx 25rpx;
	border-radius: 30rpx;
	margin-right: 20rpx;
	margin-bottom: 20rpx;
	background-color: #f8f8f8;
}

.tag-item.selected {
	background-color: #07c160;
}

.tag-item.selected .tag-name {
	color: #fff;
}

.tag-name {
	font-size: 28rpx;
	color: #333;
}

.note-input {
	width: 100%;
	height: 200rpx;
	border: 1rpx solid #eee;
	border-radius: 8rpx;
	padding: 20rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.submit-btn {
	margin-top: 50rpx;
	width: 100%;
	height: 90rpx;
	line-height: 90rpx;
	background-color: #07c160;
	color: #fff;
	border-radius: 45rpx;
	font-size: 32rpx;
}
</style>