function setupHandler (sb) {

	function INIT () {
		sb.listen({
			listenFor: ["checks-complete"],
			moduleID: this.moduleID,
			moduleFunction: "loadSettings"
		})
	}

	function LOADSETTINGS () {

		/*
		Initialises loading of setting stored in settings.json
		*/

		d3.json("settings.json", receive_settings)
	}

	function receive_settings (error, data) {
		if (debug.sentinel(data, "External settings have failed to load. Please check 'settings.json' for valid json formatting.")) {
			return;
		}

		/*
		Assigns gas data to a property of the index object where it will be used by the index.Rate class.
		Removes gas data from the rest of settings where it is no longer needed.
		*/
		
		index.gas_lookup = data.gases;
		delete data.gases;

		/*
		Assigns settings data to a property of the sandbox where it will be accessible by all modules.
		*/

		sb.settings=data;

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