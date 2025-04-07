<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			this.checkLoginStatus();
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			checkLoginStatus() {
				try {
					const token = uni.getStorageSync('token');
					if (!token) {
						uni.reLaunch({
							url: '/pages/login/login'
						});
					}
				} catch (e) {
					console.error('检查登录状态失败', e);
				}
			}
		}
	}
</script>

<style>
	
</style>
