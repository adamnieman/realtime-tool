function ready (sb) {

	function INIT () {
		notify ("ready")
	}

	function notify (message) {
		sb.notify({
			type : message,
			data: null
		});
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		notify = null;
	}

	return {
        init : INIT,
        destroy : DESTROY
    };
}