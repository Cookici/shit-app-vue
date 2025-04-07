<template>
	<view class="container">
		<view class="header">
			<text class="title">添加拉屎记录</text>
		</view>
		
		<record-form 
			mode="add"
			:initial-date="initialDate"
			submit-button-text="保存记录"
			@submit="saveRecord">
		</record-form>
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
			initialDate: ''
		}
	},
	onLoad(options) {
		// 如果有传入日期参数，则使用传入的日期
		if (options.date) {
			this.initialDate = options.date;
		}
	},
	methods: {
		// 保存记录
		saveRecord(recordData) {
			uni.showLoading({
				title: '保存中...'
			});
			
			// 使用request工具类发送请求
			request.post('/records', recordData)
				.then(() => {
					uni.showToast({
						title: '记录成功',
						icon: 'success'
					});
					
					// 返回上一页
					setTimeout(() => {
						uni.navigateBack();
					}, 1000);
				})
				.catch(err => {
					console.error('保存记录失败', err);
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
</style>