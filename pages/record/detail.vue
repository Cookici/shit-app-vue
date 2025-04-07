<template>
	<view class="container">
		<view class="header">
			<text class="title">记录详情</text>
		</view>
		
		<view class="record-container" v-if="record">
			<view class="record-header">
				<view class="record-time">{{ formatDateTime(record.record_time) }}</view>
				<view class="record-type" :style="{ backgroundColor: getPoopTypeColor(record.poop_type_id) }">
					{{ getPoopTypeName(record.poop_type_id) }}
				</view>
			</view>
			
			<view class="record-info">
				<view class="info-item">
					<text class="info-label">持续时间</text>
					<text class="info-value">{{ formatDuration(record.duration) }}</text>
				</view>
				
				<view class="info-item" v-if="record.tags && record.tags.length > 0">
					<text class="info-label">心情标签</text>
					<view class="tags-list">
						<text v-for="(tag, index) in record.tags" :key="index" class="tag">{{ tag.name }}</text>
					</view>
				</view>
				
				<view class="info-item" v-if="record.note">
					<text class="info-label">备注</text>
					<text class="info-value note">{{ record.note }}</text>
				</view>
			</view>
			
			<view class="health-info" v-if="poopType">
				<text class="health-title">健康提示</text>
				<text class="health-content">{{ poopType.health_indication || '暂无健康提示' }}</text>
			</view>
			
			<view class="action-buttons">
				<button class="edit-btn" @click="editRecord">编辑</button>
				<button class="delete-btn" @click="confirmDelete">删除</button>
			</view>
		</view>
		
		<view class="loading" v-else>
			<text>加载中...</text>
		</view>
	</view>
</template>

<script>
import request from '../../utils/request.js';

