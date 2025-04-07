<template>
	<view class="container">
		<view class="header">
			<text class="title">拉屎日记</text>
		</view>
		
		<!-- 日历组件 -->
		<view class="calendar-container">
			<view class="month-selector">
				<text class="iconfont" @click="changeMonth(-1)">◀</text>
				<text class="current-month">{{ currentYear }}年{{ currentMonth + 1 }}月</text>
				<text class="iconfont" @click="changeMonth(1)">▶</text>
			</view>
			
			<view class="weekdays">
				<text v-for="(day, index) in weekdays" :key="index" class="weekday">{{ day }}</text>
			</view>
			
			<view class="days">
				<view v-for="(day, index) in days" :key="index" 
					class="day-cell" 
					:class="{ 
						'empty': !day.date, 
						'today': day.isToday,
						'has-record': day.hasRecord
					}"
					@click="day.date && selectDate(day.date)">
					<text class="day-number">{{ day.date ? day.date.getDate() : '' }}</text>
					<view v-if="day.hasRecord" class="record-indicator" 
						:style="{ backgroundColor: day.recordColor || '#07c160' }"></view>
				</view>
			</view>
		</view>
		
		<!-- 选中日期的记录列表 -->
		<view class="records-container" v-if="selectedDate">
			<view class="date-header">
				<text class="selected-date">{{ formatDate(selectedDate) }}的记录</text>
				<!-- 修改按钮样式和位置 -->
				<view class="corner-add-btn" @click="addRecord">
					<text class="add-icon">＋</text>
				</view>
			</view>
			
			<view v-if="dayRecords.length === 0" class="empty-records">
				<text>今天还没有记录哦，点击添加按钮记录一下吧！</text>
			</view>
			
			<view v-else class="record-list">
				<view v-for="item in dayRecords" :key="item.record.id" class="record-item" @click="viewRecord(item.record)">
					<view class="record-time">{{ formatTime(item.record.record_time) }}</view>
					<view class="record-type" :style="{ backgroundColor: getPoopTypeColor(item.poop_type.id) }">
						{{ item.poop_type.name }}
					</view>
					<view class="record-duration">{{ formatDuration(item.record.duration) }}</view>
					<view class="record-tags">
						<text v-for="tag in item.tags" :key="tag.id" class="tag">{{ tag.name }}</text>
					</view>
					<view class="record-note" v-if="item.record.note">{{ formatNote(item.record.note) }}</view>
				</view>
			</view>

			<view class="pagination" v-if="totalPages > 1">
				<view class="pagination-info">
					<text>共 {{ totalRecords }} 条记录，{{ totalPages }} 页</text>
				</view>
				<view class="pagination-controls">
					<view class="pagination-btn" 
						:class="{ 'disabled': currentPage <= 1 }"
						@click="currentPage > 1 && changePage(currentPage - 1)">
						<text class="pagination-icon">◀</text>
					</view>
					
					<view v-for="page in displayedPages" :key="page" 
						class="pagination-page" 
						:class="{ 'active': page === currentPage }"
						@click="changePage(page)">
						<text>{{ page }}</text>
					</view>
					
					<view class="pagination-btn" 
						:class="{ 'disabled': currentPage >= totalPages }"
						@click="currentPage < totalPages && changePage(currentPage + 1)">
						<text class="pagination-icon">▶</text>
					</view>
				</view>
			</view>

		</view>
	</view>
</template>

<script>
import request from '../../utils/request.js';

