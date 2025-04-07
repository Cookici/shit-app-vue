<template>
  <view class="container">
    <view class="header">
      <text class="title">排行榜</text>
    </view>
    
    <view class="time-selector">
      <view class="selector-item" 
        :class="{ active: timeRange === 'week' }" 
        @click="changeTimeRange('week')">本周</view>
      <view class="selector-item" 
        :class="{ active: timeRange === 'month' }" 
        @click="changeTimeRange('month')">本月</view>
    </view>
    
    <view class="ranking-list">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      

      <view v-else class="ranking-items">
        <view v-for="(item, index) in friendRankings" :key="item.user_id" class="ranking-item">
          <view class="rank-number" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</view>
          <image class="avatar" :src="item.avatar_url" mode="aspectFill"></image>
          <view class="user-info">
            <text class="nickname">{{ item.nickname }}</text>
            <view class="stats">
              <text class="count">{{ item.record_count }}次</text>
              <text class="duration">{{ formatDuration(item.total_duration) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 添加查看好友排行榜按钮 -->
    <view class="friend-ranking-btn" @click="goToFriendRanking">查看好友排行榜</view>
  </view>
</template>

<script>
import request from '../../utils/request.js';

export default {
  data() {
    return {
      timeRange: 'week', // 默认显示本周
      friendRankings: [],
      loading: true
    }
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
      
      // 获取当前时间范围的开始和结束日期
      const { startDate, endDate } = this.getDateRange(this.timeRange);
      
      request.get('/rankings', {
        start_date: this.formatDateForAPI(startDate),
        end_date: this.formatDateForAPI(endDate)
      })
      .then(data => {
        this.friendRankings = data.rankings || [];
      })
      .catch(err => {
        console.error('获取排行榜失败', err);
      })
      .finally(() => {
        this.loading = false;
      });
    },
    
    // 格式化时长显示
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
      } else {
        return `${minutes}分钟`;
      }
    },
    
    // 获取日期范围
    getDateRange(range) {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      if (range === 'week') {
        // 本周的开始（周日为一周的开始）
        const day = now.getDay();
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        
        // 本周的结束（下周日）
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
      } else if (range === 'month') {
        // 本月的开始
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        // 本月的结束
        endDate.setMonth(now.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
      } else if (range === 'year') {
        // 今年的开始
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        
        // 今年的结束
        endDate.setFullYear(now.getFullYear() + 1);
        endDate.setMonth(0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      return { startDate, endDate };
    },
    
    // 格式化日期为API需要的格式
    formatDateForAPI(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    // 跳转到好友管理页面
    goToFriendPage() {
      uni.navigateTo({
        url: '/pages/friends/index'
      });
    },
    
    // 添加跳转到好友排行榜的方法
    goToFriendRanking() {
      uni.navigateTo({
        url: '/pages/ranking/friends'
      });
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

.time-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 30rpx;
  background-color: #f8f8f8;
  border-radius: 10rpx;
  padding: 10rpx;
}

.selector-item {
  padding: 15rpx 30rpx;
  font-size: 28rpx;
  color: #666;
  border-radius: 8rpx;
}

.selector-item.active {
  background-color: #07c160;
  color: #fff;
}

.ranking-list {
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  padding: 20rpx;
}

.loading, .empty-list {
  padding: 50rpx 0;
  text-align: center;
  color: #999;
}

.friend-btn {
  margin-top: 30rpx;
  background-color: #07c160;
  color: #fff;
  font-size: 28rpx;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
}

.ranking-items {
  padding: 10rpx 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-number {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  background-color: #f0f0f0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.rank-number.top-three {
  background-color: #07c160;
  color: #fff;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  margin-right: 20rpx;
}

.user-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nickname {
  font-size: 30rpx;
  color: #333;
}

.stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.count {
  font-size: 32rpx;
  color: #07c160;
  font-weight: bold;
}

.duration {
  font-size: 24rpx;
  color: #999;
  margin-top: 5rpx;
}
.friend-ranking-btn {
  margin-top: 30rpx;
  background-color: #07c160;
  color: #fff;
  text-align: center;
  padding: 20rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
}
</style>