export default {
	data() {
		return {
			recordId: '',
			record: null,
			poopTypes: [],
			poopType: null,
			needRefresh: false  // 添加刷新标志
		}
	},
	onLoad(options) {
		if (options.id) {
			this.recordId = options.id;
			this.loadRecord();
			this.loadPoopTypes();
		} else {
			uni.showToast({
				title: '记录ID不存在',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		}
	},
	onShow() {
		// 如果需要刷新，则重新加载记录
		console.log('详情页onShow, needRefresh:', this.needRefresh);
		if (this.needRefresh) {
			this.loadRecord();
			this.loadPoopTypes();
			this.needRefresh = false;
		}
	},
	methods: {
		// 加载记录详情
		loadRecord() {
			uni.showLoading({
				title: '加载中...'
			});
			
			request.get(`/records/${this.recordId}`)
				.then(data => {
					this.record = data.record;
					// 获取便便类型详情
					if (this.record && this.poopTypes.length > 0) {
						this.poopType = this.poopTypes.find(t => t.id === this.record.poop_type_id);
					}
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
				});
		},
		
		// 加载便便类型
		loadPoopTypes() {
			request.get('/poop-types')
				.then(data => {
					// 确保数据结构正确，并处理颜色值
					if (data && Array.isArray(data.types)) {
						this.poopTypes = data.types.map(type => {
							// 使用统一方法处理颜色
							type.color = this.getPoopTypeColor(type);
							return type;
						});
					} else if (data) {
						// 如果数据直接是数组
						this.poopTypes = data.map(type => {
							// 使用统一方法处理颜色
							type.color = this.getPoopTypeColor(type);
							return type;
						});
					} else {
						this.poopTypes = [];
					}
					
					// 获取便便类型详情
					if (this.record && this.poopTypes.length > 0) {
						this.poopType = this.poopTypes.find(t => t.id === this.record.poop_type_id);
					}
				})
				.catch(err => {
					console.error('获取便便类型失败', err);
					uni.showToast({
						title: '拉取数据失败，请检查网络',
						icon: 'none'
					});
				});
		},
		
		// 编辑记录
		editRecord() {
			uni.navigateTo({
				url: `/pages/record/edit?id=${this.recordId}`
			});
		},
		
		// 确认删除
		confirmDelete() {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条记录吗？删除后无法恢复。',
				confirmColor: '#ff0000',
				success: (res) => {
					if (res.confirm) {
						this.deleteRecord();
					}
				}
			});
		},
		
		// 删除记录
		deleteRecord() {
			uni.showLoading({
				title: '删除中...'
			});
			
			request.delete(`/records/${this.recordId}`)
				.then(() => {
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});
					
					// 返回上一页
					setTimeout(() => {
						uni.navigateBack();
					}, 1000);
				})
				.catch(err => {
					console.error('删除记录失败', err);
				})
				.finally(() => {
					uni.hideLoading();
				});
		},
		
		// 获取便便类型名称
		getPoopTypeName(typeId) {
			const type = this.poopTypes.find(t => t.id === typeId);
			return type ? type.name : '未知类型';
		},
		
		// 获取便便类型颜色
		getPoopTypeColor(typeOrId) {
			// 如果传入的是ID
			if (typeof typeOrId === 'number') {
				const type = this.poopTypes.find(t => t.id === typeOrId);
				if (!type) return '#cccccc';
				return this.getPoopTypeColor(type);
			}
			
			// 如果传入的是类型对象
			const type = typeOrId;
			
			// 如果已经是十六进制颜色，直接返回
			if (type.color && type.color.startsWith('#')) {
				return type.color;
			}
			
			// 根据颜色描述转换为十六进制
			if (type.color) {
				switch(type.color) {
					case '深棕色': return '#8B4513';
					case '棕色': return '#A0522D';
					case '浅棕色': return '#DEB887';
					case '黄色或浅棕色': return '#F4A460';
					default: return '#A0522D'; // 默认棕色
				}
			}
			
			// 如果没有颜色，根据ID设置默认颜色
			switch(type.id) {
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
		
		// 格式化日期时间
		formatDateTime(dateTimeStr) {
			const date = new Date(dateTimeStr);
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			
			return `${year}年${month}月${day}日 ${hours}:${minutes}`;
		},
		
		// 格式化持续时间
		formatDuration(seconds) {
			if (!seconds) return '未记录';
			const minutes = Math.floor(seconds / 60);
			const remainSeconds = seconds % 60;
			return `${minutes}分${remainSeconds}秒`;
		}
	}
}
</script>

<style>
.container {
	padding: 20rpx;
}

.header {
	text-align: center;
	margin-bottom: 30rpx;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.record-container {
	background-color: #fff;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	padding: 30rpx;
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #eee;
	margin-bottom: 20rpx;
}

.record-time {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.record-type {
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
	font-size: 28rpx;
	color: #fff;
}

.record-info {
	margin-bottom: 30rpx;
}

.info-item {
	margin-bottom: 20rpx;
}

.info-label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 10rpx;
}

.info-value {
	font-size: 32rpx;
	color: #333;
}

.note {
	line-height: 1.5;
}

.tags-list {
	display: flex;
	flex-wrap: wrap;
}

.tag {
	font-size: 28rpx;
	background-color: #f0f0f0;
	color: #666;
	padding: 8rpx 16rpx;
	border-radius: 16rpx;
	margin-right: 16rpx;
	margin-bottom: 10rpx;
}

.health-info {
	background-color: #f8f8f8;
	padding: 20rpx;
	border-radius: 8rpx;
	margin-bottom: 30rpx;
}

.health-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 10rpx;
	display: block;
}

.health-content {
	font-size: 28rpx;
	color: #666;
	line-height: 1.5;
}

.action-buttons {
	display: flex;
	justify-content: space-between;
}

.edit-btn, .delete-btn {
	width: 45%;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 40rpx;
	font-size: 28rpx;
}

.edit-btn {
	background-color: #07c160;
	color: #fff;
}

.delete-btn {
	background-color: #fff;
	color: #ff0000;
	border: 1rpx solid #ff0000;
}

.loading {
	text-align: center;
	padding: 50rpx 0;
	color: #999;
}
</style>