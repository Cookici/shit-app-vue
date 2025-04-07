<template>
	<view class="profile-container">
		<view class="header">
			<text class="title">完善个人资料</text>
		</view>
		
		<view class="form-item">
			<text class="label">头像</text>
			<view class="avatar-wrapper" @click="chooseAvatar">
				<image class="avatar" :src="userInfo.avatar_url || '/static/logo.png'"></image>
				<text class="tip">点击更换头像</text>
			</view>
		</view>
		
		<view class="form-item">
			<text class="label">昵称</text>
			<input class="input" v-model="userInfo.nickname" placeholder="请输入昵称" />
		</view>
		
		<button class="submit-btn" type="primary" @click="saveUserInfo">保存</button>
	</view>
</template>

<script>
import request from '../../utils/request.js';

export default {
	data() {
		return {
			userId: '',
			userInfo: {
				nickname: '',
				avatar_url: ''
			}
		}
	},
	onLoad() {
		// 获取本地存储的用户信息
		try {
			const userInfoStr = uni.getStorageSync('userInfo');
			if (userInfoStr) {
				this.userInfo = JSON.parse(userInfoStr);
				// 从用户信息中获取ID
				if (this.userInfo.id) {
					this.userId = this.userInfo.id;
					console.log('从本地存储获取到用户ID:', this.userId);
				}
			}
		} catch (e) {
			console.error('获取用户信息失败', e);
		}
	},
	methods: {
		// 选择头像
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePath = res.tempFilePaths[0];
					
					// 直接使用本地路径作为临时显示
					this.userInfo.avatar_url = tempFilePath;
					
					// 上传图片
					this.uploadAvatar(tempFilePath);
				}
			});
		},
		
		// 上传头像
		uploadAvatar(filePath) {
			uni.showLoading({
				title: '上传中...'
			});
			
			// 由于uploadFile不能直接使用request.js，需要单独处理
			uni.uploadFile({
				url: 'http://localhost:8080/api/v1/auth/upload',
				filePath: filePath,
				name: 'file',
				header: {
					'Authorization': 'Bearer ' + uni.getStorageSync('token')
				},
				success: (uploadRes) => {
					uni.hideLoading();
					
					// 解析响应数据
					if (uploadRes.statusCode === 200) {
						try {
							const result = JSON.parse(uploadRes.data);
							// 更新头像URL
							this.userInfo.avatar_url = result.url;
							
							uni.showToast({
								title: '上传成功',
								icon: 'success'
							});
						} catch (e) {
							console.error('解析响应数据失败', e);
							uni.showToast({
								title: '上传失败，响应格式错误',
								icon: 'none'
							});
						}
					} else {
						let errorMsg = '上传失败';
						try {
							const result = JSON.parse(uploadRes.data);
							errorMsg = result.error || '上传失败';
						} catch (e) {}
						
						uni.showToast({
							title: errorMsg,
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('上传头像失败', err);
					uni.showToast({
						title: '上传失败，请检查网络',
						icon: 'none'
					});
				}
			});
		},
		
		// 保存用户信息
		saveUserInfo() {
			if (!this.userInfo.nickname) {
				uni.showToast({
					title: '请输入昵称',
					icon: 'none'
				});
				return;
			}
			
			// 检查userId是否存在
			if (!this.userId) {
				console.error('用户ID不存在，尝试从userInfo获取');
				if (this.userInfo.id) {
					this.userId = this.userInfo.id;
				} else {
					uni.showToast({
						title: '用户信息不完整，请重新登录',
						icon: 'none'
					});
					setTimeout(() => {
						uni.reLaunch({
							url: '/pages/login/login'
						});
					}, 1000);
					return;
				}
			}
			
			uni.showLoading({
				title: '保存中...'
			});
			
			console.log('保存用户信息，用户ID:', this.userId);
			
			request.put(`/auth/user/${this.userId}/info`, {
				nickname: this.userInfo.nickname,
				avatar_url: this.userInfo.avatar_url
			})
			.then(data => {
				// 更新本地存储的用户信息
				uni.setStorageSync('userInfo', JSON.stringify(data.user || this.userInfo));
				
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});
				
				// 跳转到首页
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/index/index'
					});
				}, 1000);
			})
			.catch(err => {
				console.error('保存用户信息失败', err);
			})
			.finally(() => {
				uni.hideLoading();
			});
		}
	}
}
</script>

<style>
	.profile-container {
		padding: 30rpx;
	}
	
	.header {
		margin-bottom: 50rpx;
		text-align: center;
	}
	
	.title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
	
	.form-item {
		margin-bottom: 30rpx;
	}
	
	.label {
		display: block;
		margin-bottom: 10rpx;
		font-size: 28rpx;
		color: #666;
	}
	
	.avatar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx;
	}
	
	.avatar {
		width: 150rpx;
		height: 150rpx;
		border-radius: 75rpx;
		margin-bottom: 10rpx;
	}
	
	.tip {
		font-size: 24rpx;
		color: #999;
	}
	
	.input {
		height: 80rpx;
		border: 1px solid #eee;
		border-radius: 8rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
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