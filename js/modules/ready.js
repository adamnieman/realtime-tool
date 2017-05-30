function ready (sb) {

	function INIT () {
		/*
		'ready' notification means that all modules have been loaded and initialised, and are ready to be run.
		*/

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