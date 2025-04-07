<template>
    <view class="container">
        <view class="header">
            <text class="title">好友管理</text>
        </view>

        <!-- 顶部标签页 -->
        <view class="tabs">
            <view class="tab-item" :class="{ active: activeTab === 'friends' }" @click="switchTab('friends')">我的好友
            </view>
            <view class="tab-item" :class="{ active: activeTab === 'search' }" @click="switchTab('search')">查找好友</view>
            <view class="tab-item" :class="{ active: activeTab === 'requests' }" @click="switchTab('requests')">好友申请
                <view class="badge" v-if="pendingRequests > 0">{{ pendingRequests }}</view>
            </view>
        </view>

        <!-- 我的好友列表 -->
        <view class="tab-content" v-if="activeTab === 'friends'">
            <!-- 添加好友排行榜入口 -->
            <view class="ranking-entry" @click="goToRanking">
                <view class="ranking-icon">🏆</view>
                <view class="ranking-text">好友排行榜</view>
                <view class="ranking-arrow">></view>
            </view>

            <view class="search-box">
                <input type="text" v-model="friendKeyword" placeholder="搜索好友" @input="searchFriends" />
            </view>

            <!-- 其余好友列表内容保持不变 -->
            <view v-if="loading" class="loading">
                <text>加载中...</text>
            </view>

            <view v-else-if="filteredFriends.length === 0" class="empty-list">
                <text>暂无好友，快去添加好友吧！</text>
            </view>

            <view v-else class="friend-list">
                <view v-for="friend in filteredFriends" :key="friend.id" class="friend-item">
                    <image class="avatar" :src="friend.friend_user.avatar_url" mode="aspectFill"></image>
                    <view class="friend-info">
                        <text class="nickname">{{ friend.friend_user.nickname }}</text>
                        <view class="stats-info" v-if="friendStats[friend.friend_id]">
                            <text class="stats-count">今日: {{ friendStats[friend.friend_id].count || 0 }}次</text>
                            <text class="stats-time">总时长: {{ formatDuration(friendStats[friend.friend_id].total_time || 0) }}</text>
                        </view>
                        <text class="stats-loading" v-else>加载统计中...</text>
                    </view>
                    <view class="action-buttons">
                        <view class="action-btn delete" @click="deleteFriend(friend.id)">删除</view>
                    </view>
                </view>
            </view>

            <!-- 分页控件保持不变 -->
            <view class="pagination" v-if="totalFriendPages > 1">
                <view class="page-btn" :class="{ disabled: currentFriendPage <= 1 }"
                    @click="currentFriendPage > 1 && changeFriendPage(currentFriendPage - 1)">上一页</view>
                <text class="page-info">{{ currentFriendPage }}/{{ totalFriendPages }}</text>
                <view class="page-btn" :class="{ disabled: currentFriendPage >= totalFriendPages }"
                    @click="currentFriendPage < totalFriendPages && changeFriendPage(currentFriendPage + 1)">下一页</view>
            </view>
        </view>

        <!-- 查找好友 -->
        <view class="tab-content" v-if="activeTab === 'search'">
            <view class="search-box">
                <input type="text" v-model="searchKeyword" placeholder="输入用户名或昵称搜索" />
                <button class="search-btn" @click="searchUsers">搜索</button>
            </view>

            <view v-if="searching" class="loading">
                <text>搜索中...</text>
            </view>

            <view v-else-if="searchResults.length === 0 && hasSearched" class="empty-list">
                <text>未找到相关用户</text>
            </view>

            <view v-else-if="searchResults.length > 0" class="user-list">
                <view v-for="user in searchResults" :key="user.id" class="user-item">
                    <image class="avatar" :src="user.avatar_url" mode="aspectFill"></image>
                    <view class="user-info">
                        <text class="nickname">{{ user.nickname }}</text>
                    </view>
                    <view class="action-btn add" @click="addFriend(user)">
                        添加
                    </view>
                </view>
            </view>

            <!-- 分页控件 -->
            <view class="pagination" v-if="totalSearchPages > 1">
                <view class="page-btn" :class="{ disabled: currentSearchPage <= 1 }"
                    @click="currentSearchPage > 1 && changeSearchPage(currentSearchPage - 1)">上一页</view>
                <text class="page-info">{{ currentSearchPage }}/{{ totalSearchPages }}</text>
                <view class="page-btn" :class="{ disabled: currentSearchPage >= totalSearchPages }"
                    @click="currentSearchPage < totalSearchPages && changeSearchPage(currentSearchPage + 1)">下一页</view>
            </view>
        </view>

        <!-- 好友申请 -->
        <view class="tab-content" v-if="activeTab === 'requests'">
            <view v-if="loadingRequests" class="loading">
                <text>加载中...</text>
            </view>

            <view v-else-if="friendRequests.length === 0" class="empty-list">
                <text>暂无好友申请</text>
            </view>

            <view v-else class="request-list">
                <view v-for="request in friendRequests" :key="request.id" class="request-item">
                    <image class="avatar" :src="request.friend_user.avatar_url" mode="aspectFill"></image>
                    <view class="request-info">
                        <text class="nickname">{{ request.friend_user.nickname }}</text>
                        <text class="time">{{ formatTime(request.created_at) }}</text>
                    </view>
                    <view class="request-actions">
                        <view class="action-btn accept" @click="handleRequest(request.id,request.user_id,request.friend_id,1)">接受</view>
                        <view class="action-btn reject" @click="handleRequest(request.id,request.user_id,request.friend_id, 2)">拒绝</view>
                    </view>
                </view>
            </view>
            <!-- 在好友申请列表下方添加分页控件 -->
            <view class="pagination" v-if="totalRequestPages > 1">
                <view class="page-btn" :class="{ disabled: currentRequestPage <= 1 }"
                    @click="currentRequestPage > 1 && changeRequestPage(currentRequestPage - 1)">上一页</view>
                <text class="page-info">{{ currentRequestPage }}/{{ totalRequestPages }}</text>
                <view class="page-btn" :class="{ disabled: currentRequestPage >= totalRequestPages }"
                    @click="currentRequestPage < totalRequestPages && changeRequestPage(currentRequestPage + 1)">下一页</view>
            </view>
        </view>
    </view>
