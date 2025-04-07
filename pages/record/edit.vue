<template>
	<view class="container">
		<view class="header">
			<text class="title">编辑拉屎记录</text>
		</view>

		<record-form 
			v-if="recordId"
			mode="edit"
			:record-id="recordId"
			submit-button-text="保存修改"
			@submit="updateRecord">
		</record-form>

		<view class="loading" v-else>
			<text>加载中...</text>
		</view>
	</view>
</template>

<script>
import recordForm from '@/components/record-form.vue';
import request from '../../utils/request.js';

export default {
	components: {
		'record-form': recordForm 
	},
	data() {
		return {
			recordId: ''
		}
	},
	onLoad(options) {
		if (options.id) {
			this.recordId = options.id;
		} else {
			uni.showToast({
				title: '记录ID不存在',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 1000);
		}
	},
	methods: {
		// 更新记录
		updateRecord(recordData) {
			uni.showLoading({
				title: '保存中...'
			});

			// 使用request工具类发送请求
			request.put(`/records/${this.recordId}`, recordData)
				.then(() => {
					uni.showToast({
						title: '更新成功',
						icon: 'success'
					});

					// 设置上一页需要刷新的标记
					const pages = getCurrentPages();
					const prevPage = pages[pages.length - 2]; // 获取上一个页面
					if (prevPage && prevPage.$vm) {
						// 设置需要刷新的标记
						prevPage.$vm.needRefresh = true;
					}
					
					setTimeout(() => {
						uni.navigateBack();
					}, 1000);
				})
				.catch(err => {
					console.error('更新记录失败', err);
					// 添加错误提示
					uni.showToast({
						title: '更新失败，请重试',
						icon: 'none'
					});
				})
				.finally(() => {
					uni.hideLoading();
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

.loading {
	text-align: center;
	padding: 50rpx 0;
	color: #999;
}
</style>