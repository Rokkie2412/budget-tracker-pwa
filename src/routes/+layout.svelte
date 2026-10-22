<script>
	import '../app.css';

	import { ToastContainer } from '../lib/components';

	let { children } = $props();
</script>

{@render children()}
<ToastContainer />