export default {
	data() {
		return {
			weekdays: ['日', '一', '二', '三', '四', '五', '六'],
			currentDate: new Date(),
			currentYear: new Date().getFullYear(),
			currentMonth: new Date().getMonth(),
			days: [],
			selectedDate: new Date(),
			dayRecords: [],
			poopTypes: [],
			tags: [],
			// 分页相关数据
			currentPage: 1,
			pageSize: 3,
			totalPages: 1,
			totalRecords: 0
		}
	},
	computed: {
		displayedPages() {
			const pages = [];
			const maxVisiblePages = 3; // 最多显示1个页码按钮
			
			if (this.totalPages <= maxVisiblePages) {
				// 如果总页数小于等于最大可见页数，则显示所有页码
				for (let i = 1; i <= this.totalPages; i++) {
					pages.push(i);
				}
			} else {
				// 否则，显示当前页附近的页码
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
		const token = uni.getStorageSync('token');
		
		if (!token) {
			// 未登录，跳转到登录页
			uni.redirectTo({
				url: '/pages/login/login'
			});
			return;
		}
		
		// 初始化日历
		this.initCalendar();
		
		// 加载便便类型和标签
		this.loadPoopTypes();
		this.loadTags();
		
		// 加载当天记录
		this.loadDayRecords(this.selectedDate);
	},
	onShow() {
		const token = uni.getStorageSync('token');
		
		if (!token) {
			uni.redirectTo({
				url: '/pages/login/login'
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
			
			// 获取当月第一天是星期几
			const firstDay = new Date(year, month, 1).getDay();
			
			// 获取当月天数
			const daysInMonth = new Date(year, month + 1, 0).getDate();
			
			// 构建日历数组
			const days = [];
			
			// 填充月初空白
			for (let i = 0; i < firstDay; i++) {
				days.push({ date: null });
			}
			
			// 填充日期
			const today = new Date();
			for (let i = 1; i <= daysInMonth; i++) {
				const date = new Date(year, month, i);
				days.push({
					date: date,
					isToday: date.getDate() === today.getDate() && 
							date.getMonth() === today.getMonth() && 
							date.getFullYear() === today.getFullYear(),
					hasRecord: false, // 默认没有记录，后面会更新
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
			const userInfo = JSON.parse(uni.getStorageSync('userInfo'));
			const startDate = this.formatDateForAPI(date);
			
			this.currentPage = page;
			
			request.get('/records/date-range', {
				user_id: userInfo.id,
				start: startDate,
				end: startDate,
				page: this.currentPage,
				page_size: this.pageSize
			})
			.then(data => {
				// 更新记录数据
				this.dayRecords = data.records || [];
				
				// 更新分页信息
				this.totalRecords = data.total || this.dayRecords.length;
				this.totalPages = data.total_pages || Math.ceil(this.totalRecords / this.pageSize);
				
				// 如果当前页大于总页数，则加载最后一页
				if (this.currentPage > this.totalPages && this.totalPages > 0) {
					this.changePage(this.totalPages);
				}
			})
			.catch(err => {
				console.error('获取日记录失败', err);
				this.dayRecords = [];
				this.totalRecords = 0;
				this.totalPages = 1;
				uni.showToast({
					title: '获取记录失败',
					icon: 'none'
				});
			});
		},
		
		changePage(page) {
			if (page === this.currentPage) return;
			this.loadDayRecords(this.selectedDate, page);
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
				
			})
			.catch(err => {
				console.error('获取便便类型失败', err);
			});
		},
		
		// 加载标签
		loadTags() {
			request.get('/tags')
			.then(data => {
				this.tags = data.tags || [];
			})
			.catch(err => {
				console.error('获取标签失败', err);
			});
		},
		
		// 添加记录
		addRecord() {
			uni.navigateTo({
				url: `/pages/record/add?date=${this.formatDateForAPI(this.selectedDate)}`
			});
		},
		
		// 查看记录详情
		viewRecord(record) {
			uni.navigateTo({
				url: `/pages/record/detail?id=${record.id}`
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
		
		// 格式化日期显示
		formatDate(date) {
			return `${date.getMonth() + 1}月${date.getDate()}日`;
		},
		
		// 格式化时间显示
		formatTime(dateTimeStr) {
			const date = new Date(dateTimeStr);
			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			return `${hours}:${minutes}`;
		},
		
		// 格式化持续时间
		formatDuration(seconds) {
			if (!seconds) return '未记录';
			const minutes = Math.floor(seconds / 60);
			const remainSeconds = seconds % 60;
			return `${minutes}分${remainSeconds}秒`;
		},
		
		// 格式化日期为API格式
		formatDateForAPI(date) {
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			return `${year}-${month}-${day}`;
		},
		
		// 格式化备注，根据宽度调整展示字数
		formatNote(note) {
			if (!note) return '';
			// 移动端一般显示15-20个字比较合适
			const maxLength = 15;
			if (note.length <= maxLength) return note;
			return note.substring(0, maxLength) + '...';
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

/* 日历样式 */
.calendar-container {
	background-color: #fff;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	padding: 20rpx;
	margin-bottom: 30rpx;
}

.month-selector {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.current-month {
	font-size: 32rpx;
	font-weight: bold;
}

.weekdays {
	display: flex;
	justify-content: space-between;
	margin-bottom: 10rpx;
}

.weekday {
	width: 14.28%;
	text-align: center;
	font-size: 28rpx;
	color: #666;
}

.days {
	display: flex;
	flex-wrap: wrap;
}

.day-cell {
	width: 14.28%;
	height: 80rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	margin-bottom: 10rpx;
}

.day-number {
	font-size: 28rpx;
}

.empty {
	opacity: 0;
}

.today .day-number {
	background-color: #07c160;
	color: #fff;
	width: 50rpx;
	height: 50rpx;
	border-radius: 25rpx;
	text-align: center;
	line-height: 50rpx;
}

.record-indicator {
	width: 8rpx;
	height: 8rpx;
	border-radius: 4rpx;
	background-color: #07c160;
	position: absolute;
	bottom: 10rpx;
}

/* 记录列表样式 */
.records-container {
	background-color: #fff;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	padding: 20rpx;
}

.date-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	position: relative; /* 添加相对定位 */
}

/* 移除原添加按钮样式 */
.add-btn {
	display: none;
}

/* 添加右上角按钮样式 */
.corner-add-btn {
	width: 60rpx;
	height: 60rpx;
	background-color: #07c160;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
}

.add-icon {
	color: #fff;
	font-size: 32rpx; /* 调小字体大小 */
	font-weight: bold;
	text-align: center;
	line-height: 1; /* 设置行高为1 */
}

.empty-records {
	padding: 40rpx 0;
	text-align: center;
	color: #999;
}

.record-list {
	margin-top: 20rpx;
}

.record-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;
}

.record-time {
	width: 120rpx;
	font-size: 28rpx;
	color: #333;
}

.record-type {
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
	color: #fff;
	margin-right: 20rpx;
}

.record-duration {
	font-size: 24rpx;
	color: #666;
	margin-right: 20rpx;
}

/* 添加记录备注样式 */
.record-note {
	font-size: 24rpx;
	color: #666;
	margin-right: 20rpx;
	max-width: 200rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.record-tags {
	flex: 1;
	display: flex;
	flex-wrap: wrap;
}

.tag {
	font-size: 24rpx;
	background-color: #f0f0f0;
	color: #666;
	padding: 4rpx 12rpx;
	border-radius: 16rpx;
	margin-right: 10rpx;
	margin-bottom: 6rpx;
}
.pagination {
	margin-top: 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.pagination-info {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 15rpx;
}

.pagination-controls {
	display: flex;
	align-items: center;
	justify-content: center;
}

.pagination-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	background-color: #f5f5f5;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 10rpx;
}

.pagination-btn.disabled {
	opacity: 0.5;
}

.pagination-icon {
	font-size: 24rpx;
	color: #666;
}

.pagination-page {
	min-width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	background-color: #f5f5f5;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 10rpx;
	padding: 0 10rpx;
}

.pagination-page.active {
	background-color: #07c160;
}

.pagination-page.active text {
	color: #fff;
}

.pagination-page text {
	font-size: 28rpx;
	color: #666;
}
</style>