</template>

<script>
import request from '../../utils/request.js';

export default {
    data() {
        return {
            activeTab: 'friends',
            loading: true,
            searching: false,
            loadingRequests: true,
            hasSearched: false,

            // 我的好友
            friends: [],
            filteredFriends: [],
            friendKeyword: '',
            currentFriendPage: 1,
            totalFriendPages: 1,
            friendPageSize: 10,
            friendStats: {}, // 存储好友的拉屎记录统计

            // 搜索用户
            searchKeyword: '',
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
        }
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
            uni.navigateTo({
                url: '/pages/ranking/friends'
            });
        },

        // 切换标签页
        switchTab(tab) {
            this.activeTab = tab;

            if (tab === 'friends' && this.friends.length === 0) {
                this.loadFriends();
            } else if (tab === 'requests' && this.friendRequests.length === 0) {
                this.loadFriendRequests();
            }
        },

        // 加载好友列表
        // 在 methods 中添加下拉刷新方法
        onPullDownRefresh() {
            // 根据当前标签页刷新不同的数据
            if (this.activeTab === 'friends') {
                this.loadFriends();
            } else if (this.activeTab === 'requests') {
                this.loadFriendRequests();
            } else if (this.activeTab === 'search') {
                // 搜索页不自动刷新
                uni.stopPullDownRefresh();
            }
        },

        // 搜索用户
        searchUsers() {
            if (this.searchKeyword.trim() === '') {
                uni.showToast({
                    title: '请输入搜索关键词',
                    icon: 'none'
                });
                return;
            }

            this.searching = true;
            this.hasSearched = true;

            uni.showLoading({
                title: '搜索中...'
            });

            request.get('/users/search', {
                keyword: this.searchKeyword,
                page: this.currentSearchPage,
                page_size: this.searchPageSize
            })
                .then(data => {
                    this.searchResults = data.users || []
                    this.totalSearchPages = Math.ceil(data.total / this.searchPageSize) || 1;
                })
                .catch(err => {
                    console.error('搜索用户失败', err);
                    uni.showToast({
                        title: '搜索失败，请重试',
                        icon: 'none'
                    });
                })
                .finally(() => {
                    this.searching = false;
                    uni.hideLoading();
                });
        },

        loadFriends() {
            this.loading = true;
            request.get('/friends', {
                page: this.currentFriendPage,
                page_size: this.friendPageSize,
                keyword: this.friendKeyword
            })
                .then(data => {
                    this.friends = data.friends || [];
                    this.filteredFriends = this.friends;
                    this.totalFriendPages = Math.ceil(data.total / this.friendPageSize) || 1;
                    
                    // 加载好友的拉屎记录统计
                    this.loadFriendsStats();
                })
                .catch(err => {
                    console.error('获取好友列表失败', err);
                    uni.showToast({
                        title: '获取好友列表失败',
                        icon: 'none'
                    });
                })
                .finally(() => {
                    this.loading = false;
                    uni.stopPullDownRefresh();
                });
        },
        
        // 加载好友的拉屎记录统计
        loadFriendsStats() {
            if (this.friends.length === 0) return;
            
            // 提取好友ID列表
            const friendIds = this.friends.map(friend => friend.friend_id);
            
            // 构建查询参数
            const queryParams = friendIds.map(id => `user_ids=${id}`).join('&');
            
            // 获取当天日期
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            // 请求API获取统计数据
            request.get(`/records/daily-stats?${queryParams}&date=${dateStr}`)
                .then(data => {
                    // 将数组转换为以user_id为键的对象，方便查找
                    const statsMap = {};
                    (data.stats || []).forEach(stat => {
                        statsMap[stat.user_id] = stat;
                    });
                    
                    this.friendStats = statsMap;
                })
                .catch(err => {
                    console.error('获取好友记录统计失败', err);
                });
        },
        
        // 格式化时长显示
        formatDuration(seconds) {
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            
            if (hours > 0) {
                const remainingMinutes = minutes % 60;
                return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分钟' : ''}`;
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
            request.get('/friends/requests', {
                page: this.currentRequestPage,
                page_size: this.requestPageSize
            })
                .then(data => {
                    this.friendRequests = data.requests || [];
                    this.pendingRequests = this.friendRequests.length;
                    this.totalRequestPages = Math.ceil(data.total / this.requestPageSize) || 1;
                })
                .catch(err => {
                    console.error('获取好友申请失败', err);
                    uni.showToast({
                        title: '获取好友申请失败',
                        icon: 'none'
                    });
                })
                .finally(() => {
                    this.loadingRequests = false;
                    uni.stopPullDownRefresh();
                });
        },

        // 修改 addFriend 方法，确保与后端接口匹配
        addFriend(user) {
            uni.showLoading({
                title: '处理中...'
            });

            request.post('/friends', {
                friend_id: user.id
            })
                .then(() => {
                    uni.showToast({
                        title: '好友申请已发送',
                        icon: 'success'
                    });
                    
                    // 从搜索结果中移除该用户
                    this.searchResults = this.searchResults.filter(item => item.id !== user.id);
                })
                .catch(err => {
                    console.error('添加好友失败', err);
                    uni.showToast({
                        title: err.data.error,
                        icon: 'none'
                    });
                })
                .finally(() => {
                    uni.hideLoading();
                });
        },

        // 修改 handleRequest 方法，确保与后端接口匹配
        handleRequest(requestId,user_id,friend_id, status) {
            uni.showLoading({
                title: '处理中...'
            });
            
            if (!request) {
                uni.showToast({
                    title: '请求数据错误',
                    icon: 'none'
                });
                uni.hideLoading();
                return;
            }

            console.log(this.friendRequests);
            

            request.put('/friends/' + requestId, {
                user_id: user_id, // 申请方的用户ID
                friend_id: friend_id, // 被申请方的用户ID
                status: status // 1-接受, 2-拒绝
            })
                .then(() => {
                    uni.showToast({
                        title: status === 1 ? '已接受好友申请' : '已拒绝好友申请',
                        icon: 'success'
                    });

                    // 从列表中移除已处理的申请
                    this.friendRequests = this.friendRequests.filter(req => req.id !== requestId);
                    this.pendingRequests = this.friendRequests.length;

                    // 如果接受了好友申请，刷新好友列表
                    if (status === 1) {
                        this.loadFriends();
                    }
                })
                .catch(err => {
                    console.error('处理好友申请失败', err);
                    uni.showToast({
                        title: '处理失败，请重试',
                        icon: 'none'
                    });
                })
                .finally(() => {
                    uni.hideLoading();
                });
        },

        // 修改 deleteFriend 方法，确保与后端接口匹配
        deleteFriend(friendId) {
            uni.showModal({
                title: '提示',
                content: '确定要删除这个好友吗？',
                success: (res) => {
                    if (res.confirm) {
                        uni.showLoading({
                            title: '处理中...'
                        });

                        const userInfo = JSON.parse(uni.getStorageSync('userInfo'));
                        request.delete('/friends/' + friendId, {
                            user_id: userInfo.id,
                            id: friendId
                        })
                            .then(() => {
                                uni.showToast({
                                    title: '已删除好友',
                                    icon: 'success'
                                });

                                // 从列表中移除已删除的好友
                                this.friends = this.friends.filter(friend => friend.id !== friendId);
                                this.filteredFriends = this.filteredFriends.filter(friend => friend.id !== friendId);
                            })
                            .catch(err => {
                                console.error('删除好友失败', err);
                                uni.showToast({
                                    title: '删除失败，请重试',
                                    icon: 'none'
                                });
                            })
                            .finally(() => {
                                uni.hideLoading();
                            });
                    }
                }
            });
        },

        // 获取好友操作按钮文本
        getFriendActionText(relation) {
            switch (relation) {
                case 0: return '添加';
                case 1: return '待确认';
                case 2: return '已添加';
                default: return '添加';
            }
        },

        // 格式化时间
        formatTime(timeStr) {
            const date = new Date(timeStr);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            return `${year}-${month}-${day} ${hours}:${minutes}`;
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

.tabs {
    display: flex;
    justify-content: space-around;
    background-color: #f8f8f8;
    border-radius: 10rpx;
    margin-bottom: 20rpx;
    position: relative;
}

.tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx 0;
    font-size: 28rpx;
    color: #666;
    position: relative;
}

.tab-item.active {
    color: #07c160;
    font-weight: bold;
}

.tab-item.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 25%;
    width: 50%;
    height: 4rpx;
    background-color: #07c160;
    border-radius: 2rpx;
}

.badge {
    position: absolute;
    top: 10rpx;
    right: 10rpx;
    background-color: #ff4d4f;
    color: #fff;
    font-size: 20rpx;
    min-width: 32rpx;
    height: 32rpx;
    line-height: 32rpx;
    text-align: center;
    border-radius: 16rpx;
    padding: 0 6rpx;
}

.search-box {
    display: flex;
    background-color: #f5f5f5;
    border-radius: 30rpx;
    padding: 10rpx 20rpx;
    margin-bottom: 20rpx;
}

.search-box input {
    flex: 1;
    height: 60rpx;
    font-size: 28rpx;
}

.search-btn {
    background-color: #07c160;
    color: #fff;
    font-size: 28rpx;
    padding: 0 30rpx;
    border-radius: 30rpx;
    margin-left: 10rpx;
}

/* 添加排行榜入口样式 */
.ranking-entry {
    display: flex;
    align-items: center;
    background-color: #f8f8f8;
    padding: 20rpx;
    border-radius: 10rpx;
    margin-bottom: 20rpx;
}

.ranking-icon {
    font-size: 36rpx;
    margin-right: 15rpx;
}

.ranking-text {
    flex: 1;
    font-size: 30rpx;
    color: #333;
    font-weight: bold;
}

.ranking-arrow {
    color: #999;
    font-size: 30rpx;
}

.loading,
.empty-list {
    padding: 50rpx 0;
    text-align: center;
    color: #999;
}

.friend-list,
.user-list,
.request-list {
    background-color: #fff;
    border-radius: 12rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.friend-item,
.user-item,
.request-item {
    display: flex;
    align-items: center;
    padding: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.friend-item:last-child,
.user-item:last-child,
.request-item:last-child {
    border-bottom: none;
}

.avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 40rpx;
    margin-right: 20rpx;
}

.friend-info,
.user-info,
.request-info {
    flex: 1;
}

.nickname {
    font-size: 30rpx;
    color: #333;
    margin-bottom: 6rpx;
}

.stats-info {
    display: flex;
    flex-direction: column;
    margin-top: 6rpx;
}

.stats-count, .stats-time {
    font-size: 24rpx;
    color: #666;
}

.stats-count {
    color: #07c160;
}

.stats-loading {
    font-size: 24rpx;
    color: #999;
    margin-top: 6rpx;
}

.time {
    font-size: 24rpx;
    color: #999;
}

/* 修改好友项样式，添加多个操作按钮的容器 */
.action-buttons {
    display: flex;
}

.action-btn {
    padding: 10rpx 20rpx;
    border-radius: 30rpx;
    font-size: 24rpx;
    color: #fff;
    margin-left: 10rpx;
}

.action-btn.view {
    background-color: #1989fa;
}

.action-btn.delete {
    background-color: #ff4d4f;
}

.action-btn.add {
    background-color: #07c160;
}

.action-btn.pending {
    background-color: #faad14;
}

.action-btn.added {
    background-color: #999;
}

.action-btn.accept {
    background-color: #07c160;
}

.action-btn.reject {
    background-color: #ff4d4f;
}

.request-actions {
    display: flex;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20rpx;
    padding: 20rpx 0;
}

.page-btn {
    padding: 10rpx 20rpx;
    background-color: #f8f8f8;
    color: #333;
    font-size: 24rpx;
    border-radius: 6rpx;
}

.page-btn.disabled {
    color: #ccc;
}

.page-info {
    margin: 0 20rpx;
    font-size: 24rpx;
    color: #666;
}
</style>