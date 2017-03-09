function setupHandler (sb) {

	function INIT () {
		sb.listen({
			listenFor: ["checks-complete"],
			moduleID: this.moduleID,
			moduleFunction: "loadSettings"
		})
	}

	function LOADSETTINGS () {
		d3.json("settings.json", receive_settings)
	}

	function receive_settings (error, data) {
		if (debug.sentinel(data, "External settings have failed to load. Please check 'settings.json' for valid json formatting.")) {
			return;
		}

		
		index.gas_lookup = data.gases;
		delete data.gases;

		sb.settings=data;

		console.log(sb.settings);

		sb.notify({
			type : "setup-complete",
			data: null
		});
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		init_sphere_array = null;
	}

	return {
        init : INIT,
        loadSettings: LOADSETTINGS,
        destroy : DESTROY
    };
}