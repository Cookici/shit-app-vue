<template>
	<view class="login-container">
		<view class="logo-box">
			<image class="logo" src="/static/logo.png"></image>
		</view>
		<view class="title-box">
			<text class="title">欢迎使用</text>
			<text class="subtitle">请授权登录以继续</text>
		</view>
		<view class="btn-box">
			<button class="wx-login-btn" type="primary" @click="wxLogin">
				<text class="iconfont">微信登录</text>
			</button>
		</view>
	</view>
</template>

<script>

export default {
	data() {
		return {
			hasLogin: false,
			userInfo: {}
		}
	},
	onLoad() {
		// 检查是否已经登录
		this.checkLoginStatus();
	},
	methods: {
		// 检查登录状态
		checkLoginStatus() {
			try {
				const token = uni.getStorageSync('token');
				if (token) {
					this.hasLogin = true;
					// 已登录，跳转到首页 - 使用reLaunch代替switchTab
					uni.reLaunch({
						url: '/pages/index/index'
					});
				}
			} catch (e) {
				console.error('检查登录状态失败', e);
			}
		},

		// 微信登录
		wxLogin() {
			uni.showLoading({
				title: '登录中...'
			});

			// 调用微信登录接口
			uni.login({
				provider: 'weixin',
				success: (loginRes) => {
					if (loginRes.code) {
						// 获取到登录code，发送到后端换取token
						this.getToken(loginRes.code);
					} else {
						uni.hideLoading();
						uni.showToast({
							title: '登录失败，请重试',
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('微信登录失败', err);
					uni.showToast({
						title: '登录失败，请重试',
						icon: 'none'
					});
				}
			});
		},

		// 获取token
		getToken(code) {
			// 根据后端API调整请求
			uni.request({
				url: 'http://localhost:8080/api/v1/auth/login', // 替换为您的实际API地址
				method: 'POST',
				data: {
					code: code
				},
				header: {
					'content-type': 'application/json'
				},
				success: (res) => {
					uni.hideLoading();
					if (res.statusCode === 200) {
						// 登录成功，保存token和用户信息
						const userData = res.data.user;
						const token = res.data.token;

						uni.setStorageSync('token', token);
						uni.setStorageSync('userInfo', JSON.stringify(userData));

						// 提示登录成功
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						});


						setTimeout(() => {
							uni.switchTab({
								url: '/pages/index/index'
							});
						}, 1000);
					} else {
						uni.showToast({
							title: res.data.error || '登录失败，请重试',
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('获取token失败', err);
					uni.showToast({
						title: '登录失败，请重试',
						icon: 'none'
					});
				}
			});
		},
	}
}
</script>

<style>
.login-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 50rpx;
	height: 100vh;
	background-color: #f8f8f8;
}

.logo-box {
	margin-top: 100rpx;
	margin-bottom: 50rpx;
}

.logo {
	width: 200rpx;
	height: 200rpx;
	border-radius: 20rpx;
}

.title-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 100rpx;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.subtitle {
	font-size: 28rpx;
	color: #666;
}

.btn-box {
	width: 100%;
	padding: 0 30rpx;
}

.wx-login-btn {
	width: 100%;
	height: 90rpx;
	line-height: 90rpx;
	background-color: #07c160;
	color: #fff;
	border-radius: 45rpx;
	font-size: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.iconfont {
	margin-right: 10rpx;
}
</style>